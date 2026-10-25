import { ICONS, PATTERNS, type Prim } from "./motifs.ts";
import QRCode from "qrcode";
import { TEMPLATE_PALETTES } from "./canva.ts";
import { CLIPARTS } from "./clipart.ts";
import type { Cut } from "./supports.ts";
import { BLEED_MM, colorOf, FONT_PAIRS, PALETTES, type Color, type Design, type FontKey, type Palette, type Side, type Template } from "./model.ts";

/** Largeur d'un texte en mm pour une police et une taille (en mm) données. */
export type Measure = (text: string, font: FontKey, sizeMm: number) => number;

export const LINE_HEIGHT = 1.18;
/** Position de la ligne de base sous le haut de la ligne, en fraction de la taille. */
export const ASCENT = 0.8;

/** Rotation en degrés autour du point (cx, cy), en mm. */
export type RTurn = { deg: number; cx: number; cy: number };
/** Dégradé résolu : de `fill` (opacité de l'élément) vers `to` (opacité `op`), vertical ou horizontal. */
export type RGrad = { to: string; op: number; dir: "v" | "h" };
/** Contour résolu (mm). `fill: "none"` = forme sans remplissage. */
export type RStroke = { stroke?: string; sw?: number; dash?: number };
export type RRect = { t: "rect"; x: number; y: number; w: number; h: number; r: number; fill: string; opacity: number; rot?: RTurn; grad?: RGrad } & RStroke;
export type REllipse = { t: "ellipse"; cx: number; cy: number; rx: number; ry: number; fill: string; opacity: number; rot?: RTurn } & RStroke;
/** `ls` : espacement des lettres en mm. */
export type RText = { ref?: string; t: "text"; font: FontKey; size: number; fill: string; align: "left" | "center" | "right"; x: number; lines: { s: string; y: number }[]; ls?: number; rot?: RTurn };
/** Image placée ; `clip` = zone visible (photo recadrée), `shape` = coins arrondis (mm) ou arche. */
export type RImage = { ref?: string; t: "image"; x: number; y: number; w: number; h: number; src: string; clip?: { x: number; y: number; w: number; h: number }; shape?: { r?: number; arch?: boolean } };
/** Formes simples en mm, couleur résolue. */
export type RPrim =
  | { k: "rect"; x: number; y: number; w: number; h: number; r: number; fill: string }
  | { k: "ellipse"; cx: number; cy: number; rx: number; ry: number; fill: string }
  | { k: "poly"; pts: number[]; fill: string }
  | { k: "ring"; cx: number; cy: number; r: number; sw: number; stroke: string };
/** Groupe de formes (motif ou pictogramme), éventuellement découpé à une zone. */
export type RGroup = { ref?: string; t: "group"; clip?: { x: number; y: number; w: number; h: number }; opacity: number; prims: RPrim[] };
export type RItem = RRect | REllipse | RText | RImage | RGroup;
/** Face prête à dessiner : coordonnées en mm, origine au coin haut-gauche de la zone finie. */
export type RSide = { w: number; h: number; bleed: number; bg: string; items: RItem[]; cut?: Cut };

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

/** Place des formes définies dans un carré unité dans la boîte (x, y, taille s). */
function place(shapes: Prim[], x: number, y: number, s: number, colors: string[]): RPrim[] {
  return shapes.map((p): RPrim => {
    const fill = colors[p.c] ?? colors[0];
    if (p.k === "rect") return { k: "rect", x: x + p.x * s, y: y + p.y * s, w: p.w * s, h: p.h * s, r: (p.r ?? 0) * s, fill };
    if (p.k === "ellipse") return { k: "ellipse", cx: x + p.cx * s, cy: y + p.cy * s, rx: p.rx * s, ry: p.ry * s, fill };
    if (p.k === "ring") return { k: "ring", cx: x + p.cx * s, cy: y + p.cy * s, r: p.r * s, sw: p.sw * s, stroke: fill };
    return { k: "poly", pts: p.pts.map((v, i) => (i % 2 ? y : x) + v * s), fill };
  });
}

