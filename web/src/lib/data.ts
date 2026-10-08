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
  coordonnees: { lat: number; lng: number } | null; formations: string[]; logo: string | null;
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
export const riasec = riasecData as { code: string; nom: string; profil: string; description: string }[];

const index = <T extends { id: string }>(arr: T[]) => Object.fromEntries(arr.map((x) => [x.id, x])) as Record<string, T>;
export const metierById = index(metiers);
export const formationById = index(formations);
export const etabById = index(etablissements);
export const domaineById = index(domaines);
export const competenceById = index(competences);
export const serieById = index(series);

export const PAYS_NOM: Record<PaysCode, string> = { GA: "Gabon", MA: "Maroc", SN: "Sénégal" };
export const niveauLabel = (n: string) =>
  ({ "niv-bac": "Bac", "niv-bac2": "Bac+2", "niv-bac3": "Bac+3", "niv-bac5": "Bac+5", "niv-bac7": "Bac+6/7", "niv-bac8": "Bac+8" } as Record<string, string>)[n] ?? n;
export const admissionLabel = (m: string) =>
  ({ bac: "De droit", dossier: "Sur dossier", concours: "Concours", "dossier+entretien": "Dossier + entretien" } as Record<string, string>)[m] ?? m;
export const statutLabel = (s: string) =>
  ({ public: "Public", public_autonome: "Public autonome", prive: "Privé", prive_reconnu: "Privé reconnu", prive_non_lucratif: "Privé non lucratif", inter_etats: "Inter-États" } as Record<string, string>)[s] ?? s;
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
  pays: pays.length,
};
