import paysData from "@/data/pays.json";
import domainesData from "@/data/domaines.json";
import competencesData from "@/data/competences.json";
import metiersData from "@/data/metiers.json";
import formationsData from "@/data/formations.json";
import seriesData from "@/data/series.json";
import etablissementsData from "@/data/etablissements.json";
import lyceesData from "@/data/lycees.json";
import navileaseData from "@/data/navilease.json";
import riasecData from "@/data/profils_riasec.json";
import paysDetailsData from "@/data/pays_details.json";

export type PaysCode = "GA" | "MA" | "SN";

export type Metier = {
  id: string; nom: string; domaine: string; riasec: string[]; niveau_min: string; description: string;
  missions: string[]; competences: string[]; formations: string[]; secteurs: string[];
};
export type Formation = {
  id: string; intitule: string; diplome: string; niveau: string; duree_annees: number; domaine: string;
  competences: string[]; mode_admission: string; metiers: string[];
  series_recommandees: Partial<Record<PaysCode, string[]>>; etablissements: string[];
};
export type Etablissement = {
  id: string; nom: string; sigle: string; pays: PaysCode; ville: string; type: string; type_libelle: string;
  statut: string; site_web: string | null; annee_creation: number | null;
  coordonnees: { lat: number; lng: number } | null; formations: string[]; logo: string | null; photos: Photo[];
  label: Label; label_libelle: string; reconnaissance: string | null; reconnaissance_en_cours: boolean;
  adresse: string | null; description: string | null; filieres: Filiere[];
};
export type Label = "reconnu_etat" | "diplomes_homologues" | "professionnel";
/** Filière homologuée par l'État (accréditation en cours). */
export type Filiere = {
  intitule: string; options: string | null; composante: string | null; ville: string | null;
  diplome: string | null; duree_annees: number | null; niveau: string | null; formation: string | null; domaine: string | null;
  homologation: { statut: string; fin: string; texte: string };
};
export const LABELS: { id: Label; libelle: string; court: string; description: string }[] = [
  { id: "reconnu_etat", libelle: "Reconnu par l'État", court: "Reconnu par l'État", description: "Établissement reconnu par décret : ses diplômes accrédités sont équivalents aux diplômes nationaux." },
  { id: "diplomes_homologues", libelle: "Diplômes homologués", court: "Diplômes homologués", description: "Établissement autorisé dont les filières publiées sont accréditées par l'État (arrêté au Bulletin officiel)." },
  { id: "professionnel", libelle: "Établissement professionnel", court: "Professionnel", description: "Établissement de formation professionnelle accrédité : diplômes d'État (technicien, technicien spécialisé)." },
];
export const labelById = Object.fromEntries(LABELS.map((l) => [l.id, l])) as Record<Label, (typeof LABELS)[number]>;
/** Villes d'études (établissements publiés). */
export const VILLES_ETUDES = Array.from(new Set((etablissementsData as unknown as { ville: string }[]).map((e) => e.ville))).sort((a, b) => a.localeCompare(b, "fr"));
export type Photo = { src: string; credit: string | null; licence: string | null; page: string | null };
type Fourchette = { min: number; max: number };
export type PaysDetail = {
  id: PaysCode; nom: string; accroche: string;
  chiffres: { population: string; capitale: string; monnaie: string; langues: string[]; fuseau: string; indicatif: string };
  pourquoi: string[]; systeme: string; reconnaissance: string; calendrier: string; visa: string[];
  budget: { devise: string; lignes: ({ poste: string } & Fourchette)[]; total_mensuel: Fourchette; note: string };
  frais_prive: { devise: string; unite: string; note: string } & Fourchette;
  travail: string; sante: string; paiement: string[]; villes: { nom: string; profil: string }[]; bourses: string[]; sources: string[];
};
export type Serie = {
  id: string; pays: PaysCode; code: string; intitule: string; filiere: string; matieres_dominantes: string[];
  riasec: string[]; domaines_ouverts: string[]; remarque: string | null; formations_accessibles: string[]; metiers_exemples: string[];
};
export type Residence = { id: string; nom: string; pays: PaysCode; ville: string; gestionnaire: string; etablissements_desservis: string[] };

