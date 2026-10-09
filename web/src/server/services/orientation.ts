import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db, schema } from "../db";

/** Enregistre un résultat de test RIASEC et met à jour le profil. */
export async function saveResult(userId: string, answers: (number | null)[], scores: Record<string, number>, top: string[]) {
  const [r] = await db.insert(schema.orientationResults).values({ userId, answers, scores, top }).returning();
  await db.insert(schema.profiles).values({ userId, riasec: { scores, top } }).onConflictDoUpdate({ target: schema.profiles.userId, set: { riasec: { scores, top } } });
  return r;
}

export const history = (userId: string) => db.select().from(schema.orientationResults).where(eq(schema.orientationResults.userId, userId)).orderBy(desc(schema.orientationResults.createdAt));

type Metier = { id: string; nom: string; riasec: string[]; formations: string[] };
type Formation = { id: string; intitule: string; metiers: string[]; series_recommandees: Record<string, string[]>; duree_annees: number };

/**
 * Moteurs 2 à 4 : profil RIASEC → métiers → formations (filtrées par série et pays) → offres des établissements.
 * Score métier = part des codes RIASEC du métier présents dans le profil (pondérée par le rang).
 */
export async function recommend(userId: string, opts: { limit?: number } = {}) {
  const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
  const top = p?.riasec?.top ?? [];
  const metiers = (await db.select().from(schema.refMetiers).where(eq(schema.refMetiers.published, true))).map((m) => m.data as Metier);
  const formations = (await db.select().from(schema.refFormations).where(eq(schema.refFormations.published, true))).map((f) => f.data as Formation);
  const weight = (c: string) => (top.indexOf(c) === 0 ? 1 : top.indexOf(c) === 1 ? 0.75 : top.indexOf(c) === 2 ? 0.5 : 0);
  const scoredMetiers = metiers.map((m) => ({ m, s: m.riasec.reduce((a, c) => a + weight(c), 0) / Math.max(1, m.riasec.length) }))
    .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, opts.limit ?? 12);
  const serie = p?.serie;
  // Destination unique : le Maroc. Préférence éventuelle de villes d'études.
  const prefVilles = p?.preferences?.villes ?? [];
  const fScore = new Map<string, number>();
  for (const { m, s } of scoredMetiers) for (const fid of m.formations) fScore.set(fid, Math.max(fScore.get(fid) ?? 0, s));
  const forms = formations.filter((f) => fScore.has(f.id)).map((f) => {
    const serieOk = !serie || Object.values(f.series_recommandees).some((xs) => xs.includes(serie));
    return { f, s: (fScore.get(f.id) ?? 0) * (serieOk ? 1 : 0.6), serieOk };
  }).sort((a, b) => b.s - a.s).slice(0, 12);
  const programs = forms.length ? await db.select({ p: schema.programs, e: schema.establishments }).from(schema.programs)
    .innerJoin(schema.establishments, eq(schema.establishments.id, schema.programs.establishmentId))
    .where(and(inArray(schema.programs.formationId, forms.map((x) => x.f.id)), eq(schema.programs.active, true), eq(schema.programs.homologated, true), isNotNull(schema.establishments.label),
      prefVilles.length ? inArray(schema.establishments.ville, prefVilles) : undefined)) : [];
  const pct = (s: number) => Math.round(55 + s * 43);
  return {
    profil: top,
    metiers: scoredMetiers.map(({ m, s }) => ({ id: m.id, nom: m.nom, score: pct(s) })),
    formations: forms.map(({ f, s, serieOk }) => ({ id: f.id, intitule: f.intitule, score: pct(s), serieOk })),
    offres: programs.map(({ p, e }) => ({ programId: p.id, title: p.title, etablissement: { id: e.id, nom: e.nom, sigle: e.sigle, pays: e.pays, ville: e.ville, logo: e.logo }, score: pct(fScore.get(p.formationId) ?? 0) }))
      .sort((a, b) => b.score - a.score).slice(0, 24),
  };
}
