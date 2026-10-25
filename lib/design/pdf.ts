"use client";

import type { RImage, RPrim, RSide, RTurn } from "./layout";
import type { FontKey } from "./model";

const PT = 72 / 25.4; // points par mm
/** Taille maximale d'une page PDF (200 pouces). Au-delà, le fichier est produit à l'échelle 1:10. */
const MAX_PAGE_MM = 5000;

function rgb255(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
}

function dataUrlBytes(src: string) {
  const b64 = src.slice(src.indexOf(",") + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Fichier d'impression vectoriel : une page par face, taille réelle + 3 mm de fond perdu,
 * zone finie déclarée (TrimBox), polices intégrées.
 */
export async function buildPrintPdf(sides: RSide[], title: string): Promise<{ bytes: Uint8Array; scale: number }> {
  const {
    PDFDocument, rgb, pushGraphicsState, popGraphicsState, rectangle, clip, endPath, concatTransformationMatrix,
    setCharacterSpacing, moveTo, lineTo, appendBezierCurve, closePath,
  } = await import("pdf-lib");
  const fontkit = (await import("@pdf-lib/fontkit")).default;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(title);
  doc.setCreator("Neam Print · éditeur en ligne");
  doc.setProducer("Neam Print");

  const fonts = new Map<FontKey, Awaited<ReturnType<typeof doc.embedFont>>>();
  const fontOf = async (k: FontKey) => {
    let f = fonts.get(k);
    if (!f) {
      const bytes = await fetch(`/fonts/${k}.ttf`).then((r) => r.arrayBuffer());
      f = await doc.embedFont(bytes, { subset: true });
      fonts.set(k, f);
    }
    return f;
  };
  const images = new Map<string, Awaited<ReturnType<typeof doc.embedPng>>>();
  const imageOf = async (src: string) => {
    let img = images.get(src);
    if (!img) {
      // Images du client (data:) ou photos des modèles (fichiers du site).
      const bytes: Uint8Array = src.startsWith("data:") ? dataUrlBytes(src) : new Uint8Array(await (await fetch(src)).arrayBuffer());
      img = bytes[0] === 0xff && bytes[1] === 0xd8 ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
      images.set(src, img);
    }
    return img;
  };

  const longest = Math.max(...sides.flatMap((s) => [s.w, s.h])) + 6;
  const scale = longest > MAX_PAGE_MM ? 0.1 : 1;
  const k = PT * scale;
  const color = (hex: string) => rgb(...rgb255(hex));

  for (const s of sides) {
    const b = s.bleed;
    const W = (s.w + 2 * b) * k, H = (s.h + 2 * b) * k;
    const page = doc.addPage([W, H]);
    page.setBleedBox(0, 0, W, H);
    page.setTrimBox(b * k, b * k, s.w * k, s.h * k);
    page.setMediaBox(0, 0, W, H);
    // Repère : mm depuis le coin haut-gauche de la zone finie → points depuis le bas-gauche de la page.
    const X = (mm: number) => (mm + b) * k;
    const Y = (mm: number) => H - (mm + b) * k;

    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: color(s.bg) });

    /** Rotation autour d'un point (sens horaire comme à l'écran, donc négatif dans le repère PDF). */
    const turn = (r?: RTurn) => {
      if (!r) return false;
      const a = (-r.deg * Math.PI) / 180, cx = X(r.cx), cy = Y(r.cy);
      const c = Math.cos(a), sn = Math.sin(a);
      page.pushOperators(pushGraphicsState(), concatTransformationMatrix(c, sn, -sn, c, cx - c * cx + sn * cy, cy - sn * cx - c * cy));
      return true;
    };
    const end = (on: boolean) => { if (on) page.pushOperators(popGraphicsState()); };
    /** Découpe selon un contour (mm) : rectangle, coins arrondis ou arche. */
    const clipShape = (c: { x: number; y: number; w: number; h: number }, shape?: RImage["shape"]) => {
      const x0 = X(c.x), x1 = X(c.x + c.w), yt = Y(c.y), yb = Y(c.y + c.h), K = 0.5523;
      const ops = [pushGraphicsState()];
      if (shape?.arch) {
        const r = Math.min(c.w / 2, c.h) * k, cx = (x0 + x1) / 2, cyArc = yt - r;
        ops.push(moveTo(x0, yb), lineTo(x0, cyArc),
          appendBezierCurve(x0, cyArc + K * r, cx - K * r, yt, cx, yt),
          appendBezierCurve(cx + K * r, yt, x1, cyArc + K * r, x1, cyArc), lineTo(x1, yb), closePath());
      } else if (shape?.r) {
        const r = Math.min(shape.r, c.w / 2, c.h / 2) * k;
        ops.push(moveTo(x0 + r, yt), lineTo(x1 - r, yt), appendBezierCurve(x1 - r + K * r, yt, x1, yt - r + K * r, x1, yt - r),
          lineTo(x1, yb + r), appendBezierCurve(x1, yb + r - K * r, x1 - r + K * r, yb, x1 - r, yb),
          lineTo(x0 + r, yb), appendBezierCurve(x0 + r - K * r, yb, x0, yb + r - K * r, x0, yb + r),
          lineTo(x0, yt - r), appendBezierCurve(x0, yt - r + K * r, x0 + r - K * r, yt, x0 + r, yt), closePath());
      } else ops.push(rectangle(x0, yb, x1 - x0, yt - yb));
      ops.push(clip(), endPath());
      page.pushOperators(...ops);
    };
    const mix = (a: string, b2: string, t: number) => {
      const [r1, g1, b1] = rgb255(a), [r2, g2, bb2] = rgb255(b2);
      return rgb(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (bb2 - b1) * t);
    };

    for (const it of s.items) {
      if (it.t === "rect") {
        const on = turn(it.rot);
        const fill = it.fill === "none" ? undefined : color(it.fill);
        const border = it.stroke ? { borderColor: color(it.stroke), borderWidth: (it.sw ?? 0) * k, borderDashArray: it.dash ? [it.dash * k] : undefined, borderOpacity: it.opacity } : { borderWidth: 0 };
        if (it.grad && it.fill !== "none") {
          // Dégradé : bandes fines interpolées, découpées à la forme.
          clipShape(it, { r: it.r });
          const n = 96, g = it.grad;
          for (let i = 0; i < n; i++) {
            const t = (i + 0.5) / n, op = it.opacity + (g.op - it.opacity) * t, c = mix(it.fill, g.to, t);
            if (g.dir === "h") page.drawRectangle({ x: X(it.x + (it.w * i) / n), y: Y(it.y + it.h), width: (it.w / n) * k + 0.05, height: it.h * k, color: c, opacity: op });
            else page.drawRectangle({ x: X(it.x), y: Y(it.y + (it.h * (i + 1)) / n), width: it.w * k, height: (it.h / n) * k + 0.05, color: c, opacity: op });
          }
          page.pushOperators(popGraphicsState());
        } else if (it.r > 0) {
          const r = Math.min(it.r, it.w / 2, it.h / 2) * k, w = it.w * k, h = it.h * k;
          const path = `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
          page.drawSvgPath(path, { x: X(it.x), y: Y(it.y), color: fill, opacity: it.opacity, ...border });
        } else {
          page.drawRectangle({ x: X(it.x), y: Y(it.y + it.h), width: it.w * k, height: it.h * k, color: fill, opacity: it.opacity, ...border });
        }
        end(on);
      } else if (it.t === "ellipse") {
        const on = turn(it.rot);
        page.drawEllipse({
          x: X(it.cx), y: Y(it.cy), xScale: it.rx * k, yScale: it.ry * k, color: it.fill === "none" ? undefined : color(it.fill), opacity: it.opacity,
          ...(it.stroke ? { borderColor: color(it.stroke), borderWidth: (it.sw ?? 0) * k, borderDashArray: it.dash ? [it.dash * k] : undefined, borderOpacity: it.opacity } : {}),
        });
        end(on);
      } else if (it.t === "group") {
        if (it.clip) {
          const c = it.clip;
          page.pushOperators(pushGraphicsState(), rectangle(X(c.x), Y(c.y + c.h), c.w * k, c.h * k), clip(), endPath());
        }
        const op = it.opacity;
        const draw = (p: RPrim) => {
          if (p.k === "rect") {
            if (p.r > 0) {
              const r = Math.min(p.r, p.w / 2, p.h / 2) * k, w = p.w * k, h = p.h * k;
              const d = `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
              page.drawSvgPath(d, { x: X(p.x), y: Y(p.y), color: color(p.fill), opacity: op, borderWidth: 0 });
            } else page.drawRectangle({ x: X(p.x), y: Y(p.y + p.h), width: p.w * k, height: p.h * k, color: color(p.fill), opacity: op });
          } else if (p.k === "ellipse") {
            page.drawEllipse({ x: X(p.cx), y: Y(p.cy), xScale: p.rx * k, yScale: p.ry * k, color: color(p.fill), opacity: op });
          } else if (p.k === "ring") {
            page.drawEllipse({ x: X(p.cx), y: Y(p.cy), xScale: p.r * k, yScale: p.r * k, borderColor: color(p.stroke), borderWidth: p.sw * k, borderOpacity: op });
          } else {
            const pts = [];
            for (let i = 0; i < p.pts.length; i += 2) pts.push(`${(p.pts[i] + b) * k} ${(p.pts[i + 1] + b) * k}`);
            page.drawSvgPath(`M ${pts.join(" L ")} Z`, { x: 0, y: H, color: color(p.fill), opacity: op, borderWidth: 0 });
          }
        };
        it.prims.forEach(draw);
        if (it.clip) page.pushOperators(popGraphicsState());
      } else if (it.t === "image") {
        const img = await imageOf(it.src);
        if (it.clip) clipShape(it.clip, it.shape);
        page.drawImage(img, { x: X(it.x), y: Y(it.y + it.h), width: it.w * k, height: it.h * k });
        if (it.clip) page.pushOperators(popGraphicsState());
      } else {
        const font = await fontOf(it.font);
        const size = it.size * k;
        const ls = (it.ls ?? 0) * k;
        const on = turn(it.rot);
        if (ls) page.pushOperators(setCharacterSpacing(ls));
        for (const l of it.lines) {
          if (!l.s) continue;
          // Largeur visible : l'espacement ne compte pas après la dernière lettre.
          const tw = font.widthOfTextAtSize(l.s, size) + ls * Math.max(0, [...l.s].length - 1);
          const x = X(it.x) - (it.align === "center" ? tw / 2 : it.align === "right" ? tw : 0);
          page.drawText(l.s, { x, y: Y(l.y), size, font, color: color(it.fill) });
        }
        if (ls) page.pushOperators(setCharacterSpacing(0));
        end(on);
      }
    }
  }

  // Tracé de découpe (forme, patron, trous) sur une page à part, au même format, pour l'atelier.
  const cutSides = sides.filter((s) => s.cut && (s.cut.shaped || s.cut.folds || s.cut.holes?.length));
  if (cutSides.length) {
    const { StandardFonts } = await import("pdf-lib");
    const helv = await doc.embedFont(StandardFonts.Helvetica);
    const magenta = rgb(0.93, 0, 0.55), blue = rgb(0.18, 0.42, 1);
    for (const s of cutSides) {
      const c = s.cut!;
      const b = s.bleed;
      const W = (s.w + 2 * b) * k, H = (s.h + 2 * b) * k;
      const page = doc.addPage([W, H]);
      page.setTrimBox(b * k, b * k, s.w * k, s.h * k);
      const lw = Math.max(0.5, 0.25 * k);
      page.drawSvgPath(c.d, { x: b * k, y: H - b * k, scale: k, borderColor: magenta, borderWidth: lw / k });
      for (const [x1, y1, x2, y2] of c.folds ?? []) {
        page.drawLine({ start: { x: (x1 + b) * k, y: H - (y1 + b) * k }, end: { x: (x2 + b) * k, y: H - (y2 + b) * k }, color: blue, thickness: lw, dashArray: [4, 3] });
      }
      for (const h of c.holes ?? []) page.drawCircle({ x: (h.cx + b) * k, y: H - (h.cy + b) * k, size: h.r * k, borderColor: magenta, borderWidth: lw });
      const fs = Math.max(6, Math.min(14, W / 40));
      page.drawText("Tracé de découpe (magenta) et plis (bleu) - ne pas imprimer", { x: fs, y: fs * 0.8, size: fs, font: helv, color: rgb(0.3, 0.3, 0.35) });
    }
  }
  return { bytes: await doc.save(), scale };
}
