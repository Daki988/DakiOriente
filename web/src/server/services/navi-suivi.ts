// Suivi de Navi pour le back-office : volume, coût, rapidité, qualité (refus, erreurs), part du petit modèle et du cache,
// outils utilisés, et les conversations elles-mêmes (question, réponse affichée, modèle, coût).
import { and, desc, eq, gte, ilike, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { forbidden } from "../lib/errors";

type User = typeof schema.users.$inferSelect;
const t = schema.naviTraces;
const PERIODES: Record<string, number> = { jour: 1, "7j": 7, "30j": 30, "90j": 90 };

export async function tableau(admin: User, q: { periode?: string | null; route?: string | null; statut?: string | null; q?: string | null }) {
  if (admin.role !== "admin") throw forbidden();
  const jours = PERIODES[q.periode ?? "7j"] ?? 7;
  const depuis = new Date(Date.now() - jours * 864e5);
  const filtre = and(gte(t.at, depuis),
    q.route && ["simple", "complet", "cache"].includes(q.route) ? eq(t.route, q.route) : undefined,
    q.statut && ["ok", "refus", "erreur"].includes(q.statut) ? eq(t.statut, q.statut) : undefined,
    q.q ? ilike(t.question, `%${q.q.replace(/[%_\\]/g, (c) => `\\${c}`).slice(0, 100)}%`) : undefined);

  const [chiffres] = await db.select({
    questions: sql<number>`count(*)::int`,
    cout: sql<number>`coalesce(sum(${t.coutUsd}), 0)::float`,
    dureeMed: sql<number>`coalesce(percentile_cont(0.5) within group (order by ${t.dureeMs}), 0)::float`,
    duree90: sql<number>`coalesce(percentile_cont(0.9) within group (order by ${t.dureeMs}), 0)::float`,
    refus: sql<number>`count(*) filter (where ${t.statut} = 'refus')::int`,
    erreurs: sql<number>`count(*) filter (where ${t.statut} = 'erreur')::int`,
    simple: sql<number>`count(*) filter (where ${t.route} = 'simple')::int`,
    cache: sql<number>`count(*) filter (where ${t.route} = 'cache')::int`,
    sansReponse: sql<number>`count(*) filter (where ${t.statut} = 'ok' and length(trim(${t.reponse})) = 0)::int`,
    entree: sql<number>`coalesce(sum(${t.entree}), 0)::bigint`,
    cacheLu: sql<number>`coalesce(sum(${t.cacheLu}), 0)::bigint`,
    connectes: sql<number>`count(*) filter (where ${t.userId} is not null)::int`,
  }).from(t).where(filtre);

  const parJour = await db.select({ jour: sql<string>`to_char(${t.at} at time zone 'UTC', 'YYYY-MM-DD')`, questions: sql<number>`count(*)::int`, cout: sql<number>`sum(${t.coutUsd})::float` })
    .from(t).where(filtre).groupBy(sql`1`).orderBy(sql`1`);
  const outils = (await db.execute<{ outil: string; n: number }>(sql`select o as outil, count(*)::int as n from ${t}, jsonb_array_elements_text(${t.outils}) o
    where ${t.at} >= ${depuis} group by o order by n desc limit 12`)).rows;
  const modeles = await db.select({ modele: t.modele, questions: sql<number>`count(*)::int`, cout: sql<number>`sum(${t.coutUsd})::float` })
    .from(t).where(filtre).groupBy(t.modele).orderBy(desc(sql`2`));
  const dernieres = await db.select({ id: t.id, at: t.at, role: t.role, page: t.page, question: t.question, route: t.route, modele: t.modele, statut: t.statut, coutUsd: t.coutUsd, dureeMs: t.dureeMs, outils: t.outils, cartes: t.cartes })
    .from(t).where(filtre).orderBy(desc(t.at)).limit(100);

  const lu = Number(chiffres.cacheLu), entree = Number(chiffres.entree);
  return {
    periode: q.periode ?? "7j",
    chiffres: {
      ...chiffres, entree, cacheLu: lu,
      coutMoyen: chiffres.questions ? chiffres.cout / chiffres.questions : 0,
      partCacheConsignes: lu + entree ? lu / (lu + entree) : 0,
    },
    parJour, outils, modeles, dernieres,
  };
}

export async function detail(admin: User, id: string) {
  if (admin.role !== "admin") throw forbidden();
  const [r] = await db.select().from(t).where(eq(t.id, id)).limit(1);
  return r ?? null;
}
