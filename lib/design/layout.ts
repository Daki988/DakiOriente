import { BLEED_MM, colorOf, FONT_PAIRS, PALETTES, type Design, type FontKey, type Palette, type Side, type Template } from "./model.ts";

/** Largeur d'un texte en mm pour une police et une taille (en mm) données. */
export type Measure = (text: string, font: FontKey, sizeMm: number) => number;

export const LINE_HEIGHT = 1.18;
/** Position de la ligne de base sous le haut de la ligne, en fraction de la taille. */
export const ASCENT = 0.8;

export type RRect = { t: "rect"; x: number; y: number; w: number; h: number; r: number; fill: string; opacity: number };
export type REllipse = { t: "ellipse"; cx: number; cy: number; rx: number; ry: number; fill: string; opacity: number };
export type RText = { t: "text"; font: FontKey; size: number; fill: string; align: "left" | "center" | "right"; x: number; lines: { s: string; y: number }[] };
export type RImage = { t: "image"; x: number; y: number; w: number; h: number; src: string };
export type RItem = RRect | REllipse | RText | RImage;
/** Face prête à dessiner : coordonnées en mm, origine au coin haut-gauche de la zone finie. */
export type RSide = { w: number; h: number; bleed: number; bg: string; items: RItem[] };

/** Découpe en lignes ; null si un mot dépasse ou s'il faut plus de `maxLines` lignes. */
export function wrap(text: string, font: FontKey, size: number, maxW: number, maxLines: number, measure: Measure): string[] | null {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(""); continue; }
    let line = "";
    for (const word of words) {
      if (measure(word, font, size) > maxW) return null;
      const next = line ? `${line} ${word}` : word;
      if (measure(next, font, size) <= maxW) line = next;
      else { out.push(line); line = word; }
    }
    out.push(line);
  }
  while (out.length && out[out.length - 1] === "") out.pop();
  return out.length <= maxLines ? out : null;
}

/** Réduit la taille jusqu'à ce que le texte tienne (largeur + nombre de lignes), sans descendre sous 35 %. */
export function fitText(text: string, font: FontKey, size: number, maxW: number, maxLines: number, measure: Measure) {
  let s = size;
  while (s >= size * 0.35) {
    const lines = wrap(text, font, s, maxW, maxLines, measure);
    if (lines) return { size: s, lines };
    s *= 0.94;
  }
  // Texte vraiment trop long : on garde la taille minimale et on coupe.
  const min = size * 0.35;
  const lines: string[] = [];
  let line = "";
  for (const ch of text.replace(/\s+/g, " ")) {
    if (measure(line + ch, font, min) > maxW) { lines.push(line); line = ch.trimStart(); if (lines.length >= maxLines) break; }
    else line += ch;
  }
  if (lines.length < maxLines && line) lines.push(line);
  return { size: min, lines: lines.slice(0, maxLines) };
}

export function initials(text: string) {
  return text.split(/\s+/).filter((w) => /\p{L}/u.test(w[0] ?? "")).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "★";
}

