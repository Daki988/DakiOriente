/**
 * Motifs africains et pictogrammes métiers, dessinés pour Neam Print (création originale, vectorielle).
 * Coordonnées dans un carreau de 1 × 1. `c` = indice de couleur (0, 1, 2) fourni par le modèle.
 */

export type Prim =
  | { k: "rect"; x: number; y: number; w: number; h: number; r?: number; c: number }
  | { k: "ellipse"; cx: number; cy: number; rx: number; ry: number; c: number }
  | { k: "poly"; pts: number[]; c: number }
  | { k: "ring"; cx: number; cy: number; r: number; sw: number; c: number };

export type PatternId = "kente" | "bogolan" | "wax" | "losanges" | "dents" | "cauris";
/** Le fond du carreau est la couleur 0 ; les formes peuvent déborder sur les carreaux voisins. */
export const PATTERNS: Record<PatternId, { name: string; shapes: Prim[] }> = {
  kente: {
    name: "Kente",
    shapes: [
      { k: "rect", x: 0.4, y: 0, w: 0.2, h: 1, c: 1 },
      { k: "rect", x: 0, y: 0.4, w: 1, h: 0.2, c: 1 },
      { k: "rect", x: 0.45, y: 0.45, w: 0.1, h: 0.1, c: 2 },
      { k: "rect", x: 0, y: 0.08, w: 0.4, h: 0.05, c: 2 },
      { k: "rect", x: 0.6, y: 0.87, w: 0.4, h: 0.05, c: 2 },
      { k: "rect", x: 0.08, y: 0.6, w: 0.05, h: 0.4, c: 2 },
      { k: "rect", x: 0.87, y: 0, w: 0.05, h: 0.4, c: 2 },
    ],
  },
  bogolan: {
    name: "Bogolan",
    shapes: [
      { k: "poly", pts: [0, 0.5, 0.25, 0.36, 0.5, 0.5, 0.75, 0.36, 1, 0.5, 1, 0.6, 0.75, 0.46, 0.5, 0.6, 0.25, 0.46, 0, 0.6], c: 1 },
      { k: "ellipse", cx: 0.25, cy: 0.16, rx: 0.06, ry: 0.06, c: 1 },
      { k: "ellipse", cx: 0.75, cy: 0.16, rx: 0.06, ry: 0.06, c: 1 },
      { k: "ellipse", cx: 0.5, cy: 0.84, rx: 0.06, ry: 0.06, c: 2 },
      { k: "rect", x: 0, y: 0.94, w: 0.3, h: 0.03, c: 1 },
      { k: "rect", x: 0.7, y: 0.94, w: 0.3, h: 0.03, c: 1 },
    ],
  },
  wax: {
    name: "Wax",
    shapes: [
      { k: "ellipse", cx: 0.5, cy: 0.5, rx: 0.4, ry: 0.4, c: 1 },
      { k: "ellipse", cx: 0.5, cy: 0.5, rx: 0.29, ry: 0.29, c: 2 },
      { k: "ellipse", cx: 0.5, cy: 0.5, rx: 0.18, ry: 0.18, c: 1 },
      { k: "ellipse", cx: 0.5, cy: 0.5, rx: 0.07, ry: 0.07, c: 2 },
      { k: "ellipse", cx: 0, cy: 0, rx: 0.12, ry: 0.12, c: 2 },
      { k: "ellipse", cx: 1, cy: 0, rx: 0.12, ry: 0.12, c: 2 },
      { k: "ellipse", cx: 0, cy: 1, rx: 0.12, ry: 0.12, c: 2 },
      { k: "ellipse", cx: 1, cy: 1, rx: 0.12, ry: 0.12, c: 2 },
    ],
  },
  losanges: {
    name: "Losanges",
    shapes: [
      { k: "poly", pts: [0.5, 0.02, 0.98, 0.5, 0.5, 0.98, 0.02, 0.5], c: 1 },
      { k: "poly", pts: [0.5, 0.24, 0.76, 0.5, 0.5, 0.76, 0.24, 0.5], c: 2 },
      { k: "ellipse", cx: 0.5, cy: 0.5, rx: 0.07, ry: 0.07, c: 0 },
    ],
  },
  dents: {
    name: "Dents de scie",
    shapes: [
      { k: "poly", pts: [0, 1, 0.25, 0.5, 0.5, 1], c: 1 },
      { k: "poly", pts: [0.5, 1, 0.75, 0.5, 1, 1], c: 1 },
      { k: "poly", pts: [0, 0, 0.125, 0.22, 0.25, 0], c: 2 },
      { k: "poly", pts: [0.25, 0, 0.375, 0.22, 0.5, 0], c: 2 },
      { k: "poly", pts: [0.5, 0, 0.625, 0.22, 0.75, 0], c: 2 },
      { k: "poly", pts: [0.75, 0, 0.875, 0.22, 1, 0], c: 2 },
    ],
  },
  cauris: {
    name: "Cauris",
    shapes: [
      { k: "ellipse", cx: 0.27, cy: 0.3, rx: 0.14, ry: 0.21, c: 1 },
      { k: "rect", x: 0.257, y: 0.17, w: 0.026, h: 0.26, r: 0.013, c: 0 },
      { k: "ellipse", cx: 0.77, cy: 0.8, rx: 0.14, ry: 0.21, c: 1 },
      { k: "rect", x: 0.757, y: 0.67, w: 0.026, h: 0.26, r: 0.013, c: 0 },
      { k: "ellipse", cx: 0.77, cy: 0.27, rx: 0.045, ry: 0.045, c: 2 },
      { k: "ellipse", cx: 0.27, cy: 0.78, rx: 0.045, ry: 0.045, c: 2 },
    ],
  },
};
export const PATTERN_IDS = Object.keys(PATTERNS) as PatternId[];

