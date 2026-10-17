"use client";

import { FONT_KEYS, type FontKey } from "./model";
import type { Measure } from "./layout";

let fontsReady: Promise<void> | null = null;

/** Charge les polices de l'éditeur une seule fois (nécessaire avant de mesurer les textes). */
export function loadEditorFonts() {
  fontsReady ??= Promise.all(FONT_KEYS.map((k) => document.fonts.load(`40px "np-${k}"`))).then(() => undefined);
  return fontsReady;
}

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

/** Mesure réelle dans le navigateur, avec la même police que celle intégrée au PDF. */
export const browserMeasure: Measure = (text: string, font: FontKey, sizeMm: number) => {
  const key = `${font}|${text}`;
  let w = cache.get(key);
  if (w === undefined) {
    ctx ??= document.createElement("canvas").getContext("2d");
    if (!ctx) return text.length * sizeMm * 0.55;
    ctx.font = `100px "np-${font}"`;
    w = ctx.measureText(text).width / 100;
    if (cache.size > 5000) cache.clear();
    cache.set(key, w);
  }
  return w * sizeMm;
};

/** Vide le cache après le chargement des polices (les mesures d'avant utilisaient une police de secours). */
export const resetMeasureCache = () => cache.clear();

/** Lit une image (PNG, JPG, WebP, SVG) et la convertit en PNG, limité à 2400 px de côté. */
export async function readLogo(file: File): Promise<{ src: string; w: number; h: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error("Image illisible"));
      i.src = url;
    });
    const natW = img.naturalWidth || 800, natH = img.naturalHeight || 800;
    const scale = Math.min(1, 2400 / Math.max(natW, natH));
    const w = Math.max(1, Math.round(natW * scale)), h = Math.max(1, Math.round(natH * scale));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d")!.drawImage(img, 0, 0, w, h);
    return { src: c.toDataURL("image/png"), w, h };
  } finally {
    URL.revokeObjectURL(url);
  }
}
