// Affichage des prix (décision de novembre 2026) : jamais de fourchette sur la plateforme.
// Montant connu exactement (tarif officiel unique, loyer d'une annonce…) : le montant seul.
// Sinon (estimation, ou tarifs officiels qui varient selon la filière) : « à partir de » + le minimum.
export type Bornes = { min: number; max?: number | null } | readonly [number, number] | readonly number[];

const bornes = (v: Bornes): [number, number] => (Array.isArray(v) ? [v[0], v[1] ?? v[0]] : [(v as { min: number }).min, (v as { max?: number | null }).max ?? (v as { min: number }).min]) as [number, number];

/** Le montant à afficher (le minimum) et s'il faut dire « à partir de ». */
export function prixMin(v: Bornes): { montant: number; aPartir: boolean } {
  const [a, b] = bornes(v);
  return { montant: a, aPartir: Math.round(b) !== Math.round(a) };
}

/** Texte complet : « à partir de 12 000 MAD » ou « 12 000 MAD ». `format` met en forme le montant (devise comprise). */
export function prixTexte(v: Bornes, format: (n: number) => string, opts: { majuscule?: boolean } = {}): string {
  const { montant, aPartir } = prixMin(v);
  const t = aPartir ? `à partir de ${format(montant)}` : format(montant);
  return opts.majuscule ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

/** Préfixe seul (« à partir de » ou ""), pour les mises en page qui affichent le montant à part. */
export const prefixePrix = (v: Bornes, majuscule = false) => (prixMin(v).aPartir ? (majuscule ? "À partir de " : "à partir de ") : "");
