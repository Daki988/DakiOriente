import tauxData from "@/data/taux.json";
import { paysOrigineById } from "@/lib/pays-origine";

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

export const formatMontant = (n: number, devise: string) => {
  const s = Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ");
  const sym = symbole(devise);
  return sym === "€" || sym === "$" || sym === "£" ? `${s} ${sym}` : `${s} ${sym}`;
};

/** Pays déduit de la langue du navigateur (fr-SN → SN), à défaut de profil ou de choix enregistré. */
export function paysNavigateur(): string | null {
  if (typeof navigator === "undefined") return null;
  for (const l of navigator.languages ?? [navigator.language]) {
    const m = /-([A-Z]{2})$/i.exec(l);
    if (m && paysOrigineById[m[1].toUpperCase()] && m[1].toUpperCase() !== "MA") return m[1].toUpperCase();
  }
  return null;
}
