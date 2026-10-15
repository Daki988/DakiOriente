import { sql } from "drizzle-orm";
import { db, schema } from "../db";
import { assertMember } from "./establishments";

type User = typeof schema.users.$inferSelect;
export type Periode = "annee" | "mois" | "semaine";

/** Bornes de la période courante et de la période précédente de même durée. */
export function bornes(periode: Periode, now = new Date()) {
  const start = periode === "annee" ? new Date(now.getFullYear(), 0, 1) : new Date(now.getTime() - (periode === "mois" ? 30 : 7) * 864e5);
  const len = now.getTime() - start.getTime();
  const prevStart = periode === "annee" ? new Date(now.getFullYear() - 1, 0, 1) : new Date(start.getTime() - len);
  const prevEnd = periode === "annee" ? new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), now.getHours()) : start;
  return { start, prevStart, prevEnd, now };
}
/** Variation en % (null si la période précédente est vide). */
const trend = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);

/**
 * Tableau de bord établissement (planche) : indicateurs de la période avec tendance, évolution mensuelle,
 * répartition par formation et par campus, origine des candidats, besoins logement des admis.
 */
export async function schoolDashboard(user: User, establishmentId: string, periode: Periode = "annee") {
  await assertMember(user, establishmentId);
  const q = async <T,>(s: ReturnType<typeof sql>) => (await db.execute(s)).rows as T[];
  const { start, prevStart, prevEnd, now } = bornes(periode);
  const period = (a: Date, b: Date) => sql`submitted_at >= ${a.toISOString()} and submitted_at < ${b.toISOString()}`;
  const counts = (a: Date, b: Date) => q<{ total: number; admis: number; en_cours: number; refuses: number }>(sql`select count(*)::int total,
      count(*) filter (where status='acceptee')::int admis,
      count(*) filter (where status in ('soumise','paiement_confirme','en_verification','complet','en_traitement','piece_demandee','liste_attente'))::int en_cours,
      count(*) filter (where status='refusee')::int refuses
      from applications where establishment_id = ${establishmentId} and status <> 'brouillon' and ${period(a, b)}`);
  const [[cur], [prev], [all], months, byProgram, byCampus, byCountry, [programs], [housing]] = await Promise.all([
    counts(start, new Date(now.getTime() + 1000)),
    counts(prevStart, prevEnd),
    q<{ total: number; attente: number; admis: number; refuses: number; nouveaux: number }>(sql`select count(*)::int total,
      count(*) filter (where status in ('soumise','paiement_confirme','en_verification','complet','en_traitement','piece_demandee'))::int attente,
      count(*) filter (where status='acceptee')::int admis, count(*) filter (where status='refusee')::int refuses,
      count(*) filter (where submitted_at >= now() - interval '7 days')::int nouveaux
      from applications where establishment_id = ${establishmentId} and status <> 'brouillon'`),
    q<{ mois: number; n: number; prev: number }>(sql`select m.mois::int, count(a.id) filter (where extract(year from a.submitted_at) = ${now.getFullYear()})::int n,
      count(a.id) filter (where extract(year from a.submitted_at) = ${now.getFullYear() - 1})::int prev
      from generate_series(1, 12) m(mois) left join applications a on a.establishment_id = ${establishmentId} and a.status <> 'brouillon'
        and extract(month from a.submitted_at) = m.mois and extract(year from a.submitted_at) >= ${now.getFullYear() - 1}
      group by 1 order by 1`),
    q<{ title: string; n: number; admis: number }>(sql`select p.title, count(*)::int n, count(*) filter (where a.status='acceptee')::int admis from applications a join programs p on p.id = a.program_id
      where a.establishment_id = ${establishmentId} and a.status <> 'brouillon' and ${period(start, new Date(now.getTime() + 1000))} group by 1 order by 2 desc`),
    q<{ campus: string | null; n: number }>(sql`select coalesce(a.campus, p.campus, e.ville) campus, count(*)::int n from applications a join programs p on p.id = a.program_id join establishments e on e.id = a.establishment_id
      where a.establishment_id = ${establishmentId} and a.status <> 'brouillon' and ${period(start, new Date(now.getTime() + 1000))} group by 1 order by 2 desc`),
    q<{ country: string | null; n: number }>(sql`select u.country, count(*)::int n from applications a join users u on u.id = a.student_id where a.establishment_id = ${establishmentId} and a.status <> 'brouillon' group by 1 order by 2 desc`),
    q<{ actives: number; nouvelles: number; prev: number }>(sql`select count(*) filter (where active)::int actives,
      count(*) filter (where active and not indicative and created_at >= ${start.toISOString()})::int nouvelles,
      count(*) filter (where active and not indicative and created_at >= ${prevStart.toISOString()} and created_at < ${prevEnd.toISOString()})::int prev
      from programs p where establishment_id = ${establishmentId} and (homologated or homologation->>'statut' = 'recente' or exists (select 1 from establishments pe where pe.id = p.establishment_id and pe.label = 'autorise'))`),
    q<{ admis_etrangers: number; loges: number }>(sql`select count(distinct a.student_id) filter (where u.country is distinct from e.pays)::int admis_etrangers,
      count(distinct b.tenant_id)::int loges
      from applications a join users u on u.id = a.student_id join establishments e on e.id = a.establishment_id
      left join bookings b on b.tenant_id = a.student_id and b.status not in ('refusee','annulee','demande')
      where a.establishment_id = ${establishmentId} and a.status = 'acceptee'`),
  ]);
  return {
    periode, depuis: start.toISOString(),
    indicateurs: {
      candidatures: { v: cur.total, trend: trend(cur.total, prev.total) },
      admis: { v: cur.admis, trend: trend(cur.admis, prev.admis) },
      enCours: { v: cur.en_cours, trend: trend(cur.en_cours, prev.en_cours) },
      formations: { v: programs.actives, delta: programs.nouvelles - programs.prev, nouvelles: programs.nouvelles },
    },
    kpis: all, months, byProgram, byCampus, byCountry, housing,
  };
}
