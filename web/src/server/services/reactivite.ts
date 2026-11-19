// Réactivité des écoles (chantier « Écoles actives », novembre 2026).
// Délai de première réponse = temps entre l'envoi d'une candidature et la première action d'un autre compte que
// l'élève : changement de statut (vérification, pièce demandée, décision…) ou message dans le fil de la candidature.
// Calculé sur 90 jours ; affiché publiquement à partir de 5 candidatures. Relances : J+3 et J+6 à l'école, J+8 à
// l'équipe Navigoal et à l'élève (tâche quotidienne `npm run rappels-offres`).
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { notify } from "./notifications";
import { notifySchool } from "./applications";
import { etabById } from "@/lib/data";

export const SEUIL_AFFICHAGE = 5;
export const OBJECTIF_JOURS = 7;
const JOUR = 864e5;

export type Reactivite = { n: number; repondues: number; medianeJours: number | null; sous7: number; enRetard: number };
export type ReactivitePublique = { jours: number; rapide: boolean } | null;

// Première réponse de chaque candidature envoyée depuis `depuis` (null : pas encore de réponse).
const PREMIERES = (depuis: Date, eid?: string) => sql`
  with apps as (
    select a.id, a.number, a.establishment_id, a.student_id, a.submitted_at, a.status
    from applications a
    where a.submitted_at is not null and a.submitted_at >= ${depuis.toISOString()} ${eid ? sql`and a.establishment_id = ${eid}` : sql``}
  )
  select apps.*, least(
    (select min(e.created_at) from application_events e
      where e.application_id = apps.id and e.created_at > apps.submitted_at
        and e.author_id is distinct from apps.student_id and e.author_id is not null
        and e.status not in ('brouillon', 'soumise', 'paiement_confirme')),
    (select min(m.created_at) from messages m join conversations c on c.id = m.conversation_id
      where c.context_kind = 'application' and c.context_id = apps.id
        and m.created_at > apps.submitted_at and m.author_id <> apps.student_id and not m.internal)
  ) as premiere
  from apps`;

/** Indicateurs de réactivité par école sur 90 jours. */
export async function reactivites(eid?: string): Promise<Record<string, Reactivite>> {
  const depuis = new Date(Date.now() - 90 * JOUR);
  const r = await db.execute(sql`
    with rep as (${PREMIERES(depuis, eid)})
    select establishment_id,
      count(*)::int as n,
      count(premiere)::int as repondues,
      percentile_cont(0.5) within group (order by extract(epoch from (premiere - submitted_at)) / 86400) filter (where premiere is not null) as mediane,
      count(*) filter (where premiere is not null and premiere - submitted_at <= interval '7 days')::int as sous7,
      count(*) filter (where premiere is null and status not in ('desistee') and now() - submitted_at > interval '7 days')::int as en_retard
    from rep group by establishment_id`);
  const out: Record<string, Reactivite> = {};
  for (const x of r.rows as { establishment_id: string; n: number; repondues: number; mediane: number | null; sous7: number; en_retard: number }[])
    out[x.establishment_id] = { n: x.n, repondues: x.repondues, medianeJours: x.mediane == null ? null : Number(x.mediane), sous7: x.sous7, enRetard: x.en_retard };
  return out;
}

/** Ce qui est montré au public : « Répond en moyenne sous X jours », badge « Réponse rapide » (≤ 3 jours, 80 % sous 7 jours). */
export function versPublic(r: Reactivite | undefined): ReactivitePublique {
  if (!r || r.n < SEUIL_AFFICHAGE || r.medianeJours == null) return null;
  return { jours: Math.max(1, Math.ceil(r.medianeJours)), rapide: r.medianeJours <= 3 && r.sous7 / r.n >= 0.8 };
}

let memo: { at: number; data: Record<string, ReactivitePublique> } | null = null;
/** Réactivité publique de toutes les écoles (gardée 1 h en mémoire). */
export async function reactivitesPubliques() {
  if (memo && Date.now() - memo.at < 3600e3) return memo.data;
  const toutes = await reactivites();
  const data = Object.fromEntries(Object.entries(toutes).map(([k, v]) => [k, versPublic(v)]).filter(([, v]) => v)) as Record<string, ReactivitePublique>;
  memo = { at: Date.now(), data };
  return data;
}

/** Candidatures sans réponse depuis plus de 7 jours (pour l'école ou l'équipe). */
export async function sansReponse(eid?: string) {
  const depuis = new Date(Date.now() - 90 * JOUR);
  const r = await db.execute(sql`with rep as (${PREMIERES(depuis, eid)})
    select rep.id, rep.number, rep.establishment_id, rep.submitted_at, u.first_name, u.last_name
    from rep join users u on u.id = rep.student_id
    where premiere is null and status not in ('desistee', 'acceptee', 'refusee') and now() - submitted_at > interval '7 days'
    order by submitted_at asc limit 200`);
  return r.rows as { id: string; number: string; establishment_id: string; submitted_at: string; first_name: string; last_name: string }[];
}

const premiereFois = async (cle: string) => (await db.insert(schema.counters).values({ key: cle, value: 1 }).onConflictDoNothing().returning({ k: schema.counters.key })).length > 0;

/** Relances des candidatures sans réponse : J+3 et J+6 à l'école, J+8 à l'équipe Navigoal et à l'élève. Une fois par palier. */
export async function relancesEcoles(maintenant = new Date()) {
  const depuis = new Date(maintenant.getTime() - 30 * JOUR);
  const r = await db.execute(sql`with rep as (${PREMIERES(depuis)})
    select rep.id, rep.number, rep.establishment_id, rep.student_id, rep.submitted_at from rep
    where premiere is null and status in ('soumise', 'paiement_confirme', 'complet')`);
  let envoyees = 0;
  const admins = await db.select({ id: schema.users.id }).from(schema.users).where(and(eq(schema.users.role, "admin"), eq(schema.users.status, "actif")));
  for (const a of r.rows as { id: string; number: string; establishment_id: string; student_id: string; submitted_at: string }[]) {
    const jours = Math.floor((maintenant.getTime() - new Date(a.submitted_at).getTime()) / JOUR);
    const palier = jours >= 8 ? "J8" : jours >= 6 ? "J6" : jours >= 3 ? "J3" : null;
    if (!palier || !(await premiereFois(`relance:ecole:${a.id}:${palier}`))) continue;
    const ecole = etabById[a.establishment_id]?.sigle || etabById[a.establishment_id]?.nom || "L'école";
    if (palier !== "J8") {
      await notifySchool(a.establishment_id, `Candidature ${a.number} en attente depuis ${jours} jours : merci d'y répondre (objectif ${OBJECTIF_JOURS} jours)`, `/etablissement/candidatures/${a.id}`);
    } else {
      for (const ad of admins) await notify(ad.id, { kind: "relance_ecole", title: `${ecole} n'a pas répondu à la candidature ${a.number} (${jours} jours)`, body: "Relances J+3 et J+6 restées sans effet : à suivre par le relais Navigoal.", link: `/admin/candidatures/` });
      await notify(a.student_id, { kind: "relance_ecole", title: `${ecole} n'a pas encore répondu à ta candidature`, body: "Un conseiller Navigoal suit ton dossier et relance l'école. Tu peux lui écrire depuis ta messagerie.", link: `/espace/candidatures/${a.id}/` });
    }
    envoyees++;
  }
  return { envoyees };
}
