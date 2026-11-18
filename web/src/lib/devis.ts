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
  personnalisation?: Personnalisation;
};
type ParVille = { libelle: string; ville_chere: F; autre_ville: F };
type Lib = F & { libelle: string };
export type Personnalisation = {
  logement_mensuel: Record<"colocation" | "studio" | "standing", ParVille>;
  vie_mensuelle_hors_logement: Record<"econome" | "normal" | "confortable", ParVille>;
  transport_mensuel: Record<"tram" | "taxi", Lib>;
  assurance_annuelle: Record<"base" | "complete", Lib>;
  ordinateur: Lib;
  equipement_sans_ordinateur: Lib;
  soutien_mensuel: Lib;
};

/** Choix du devis personnalisé. logement : type, ou « res:<résidence>:<n° de logement> » pour une résidence universitaire. */
export type Perso = {
  logement: string; niveau: "econome" | "normal" | "confortable"; transport: "tram" | "taxi"; assurance: "base" | "complete";
  retours: number; ordinateur: boolean; soutien: boolean; aide: number; // aide : bourse ou réduction par an, en monnaie du pays d'études
};
export const PERSO_DEFAUT: Perso = { logement: "studio", niveau: "normal", transport: "tram", assurance: "base", retours: 0, ordinateur: false, soutien: false, aide: 0 };
export type Poste = { libelle: string; v: Pair; quand: "avant" | "mois" | "an" };
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
  /** true : la scolarité vient des tarifs publiés par l'école ; false : fourchette indicative du type d'établissement. */
  scolaritePubliee: boolean;
  devise: string; years: number; total: Pair; installation: Pair; cats: Record<string, Pair>; typ: string; chere: boolean;
  rows: { annee: number; scolarite: Pair; annexes: Pair; vie: Pair; renouvellements: Pair; total: Pair }[];
  /** Devis personnalisé : détail des postes (avant le départ, chaque mois, chaque année de la 1re année) et aides déduites. */
  postes?: Poste[]; aides?: Pair; logementLibelle?: string;
  /** Détail ligne par ligne sur toute la durée, regroupé par rubrique (Scolarité, Logement, Vie quotidienne…). */
  detail: Ligne[];
};
export const RUBRIQUES = ["Scolarité", "Logement", "Vie quotidienne", "Voyages", "Démarches & santé", "Équipement", "Imprévus & transferts"] as const;
export type Rubrique = (typeof RUBRIQUES)[number];

/** Billet d'avion aller simple vers le Maroc : tarif du pays s'il existe, sinon estimation par région. */
export function billet(c: CoutsPays, origine: string): F {
  const region = paysOrigineById[origine]?.region;
  return (c.billet_avion[`depuis_${origine}`] as F) ?? (region ? (c.billet_avion[`depuis_region_${region}`] as F) : undefined) ?? { min: 0, max: 0 };
}

/** Loyer mensuel du logement choisi (type ou résidence universitaire), et son libellé. */
export function loyerPerso(p: Personnalisation, ville: string, chere: boolean, choix: string, residences: { id: string; nom: string; logements: { type: string; loyer_min: number | null; loyer_max: number | null }[] }[] = []): { v: F; libelle: string } {
  const [k, rid, n] = choix.split(":");
  if (k === "res") {
    const r = residences.find((x) => x.id === rid);
    const l = r?.logements[Number(n) || 0];
    if (r && l?.loyer_min) return { v: { min: l.loyer_min, max: l.loyer_max ?? l.loyer_min }, libelle: `${r.nom} · ${l.type}` };
  }
  const t = p.logement_mensuel[(k as keyof Personnalisation["logement_mensuel"])] ?? p.logement_mensuel.studio;
  return { v: t[chere ? "ville_chere" : "autre_ville"], libelle: `${t.libelle}${ville ? ` à ${ville}` : ""}` };
}

/** Une ligne du devis : clé stable (cochée ou décochée par le parent), rubrique, et quand elle se paie. */
export type Ligne = { cle: string; rubrique: Rubrique; libelle: string; v: Pair; inclus: boolean; quand: "avant" | "mois" | "an"; unitaire: Pair };

