"use client";

import type { RPrim, RSide } from "./layout";
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
  const { PDFDocument, rgb, pushGraphicsState, popGraphicsState, rectangle, clip, endPath } = await import("pdf-lib");
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
      const bytes = dataUrlBytes(src);
      img = src.startsWith("data:image/jpeg") ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
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

    for (const it of s.items) {
      if (it.t === "rect") {
        if (it.r > 0) {
          const r = Math.min(it.r, it.w / 2, it.h / 2) * k, w = it.w * k, h = it.h * k;
          const path = `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
          page.drawSvgPath(path, { x: X(it.x), y: Y(it.y), color: color(it.fill), opacity: it.opacity, borderWidth: 0 });
        } else {
          page.drawRectangle({ x: X(it.x), y: Y(it.y + it.h), width: it.w * k, height: it.h * k, color: color(it.fill), opacity: it.opacity });
        }
      } else if (it.t === "ellipse") {
        page.drawEllipse({ x: X(it.cx), y: Y(it.cy), xScale: it.rx * k, yScale: it.ry * k, color: color(it.fill), opacity: it.opacity });
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
        if (it.clip) {
          const c = it.clip;
          page.pushOperators(pushGraphicsState(), rectangle(X(c.x), Y(c.y + c.h), c.w * k, c.h * k), clip(), endPath());
        }
        page.drawImage(img, { x: X(it.x), y: Y(it.y + it.h), width: it.w * k, height: it.h * k });
        if (it.clip) page.pushOperators(popGraphicsState());
      } else {
        const font = await fontOf(it.font);
        const size = it.size * k;
        for (const l of it.lines) {
          if (!l.s) continue;
          const tw = font.widthOfTextAtSize(l.s, size);
          const x = X(it.x) - (it.align === "center" ? tw / 2 : it.align === "right" ? tw : 0);
          page.drawText(l.s, { x, y: Y(l.y), size, font, color: color(it.fill) });
        }
      }
    }
  }
  return { bytes: await doc.save(), scale };
}
