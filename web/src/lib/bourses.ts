// Bourses d'études publiques (data/referentiels/bourses.json) et éligibilité indicative.
// Navigoal ne promet jamais l'obtention : la décision appartient à l'organisme.
import boursesData from "@/data/bourses.json";
import { nomPays } from "@/lib/pays-origine";

export type Bourse = {
  id: string; nom: string; organisme: string; pour: string; pays_origine: string[]; pays_etudes: string[];
  conditions: string[]; pieces: string[]; demarche: string; ecoles_privees_maroc?: string; ecoles_partenaires: string[];
  liens: { libelle: string; url: string }[]; verifie_le: string;
  criteres: { type_etablissement: "tous" | "public" | "prive"; niveaux: string[]; moyenne_min: number | null; age_max: number | null; age_max_bac_pro?: number };
  montant: string | null; couverture: string | null; calendrier: string | null; ouverture: string | null; date_limite: string | null;
};
export const BOURSES = boursesData as unknown as Bourse[];
export const bourseById = Object.fromEntries(BOURSES.map((b) => [b.id, b])) as Record<string, Bourse>;

export const paysOrigineLibelle = (b: Bourse) => b.pays_origine.includes("*") ? "Tous pays" : b.pays_origine.map((p) => nomPays(p)).join(", ");
export const paysEtudesLibelle = (b: Bourse) => b.pays_etudes.includes("*") ? "Tous pays d'études" : b.pays_etudes.map((p) => nomPays(p)).join(", ");

export type Profil = { pays?: string | null; anneeNaissance?: number | null; moyenne?: number | null; serie?: string | null; destination?: string | null };
export type Verdict = { statut: "eligible" | "a_verifier" | "non_eligible"; raisons: string[] };

/**
 * Éligibilité indicative d'un profil à une bourse, avec les raisons.
 * « a_verifier » dès qu'une information manque ou que la bourse ne vaut que pour les établissements publics
 * (les écoles présentées sur Navigoal sont privées).
 */
export function eligibilite(b: Bourse, p: Profil, maintenant = new Date()): Verdict {
  const non: string[] = [], verif: string[] = [], ok: string[] = [];
  const c = b.criteres;
  if (!b.pays_origine.includes("*")) {
    if (!p.pays) verif.push(`Réservée aux ressortissants de : ${paysOrigineLibelle(b)} (pays à renseigner dans votre profil).`);
    else if (!b.pays_origine.includes(p.pays)) non.push(`Réservée aux ressortissants de : ${paysOrigineLibelle(b)}.`);
    else ok.push(`Nationalité : ${nomPays(p.pays)}.`);
  }
  if (p.destination && !b.pays_etudes.includes("*") && !b.pays_etudes.includes(p.destination)) non.push(`Valable seulement pour étudier en : ${paysEtudesLibelle(b)}.`);
  if (c.type_etablissement === "public") verif.push("Seulement pour un établissement PUBLIC : ne vaut pas pour les écoles privées présentées sur Navigoal.");
  if (c.moyenne_min != null) {
    if (p.moyenne == null) verif.push(`Moyenne d'au moins ${c.moyenne_min}/20 exigée (à renseigner dans votre profil).`);
    else if (p.moyenne < c.moyenne_min) non.push(`Moyenne de ${p.moyenne.toLocaleString("fr-FR")}/20, sous le minimum de ${c.moyenne_min}/20.`);
    else ok.push(`Moyenne de ${p.moyenne.toLocaleString("fr-FR")}/20 (minimum ${c.moyenne_min}).`);
  }
  if (c.age_max != null) {
    const age = p.anneeNaissance ? maintenant.getFullYear() - p.anneeNaissance : null;
    const max = Math.max(c.age_max, c.age_max_bac_pro ?? 0);
    if (age == null) verif.push(`Âge limite : ${c.age_max} ans${c.age_max_bac_pro ? ` (${c.age_max_bac_pro} ans avec un bac professionnel)` : ""}.`);
    else if (age > max) non.push(`${age} ans environ : au-delà de la limite de ${max} ans.`);
    else if (age > c.age_max) verif.push(`${age} ans environ : possible seulement avec un bac professionnel (limite ${c.age_max_bac_pro} ans).`);
    else ok.push(`Âge : ${age} ans environ (limite ${c.age_max}).`);
  }
  if (non.length) return { statut: "non_eligible", raisons: non };
  if (verif.length) return { statut: "a_verifier", raisons: [...verif, ...ok] };
  return { statut: "eligible", raisons: ok.length ? ok : ["Aucune condition bloquante connue."] };
}

/** Bourses classées pour un profil : éligibles, puis à vérifier, puis non éligibles. */
export function boursesPour(p: Profil, maintenant = new Date()) {
  const rang = { eligible: 0, a_verifier: 1, non_eligible: 2 };
  return BOURSES.map((b) => ({ bourse: b, verdict: eligibilite(b, p, maintenant) })).sort((x, y) => rang[x.verdict.statut] - rang[y.verdict.statut]);
}
