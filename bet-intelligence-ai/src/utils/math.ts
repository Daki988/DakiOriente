export function round(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Probabilité implicite d'une cote décimale (sans retrait de marge). */
export function impliedProbability(odds: number): number {
  if (!(odds > 0)) throw new RangeError('La cote doit être strictement positive.');
  return 1 / odds;
}

/** Cote totale d'un combiné de sélections indépendantes = produit des cotes. */
export function combinedOdds(odds: number[]): number {
  if (odds.length === 0) return 0;
  return odds.reduce((acc, o) => acc * o, 1);
}

/**
 * Probabilité indicative d'un combiné, en supposant l'indépendance des événements
 * (approximation : ne tient pas compte des corrélations).
 */
export function combinedProbability(probabilities: number[]): number {
  if (probabilities.length === 0) return 0;
  return probabilities.reduce((acc, p) => acc * p, 1);
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Score de Brier : moyenne de (p − résultat)², résultat ∈ {0, 1}. */
export function brierScore(pairs: { probability: number; outcome: 0 | 1 }[]): number | null {
  if (pairs.length === 0) return null;
  return mean(pairs.map(({ probability, outcome }) => (probability - outcome) ** 2));
}
