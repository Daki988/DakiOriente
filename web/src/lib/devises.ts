import tauxData from "@/data/taux.json";
import { paysOrigineById } from "@/lib/pays-origine";
import fuseaux from "@/lib/fuseaux.json";

/** Marge de prudence appliquée aux conversions (fluctuation des taux de change entre aujourd'hui et le paiement). */
export const MARGE_PRUDENCE = 0.03;
export type Taux = { date: string; base: "MAD"; taux: Record<string, number> };
export const TAUX_SECOURS = tauxData as Taux;

const NOMS: Record<string, string> = { XOF: "F CFA", XAF: "F CFA", EUR: "€", USD: "$", MAD: "MAD", GBP: "£", CHF: "CHF", CAD: "$ CA" };
export const symbole = (devise: string) => NOMS[devise] ?? devise;
export const devisePays = (pays?: string | null) => (pays ? paysOrigineById[pays]?.devise ?? null : null);

/** Montant en dirhams converti dans la devise cible, majoré de la marge de prudence et arrondi vers le haut. */
export function convertir(mad: number, devise: string, taux: Taux = TAUX_SECOURS): number | null {
  const t = taux.taux[devise];
  if (!t || devise === "MAD") return null;
  const brut = mad * t * (1 + MARGE_PRUDENCE);
  const pas = brut >= 100000 ? 1000 : brut >= 10000 ? 100 : brut >= 1000 ? 10 : 1;
  return Math.ceil(brut / pas) * pas;
}

const CFA = new Set(["XOF", "XAF"]);
/** Montant exprimé dans la devise `source` (MAD, XOF…) converti dans la devise cible ; null si inutile (même devise, ou F CFA ↔ F CFA à parité). */
export function convertirDe(montant: number, source: string, cible: string, taux: Taux = TAUX_SECOURS): number | null {
  if (source === cible || (CFA.has(source) && CFA.has(cible))) return null;
  const enMad = source === "MAD" ? montant : taux.taux[source] ? montant / taux.taux[source] : null;
  if (enMad == null) return null;
  if (cible === "MAD") {
    const brut = enMad * (1 + MARGE_PRUDENCE);
    const pas = brut >= 100000 ? 1000 : brut >= 10000 ? 100 : brut >= 1000 ? 10 : 1;
    return Math.ceil(brut / pas) * pas;
  }
  return convertir(enMad, cible, taux);
}

export const formatMontant = (n: number, devise: string) => {
  const s = Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ");
  const sym = symbole(devise);
  return sym === "€" || sym === "$" || sym === "£" ? `${s} ${sym}` : `${s} ${sym}`;
};

/**
 * Pays du visiteur, à défaut de profil ou de choix enregistré : fuseau horaire de l'appareil d'abord (Africa/Libreville → Gabon,
 * fiable même avec un navigateur réglé en « fr-FR »), puis région de la langue du navigateur (fr-SN → Sénégal).
 * Le Maroc renvoie null : les montants restent alors en dirhams seulement.
 */
export function paysNavigateur(): string | null {
  if (typeof navigator === "undefined") return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const p = (fuseaux as Record<string, string>)[tz];
    if (p) return p === "MA" ? null : p;
  } catch { /* Intl indisponible */ }
  for (const l of navigator.languages ?? [navigator.language]) {
    const m = /-([A-Z]{2})$/i.exec(l);
    if (m && paysOrigineById[m[1].toUpperCase()] && m[1].toUpperCase() !== "MA") return m[1].toUpperCase();
  }
  return null;
}
