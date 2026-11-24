import { decomposer, decoderLocal, encoder, precisionMetres } from "./code.ts";
import { trouverZoneParCode, trouverZoneParPosition } from "./referentiel.ts";
import type { Adresse, Point, Zone } from "./types.ts";

export interface SaisieAdresse {
  position: Point;
  quartier?: string;
  /** Identifiant de la voie choisie dans le référentiel officiel de la zone. */
  voieId?: string;
  /** Numéro de porte (plaque posée par le projet d'adressage). */
  numero?: string;
  repere?: string;
}

export class ErreurAdresse extends Error {}

/** Crée une adresse à partir d'une position GPS et des éléments officiels saisis. */
export function creerAdresse(zones: Zone[], s: SaisieAdresse): Adresse {
  const zone = trouverZoneParPosition(zones, s.position.lat, s.position.lon);
  if (!zone) throw new ErreurAdresse("Aucune zone d'adressage couverte à cette position.");

  if (s.quartier && !zone.quartiers.includes(s.quartier)) {
    throw new ErreurAdresse(`Quartier « ${s.quartier} » inconnu dans ${libelleZone(zone)}.`);
  }
  const voie = s.voieId ? zone.voies.find((v) => v.id === s.voieId) : undefined;
  if (s.voieId && !voie) {
    throw new ErreurAdresse(`Voie « ${s.voieId} » absente du référentiel de ${libelleZone(zone)}.`);
  }
  if (s.numero && !/^\d{1,4}( ?(bis|ter|[A-Z]))?$/i.test(s.numero.trim())) {
    throw new ErreurAdresse(`Numéro de porte invalide : ${s.numero}`);
  }
  return {
    zone,
    quartier: s.quartier,
    voie,
    numero: s.numero?.trim(),
    position: s.position,
    code: encoder(zone, s.position),
    repere: s.repere?.trim() || undefined,
  };
}

export function libelleZone(z: Zone): string {
  return z.arrondissement ? `${z.commune} ${z.arrondissement}` : z.commune;
}

/** Libellé postal sur plusieurs lignes. Sans voie nommée, le code Nda sert de ligne de voie. */
export function formaterAdresse(a: Adresse): string[] {
  const lignes: string[] = [];
  if (a.voie) {
    const nomVoie = `${a.voie.type} ${a.voie.nom}`;
    lignes.push(a.numero ? `${a.numero}, ${nomVoie}` : nomVoie);
  } else {
    lignes.push(`Code Nda ${a.code}`);
  }
  lignes.push([a.quartier, a.zone.arrondissement].filter(Boolean).join(", ") || a.zone.commune);
  lignes.push(`${a.zone.commune}, Gabon`);
  return lignes;
}

/** Retrouve la position (centre de cellule) d'un code Nda, avec sa précision. */
export function resoudreCode(zones: Zone[], code: string): { zone: Zone; position: Point; precisionM: number } {
  const d = decomposer(code);
  const zone = trouverZoneParCode(zones, d.province, d.zone);
  if (!zone) throw new ErreurAdresse(`Zone ${d.province}-${d.zone} inconnue.`);
  return { zone, position: decoderLocal(zone, d.local), precisionM: precisionMetres(zone) };
}