/** Palette du design ; « custom:#rrggbb » = palette Violet avec une couleur principale choisie par le client. */
export function paletteOf(id: string): Palette {
  if (id.startsWith("custom:") && /^#[0-9a-f]{6}$/i.test(id.slice(7))) {
    return { ...PALETTES[0], id, name: "Personnalisée", primary: id.slice(7).toLowerCase() };
  }
  return PALETTES.find((p) => p.id === id) ?? TEMPLATE_PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

/** Hauteur du bandeau de slogan, en fraction de la hauteur, selon la famille. */
const BAND: Record<Template["family"], number> = { card: 0.16, portrait: 0.08, tall: 0.06, square: 0.15, wide: 0.15 };

/** Image recadrée pour remplir une zone (comme « cover »), centrée sur le point d'intérêt (fx, fy). */
function cover(src: string, iw: number, ih: number, box: { x: number; y: number; w: number; h: number }, fx = 0.5, fy = 0.5, zoom = 1): RImage {
  const s = Math.max(box.w / iw, box.h / ih) * Math.max(zoom, 1);
  const w = iw * s, h = ih * s;
  return { t: "image", src, x: box.x + (box.w - w) * fx, y: box.y + (box.h - h) * fy, w, h, clip: box };
}

/** Mesure tenant compte de l'espacement des lettres (`ls` en fraction de la taille). */
const spaced = (measure: Measure, ls: number): Measure =>
  ls ? (t, f, s) => measure(t, f, s) + ls * s * Math.max(0, [...t].length - 1) : measure;

/** Clé d'un texte ou d'une photo propre au modèle, dans `Design.texts` / `Design.photos`. */
export const elKey = (tpl: Template, id: string) => `${tpl.id}:${id}`;

export function resolveSide(tpl: Template, side: Side, d: Design, wMm: number, hMm: number, measure: Measure, index = 0): RSide {
  const pal = paletteOf(d.palette);
  const pair = FONT_PAIRS.find((f) => f.id === d.fonts) ?? FONT_PAIRS[0];
  // Ajouts du client (recto) : le bandeau de slogan réserve une bande, le modèle occupe le reste.
  const recto = index === 0;
  const slogan = recto ? (d.slogan ?? "").trim() : "";
  const band = slogan ? hMm * BAND[tpl.family] : 0;
  const areaTop = slogan && d.sloganPos === "haut" ? band : 0;
  const areaH = hMm - band;
  const touchTop = areaTop === 0, touchBottom = areaTop + areaH >= hMm - 0.01;
  const overlayLogo = recto && d.logo && ((d.logoPos && d.logoPos !== "modele") || !side.els.some((e) => e.t === "logo"));
  const u = Math.min(wMm, areaH);
  // Avec une photo de fond, les grands aplats et motifs deviennent translucides pour la laisser voir.
  const fade = recto && d.bgImage ? Math.max(d.bgVeil ?? 0.55, 0.3) : 1;
  const big = (el: { w: number; h: number }) => (el.w * el.h >= 0.25 ? fade : 1);
  const b = BLEED_MM;
  const items: RItem[] = [];
  // Textes déjà placés : un texte ne commence jamais sur un texte placé au-dessus de lui dans la même colonne.
  const placed: { x0: number; x1: number; top: number; bottom: number }[] = [];

  if (recto && d.bgImage) {
    // Photo de fond sur toute la surface (fond perdu compris), puis un voile de la couleur du fond.
    const full = { x: -b, y: -b, w: wMm + 2 * b, h: hMm + 2 * b };
    const cr = d.crop?.bg;
    items.push({ ...cover(d.bgImage.src, d.bgImage.w, d.bgImage.h, full, cr?.fx, cr?.fy, cr?.z), ref: "bg" });
    const veil = d.bgVeil ?? 0.55;
    if (veil > 0) items.push({ t: "rect", ...full, r: 0, fill: colorOf(pal, side.bg), opacity: veil });
  }

  for (const el of side.els) {
    const x = el.x * wMm, y = areaTop + el.y * areaH, w = el.w * wMm, h = el.h * areaH;
    const turn = (deg: number | undefined, cx: number, cy: number): RTurn | undefined => (deg ? { deg, cx, cy } : undefined);
    const stroke = (e: { stroke?: Color; sw?: number; dash?: number }): RStroke =>
      e.stroke ? { stroke: colorOf(pal, e.stroke), sw: (e.sw ?? 0.004) * u, dash: e.dash ? e.dash * u : undefined } : {};
    if (el.t === "rect") {
      // Une forme qui touche un bord déborde dans le fond perdu.
      const x0 = el.x <= 0.001 ? x - b : x, y0 = el.y <= 0.001 && touchTop ? y - b : y;
      const x1 = el.x + el.w >= 0.999 ? x + w + b : x + w, y1 = el.y + el.h >= 0.999 && touchBottom ? y + h + b : y + h;
      const grad = el.grad ? { to: colorOf(pal, el.grad.to), op: el.grad.op ?? 1, dir: el.grad.dir ?? "v" } as RGrad : undefined;
      items.push({
        t: "rect", x: x0, y: y0, w: x1 - x0, h: y1 - y0, r: (el.r ?? 0) * u, fill: el.fill ? colorOf(pal, el.fill) : "none",
        opacity: (el.opacity ?? 1) * big(el), rot: turn(el.rot, x + w / 2, y + h / 2), grad, ...stroke(el),
      });
    } else if (el.t === "ellipse") {
      items.push({
        t: "ellipse", cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2, fill: el.fill ? colorOf(pal, el.fill) : "none",
        opacity: (el.opacity ?? 1) * big(el), rot: turn(el.rot, x + w / 2, y + h / 2), ...stroke(el),
      });
    } else if (el.t === "photo") {
      const own = el.id ? d.photos?.[elKey(tpl, el.id)] : undefined;
      const img = own ? { src: own.src, iw: own.w, ih: own.h } : { src: el.src, iw: el.iw, ih: el.ih };
      const x0 = el.x <= 0.001 ? x - b : x, y0 = el.y <= 0.001 && touchTop ? y - b : y;
      const x1 = el.x + el.w >= 0.999 ? x + w + b : x + w, y1 = el.y + el.h >= 0.999 && touchBottom ? y + h + b : y + h;
      const box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      const cr = el.id ? d.crop?.[elKey(tpl, el.id)] : undefined;
      items.push({
        ...cover(img.src, img.iw, img.ih, box, cr?.fx ?? (own ? 0.5 : el.fx), cr?.fy ?? (own ? 0.5 : el.fy), cr?.z),
        shape: el.r || el.arch ? { r: (el.r ?? 0) * u, arch: el.arch } : undefined, ref: el.id ? `photo:${el.id}` : undefined,
      });
    } else if (el.t === "text") {
      const own = el.id ? d.texts?.[elKey(tpl, el.id)] : undefined;
      let text = (el.field ? d.fields[el.field] ?? "" : own ?? el.text ?? "").trim();
      if (!text) continue;
      if (el.upper) text = text.toLocaleUpperCase("fr-FR");
      const font = el.font ?? pair[el.role ?? "body"];
      // Les polices manuscrites choisies par rôle sont visuellement plus petites : on les agrandit un peu.
      const base = el.size * u * (!el.font && font === "script" ? 1.35 : 1) * (d.textScale ?? 1);
      const ls = el.ls ?? 0;
      const fit = fitText(text, font, base, w, el.lines ?? 1, spaced(measure, ls));
      const lh = el.lh ?? LINE_HEIGHT;
      const align = el.align ?? "left";
      const ax = align === "center" ? x + w / 2 : align === "right" ? x + w : x;
      const above = tpl.free ? [] : placed.filter((p) => p.x0 < x + w && x < p.x1 && p.top <= y + 0.01);
      const top = Math.max(y, ...above.map((p) => p.bottom + fit.size * 0.3));
      const bottom = top + fit.size * (1 + (fit.lines.length - 1) * lh);
      placed.push({ x0: x, x1: x + w, top, bottom });
      items.push({
        ref: el.field ? `field:${el.field}` : el.id ? `text:${el.id}` : undefined,
        t: "text", font, size: fit.size, fill: colorOf(pal, el.color), align, x: ax, ls: ls ? ls * fit.size : undefined,
        rot: turn(el.rot, x + w / 2, (top + bottom) / 2),
        lines: fit.lines.map((s, i) => ({ s, y: top + fit.size * ASCENT + i * fit.size * lh })),
      });
    } else if (el.t === "pattern") {
      const id = el.pattern === "auto" ? d.pattern ?? tpl.pattern ?? "wax" : el.pattern;
      const def = PATTERNS[id];
      const x0 = el.x <= 0.001 ? x - b : x, y0 = el.y <= 0.001 && touchTop ? y - b : y;
      const x1 = el.x + el.w >= 0.999 ? x + w + b : x + w, y1 = el.y + el.h >= 0.999 && touchBottom ? y + h + b : y + h;
      const tile = Math.max(el.tile * u, 2);
      const colors = el.colors.map((c) => colorOf(pal, c));
      // Carreaux alignés sur la zone finie, pour un rendu identique quel que soit le fond perdu.
      const prims: RPrim[] = [{ k: "rect", x: x0, y: y0, w: x1 - x0, h: y1 - y0, r: 0, fill: colors[0] }];
      const startX = x - Math.ceil((x - x0) / tile) * tile, startY = y - Math.ceil((y - y0) / tile) * tile;
      for (let ty = startY - tile; ty < y1; ty += tile) {
        for (let tx = startX - tile; tx < x1; tx += tile) prims.push(...place(def.shapes, tx, ty, tile, colors));
      }
      items.push({ t: "group", clip: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, opacity: (el.opacity ?? 1) * big(el), prims });
    } else if (el.t === "icon") {
      if (!d.icon) continue;
      const s = Math.min(w, h);
      const align = el.align ?? "center";
      const ix = align === "left" ? x : align === "right" ? x + w - s : x + (w - s) / 2;
      items.push({ t: "group", opacity: 1, prims: place(ICONS[d.icon], ix, y + (h - s) / 2, s, [colorOf(pal, el.color), colorOf(pal, el.cut)]) });
    } else if (el.t === "logo") {
      // Logo déplacé ailleurs par le client : l'emplacement du modèle reçoit le pictogramme ou les initiales.
      const moved = Boolean(overlayLogo && d.logoPos && d.logoPos !== "modele");
      if (d.logo && !moved) {
        const ratio = d.logo.w / d.logo.h;
        let lw = w, lh = w / ratio;
        if (lh > h) { lh = h; lw = h * ratio; }
        const align = el.align ?? "center";
        const lx = align === "left" ? x : align === "right" ? x + w - lw : x + (w - lw) / 2;
        items.push({ t: "image", x: lx, y: y + (h - lh) / 2, w: lw, h: lh, src: d.logo.src, ref: "logo" });
      } else if (d.icon) {
        // Sans logo : le pictogramme du métier…
        const s = Math.min(w, h) * 0.9;
        const align = el.align ?? "center";
        const ix = align === "left" ? x : align === "right" ? x + w - s : x + (w - s) / 2;
        items.push({ t: "group", opacity: 1, prims: place(ICONS[d.icon], ix, y + (h - s) / 2, s, [colorOf(pal, el.color), colorOf(pal, el.on ?? side.bg)]) });
      } else if (d.monogram && d.fields[d.monogram]?.trim()) {
        // Sans logo : les initiales de la marque (ou du nom) prennent sa place.
        const font = pair.head;
        const text = initials(d.fields[d.monogram]);
        const fit = fitText(text, font, h * 0.75, w, 1, measure);
        const align = el.align ?? "center";
        const ax = align === "center" ? x + w / 2 : align === "right" ? x + w : x;
        items.push({ ref: "logo", t: "text", font, size: fit.size, fill: colorOf(pal, el.color), align, x: ax, lines: [{ s: fit.lines[0] ?? text, y: y + (h - fit.size) / 2 + fit.size * ASCENT }] });
      }
    }
  }
  if (overlayLogo && d.logo) {
    // Logo ajouté à une position choisie (ou en haut à droite si le modèle n'a pas d'emplacement).
    const pos = d.logoPos && d.logoPos !== "modele" ? d.logoPos : "hd";
    const m = u * 0.07, box = u * 0.24;
    const ratio = d.logo.w / d.logo.h;
    let lw = box * 1.4, lh = lw / ratio;
    if (lh > box) { lh = box; lw = box * ratio; }
    const lx = pos === "hg" || pos === "bg" ? m : pos === "centre" ? (wMm - lw) / 2 : wMm - m - lw;
    const ly = pos === "hg" || pos === "hd" ? areaTop + m : pos === "centre" ? areaTop + (areaH - lh) / 2 : areaTop + areaH - m - lh;
    items.push({ t: "image", x: lx, y: ly, w: lw, h: lh, src: d.logo.src, ref: "logo" });
  }
  for (const [ci, c] of (d.clips ?? []).entries()) {
    const art = CLIPARTS[c.art];
    if (!art || c.side !== index) continue;
    const s = c.s * Math.min(wMm, hMm);
    items.push({ ref: `clip:${ci}`, t: "group", opacity: 1, prims: place(art.shapes, c.x * wMm - s / 2, c.y * hMm - s / 2, s, [colorOf(pal, c.color), colorOf(pal, side.bg)]) });
  }
  if (d.qr && d.qr.side === index && d.qr.text.trim()) items.push({ ...qrGroup(d.qr.text.trim(), d.qr.pos, wMm, hMm, colorOf(pal, d.qr.color ?? "#0d0e12")), ref: "qr" });
  if (slogan) {
    const y0 = areaTop ? 0 : areaH;
    items.push({ t: "rect", x: -b, y: areaTop ? -b : y0, w: wMm + 2 * b, h: band + b, r: 0, fill: colorOf(pal, "primary"), opacity: 1 });
    const font = pair.sub;
    const lines = tpl.family === "tall" || tpl.family === "portrait" ? 2 : 1;
    const fit = fitText(slogan, font, band * (lines === 2 ? 0.3 : 0.42), wMm * 0.88, lines, measure);
    const blockH = fit.size * (1 + (fit.lines.length - 1) * LINE_HEIGHT);
    const top = y0 + (band - blockH) / 2;
    items.push({ ref: "slogan", t: "text", font, size: fit.size, fill: colorOf(pal, "onPrimary"), align: "center", x: wMm / 2, lines: fit.lines.map((s, i) => ({ s, y: top + fit.size * ASCENT + i * fit.size * LINE_HEIGHT })) });
  }
  return { w: wMm, h: hMm, bleed: b, bg: colorOf(pal, side.bg), items };
}

/** Code QR vectoriel (modules fusionnés par ligne) sur un fond blanc avec sa marge de silence. */
export function qrGroup(text: string, pos: string, wMm: number, hMm: number, dark: string): RGroup {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = modules.size;
  const u = Math.min(wMm, hMm);
  const box = Math.max(Math.min(u * 0.28, 40), 15);
  const quiet = (box / (n + 4)) * 2;
  const cell = (box - 2 * quiet) / n;
  const m = u * 0.05;
  const x = pos === "hg" || pos === "bg" ? m : pos === "centre" ? (wMm - box) / 2 : wMm - m - box;
  const y = pos === "hg" || pos === "hd" ? m : pos === "centre" ? (hMm - box) / 2 : hMm - m - box;
  const prims: RPrim[] = [{ k: "rect", x, y, w: box, h: box, r: quiet / 2, fill: "#ffffff" }];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!modules.get(r, c)) continue;
      let e = c;
      while (e + 1 < n && modules.get(r, e + 1)) e++;
      // Léger chevauchement pour éviter les filets blancs entre modules à l'écran.
      prims.push({ k: "rect", x: x + quiet + c * cell, y: y + quiet + r * cell, w: (e - c + 1) * cell + cell * 0.02, h: cell * 1.02, r: 0, fill: dark });
      c = e;
    }
  }
  return { t: "group", opacity: 1, prims };
}

export function resolveDesign(tpl: Template, d: Design, wMm: number, hMm: number, withVerso: boolean, measure: Measure): RSide[] {
  const sides = withVerso ? tpl.sides : tpl.sides.slice(0, 1);
  return sides.map((s, i) => resolveSide(tpl, s, d, wMm, hMm, measure, i));
}
