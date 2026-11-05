// Pays de destination (module léger : utilisable partout sans charger les référentiels).
import destinationsData from "@/data/destinations.json";
import type { Label, PaysCode } from "./data";

/** Pays de destination des études (référentiel destinations) : actifs (publiés) ou « bientôt ». */
export type Destination = {
  code: PaysCode; nom: string; prep: string; de: string; actif: boolean; annonce?: boolean; defaut?: boolean; devise: string; regulateur: string | null;
  labels: Partial<Record<Label, { libelle: string; description: string }>>; reconnaissance: string | null; source_label?: string;
  etablissements: number; villes: { nom: string; n: number }[];
};
export const destinations = destinationsData as unknown as Destination[];
export const destinationById = Object.fromEntries(destinations.map((d) => [d.code, d])) as Record<PaysCode, Destination>;
export const DESTINATIONS_ACTIVES = destinations.filter((d) => d.actif);
export const DESTINATIONS_BIENTOT = destinations.filter((d) => !d.actif && d.annonce !== false);
export const DESTINATION_DEFAUT = (DESTINATIONS_ACTIVES.find((d) => d.defaut) ?? DESTINATIONS_ACTIVES[0]).code;
