import { decomposer, decoderLocal, encoder, precisionMetres } from "./code.ts";
import { trouverCommuneParCode, trouverCommuneParPosition } from "./referentiel.ts";
import type { Adresse, Commune, Point } from "./types.ts";

export interface SaisieAdresse {
  position: Point;
  quartier?: string;
  /** Code officiel de la voie choisi dans le référentiel de la commune. */
  voieCode?: string;
  numero?: string;
  repere?: string;
}

export class ErreurAdresse extends Error {}

/** Crée une adresse à partir d'une position GPS et des éléments officiels saisis. */
export function creerAdresse(communes: Commune[], s: SaisieAdresse): Adresse {
  const commune = trouverCommuneParPosition(communes, s.position.lat, s.position.lon);
  if (!commune) throw new ErreurAdresse("Aucune commune couverte à cette position.");

  if (s.quartier && !commune.quartiers.includes(s.quartier)) {
    throw new ErreurAdresse(`Quartier « ${s.quartier} » inconnu dans ${commune.nom}.`);
  }
  const voie = s.voieCode ? commune.voies.find((v) => v.code === s.voieCode) : undefined;
  if (s.voieCode && !voie) {
    throw new ErreurAdresse(`Voie « ${s.voieCode} » absente du référentiel de ${commune.nom}.`);
  }
  if (s.numero && !/^\d{1,4}( ?(bis|ter|[A-Z]))?$/i.test(s.numero.trim())) {
    throw new ErreurAdresse(`Numéro de porte invalide : ${s.numero}`);
  }
  return {
    commune,
    quartier: s.quartier,
    voie,
    numero: s.numero?.trim(),
    position: s.position,
    code: encoder(commune, s.position),
    repere: s.repere?.trim() || undefined,
  };
}

/** Libellé postal sur plusieurs lignes. Sans voie officielle, le code Dëkk sert de ligne de voie. */
export function formaterAdresse(a: Adresse): string[] {
  const lignes: string[] = [];
  if (a.voie) {
    const nomVoie = a.voie.nom ? `${a.voie.type} ${a.voie.nom}` : `${a.voie.type} ${a.voie.code}`;
    lignes.push(a.numero ? `${a.numero}, ${nomVoie}` : nomVoie);
  } else {
    lignes.push(`Code Dëkk ${a.code}`);
  }
  lignes.push([a.quartier, a.commune.nom].filter(Boolean).join(", "));
  lignes.push(`${a.commune.departement}, Sénégal`);
  return lignes;
}

/** Retrouve la position (centre de cellule) d'un code Dëkk, avec sa précision. */
export function resoudreCode(communes: Commune[], code: string): { commune: Commune; position: Point; precisionM: number } {
  const d = decomposer(code);
  const commune = trouverCommuneParCode(communes, d.region, d.commune);
  if (!commune) throw new ErreurAdresse(`Commune ${d.region}-${d.commune} inconnue.`);
  return { commune, position: decoderLocal(commune, d.local), precisionM: precisionMetres(commune) };
}
