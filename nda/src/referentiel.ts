/**
 * Référentiel d'EXEMPLE pour le développement.
 *
 * ⚠️ Les emprises, quartiers et rattachements ci-dessous sont indicatifs.
 * En production, ils doivent venir des données officielles du projet
 * d'adressage (Mairie de Libreville, communes d'Owendo, d'Akanda…) :
 * limites d'arrondissements, noms de voies, numéros de porte.
 */
import type { Zone } from "./types.ts";

export const ZONES_EXEMPLE: Zone[] = [
  {
    code: "LB1",
    commune: "Libreville",
    arrondissement: "1er arrondissement",
    province: "ES",
    bbox: { south: 0.395, west: 9.43, north: 0.445, east: 9.465 },
    quartiers: ["Louis", "Quaben", "Batterie IV"],
    voies: [
      { id: "LB1-0001", type: "Boulevard", nom: "Quaben" },
      { id: "LB1-0002", type: "Rue", nom: "Cringer" },
    ],
  },
  {
    code: "OWE",
    commune: "Owendo",
    province: "ES",
    bbox: { south: 0.26, west: 9.47, north: 0.32, east: 9.53 },
    quartiers: ["Owendo Centre", "Alénakiri"],
    voies: [],
  },
  {
    code: "AKA",
    commune: "Akanda",
    province: "ES",
    bbox: { south: 0.47, west: 9.38, north: 0.6, east: 9.5 },
    quartiers: ["Angondjé", "Cap Estérias"],
    voies: [],
  },
];

export function trouverZoneParPosition(zones: Zone[], lat: number, lon: number): Zone | undefined {
  return zones.find(
    (z) => lat >= z.bbox.south && lat <= z.bbox.north && lon >= z.bbox.west && lon <= z.bbox.east,
  );
}

export function trouverZoneParCode(zones: Zone[], province: string, code: string): Zone | undefined {
  return zones.find((z) => z.province === province && z.code === code);
}