export type IconId = "restaurant" | "beaute" | "btp" | "eglise" | "mariage" | "ecole" | "transport" | "commerce" | "sante";
/** Pictogrammes : couleur 0 = dessin, couleur 1 = découpes (couleur du fond). */
export const ICONS: Record<IconId, Prim[]> = {
  restaurant: [
    { k: "rect", x: 0.2, y: 0.08, w: 0.045, h: 0.27, r: 0.02, c: 0 },
    { k: "rect", x: 0.2775, y: 0.08, w: 0.045, h: 0.27, r: 0.02, c: 0 },
    { k: "rect", x: 0.355, y: 0.08, w: 0.045, h: 0.27, r: 0.02, c: 0 },
    { k: "rect", x: 0.2, y: 0.3, w: 0.2, h: 0.1, r: 0.04, c: 0 },
    { k: "rect", x: 0.265, y: 0.36, w: 0.07, h: 0.56, r: 0.035, c: 0 },
    { k: "poly", pts: [0.63, 0.08, 0.75, 0.16, 0.75, 0.52, 0.63, 0.52], c: 0 },
    { k: "rect", x: 0.64, y: 0.48, w: 0.1, h: 0.44, r: 0.045, c: 0 },
  ],
  beaute: [
    { k: "poly", pts: [0.42, 0.06, 0.52, 0.42, 0.88, 0.52, 0.52, 0.62, 0.42, 0.98, 0.32, 0.62, -0.04, 0.52, 0.32, 0.42], c: 0 },
    { k: "poly", pts: [0.82, 0.04, 0.86, 0.15, 0.97, 0.19, 0.86, 0.23, 0.82, 0.34, 0.78, 0.23, 0.67, 0.19, 0.78, 0.15], c: 0 },
  ],
  btp: [
    { k: "poly", pts: [0.5, 0.06, 0.96, 0.46, 0.85, 0.46, 0.85, 0.93, 0.15, 0.93, 0.15, 0.46, 0.04, 0.46], c: 0 },
    { k: "rect", x: 0.41, y: 0.6, w: 0.18, h: 0.33, r: 0.02, c: 1 },
    { k: "rect", x: 0.22, y: 0.52, w: 0.12, h: 0.12, c: 1 },
    { k: "rect", x: 0.66, y: 0.52, w: 0.12, h: 0.12, c: 1 },
  ],
  eglise: [
    { k: "rect", x: 0.42, y: 0.04, w: 0.16, h: 0.92, r: 0.02, c: 0 },
    { k: "rect", x: 0.18, y: 0.26, w: 0.64, h: 0.15, r: 0.02, c: 0 },
  ],
  mariage: [
    { k: "ring", cx: 0.37, cy: 0.56, r: 0.25, sw: 0.075, c: 0 },
    { k: "ring", cx: 0.63, cy: 0.44, r: 0.25, sw: 0.075, c: 0 },
    { k: "poly", pts: [0.63, 0.07, 0.69, 0.13, 0.63, 0.19, 0.57, 0.13], c: 0 },
  ],
  ecole: [
    { k: "poly", pts: [0.5, 0.14, 1, 0.38, 0.5, 0.62, 0, 0.38], c: 0 },
    { k: "poly", pts: [0.2, 0.5, 0.5, 0.65, 0.8, 0.5, 0.8, 0.74, 0.5, 0.88, 0.2, 0.74], c: 0 },
    { k: "rect", x: 0.885, y: 0.38, w: 0.035, h: 0.32, c: 0 },
    { k: "ellipse", cx: 0.9025, cy: 0.72, rx: 0.045, ry: 0.045, c: 0 },
  ],
  transport: [
    { k: "rect", x: 0.03, y: 0.24, w: 0.58, h: 0.46, r: 0.03, c: 0 },
    { k: "poly", pts: [0.64, 0.38, 0.83, 0.38, 0.97, 0.54, 0.97, 0.7, 0.64, 0.7], c: 0 },
    { k: "poly", pts: [0.7, 0.44, 0.8, 0.44, 0.89, 0.54, 0.7, 0.54], c: 1 },
    { k: "ellipse", cx: 0.24, cy: 0.76, rx: 0.1, ry: 0.1, c: 0 },
    { k: "ellipse", cx: 0.79, cy: 0.76, rx: 0.1, ry: 0.1, c: 0 },
    { k: "ellipse", cx: 0.24, cy: 0.76, rx: 0.04, ry: 0.04, c: 1 },
    { k: "ellipse", cx: 0.79, cy: 0.76, rx: 0.04, ry: 0.04, c: 1 },
  ],
  commerce: [
    { k: "ring", cx: 0.5, cy: 0.32, r: 0.17, sw: 0.06, c: 0 },
    { k: "rect", x: 0.14, y: 0.32, w: 0.72, h: 0.6, r: 0.06, c: 0 },
    { k: "ellipse", cx: 0.35, cy: 0.45, rx: 0.035, ry: 0.035, c: 1 },
    { k: "ellipse", cx: 0.65, cy: 0.45, rx: 0.035, ry: 0.035, c: 1 },
  ],
  sante: [
    { k: "rect", x: 0.37, y: 0.08, w: 0.26, h: 0.84, r: 0.05, c: 0 },
    { k: "rect", x: 0.08, y: 0.37, w: 0.84, h: 0.26, r: 0.05, c: 0 },
  ],
};
