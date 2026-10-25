import { ICONS, type IconId, type Prim } from "./motifs.ts";

/** Cliparts : formes simples dans un carré unité. Couleur 0 = dessin, couleur 1 = découpes (couleur du fond). */
export type ClipartId = string;

/** Étoile ou éclat à `n` branches, rayons extérieur `r1` et intérieur `r2`. */
function star(n: number, r1: number, r2: number): Prim {
  const pts: number[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const r = i % 2 ? r2 : r1;
    pts.push(0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r);
  }
  return { k: "poly", pts, c: 0 };
}

const SHAPES: Record<string, { name: string; shapes: Prim[] }> = {
  etoile: { name: "Étoile", shapes: [star(5, 0.5, 0.2)] },
  eclat: { name: "Éclat promo", shapes: [star(16, 0.5, 0.4)] },
  coeur: { name: "Cœur", shapes: [
    { k: "ellipse", cx: 0.3, cy: 0.34, rx: 0.22, ry: 0.22, c: 0 },
    { k: "ellipse", cx: 0.7, cy: 0.34, rx: 0.22, ry: 0.22, c: 0 },
    { k: "poly", pts: [0.09, 0.42, 0.91, 0.42, 0.5, 0.9], c: 0 },
  ] },
  cercle: { name: "Rond", shapes: [{ k: "ellipse", cx: 0.5, cy: 0.5, rx: 0.48, ry: 0.48, c: 0 }] },
  anneau: { name: "Cercle", shapes: [{ k: "ring", cx: 0.5, cy: 0.5, r: 0.44, sw: 0.07, c: 0 }] },
  carre: { name: "Carré", shapes: [{ k: "rect", x: 0.04, y: 0.04, w: 0.92, h: 0.92, r: 0.16, c: 0 }] },
  losange: { name: "Losange", shapes: [{ k: "poly", pts: [0.5, 0.02, 0.98, 0.5, 0.5, 0.98, 0.02, 0.5], c: 0 }] },
  triangle: { name: "Triangle", shapes: [{ k: "poly", pts: [0.5, 0.06, 0.96, 0.9, 0.04, 0.9], c: 0 }] },
  fleche: { name: "Flèche", shapes: [{ k: "poly", pts: [0.04, 0.38, 0.58, 0.38, 0.58, 0.16, 0.96, 0.5, 0.58, 0.84, 0.58, 0.62, 0.04, 0.62], c: 0 }] },
  coche: { name: "Coche", shapes: [{ k: "poly", pts: [0.06, 0.52, 0.2, 0.38, 0.4, 0.58, 0.8, 0.16, 0.94, 0.3, 0.4, 0.84], c: 0 }] },
  eclair: { name: "Éclair", shapes: [{ k: "poly", pts: [0.58, 0.02, 0.18, 0.56, 0.46, 0.56, 0.38, 0.98, 0.82, 0.4, 0.54, 0.4], c: 0 }] },
  bulle: { name: "Bulle", shapes: [
    { k: "rect", x: 0.04, y: 0.08, w: 0.92, h: 0.62, r: 0.16, c: 0 },
    { k: "poly", pts: [0.22, 0.66, 0.46, 0.66, 0.2, 0.94], c: 0 },
  ] },
  lieu: { name: "Adresse", shapes: [
    { k: "ellipse", cx: 0.5, cy: 0.38, rx: 0.3, ry: 0.3, c: 0 },
    { k: "poly", pts: [0.24, 0.5, 0.76, 0.5, 0.5, 0.96], c: 0 },
    { k: "ellipse", cx: 0.5, cy: 0.38, rx: 0.12, ry: 0.12, c: 1 },
  ] },
  bandeau: { name: "Bandeau", shapes: [
    { k: "poly", pts: [0, 0.3, 0.16, 0.3, 0.16, 0.7, 0, 0.7, 0.07, 0.5], c: 0 },
    { k: "poly", pts: [1, 0.3, 0.84, 0.3, 0.84, 0.7, 1, 0.7, 0.93, 0.5], c: 0 },
    { k: "rect", x: 0.12, y: 0.24, w: 0.76, h: 0.4, r: 0, c: 0 },
  ] },
};

const ICON_NAMES: Record<IconId, string> = {
  restaurant: "Restaurant", beaute: "Beauté", btp: "BTP", eglise: "Église", mariage: "Mariage",
  ecole: "École", transport: "Transport", commerce: "Commerce", sante: "Santé",
};

export const CLIPARTS: Record<ClipartId, { name: string; shapes: Prim[] }> = {
  ...SHAPES,
  ...Object.fromEntries((Object.keys(ICONS) as IconId[]).map((id) => [`ic-${id}`, { name: ICON_NAMES[id], shapes: ICONS[id] }])),
};
export const CLIPART_IDS = Object.keys(CLIPARTS);
