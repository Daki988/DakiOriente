import data from "@/data/residences_etudiantes.json";

// Résidences universitaires présentées dans Navilease (référentiel residences_etudiantes) : loyers et conditions relevés
// sur les sites officiels ; la réservation se fait sur la plateforme officielle de chaque résidence.
export type LogementResidence = { type: string; loyer_min: number | null; loyer_max: number | null; unite: string; surface?: string; partage?: number };
export type Residence = {
  id: string; nom: string; operateur: string; ville: string; adresse: string; capacite_lits: number | null; nb_logements: number | null;
  public: string; ouverture: string | null; duree: string | null; statut: string | null; logements: LogementResidence[];
  frais: { libelle: string; montant: number }[]; inclus: string[]; etablissements: string[]; proximite: string[];
  reservation: { url: string; libelle: string; note: string | null }; contact: { telephone: string; email: string } | null;
  site_web: string; photos: { src: string; credit: string; page: string }[]; sources: string[]; a_partir_de: number | null;
  devise: string; date_verification: string;
};
export const residencesEtudiantes = (data as unknown as Residence[]).slice().sort((a, b) => (a.a_partir_de ?? 1e9) - (b.a_partir_de ?? 1e9));
export const residenceById = Object.fromEntries(residencesEtudiantes.map((r) => [r.id, r])) as Record<string, Residence>;
export const VILLES_RESIDENCES = Array.from(new Set(residencesEtudiantes.map((r) => r.ville))).sort((a, b) => a.localeCompare(b, "fr"));
/** Réservée aux étudiants d'une université (ex. résidences de l'UM6SS). */
export const reservee = (r: Residence) => /^Réservée/.test(r.public);
export const domaine = (url: string) => url.split("/")[2]?.replace(/^www\./, "") ?? url;
/** Lien vers la plateforme officielle (source Navigoal signalée, sans donnée personnelle). */
export const lienOfficiel = (url: string) => `${url}${url.includes("?") ? "&" : "?"}utm_source=navigoal&utm_medium=navilease`;
export const dateVerif = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
