import { sql } from "drizzle-orm";
import { db, schema } from "../db";
import { assertMember } from "./establishments";

type User = typeof schema.users.$inferSelect;

/** Tableau de bord établissement (§27) : candidatures, dossiers en attente, admis, origine, formations, besoins logement. */
export async function schoolDashboard(user: User, establishmentId: string) {
  await assertMember(user, establishmentId);
  const q = async <T,>(s: ReturnType<typeof sql>) => (await db.execute(s)).rows as T[];
  const [[k], byWeek, byCountry, byProgram, [housing]] = await Promise.all([
    q<{ total: number; attente: number; admis: number; refuses: number; nouveaux: number }>(sql`select count(*)::int total,
      count(*) filter (where status in ('soumise','paiement_confirme','en_verification','complet','en_traitement','piece_demandee'))::int attente,
      count(*) filter (where status='acceptee')::int admis, count(*) filter (where status='refusee')::int refuses,
      count(*) filter (where submitted_at >= now() - interval '7 days')::int nouveaux
      from applications where establishment_id = ${establishmentId} and status <> 'brouillon'`),
    q<{ semaine: string; n: number }>(sql`select to_char(date_trunc('week', submitted_at), 'YYYY-MM-DD') semaine, count(*)::int n from applications where establishment_id = ${establishmentId} and submitted_at >= now() - interval '12 weeks' group by 1 order by 1`),
    q<{ country: string | null; n: number }>(sql`select u.country, count(*)::int n from applications a join users u on u.id = a.student_id where a.establishment_id = ${establishmentId} and a.status <> 'brouillon' group by 1 order by 2 desc`),
    q<{ title: string; n: number; admis: number }>(sql`select p.title, count(*)::int n, count(*) filter (where a.status='acceptee')::int admis from applications a join programs p on p.id = a.program_id where a.establishment_id = ${establishmentId} and a.status <> 'brouillon' group by 1 order by 2 desc limit 8`),
    q<{ admis_etrangers: number; loges: number }>(sql`select count(distinct a.student_id) filter (where u.country is distinct from e.pays)::int admis_etrangers,
      count(distinct b.tenant_id)::int loges
      from applications a join users u on u.id = a.student_id join establishments e on e.id = a.establishment_id
      left join bookings b on b.tenant_id = a.student_id and b.status not in ('refusee','annulee','demande')
      where a.establishment_id = ${establishmentId} and a.status = 'acceptee'`),
  ]);
  return { kpis: k, byWeek, byCountry, byProgram, housing };
}
