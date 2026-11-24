/**
 * Code Nda : identifiant court d'un point, relatif à sa zone d'adressage.
 *
 * Format : PP-ZZZ-XXXXX
 *   PP    = province (ES = Estuaire, OM = Ogooué-Maritime…)
 *   ZZZ   = zone (arrondissement ou commune), ex. LB1 = Libreville 1er arr.
 *   XXXXX = position dans l'emprise de la zone, 5 caractères en base 28
 *
 * L'alphabet exclut 0/O, 1/I/L et les voyelles : pas de confusion à l'oral
 * ni de mots formés par hasard.
 */

import type { Point, Zone } from "./types.ts";

export const ALPHABET = "23456789BCDFGHJKMNPQRSTVWXYZ";
const BASE = ALPHABET.length; // 28
export const LOCAL_LENGTH = 5;
/** Nombre de cellules par axe : 28^5 ≈ 17,2 M cellules → 4147 × 4147. */
export const GRID = Math.floor(Math.sqrt(BASE ** LOCAL_LENGTH));

const M_PER_DEG_LAT = 111_320;
const mPerDegLon = (lat: number) => M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);

/** Grille carrée posée sur l'emprise de la zone. */
function grille(z: Zone) {
  const { south, west, north, east } = z.bbox;
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

/** Taille (en mètres) d'une cellule de code dans cette zone. */
export function precisionMetres(z: Zone): number {
  return grille(z).cellM;
}

export function contient(z: Zone, p: Point): boolean {
  const b = z.bbox;
  return p.lat >= b.south && p.lat <= b.north && p.lon >= b.west && p.lon <= b.east;
}

export function encoderLocal(z: Zone, p: Point): string {
  if (!contient(z, p)) throw new RangeError(`Point hors de la zone ${z.code}`);
  const g = grille(z);
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
export function decoderLocal(z: Zone, code: string): Point {
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
  const g = grille(z);
  return { lat: g.south + (y + 0.5) * g.stepLat, lon: g.west + (x + 0.5) * g.stepLon };
}

export function encoder(z: Zone, p: Point): string {
  return `${z.province}-${z.code}-${encoderLocal(z, p)}`;
}

export interface CodeDecompose {
  province: string;
  zone: string;
  local: string;
}

/** Majuscules, sans espaces ni points. */
export function normaliser(code: string): string {
  return code.toUpperCase().replace(/[\s·.]/g, "");
}

export function decomposer(code: string): CodeDecompose {
  const m = /^([A-Z]{2})-?([0-9A-Z]{3})-?([0-9A-Z]{5})$/.exec(normaliser(code));
  if (!m) throw new SyntaxError(`Format attendu PP-ZZZ-XXXXX, reçu : ${code}`);
  return { province: m[1], zone: m[2], local: m[3] };
}
