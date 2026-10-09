// Moteur de devis « études à l'étranger » (min / max sur toute la durée de la formation).
// Même calcul que les maquettes validées (design/maquettes/build_v2.py).
import coutsData from "@/data/couts.json";
import { etabById, formationById } from "./data";
import { paysOrigineById } from "./pays-origine";

type F = { min: number; max: number };
export type CoutsPays = {
  id: string; devise: string;
  scolarite_annuelle: Record<string, F & { libelle: string }>;
  frais_annuels_annexes: F & { libelle: string };
  vie_mensuelle: { villes_cheres: string[]; ville_chere: F; autre_ville: F };
  installation: (F & { poste: string; note?: string; annuel?: boolean })[];
  billet_avion: Record<string, F | string>;
  demarches: { quand: string; etape: string }[];
  environnement: Record<"securite" | "sante" | "transports" | "communaute" | "climat", string>;
};
const C = coutsData as unknown as { items: CoutsPays[]; taux: Record<string, number | string>; hypotheses: Record<string, number>; sources: string[]; avertissement: string };
export const COUTS = Object.fromEntries(C.items.map((c) => [c.id, c])) as Record<string, CoutsPays>;
export const HYP = C.hypotheses as { mois_par_an: number; inflation_annuelle: number; frais_transfert: number; marge_imprevus: number };
export const TAUX = C.taux as Record<string, number>;
export const SOURCES = C.sources;

export type Logement = "studio" | "colocation";
export const LOGEMENT_LABEL: Record<Logement, string> = { studio: "Studio meublé", colocation: "Colocation" };
/** Colocation : économie estimée sur le coût de la vie (loyer partagé). */
export const ECO_COLOC = 0.15;

export type Pair = [number, number];
export type Devis = {
  devise: string; years: number; total: Pair; installation: Pair; cats: Record<string, Pair>; typ: string; chere: boolean;
  rows: { annee: number; scolarite: Pair; annexes: Pair; vie: Pair; renouvellements: Pair; total: Pair }[];
};

/** Billet d'avion aller simple vers le Maroc : tarif du pays s'il existe, sinon estimation par région. */
export function billet(c: CoutsPays, origine: string): F {
  const region = paysOrigineById[origine]?.region;
  return (c.billet_avion[`depuis_${origine}`] as F) ?? (region ? (c.billet_avion[`depuis_region_${region}`] as F) : undefined) ?? { min: 0, max: 0 };
}

export function devis(eid: string, fid: string, origine = "SN", logement: Logement = "studio"): Devis {
  const e = etabById[eid];
  const Fm = formationById[fid];
  const c = COUTS[e.pays];
  const years = Math.max(1, Math.min(Fm.duree_annees, 5));
  const typ = c.scolarite_annuelle[e.type] ? e.type : e.statut === "inter_etats" && c.scolarite_annuelle.inter_etats ? "inter_etats" : "universite";
  const sco = c.scolarite_annuelle[typ];
  const ann = c.frais_annuels_annexes;
  const chere = c.vie_mensuelle.villes_cheres.some((v) => e.ville.includes(v));
  const vie = c.vie_mensuelle[chere ? "ville_chere" : "autre_ville"];
  const k = logement === "colocation" ? 1 - ECO_COLOC : 1;
  const annuel = c.installation.filter((i) => i.annuel);
  const once = c.installation.filter((i) => !i.annuel);
  const sum = (xs: F[], key: "min" | "max") => xs.reduce((a, x) => a + x[key], 0);
  const rows: Devis["rows"] = [];
  let tot: Pair = [0, 0];
  for (let y = 0; y < years; y++) {
    const inf = (1 + HYP.inflation_annuelle) ** y;
    const a: Pair = [Math.round(sco.min * inf), Math.round(sco.max * inf)];
    const b: Pair = [ann.min, ann.max];
    const v: Pair = [Math.round(vie.min * k * HYP.mois_par_an * inf), Math.round(vie.max * k * HYP.mois_par_an * inf)];
    const r: Pair = [sum(annuel, "min"), sum(annuel, "max")];
    const row: Pair = [a[0] + b[0] + v[0] + r[0], a[1] + b[1] + v[1] + r[1]];
    rows.push({ annee: y + 1, scolarite: a, annexes: b, vie: v, renouvellements: r, total: row });
    tot = [tot[0] + row[0], tot[1] + row[1]];
  }
  const vol = billet(c, origine);
  const inst: Pair = [sum(once, "min") + vol.min * 2, sum(once, "max") + vol.max * 2];
  const sub: Pair = [tot[0] + inst[0], tot[1] + inst[1]];
  const imp = sub.map((x) => Math.round(x * HYP.marge_imprevus)) as Pair;
  const tr = sub.map((x) => Math.round(x * HYP.frais_transfert)) as Pair;
  const total: Pair = [sub[0] + imp[0] + tr[0], sub[1] + imp[1] + tr[1]];
  const cat = (f: (r: Devis["rows"][number]) => Pair): Pair => [rows.reduce((s, r) => s + f(r)[0], 0), rows.reduce((s, r) => s + f(r)[1], 0)];
  return {
    devise: c.devise, years, rows, installation: inst, total, typ: sco.libelle, chere,
    cats: {
      "Scolarité": cat((r) => [r.scolarite[0] + r.annexes[0], r.scolarite[1] + r.annexes[1]]),
      "Vie quotidienne": cat((r) => r.vie),
      "Installation & voyages": inst,
      "Séjour & assurance": cat((r) => r.renouvellements),
      "Imprévus & transferts": [imp[0] + tr[0], imp[1] + tr[1]],
    },
  };
}

export type Devise = "XAF" | "XOF" | "MAD" | "EUR";
export const DEVISE_LABEL: Record<Devise, string> = { XAF: "F CFA (XAF)", XOF: "F CFA (XOF)", MAD: "Dirham (MAD)", EUR: "Euro (€)" };
export const DEVISE_COURT: Record<Devise, string> = { XAF: "F CFA", XOF: "F CFA", MAD: "MAD", EUR: "€" };
const rate = (d: string) => (d === "EUR" ? 1 : TAUX[d]);
/** Conversion via l'euro (taux indicatifs). */
export const convert = (v: number, from: string, to: string) => (from === to ? v : Math.round((v / rate(from)) * rate(to)));
/** Devise d'affichage par défaut selon le pays d'origine (F CFA, dirham, sinon euro). */
export const devisePays = (c: string): Devise => { const d = paysOrigineById[c]?.devise; return d === "XAF" || d === "XOF" || d === "MAD" || d === "EUR" ? d : "EUR"; };

/** Formation par défaut pour un établissement : la plus longue (devis le plus complet). */
export const formationParDefaut = (eid: string) => {
  const fs = etabById[eid].formations.filter((f) => formationById[f]);
  return fs.slice().sort((a, b) => formationById[b].duree_annees - formationById[a].duree_annees)[0] ?? fs[0];
};
