// Profil RIASEC : calcul du résultat du test, compatibilités métiers / domaines (mêmes règles que le serveur).
import { QUESTIONS } from "./test";
import { domaineById, metiers, riasec, type Metier } from "./data";

export const CODES = ["R", "I", "A", "S", "E", "C"] as const;
export const RESULT_KEY = "navigoal-profil";

/** Traits associés à chaque dimension du modèle RIASEC (Holland). */
export const TRAITS: Record<string, string[]> = {
  R: ["Sens pratique", "Habileté manuelle", "Persévérance"],
  I: ["Esprit logique", "Curiosité", "Analyse"],
  A: ["Créativité", "Imagination", "Sens esthétique"],
  S: ["Écoute", "Empathie", "Esprit d'équipe"],
  E: ["Leadership", "Persuasion", "Initiative"],
  C: ["Organisation", "Rigueur", "Méthode"],
};

/** Scores (25 à 100) et deux dimensions dominantes à partir des réponses. */
export function computeResult(answers: (number | null)[]) {
  const raw: Record<string, number> = Object.fromEntries(CODES.map((c) => [c, 0]));
  answers.forEach((a, i) => { if (a !== null && QUESTIONS[i]) QUESTIONS[i].choices[a].codes.forEach((c, j) => (raw[c] += j === 0 ? 2 : 1)); });
  const max = Math.max(1, ...Object.values(raw));
  const values = Object.fromEntries(CODES.map((c) => [c, Math.round(25 + (75 * raw[c]) / max)]));
  const top = [...CODES].sort((a, b) => raw[b] - raw[a]).slice(0, 3);
  return { values, top };
}

/** Scores ramenés sur 100 (le plus fort = 100). */
export const normalize = (scores: Record<string, number>) => {
  const max = Math.max(1, ...Object.values(scores));
  return Object.fromEntries(CODES.map((c) => [c, Math.round(((scores[c] ?? 0) / max) * 100)]));
};

/** Compatibilité (0-100) entre le profil et les codes d'un métier, pondérée par le rang des codes. */
export function compat(scores: Record<string, number>, codes: string[]) {
  const max = Math.max(1, ...Object.values(scores));
  const w = codes.map((_, i) => (i === 0 ? 1 : i === 1 ? 0.7 : 0.5));
  const sum = codes.reduce((a, c, i) => a + w[i] * ((scores[c] ?? 0) / max), 0);
  return codes.length ? Math.round((sum / w.reduce((a, b) => a + b, 0)) * 100) : 0;
}

export function profileOf(top: string[]) {
  const [a, b] = top.map((c) => riasec.find((r) => r.code === c)).filter(Boolean) as (typeof riasec)[number][];
  if (!a) return null;
  const t1 = a.profil.split(" / ")[0], t2 = b ? b.profil.split(" / ")[0] : a.profil.split(" / ")[1];
  const desc = [a, b].filter(Boolean).map((x) => x!.description.replace(/^Aime /, "").replace(/\.$/, "")).join(" ; ");
  return { titre: `${t1} / ${t2}`, codes: top.slice(0, 2).join(" + "), noms: [a, b].filter(Boolean).map((x) => x!.nom), description: `Tu aimes ${desc}.`, traits: [...(TRAITS[top[0]] ?? []), ...(TRAITS[top[1]] ?? []).slice(0, 2)] };
}

/** Métiers classés par compatibilité, puis domaines (moyenne des 3 meilleurs métiers du domaine). */
export function rankMetiers(scores: Record<string, number>) {
  return metiers.map((m) => ({ m, s: compat(scores, m.riasec) })).sort((a, b) => b.s - a.s || a.m.nom.localeCompare(b.m.nom));
}
export function rankDomaines(ranked: { m: Metier; s: number }[]) {
  const by: Record<string, number[]> = {};
  for (const { m, s } of ranked) (by[m.domaine] ||= []).push(s);
  return Object.entries(by).filter(([d]) => domaineById[d]).map(([d, arr]) => {
    const best = arr.slice(0, 3);
    return { id: d, libelle: domaineById[d].libelle, score: Math.round(best.reduce((a, b) => a + b, 0) / best.length), metiers: arr.length };
  }).sort((a, b) => b.score - a.score);
}
