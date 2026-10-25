"use client";

import type { Prim } from "./motifs";
import type { FontKey, Logo } from "./model";

/** Réglages du créateur de logo : forme, pictogramme, texte (initiales ou nom court), police et couleurs. */
export type LogoSpec = {
  text: string; font: FontKey; shape: "rond" | "carre" | "aucun"; icon?: Prim[];
  bg: string; ink: string;
};

function drawPrims(c: CanvasRenderingContext2D, prims: Prim[], x: number, y: number, s: number, colors: string[]) {
  for (const p of prims) {
    const col = colors[p.c] ?? colors[0];
    c.beginPath();
    if (p.k === "rect") {
      c.fillStyle = col;
      c.roundRect(x + p.x * s, y + p.y * s, p.w * s, p.h * s, (p.r ?? 0) * s);
      c.fill();
    } else if (p.k === "ellipse") {
      c.fillStyle = col;
      c.ellipse(x + p.cx * s, y + p.cy * s, p.rx * s, p.ry * s, 0, 0, Math.PI * 2);
      c.fill();
    } else if (p.k === "ring") {
      c.strokeStyle = col;
      c.lineWidth = p.sw * s;
      c.arc(x + p.cx * s, y + p.cy * s, p.r * s, 0, Math.PI * 2);
      c.stroke();
    } else {
      c.fillStyle = col;
      for (let i = 0; i < p.pts.length; i += 2) {
        const px = x + p.pts[i] * s, py = y + p.pts[i + 1] * s;
        if (i) c.lineTo(px, py); else c.moveTo(px, py);
      }
      c.closePath();
      c.fill();
    }
  }
}

/** Dessine le logo dans un canevas carré (fond transparent hors de la forme). */
export function drawLogo(canvas: HTMLCanvasElement, spec: LogoSpec, size = 1000) {
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext("2d");
  if (!c) return;
  c.clearRect(0, 0, size, size);
  const filled = spec.shape !== "aucun";
  if (spec.shape === "rond") {
    c.beginPath(); c.fillStyle = spec.bg; c.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); c.fill();
  } else if (spec.shape === "carre") {
    c.beginPath(); c.fillStyle = spec.bg; c.roundRect(0, 0, size, size, size * 0.18); c.fill();
  }
  const fg = filled ? spec.ink : spec.bg;
  const text = spec.text.trim();
  // Zone utile : un peu en retrait de la forme (le rond coupe les coins).
  const inner = size * (spec.shape === "rond" ? 0.66 : 0.78);
  const top = (size - inner) / 2;
  const iconS = spec.icon ? (text ? inner * 0.42 : inner * 0.8) : 0;
  if (spec.icon) drawPrims(c, spec.icon, (size - iconS) / 2, text ? top : (size - iconS) / 2, iconS, [fg, filled ? spec.bg : "rgba(0,0,0,0)"]);
  if (text) {
    const boxH = spec.icon ? inner - iconS - inner * 0.06 : inner * 0.6;
    let fs = boxH;
    c.font = `${fs}px "np-${spec.font}"`;
    const w = c.measureText(text).width;
    if (w > inner) fs *= inner / w;
    c.font = `${fs}px "np-${spec.font}"`;
    c.fillStyle = fg;
    c.textAlign = "center";
    c.textBaseline = "alphabetic";
    const m = c.measureText(text);
    const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const cy = spec.icon ? top + iconS + inner * 0.06 + boxH / 2 : size / 2;
    c.fillText(text, size / 2, cy + h / 2 - m.actualBoundingBoxDescent);
  }
}

/** Logo prêt pour le design : PNG transparent 1000 × 1000 px. */
export function renderLogo(spec: LogoSpec): Logo {
  const canvas = document.createElement("canvas");
  drawLogo(canvas, spec);
  return { src: canvas.toDataURL("image/png"), w: canvas.width, h: canvas.height };
}
