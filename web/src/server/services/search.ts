import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db, schema } from "../db";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Recherche transversale : métiers, formations, établissements, articles, logements. */
export async function globalSearch(q: string, limit = 8) {
  const t = q.trim();
  if (t.length < 2) return { metiers: [], formations: [], etablissements: [], articles: [], logements: [] };
  const like = `%${t}%`;
  const unaccent = (col: unknown) => sql`translate(lower(${col}), 'àâäéèêëîïôöùûüç', 'aaaeeeeiioouuuc')`;
  const nq = `%${norm(t)}%`;
  const [metiers, formations, etablissements, articles, logements] = await Promise.all([
    db.select({ id: schema.refMetiers.id, nom: schema.refMetiers.nom, domaine: schema.refMetiers.domaine }).from(schema.refMetiers).where(and(eq(schema.refMetiers.published, true), or(sql`${unaccent(schema.refMetiers.nom)} like ${nq}`, sql`${unaccent(sql`${schema.refMetiers.data}->>'description'`)} like ${nq}`))).limit(limit),
    db.select({ id: schema.refFormations.id, intitule: schema.refFormations.intitule, domaine: schema.refFormations.domaine }).from(schema.refFormations).where(and(eq(schema.refFormations.published, true), sql`${unaccent(schema.refFormations.intitule)} like ${nq}`)).limit(limit),
    db.select({ id: schema.establishments.id, nom: schema.establishments.nom, sigle: schema.establishments.sigle, ville: schema.establishments.ville, pays: schema.establishments.pays, logo: schema.establishments.logo }).from(schema.establishments)
      .where(or(ilike(schema.establishments.nom, like), ilike(schema.establishments.sigle, like), ilike(schema.establishments.ville, like), sql`exists (select 1 from programs p where p.establishment_id = ${schema.establishments.id} and ${unaccent(sql`p.title`)} like ${nq})`)).limit(limit),
    db.select({ slug: schema.articles.slug, title: schema.articles.title, category: schema.articles.category }).from(schema.articles).where(and(eq(schema.articles.published, true), or(ilike(schema.articles.title, like), ilike(schema.articles.excerpt, like)))).limit(limit),
    db.select({ id: schema.housings.id, title: schema.housings.title, ville: schema.housings.ville, rent: schema.housings.rent, currency: schema.housings.currency }).from(schema.housings).where(and(eq(schema.housings.status, "publie"), or(ilike(schema.housings.title, like), ilike(schema.housings.ville, like), ilike(schema.housings.quartier, like)))).limit(limit),
  ]);
  return { metiers, formations, etablissements, articles, logements };
}