/** Calcule une face du modèle aux dimensions réelles (mm). */
/** Palette du design ; « custom:#rrggbb » = palette Violet avec une couleur principale choisie par le client. */
export function paletteOf(id: string): Palette {
  if (id.startsWith("custom:") && /^#[0-9a-f]{6}$/i.test(id.slice(7))) {
    return { ...PALETTES[0], id, name: "Personnalisée", primary: id.slice(7).toLowerCase() };
  }
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export function resolveSide(tpl: Template, side: Side, d: Design, wMm: number, hMm: number, measure: Measure): RSide {
  const pal = paletteOf(d.palette);
  const pair = FONT_PAIRS.find((f) => f.id === d.fonts) ?? FONT_PAIRS[0];
  const u = Math.min(wMm, hMm);
  const b = BLEED_MM;
  const items: RItem[] = [];
  // Textes déjà placés : un texte ne commence jamais sur un texte placé au-dessus de lui dans la même colonne.
  const placed: { x0: number; x1: number; top: number; bottom: number }[] = [];

  for (const el of side.els) {
    const x = el.x * wMm, y = el.y * hMm, w = el.w * wMm, h = el.h * hMm;
    if (el.t === "rect") {
      // Une forme qui touche un bord déborde dans le fond perdu.
      const x0 = el.x <= 0.001 ? x - b : x, y0 = el.y <= 0.001 ? y - b : y;
      const x1 = el.x + el.w >= 0.999 ? x + w + b : x + w, y1 = el.y + el.h >= 0.999 ? y + h + b : y + h;
      items.push({ t: "rect", x: x0, y: y0, w: x1 - x0, h: y1 - y0, r: (el.r ?? 0) * u, fill: colorOf(pal, el.fill), opacity: el.opacity ?? 1 });
    } else if (el.t === "ellipse") {
      items.push({ t: "ellipse", cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2, fill: colorOf(pal, el.fill), opacity: el.opacity ?? 1 });
    } else if (el.t === "text") {
      let text = (d.fields[el.field] ?? "").trim();
      if (!text) continue;
      if (el.upper) text = text.toLocaleUpperCase("fr-FR");
      const font = pair[el.role];
      // Les polices manuscrites sont visuellement plus petites : on les agrandit un peu.
      const base = el.size * u * (font === "script" ? 1.35 : 1);
      const fit = fitText(text, font, base, w, el.lines ?? 1, measure);
      const align = el.align ?? "left";
      const ax = align === "center" ? x + w / 2 : align === "right" ? x + w : x;
      const above = placed.filter((p) => p.x0 < x + w && x < p.x1 && p.top <= y + 0.01);
      const top = Math.max(y, ...above.map((p) => p.bottom + fit.size * 0.3));
      const bottom = top + fit.size * (1 + (fit.lines.length - 1) * LINE_HEIGHT);
      placed.push({ x0: x, x1: x + w, top, bottom });
      items.push({
        t: "text", font, size: fit.size, fill: colorOf(pal, el.color), align, x: ax,
        lines: fit.lines.map((s, i) => ({ s, y: top + fit.size * ASCENT + i * fit.size * LINE_HEIGHT })),
      });
    } else if (el.t === "logo") {
      if (d.logo) {
        const ratio = d.logo.w / d.logo.h;
        let lw = w, lh = w / ratio;
        if (lh > h) { lh = h; lw = h * ratio; }
        const align = el.align ?? "center";
        const lx = align === "left" ? x : align === "right" ? x + w - lw : x + (w - lw) / 2;
        items.push({ t: "image", x: lx, y: y + (h - lh) / 2, w: lw, h: lh, src: d.logo.src });
      } else if (d.monogram && d.fields[d.monogram]?.trim()) {
        // Sans logo : les initiales de la marque (ou du nom) prennent sa place.
        const font = pair.head;
        const text = initials(d.fields[d.monogram]);
        const fit = fitText(text, font, h * 0.75, w, 1, measure);
        const align = el.align ?? "center";
        const ax = align === "center" ? x + w / 2 : align === "right" ? x + w : x;
        items.push({ t: "text", font, size: fit.size, fill: colorOf(pal, el.color), align, x: ax, lines: [{ s: fit.lines[0] ?? text, y: y + (h - fit.size) / 2 + fit.size * ASCENT }] });
      }
    }
  }
  return { w: wMm, h: hMm, bleed: b, bg: colorOf(pal, side.bg), items };
}

export function resolveDesign(tpl: Template, d: Design, wMm: number, hMm: number, withVerso: boolean, measure: Measure): RSide[] {
  const sides = withVerso ? tpl.sides : tpl.sides.slice(0, 1);
  return sides.map((s) => resolveSide(tpl, s, d, wMm, hMm, measure));
}
