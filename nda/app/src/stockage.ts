import { creerAdresse, ZONES_EXEMPLE, type Adresse, type SaisieAdresse } from "../../src/index.ts";

/** On ne stocke que la saisie : l'adresse est recalculée avec le référentiel courant. */
export interface Enregistrement {
  id: string;
  libelle: string;
  saisie: SaisieAdresse;
  /** Consigne vocale encodée en data URL (30 s max). */
  vocal?: string;
  creeLe: string;
}

const CLE = "nda.adresses.v1";
export const ZONES = ZONES_EXEMPLE;

export function lire(): Enregistrement[] {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as Enregistrement[]) : [];
  } catch {
    return [];
  }
}

export function ecrire(liste: Enregistrement[]): boolean {
  try {
    localStorage.setItem(CLE, JSON.stringify(liste));
    return true;
  } catch {
    return false;
  }
}

/** Reconstitue l'adresse ; ignore les entrées devenues invalides (référentiel modifié). */
export function resoudre(e: Enregistrement): Adresse | null {
  try {
    return creerAdresse(ZONES, e.saisie);
  } catch {
    return null;
  }
}
