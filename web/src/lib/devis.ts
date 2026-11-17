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
  detail: { rubrique: Rubrique; libelle: string; v: Pair }[];
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

export function devis(eid: string, fid: string, origine = "", logement: Logement = "studio", perso?: Perso & { residences?: Parameters<typeof loyerPerso>[4] }): Devis {
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
  // Devis personnalisé : la vie se compose du loyer choisi, du niveau de vie, du transport et du soutien scolaire ;
  // l'assurance suit le choix (de base ou complète), la caution suit le loyer, l'ordinateur s'ajoute s'il est coché.
  const lp = P ? loyerPerso(P, e.ville, chere, perso!.logement, perso!.residences) : null;
  const viePerso: F | null = P && lp ? (() => {
    const hors = P.vie_mensuelle_hors_logement[perso!.niveau][chere ? "ville_chere" : "autre_ville"];
    const tr = P.transport_mensuel[perso!.transport];
    const so = perso!.soutien ? P.soutien_mensuel : { min: 0, max: 0 };
    return { min: lp.v.min + hors.min + tr.min + so.min, max: lp.v.max + hors.max + tr.max + so.max };
  })() : null;
  const estAssurance = (i: { poste: string }) => /assurance/i.test(i.poste);
  const estCaution = (i: { poste: string }) => /caution/i.test(i.poste);
  const annuel = P
    ? [...c.installation.filter((i) => i.annuel && !estAssurance(i)), { poste: P.assurance_annuelle[perso!.assurance].libelle, ...P.assurance_annuelle[perso!.assurance] }]
    : c.installation.filter((i) => i.annuel);
  const once = P && lp
    ? [...c.installation.filter((i) => !i.annuel && !estCaution(i)).map((i) => perso!.ordinateur && /équipement/i.test(i.poste) ? { ...i, poste: P.equipement_sans_ordinateur.libelle, min: P.equipement_sans_ordinateur.min, max: P.equipement_sans_ordinateur.max } : i),
       { poste: "Caution + 1er mois de loyer", min: lp.v.min * 2, max: lp.v.max * 2 }, ...(perso!.ordinateur ? [{ poste: P.ordinateur.libelle, min: P.ordinateur.min, max: P.ordinateur.max }] : [])]
    : c.installation.filter((i) => !i.annuel);
  const sum = (xs: F[], key: "min" | "max") => xs.reduce((a, x) => a + x[key], 0);
  const rows: Devis["rows"] = [];
  let tot: Pair = [0, 0];
  // Part du loyer dans la vie sur place : loyer choisi (devis personnalisé) ou loyer type du logement (devis standard).
  const loyerMois: F | null = lp ? lp.v : c.personnalisation ? c.personnalisation.logement_mensuel[logement === "colocation" ? "colocation" : "studio"][chere ? "ville_chere" : "autre_ville"] : null;
  let loyerTot: Pair = [0, 0], vieTot: Pair = [0, 0];
  for (let y = 0; y < years; y++) {
    const inf = (1 + HYP.inflation_annuelle) ** y;
    const a: Pair = [Math.round(sco.min * inf), Math.round(sco.max * inf)];
    const b: Pair = [ann.min, ann.max];
    const v: Pair = viePerso
      ? [Math.round(viePerso.min * HYP.mois_par_an * inf), Math.round(viePerso.max * HYP.mois_par_an * inf)]
      : [Math.round(vie.min * k * HYP.mois_par_an * inf), Math.round(vie.max * k * HYP.mois_par_an * inf)];
    // Retours au pays pendant les vacances (aller-retour) : seulement dans le devis personnalisé.
    const vol1 = billet(c, origine);
    const retours = P ? Math.max(0, Math.min(3, perso!.retours)) : 0;
    const r: Pair = [sum(annuel, "min") + retours * 2 * vol1.min, sum(annuel, "max") + retours * 2 * vol1.max];
    const row: Pair = [a[0] + b[0] + v[0] + r[0], a[1] + b[1] + v[1] + r[1]];
    rows.push({ annee: y + 1, scolarite: a, annexes: b, vie: v, renouvellements: r, total: row });
    const ly: Pair = loyerMois ? [Math.min(v[0], Math.round(loyerMois.min * HYP.mois_par_an * inf)), Math.min(v[1], Math.round(loyerMois.max * HYP.mois_par_an * inf))] : [0, 0];
    loyerTot = [loyerTot[0] + ly[0], loyerTot[1] + ly[1]];
    vieTot = [vieTot[0] + v[0], vieTot[1] + v[1]];
    tot = [tot[0] + row[0], tot[1] + row[1]];
  }
  const vol = billet(c, origine);
  const inst: Pair = [sum(once, "min") + vol.min * 2, sum(once, "max") + vol.max * 2];
  const sub: Pair = [tot[0] + inst[0], tot[1] + inst[1]];
  const imp = sub.map((x) => Math.round(x * HYP.marge_imprevus)) as Pair;
  const tr = sub.map((x) => Math.round(x * HYP.frais_transfert)) as Pair;
  // Aides (bourse, réduction de l'école) déduites du total, sans le rendre négatif.
  const aideAn = P ? Math.max(0, Math.round(perso!.aide)) : 0;
  const aides: Pair = [Math.min(aideAn * years, sub[1] + imp[1] + tr[1]), Math.min(aideAn * years, sub[0] + imp[0] + tr[0])];
  const total: Pair = [Math.max(0, sub[0] + imp[0] + tr[0] - aides[1]), Math.max(0, sub[1] + imp[1] + tr[1] - aides[0])];
  const cat = (f: (r: Devis["rows"][number]) => Pair): Pair => [rows.reduce((s, r) => s + f(r)[0], 0), rows.reduce((s, r) => s + f(r)[1], 0)];
  return {
    devise: c.devise, years, rows, installation: inst, total, typ: sco.libelle, chere, scolaritePubliee: !!publie,
    ...(() => {
      // Détail ligne par ligne sur toute la durée, puis total par rubrique (la somme des rubriques = total avant aides).
      const n = years, ret = P ? Math.max(0, Math.min(3, perso!.retours)) : 0;
      const L: Devis["detail"] = [];
      const add = (rubrique: Rubrique, libelle: string, v: Pair) => { if (v[1] > 0) L.push({ rubrique, libelle, v }); };
      const fois = (x: { min: number; max: number }, k: number): Pair => [x.min * k, x.max * k];
      const rub = (poste: string): Rubrique => /caution|loyer/i.test(poste) ? "Logement" : /équipement|ordinateur/i.test(poste) ? "Équipement" : "Démarches & santé";
      add("Scolarité", `Frais de scolarité (${sco.libelle}), ${n} an${n > 1 ? "s" : ""}`, cat((r) => r.scolarite));
      add("Scolarité", `${ann.libelle}, chaque année`, cat((r) => r.annexes));
      add("Logement", `Loyer : ${lp ? lp.libelle : LOGEMENT_LABEL[logement].toLowerCase()}, ${HYP.mois_par_an} mois par an`, loyerTot);
      const reste: Pair = [vieTot[0] - loyerTot[0], vieTot[1] - loyerTot[1]];
      if (P && lp) {
        const hors = P.vie_mensuelle_hors_logement[perso!.niveau][chere ? "ville_chere" : "autre_ville"];
        const tra = P.transport_mensuel[perso!.transport];
        const parts: [string, F][] = [[`Nourriture, téléphone, sorties (${P.vie_mensuelle_hors_logement[perso!.niveau].libelle.toLowerCase()})`, hors], [`Déplacements : ${tra.libelle.toLowerCase()}`, tra], ...(perso!.soutien ? [[P.soutien_mensuel.libelle, P.soutien_mensuel] as [string, F]] : [])];
        const total = parts.reduce((a, [, x]) => [a[0] + x.min, a[1] + x.max], [0, 0]);
        parts.forEach(([l, x]) => add("Vie quotidienne", `${l}, ${HYP.mois_par_an} mois par an`, [Math.round(reste[0] * (x.min / (total[0] || 1))), Math.round(reste[1] * (x.max / (total[1] || 1)))]));
      } else add("Vie quotidienne", `Nourriture, déplacements, téléphone, sorties, ${HYP.mois_par_an} mois par an`, reste);
      add("Voyages", "Billets d'avion : aller à l'arrivée et retour à la fin des études", fois(vol, 2));
      if (ret) add("Voyages", `${ret} aller-retour${ret > 1 ? "s" : ""} par an pendant les vacances`, fois(vol, 2 * ret * n));
      for (const i of once) add(rub(i.poste), `${i.poste} (une fois)`, [i.min, i.max]);
      for (const i of annuel) add(rub(i.poste), `${i.poste}, chaque année`, fois(i, n));
      add("Imprévus & transferts", `Marge pour imprévus (${Math.round(HYP.marge_imprevus * 100)} %)`, imp);
      add("Imprévus & transferts", `Frais de transfert d'argent (${Math.round(HYP.frais_transfert * 100)} %)`, tr);
      const cats = Object.fromEntries(RUBRIQUES.map((k) => [k, L.filter((x) => x.rubrique === k).reduce<Pair>((a, x) => [a[0] + x.v[0], a[1] + x.v[1]], [0, 0])]).filter(([, v]) => (v as Pair)[1] > 0)) as Record<string, Pair>;
      return { detail: L, cats };
    })(),
    ...(P && lp ? (() => {
      const vol = billet(c, origine);
      const ret = Math.max(0, Math.min(3, perso!.retours));
      const hors = P.vie_mensuelle_hors_logement[perso!.niveau][chere ? "ville_chere" : "autre_ville"];
      const postes: Poste[] = [
        ...once.map((i) => ({ libelle: i.poste, v: [i.min, i.max] as Pair, quand: "avant" as const })),
        ...(vol.max ? [{ libelle: "Billet d'avion aller", v: [vol.min, vol.max] as Pair, quand: "avant" as const }] : []),
        { libelle: lp.libelle, v: [lp.v.min, lp.v.max], quand: "mois" },
        { libelle: `Vie quotidienne : ${P.vie_mensuelle_hors_logement[perso!.niveau].libelle.toLowerCase()}`, v: [hors.min, hors.max], quand: "mois" },
        { libelle: P.transport_mensuel[perso!.transport].libelle, v: [P.transport_mensuel[perso!.transport].min, P.transport_mensuel[perso!.transport].max], quand: "mois" },
        ...(perso!.soutien ? [{ libelle: P.soutien_mensuel.libelle, v: [P.soutien_mensuel.min, P.soutien_mensuel.max] as Pair, quand: "mois" as const }] : []),
        { libelle: `Scolarité (${sco.libelle})`, v: [sco.min, sco.max], quand: "an" },
        { libelle: ann.libelle, v: [ann.min, ann.max], quand: "an" },
        ...annuel.map((i) => ({ libelle: i.poste, v: [i.min, i.max] as Pair, quand: "an" as const })),
        ...(ret ? [{ libelle: `${ret} aller-retour${ret > 1 ? "s" : ""} au pays pendant les vacances`, v: [ret * 2 * vol.min, ret * 2 * vol.max] as Pair, quand: "an" as const }] : []),
      ];
      return { postes, aides, logementLibelle: lp.libelle };
    })() : {}),
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
