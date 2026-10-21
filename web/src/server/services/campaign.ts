// Campagnes : origine des inscriptions (liens suivis, QR codes), parrainage et statistiques par source.
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "../db";
import type { Acquisition } from "../db/schema";
import { audit } from "../lib/audit";
import { forbidden } from "../lib/errors";
import { notify } from "./notifications";
import { CAMPAGNE, PARRAINAGE_OBJECTIF, sourceLabel } from "@/lib/campagne";
import { SITE_URL } from "@/lib/site";

type User = typeof schema.users.$inferSelect;

const slug = (v: unknown, max = 60) => {
  if (typeof v !== "string") return undefined;
  const s = v.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, max);
  return s || undefined;
};
export const normRef = (v: unknown) => {
  if (typeof v !== "string") return undefined;
  const s = v.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
  return s || undefined;
};

/** Lit le cookie de première visite (JSON encodé). Une valeur illisible est ignorée. */
export function parseAcquisition(raw?: string | null): Acquisition | null {
  if (!raw) return null;
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
  if (!o || typeof o !== "object") return null;
  const ref = normRef(o.ref);
  return {
    source: ref ? "parrain" : slug(o.source) ?? "direct",
    medium: slug(o.medium), campaign: slug(o.campaign), content: slug(o.content), ref,
    landing: typeof o.landing === "string" ? o.landing.slice(0, 120) : undefined,
    at: typeof o.at === "string" ? o.at.slice(0, 30) : undefined,
  };
}

// Sans I, O, 0, 1 : un code lu à voix haute ou recopié d'un SMS ne prête pas à confusion.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const prefixe = (firstName: string) =>
  firstName.normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 4) || "NAVI";
const suffixe = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => ALPHABET[b % ALPHABET.length]).join("");

/** Code de parrainage personnel, créé à la première demande (ex. DIMI-7K3Q). */
export async function ensureReferralCode(u: Pick<User, "id" | "firstName" | "referralCode">) {
  if (u.referralCode) return u.referralCode;
  for (let i = 0; i < 6; i++) {
    const code = `${prefixe(u.firstName)}-${suffixe()}`;
    const [r] = await db.update(schema.users).set({ referralCode: code })
      .where(and(eq(schema.users.id, u.id), sql`${schema.users.referralCode} is null`))
      .returning({ code: schema.users.referralCode })
      .catch((e) => { if (String(e?.code) === "23505") return []; throw e; }); // collision : on retire
    if (r?.code) return r.code;
    const [again] = await db.select({ code: schema.users.referralCode }).from(schema.users).where(eq(schema.users.id, u.id));
    if (again?.code) return again.code;
  }
  throw new Error("Impossible de créer un code de parrainage.");
}

const filleuls = async (parrainId: string) =>
  (await db.select({ n: sql<number>`count(*)::int` }).from(schema.users).where(eq(schema.users.referredById, parrainId)))[0]?.n ?? 0;

/** Enregistre l'origine d'un compte qui vient d'être créé, et le rattache à son parrain si le code est valide. */
export async function recordAcquisition(userId: string, acq: Acquisition | null) {
  if (!acq) return;
  let referredById: string | null = null;
  let a = acq;
  if (acq.ref) {
    const [p] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.referralCode, acq.ref));
    if (p && p.id !== userId) referredById = p.id;
    else a = { ...acq, ref: undefined, source: "direct" };
  }
  await db.update(schema.users).set({ acquisition: a, referredById }).where(eq(schema.users.id, userId));
  if (!referredById) return;
  await audit(userId, "parrainage", "user", referredById, { code: acq.ref });
  if ((await filleuls(referredById)) === PARRAINAGE_OBJECTIF)
    await notify(referredById, {
      kind: "parrainage", title: "Entretien prioritaire débloqué",
      body: `${PARRAINAGE_OBJECTIF} amis se sont inscrits avec ton code. Un conseiller Navigoal te contacte en priorité.`,
      link: "/espace/conseiller/",
    });
}

/** Encart « Parraine 2 amis » de l'espace élève ou étudiant. */
export async function myReferral(u: User) {
  const code = await ensureReferralCode(u);
  const n = await filleuls(u.id);
  return { code, lien: `${SITE_URL}/inscription/?ref=${code}`, filleuls: n, objectif: PARRAINAGE_OBJECTIF, debloque: n >= PARRAINAGE_OBJECTIF };
}

/** Tableau de bord de la campagne (administration). */
export async function campaignStats(a: User, depuis?: string | null) {
  if (a.role !== "admin") throw forbidden();
  // Par défaut depuis le lancement ; une autre date (AAAA-MM-JJ) permet de suivre la préparation ou une période.
  const debut = depuis && /^\d{4}-\d{2}-\d{2}$/.test(depuis) ? depuis : CAMPAGNE.debut;
  const since = new Date(`${debut}T00:00:00+01:00`);
  const q = async <T,>(s: ReturnType<typeof sql>) => (await db.execute(s)).rows as T[];
  const [[totaux], parSource, parDetail, parSemaine] = await Promise.all([
    q<{ comptes: number; parents: number; tests: number; parraines: number }>(sql`select
      (select count(*)::int from users where role in ('eleve','etudiant') and created_at >= ${since}) comptes,
      (select count(*)::int from users where role = 'parent' and created_at >= ${since}) parents,
      (select count(*)::int from orientation_results where created_at >= ${since}) tests,
      (select count(*)::int from users where referred_by_id is not null and created_at >= ${since}) parraines`),
    q<{ source: string; n: number }>(sql`select coalesce(acquisition->>'source', 'direct') source, count(*)::int n
      from users where role in ('eleve','etudiant','parent') and created_at >= ${since} group by 1 order by 2 desc, 1`),
    q<{ source: string; detail: string; n: number }>(sql`select acquisition->>'source' source, acquisition->>'content' detail, count(*)::int n
      from users where role in ('eleve','etudiant','parent') and created_at >= ${since} and acquisition->>'content' is not null
      group by 1, 2 order by 3 desc limit 30`),
    q<{ semaine: string; n: number }>(sql`select to_char(date_trunc('week', created_at), 'YYYY-MM-DD') semaine, count(*)::int n
      from users where role in ('eleve','etudiant') and created_at >= ${since} group by 1 order by 1`),
  ]);
  return {
    campagne: CAMPAGNE,
    depuis: debut,
    totaux,
    sources: parSource.map((s) => ({ ...s, libelle: sourceLabel(s.source) })),
    details: parDetail.map((d) => ({ ...d, libelle: sourceLabel(d.source) })),
    semaines: parSemaine,
  };
}

/** Export CSV des inscriptions agrégées par source et détail (aucune donnée personnelle). */
export async function campaignCsv(a: User, depuis?: string | null) {
  const s = await campaignStats(a, depuis);
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lignes = [["source", "libelle", "detail", "inscriptions"].join(";")];
  for (const r of s.sources) lignes.push([r.source, r.libelle, "", r.n].map(esc).join(";"));
  for (const r of s.details) lignes.push([r.source, r.libelle, r.detail, r.n].map(esc).join(";"));
  return lignes.join("\n") + "\n";
}