export function devis(eid: string, fid: string, origine = "", logement: Logement = "studio", perso?: Perso & { residences?: Parameters<typeof loyerPerso>[4] }, exclus: readonly string[] = []): Devis {
  const e = etabById[eid];
  const Fm = formationById[fid];
  const c = COUTS[e.pays];
  const years = Math.max(1, Math.min(Fm.duree_annees, 5));
  const typ = c.scolarite_annuelle[e.type] ? e.type : e.statut === "inter_etats" && c.scolarite_annuelle.inter_etats ? "inter_etats" : "universite";
  // Tarifs publiés par l'école quand elle les affiche ; sinon fourchette indicative du type d'établissement.
  const publie = e.frais_publies;
  const sco = publie ? { min: publie.min, max: publie.max, libelle: "tarifs publiés par l'école" } : c.scolarite_annuelle[typ];
  const ann = c.frais_annuels_annexes;
  const chere = c.vie_mensuelle.villes_cheres.some((v) => e.ville.includes(v));
  const vie = c.vie_mensuelle[chere ? "ville_chere" : "autre_ville"];
  const k = logement === "colocation" ? 1 - ECO_COLOC : 1;
  const P = perso && c.personnalisation ? c.personnalisation : null;
  const lp = P ? loyerPerso(P, e.ville, chere, perso!.logement, perso!.residences) : null;
  const mois = HYP.mois_par_an;
  const inf = (y: number) => (1 + HYP.inflation_annuelle) ** y;
  const vol = billet(c, origine);
  const ret = P ? Math.max(0, Math.min(3, perso!.retours)) : 0;

  // Composantes : par année (montant de base de l'année 1, avec ou sans inflation) ou une seule fois.
  type Comp = { cle: string; rubrique: Rubrique; libelle: string; quand: "avant" | "mois" | "an"; base: F; parAn: boolean; inflation: boolean; facteur: number; ligneRow: "scolarite" | "annexes" | "vie" | "renouvellements" | null };
  const C: Comp[] = [];
  const add = (x: Omit<Comp, "facteur"> & { facteur?: number }) => C.push({ facteur: 1, ...x });
  add({ cle: "scolarite", rubrique: "Scolarité", libelle: `Frais de scolarité (${sco.libelle})`, quand: "an", base: sco, parAn: true, inflation: true, ligneRow: "scolarite" });
  add({ cle: "inscription", rubrique: "Scolarité", libelle: ann.libelle, quand: "an", base: ann, parAn: true, inflation: false, ligneRow: "annexes" });
  // Loyer et vie quotidienne (10 mois par an, avec inflation).
  const loyerType = c.personnalisation ? c.personnalisation.logement_mensuel[logement === "colocation" ? "colocation" : "studio"][chere ? "ville_chere" : "autre_ville"] : null;
  if (P && lp) {
    const hors = P.vie_mensuelle_hors_logement[perso!.niveau][chere ? "ville_chere" : "autre_ville"];
    const tra = P.transport_mensuel[perso!.transport];
    add({ cle: "loyer", rubrique: "Logement", libelle: `Loyer : ${lp.libelle}`, quand: "mois", base: lp.v, parAn: true, inflation: true, facteur: mois, ligneRow: "vie" });
    add({ cle: "vie", rubrique: "Vie quotidienne", libelle: `Nourriture, téléphone, sorties (${P.vie_mensuelle_hors_logement[perso!.niveau].libelle.toLowerCase()})`, quand: "mois", base: hors, parAn: true, inflation: true, facteur: mois, ligneRow: "vie" });
    add({ cle: "transport", rubrique: "Vie quotidienne", libelle: `Déplacements : ${tra.libelle.toLowerCase()}`, quand: "mois", base: tra, parAn: true, inflation: true, facteur: mois, ligneRow: "vie" });
    if (perso!.soutien) add({ cle: "soutien", rubrique: "Vie quotidienne", libelle: P.soutien_mensuel.libelle, quand: "mois", base: P.soutien_mensuel, parAn: true, inflation: true, facteur: mois, ligneRow: "vie" });
  } else {
    const total = { min: vie.min * k, max: vie.max * k };
    const loyer = loyerType ? { min: Math.min(total.min, loyerType.min), max: Math.min(total.max, loyerType.max) } : { min: 0, max: 0 };
    if (loyer.max) add({ cle: "loyer", rubrique: "Logement", libelle: `Loyer : ${LOGEMENT_LABEL[logement].toLowerCase()} à ${e.ville}`, quand: "mois", base: loyer, parAn: true, inflation: true, facteur: mois, ligneRow: "vie" });
    add({ cle: "vie", rubrique: "Vie quotidienne", libelle: "Nourriture, déplacements, téléphone, sorties", quand: "mois", base: { min: total.min - loyer.min, max: total.max - loyer.max }, parAn: true, inflation: true, facteur: mois, ligneRow: "vie" });
  }
  // Frais d'installation et de séjour (référentiel), adaptés au devis personnalisé (assurance, caution, ordinateur).
  const rub = (poste: string): Rubrique => /caution|loyer/i.test(poste) ? "Logement" : /équipement|ordinateur/i.test(poste) ? "Équipement" : "Démarches & santé";
  const cleDe = (poste: string) => /visa/i.test(poste) ? "visa" : /séjour/i.test(poste) ? "carte_sejour" : /assurance/i.test(poste) ? "assurance" : /caution/i.test(poste) ? "caution" : /équipement/i.test(poste) ? "equipement" : poste.toLowerCase().replace(/[^a-z]+/g, "_");
  for (const i of c.installation) {
    let base: F = i, libelle = i.poste;
    if (P && /assurance/i.test(i.poste)) { base = P.assurance_annuelle[perso!.assurance]; libelle = P.assurance_annuelle[perso!.assurance].libelle; }
    if (P && lp && /caution/i.test(i.poste)) base = { min: lp.v.min * 2, max: lp.v.max * 2 };
    if (P && perso!.ordinateur && /équipement/i.test(i.poste)) { base = P.equipement_sans_ordinateur; libelle = P.equipement_sans_ordinateur.libelle; }
    add({ cle: cleDe(i.poste), rubrique: rub(i.poste), libelle, quand: i.annuel ? "an" : "avant", base, parAn: !!i.annuel, inflation: false, ligneRow: i.annuel ? "renouvellements" : null });
  }
  if (P && perso!.ordinateur) add({ cle: "ordinateur", rubrique: "Équipement", libelle: P.ordinateur.libelle, quand: "avant", base: P.ordinateur, parAn: false, inflation: false, ligneRow: null });
  if (vol.max) add({ cle: "billets", rubrique: "Voyages", libelle: "Billets d'avion : aller à l'arrivée et retour à la fin des études", quand: "avant", base: vol, parAn: false, inflation: false, facteur: 2, ligneRow: null });
  if (ret && vol.max) add({ cle: "retours", rubrique: "Voyages", libelle: `${ret} aller-retour${ret > 1 ? "s" : ""} par an au pays pendant les vacances`, quand: "an", base: vol, parAn: true, inflation: false, facteur: 2 * ret, ligneRow: "renouvellements" });

  const exclu = new Set(exclus);
  const val = (x: Comp, y: number): Pair => { const f = x.facteur * (x.inflation ? inf(y) : 1); return [Math.round(x.base.min * f), Math.round(x.base.max * f)]; };
  const plus = (a: Pair, b: Pair): Pair => [a[0] + b[0], a[1] + b[1]];
  const rows: Devis["rows"] = [];
  let tot: Pair = [0, 0];
  for (let y = 0; y < years; y++) {
    const r = { scolarite: [0, 0] as Pair, annexes: [0, 0] as Pair, vie: [0, 0] as Pair, renouvellements: [0, 0] as Pair };
    for (const x of C) if (x.parAn && x.ligneRow && !exclu.has(x.cle)) r[x.ligneRow] = plus(r[x.ligneRow], val(x, y));
    const row = plus(plus(r.scolarite, r.annexes), plus(r.vie, r.renouvellements));
    rows.push({ annee: y + 1, ...r, total: row });
    tot = plus(tot, row);
  }
  const inst = C.filter((x) => !x.parAn && !exclu.has(x.cle)).reduce<Pair>((a, x) => plus(a, val(x, 0)), [0, 0]);
  const sub = plus(tot, inst);
  const imp = sub.map((x) => Math.round(x * HYP.marge_imprevus)) as Pair;
  const tr = sub.map((x) => Math.round(x * HYP.frais_transfert)) as Pair;
  // Aides (bourse, réduction de l'école) déduites du total, sans le rendre négatif.
  const aideAn = P ? Math.max(0, Math.round(perso!.aide)) : 0;
  const brut = plus(plus(sub, imp), tr);
  const aides: Pair = [Math.min(aideAn * years, brut[1]), Math.min(aideAn * years, brut[0])];
  const total: Pair = [Math.max(0, brut[0] - aides[1]), Math.max(0, brut[1] - aides[0])];

  // Lignes sur toute la durée (cochées ou non), puis imprévus et transferts calculés sur les lignes cochées.
  const n = years;
  const detail: Ligne[] = C.map((x) => {
    const v = x.parAn ? Array.from({ length: n }, (_, y) => val(x, y)).reduce(plus, [0, 0] as Pair) : val(x, 0);
    const suffixe = x.parAn ? (x.quand === "mois" ? `, ${mois} mois par an pendant ${n} an${n > 1 ? "s" : ""}` : `, chaque année pendant ${n} an${n > 1 ? "s" : ""}`) : " (une fois)";
    return { cle: x.cle, rubrique: x.rubrique, libelle: `${x.libelle}${suffixe}`, v, inclus: !exclu.has(x.cle), quand: x.quand, unitaire: [Math.round(x.base.min * (x.quand === "mois" ? 1 : x.facteur)), Math.round(x.base.max * (x.quand === "mois" ? 1 : x.facteur))] as Pair };
  }).filter((l) => l.v[1] > 0 || l.cle === "visa");
  detail.push({ cle: "imprevus", rubrique: "Imprévus & transferts", libelle: `Marge pour imprévus (${Math.round(HYP.marge_imprevus * 100)} % des postes cochés)`, v: imp, inclus: true, quand: "an", unitaire: imp });
  detail.push({ cle: "transferts", rubrique: "Imprévus & transferts", libelle: `Frais de transfert d'argent (${Math.round(HYP.frais_transfert * 100)} % des postes cochés)`, v: tr, inclus: true, quand: "an", unitaire: tr });
  const cats = Object.fromEntries(RUBRIQUES.map((r) => [r, detail.filter((x) => x.rubrique === r && x.inclus).reduce<Pair>((a, x) => plus(a, x.v), [0, 0])]).filter(([, v]) => (v as Pair)[1] > 0)) as Record<string, Pair>;
  // « Quand payer quoi » (devis personnalisé) : montants de la 1re année, lignes cochées seulement.
  const postes: Poste[] | undefined = P && lp ? detail.filter((x) => x.inclus && !["imprevus", "transferts"].includes(x.cle)).map((x) => ({
    libelle: x.cle === "billets" ? "Billet d'avion aller" : x.libelle.replace(/,( \d+ mois par an)? pendant.*$|, chaque année pendant.*$| \(une fois\)$/, ""),
    v: x.cle === "billets" ? [vol.min, vol.max] : x.unitaire, quand: x.quand,
  })) : undefined;
  return {
    devise: c.devise, years, rows, installation: inst, total, typ: sco.libelle, chere, scolaritePubliee: !!publie,
    detail, cats, ...(postes ? { postes, aides, logementLibelle: lp!.libelle } : {}),
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
