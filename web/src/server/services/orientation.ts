import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db, schema } from "../db";
import { publishable } from "./establishments";

/** Enregistre un résultat de test RIASEC et met à jour le profil. */
export async function saveResult(userId: string, answers: (number | null)[], scores: Record<string, number>, top: string[]) {
  const [r] = await db.insert(schema.orientationResults).values({ userId, answers, scores, top }).returning();
  await db.insert(schema.profiles).values({ userId, riasec: { scores, top } }).onConflictDoUpdate({ target: schema.profiles.userId, set: { riasec: { scores, top } } });
  return r;
}

export const history = (userId: string) => db.select().from(schema.orientationResults).where(eq(schema.orientationResults.userId, userId)).orderBy(desc(schema.orientationResults.createdAt));

type Metier = { id: string; nom: string; domaine: string; riasec: string[]; formations: string[] };
type Formation = { id: string; intitule: string; domaine: string; metiers: string[]; series_recommandees: Record<string, string[]>; duree_annees: number };

/**
 * Compatibilité (0-100) entre le profil RIASEC et une liste de codes (métier) : moyenne des scores du profil
 * pour ces codes, pondérée par leur rang (le premier code du métier compte le plus), rapportée au score maximal du profil.
 */
export function compat(scores: Record<string, number>, codes: string[]) {
  const max = Math.max(1, ...Object.values(scores));
  const w = codes.map((_, i) => (i === 0 ? 1 : i === 1 ? 0.7 : 0.5));
  const sum = codes.reduce((a, c, i) => a + w[i] * ((scores[c] ?? 0) / max), 0);
  return codes.length ? Math.round((sum / w.reduce((a, b) => a + b, 0)) * 100) : 0;
}

/**
 * Moteurs 2 à 4 : profil RIASEC → métiers → formations (série du bac) → offres des établissements (Maroc) → établissements.
 * Tous les pourcentages sont calculés à partir des scores du test enregistrés dans le profil.
 */
export async function recommend(userId: string, opts: { limit?: number } = {}) {
  const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
  const riasec = p?.riasec ?? null;
  const top = riasec?.top ?? [];
  if (!riasec || !Object.keys(riasec.scores ?? {}).length) return { profil: top, metiers: [], formations: [], offres: [], etablissements: [] };
  const scores = riasec.scores;
  const metiers = (await db.select().from(schema.refMetiers).where(eq(schema.refMetiers.published, true))).map((m) => m.data as Metier);
  const formations = (await db.select().from(schema.refFormations).where(eq(schema.refFormations.published, true))).map((f) => f.data as Formation);
  const scoredMetiers = metiers.map((m) => ({ m, s: compat(scores, m.riasec) })).sort((a, b) => b.s - a.s || a.m.nom.localeCompare(b.m.nom)).slice(0, opts.limit ?? 12);
  const serie = p?.serie;
  const prefVilles = p?.preferences?.villes ?? [];
  // Formation : meilleur score des métiers visés, minoré de 15 % si la série du bac n'est pas recommandée.
  const fScore = new Map<string, number>();
  for (const { m, s } of scoredMetiers) for (const fid of m.formations) fScore.set(fid, Math.max(fScore.get(fid) ?? 0, s));
  const forms = formations.filter((f) => fScore.has(f.id)).map((f) => {
    const serieOk = !serie || !Object.values(f.series_recommandees ?? {}).flat().length || Object.values(f.series_recommandees).some((xs) => xs.includes(serie));
    return { f, s: Math.round((fScore.get(f.id) ?? 0) * (serieOk ? 1 : 0.85)), serieOk };
  }).sort((a, b) => b.s - a.s).slice(0, 12);
  const formScore = new Map(forms.map((x) => [x.f.id, x.s]));
  const programs = forms.length ? await db.select({ p: schema.programs, e: schema.establishments }).from(schema.programs)
    .innerJoin(schema.establishments, eq(schema.establishments.id, schema.programs.establishmentId))
    .where(and(inArray(schema.programs.formationId, forms.map((x) => x.f.id)), eq(schema.programs.active, true), publishable, isNotNull(schema.establishments.label))) : [];
  // Offre : score de la formation, +3 points si la ville fait partie des villes d'études souhaitées.
  const inPref = (e: typeof schema.establishments.$inferSelect, campuses: string[]) => prefVilles.length > 0 && [e.ville, ...campuses].some((v) => prefVilles.includes(v));
  const offres = programs.map(({ p, e }) => ({
    programId: p.id, title: p.title, formationId: p.formationId, campuses: p.campuses, homologated: p.homologated, statut: p.homologation?.statut ?? null,
    etablissement: { id: e.id, nom: e.nom, sigle: e.sigle, pays: e.pays, ville: e.ville, logo: e.logo, label: e.label },
    score: Math.min(99, (formScore.get(p.formationId) ?? 0) + (inPref(e, p.campuses) ? 3 : 0)),
  })).sort((a, b) => b.score - a.score || a.etablissement.nom.localeCompare(b.etablissement.nom));
  // Diversité : à score égal, la 1re offre de chaque établissement passe avant la 2e d'un même établissement.
  const rank = new Map<string, number>();
  const ranked = offres.map((o) => { const k = rank.get(o.etablissement.id) ?? 0; rank.set(o.etablissement.id, k + 1); return { o, k }; });
  offres.splice(0, offres.length, ...ranked.sort((a, b) => b.o.score - a.o.score || a.k - b.k).map((x) => x.o));
  // Établissement : meilleure offre et nombre de formations compatibles.
  const byEtab = new Map<string, { etablissement: (typeof offres)[number]["etablissement"]; score: number; formations: number }>();
  for (const o of offres) {
    const cur = byEtab.get(o.etablissement.id);
    if (!cur) byEtab.set(o.etablissement.id, { etablissement: o.etablissement, score: o.score, formations: 1 });
    else { cur.formations++; cur.score = Math.max(cur.score, o.score); }
  }
  return {
    profil: top,
    metiers: scoredMetiers.map(({ m, s }) => ({ id: m.id, nom: m.nom, domaine: m.domaine, score: s })),
    formations: forms.map(({ f, s, serieOk }) => ({ id: f.id, intitule: f.intitule, domaine: f.domaine, score: s, serieOk })),
    offres: offres.slice(0, 24),
    etablissements: [...byEtab.values()].sort((a, b) => b.score - a.score || b.formations - a.formations).slice(0, 12),
  };
}
