/**
 * Référentiel d'EXEMPLE pour le développement.
 *
 * ⚠️ Les emprises, quartiers et codes de voies ci-dessous sont indicatifs.
 * En production, ils doivent être chargés depuis les données officielles
 * (limites communales, référentiel des voies de chaque commune / programme
 * national d'adressage), jamais saisis à la main.
 */
import type { Commune } from "./types.ts";

export const COMMUNES_EXEMPLE: Commune[] = [
  {
    code: "SLB",
    nom: "Sicap-Liberté",
    region: "DK",
    departement: "Dakar",
    bbox: { south: 14.705, west: -17.47, north: 14.722, east: -17.452 },
    quartiers: ["Liberté 1", "Liberté 2", "Liberté 3", "Liberté 4", "Liberté 5", "Liberté 6", "Sicap Baobab"],
    voies: [
      { code: "SL-41", type: "Rue" },
      { code: "SL-42", type: "Rue" },
      { code: "SL-10", type: "Rue" },
    ],
  },
  {
    code: "FAN",
    nom: "Fann-Point E-Amitié",
    region: "DK",
    departement: "Dakar",
    bbox: { south: 14.685, west: -17.475, north: 14.705, east: -17.455 },
    quartiers: ["Fann Résidence", "Point E", "Amitié"],
    voies: [{ code: "FN-01", type: "Avenue", nom: "Cheikh Anta Diop" }],
  },
  {
    code: "PAU",
    nom: "Parcelles Assainies",
    region: "DK",
    departement: "Keur Massar",
    bbox: { south: 14.755, west: -17.455, north: 14.785, east: -17.425 },
    quartiers: ["Unité 1", "Unité 10", "Unité 15", "Cité Soprim"],
    voies: [],
  },
];

export function trouverCommuneParPosition(communes: Commune[], lat: number, lon: number): Commune | undefined {
  return communes.find(
    (c) => lat >= c.bbox.south && lat <= c.bbox.north && lon >= c.bbox.west && lon <= c.bbox.east,
  );
}

export function trouverCommuneParCode(communes: Commune[], region: string, code: string): Commune | undefined {
  return communes.find((c) => c.region === region && c.code === code);
}