export const pays = paysData as unknown as { id: PaysCode; nom: string; capitale: string; monnaie: string; paiement_mobile: string[]; villes_universitaires: string[] }[];
export const domaines = domainesData as { id: string; libelle: string; description: string }[];
export const competences = competencesData as { id: string; libelle: string; categorie: string; domaine: string | null }[];
export const metiers = metiersData as Metier[];
export const formations = formationsData as unknown as Formation[];
export const series = seriesData as unknown as Serie[];
export const etablissements = etablissementsData as unknown as Etablissement[];
export const lycees = lyceesData as unknown as { total: Record<PaysCode, number>; items: { id: string; nom: string; pays: PaysCode; ville: string; logo: string | null }[] };
export const residences = (navileaseData as unknown as { residences: Residence[] }).residences;
export const paysDetails = paysDetailsData as unknown as PaysDetail[];
export const riasec = riasecData as { code: string; nom: string; profil: string; description: string }[];

const index = <T extends { id: string }>(arr: T[]) => Object.fromEntries(arr.map((x) => [x.id, x])) as Record<string, T>;
export const metierById = index(metiers);
export const formationById = index(formations);
export const etabById = index(etablissements);
export const domaineById = index(domaines);
export const competenceById = index(competences);
export const serieById = index(series);
export const paysDetailById = index(paysDetails) as Record<PaysCode, PaysDetail>;

export const STATUT_LONG: Record<string, string> = { prive: "Privé", partenariat_etat: "Privé, en partenariat avec l'État", prive_reconnu: "Privé reconnu par l'État", prive_non_lucratif: "Privé à but non lucratif", inter_etats: "Inter-États" };
export const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ");
/** Établissements d'un pays, ceux qui ont des photos d'abord. */
export const vitrine = (code?: PaysCode, needPhoto = false) =>
  etablissements.filter((e) => (!code || e.pays === code) && (!needPhoto || e.photos.length))
    .sort((a, b) => b.photos.length - a.photos.length || b.formations.length - a.formations.length);
/** Formations reliées : même formation ou mêmes métiers visés. */
export const formationsLiees = (e: Etablissement, fid: string) => {
  const F = formationById[fid];
  return e.formations.filter((f) => formationById[f] && (f === fid || formationById[f].metiers.some((m) => F.metiers.includes(m))));
};

export const PAYS_NOM: Record<PaysCode, string> = { GA: "Gabon", MA: "Maroc", SN: "Sénégal" };
export const niveauLabel = (n: string) =>
  ({ "niv-bac": "Bac", "niv-bac2": "Bac+2", "niv-bac3": "Bac+3", "niv-bac5": "Bac+5", "niv-bac7": "Bac+6/7", "niv-bac8": "Bac+8" } as Record<string, string>)[n] ?? n;
export const admissionLabel = (m: string) =>
  ({ bac: "De droit", dossier: "Sur dossier", concours: "Concours", "dossier+entretien": "Dossier + entretien" } as Record<string, string>)[m] ?? m;
export const statutLabel = (s: string) =>
  ({ public: "Public", public_autonome: "Public autonome", prive: "Privé", partenariat_etat: "Partenariat avec l'État", prive_reconnu: "Privé reconnu par l'État", prive_non_lucratif: "Privé non lucratif", inter_etats: "Inter-États" } as Record<string, string>)[s] ?? s;
export const competenceLabel = (id: string) => competenceById[id]?.libelle ?? id;

/** Score de compatibilité (démo) entre un profil RIASEC et une formation, à partir des métiers visés. */
export function compatibilite(profil: string[], formationId: string): number {
  const f = formationById[formationId];
  if (!f) return 0;
  const codes = f.metiers.flatMap((m) => metierById[m]?.riasec ?? []);
  if (!codes.length) return 60;
  const hits = codes.filter((c) => profil.includes(c)).length / codes.length;
  return Math.round(58 + hits * 38);
}

export const stats = {
  etablissements: etablissements.length,
  metiers: metiers.length,
  formations: formations.length,
  filieres: etablissements.reduce((n, e) => n + e.filieres.length, 0),
  villes: VILLES_ETUDES.length,
  paysOrigine: 54,
};
