/**
 * Code Dëkk : identifiant court d'un point, relatif à sa commune.
 *
 * Format : RR-CCC-XXXXX
 *   RR    = région (code ISO 3166-2:SN sans le préfixe « SN- »), ex. DK = Dakar
 *   CCC   = commune (code du référentiel Dëkk), ex. SLB = Sicap-Liberté
 *   XXXXX = position dans l'emprise de la commune, 5 caractères en base 28
 *
 * L'alphabet exclut 0/O, 1/I/L et les voyelles : pas de confusion à l'oral
 * ni de mots formés par hasard.
 */

import type { Commune, Point } from "./types.ts";

export const ALPHABET = "23456789BCDFGHJKMNPQRSTVWXYZ";
const BASE = ALPHABET.length; // 28
export const LOCAL_LENGTH = 5;
/** Nombre de cellules par axe : 28^5 ≈ 17,2 M cellules → 4147 × 4147. */
export const GRID = Math.floor(Math.sqrt(BASE ** LOCAL_LENGTH));

const M_PER_DEG_LAT = 111_320;
const mPerDegLon = (lat: number) => M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);

/** Emprise carrée (en degrés) utilisée pour quadriller la commune. */
function grille(c: Commune) {
  const { south, west, north, east } = c.bbox;
  const midLat = (south + north) / 2;
  const hM = (north - south) * M_PER_DEG_LAT;
  const wM = (east - west) * mPerDegLon(midLat);
  const sizeM = Math.max(hM, wM);
  return {
    south,
    west,
    stepLat: sizeM / GRID / M_PER_DEG_LAT,
    stepLon: sizeM / GRID / mPerDegLon(midLat),
    cellM: sizeM / GRID,
  };
}

/** Taille (en mètres) d'une cellule de code pour cette commune. */
export function precisionMetres(c: Commune): number {
  return grille(c).cellM;
}

export function contient(c: Commune, p: Point): boolean {
  const b = c.bbox;
  return p.lat >= b.south && p.lat <= b.north && p.lon >= b.west && p.lon <= b.east;
}

export function encoderLocal(c: Commune, p: Point): string {
  if (!contient(c, p)) throw new RangeError(`Point hors de la commune ${c.nom}`);
  const g = grille(c);
  const x = Math.min(GRID - 1, Math.floor((p.lon - g.west) / g.stepLon));
  const y = Math.min(GRID - 1, Math.floor((p.lat - g.south) / g.stepLat));
  let n = y * GRID + x;
  let out = "";
  for (let i = 0; i < LOCAL_LENGTH; i++) {
    out = ALPHABET[n % BASE] + out;
    n = Math.floor(n / BASE);
  }
  return out;
}

/** Centre de la cellule désignée par le code local. */
export function decoderLocal(c: Commune, code: string): Point {
  const s = normaliser(code);
  if (s.length !== LOCAL_LENGTH) throw new SyntaxError(`Code local invalide : ${code}`);
  let n = 0;
  for (const ch of s) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) throw new SyntaxError(`Caractère interdit « ${ch} » dans ${code}`);
    n = n * BASE + v;
  }
  const x = n % GRID;
  const y = Math.floor(n / GRID);
  if (y >= GRID) throw new RangeError(`Code hors grille : ${code}`);
  const g = grille(c);
  return { lat: g.south + (y + 0.5) * g.stepLat, lon: g.west + (x + 0.5) * g.stepLon };
}

export function encoder(c: Commune, p: Point): string {
  return `${c.region}-${c.code}-${encoderLocal(c, p)}`;
}

export interface CodeDecompose {
  region: string;
  commune: string;
  local: string;
}

/** Majuscules, sans espaces ; corrige les confusions courantes à la saisie (O→0 n'existe pas, donc rejeté plus loin). */
export function normaliser(code: string): string {
  return code.toUpperCase().replace(/[\s·.]/g, "");
}

export function decomposer(code: string): CodeDecompose {
  const m = /^([A-Z]{2})-?([A-Z]{3})-?([0-9A-Z]{5})$/.exec(normaliser(code));
  if (!m) throw new SyntaxError(`Format attendu RR-CCC-XXXXX, reçu : ${code}`);
  return { region: m[1], commune: m[2], local: m[3] };
}
