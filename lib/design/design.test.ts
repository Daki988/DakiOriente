import { test } from "node:test";
import assert from "node:assert/strict";
import { fitText, initials, resolveDesign, wrap, type Measure } from "./layout.ts";
import { FIELDS, FONT_PAIRS, PALETTES, type Design } from "./model.ts";
import { familyFor, KINDS, TEMPLATES, templatesFor } from "./templates.ts";
import { ICONS, PATTERNS } from "./motifs.ts";
import { SECTORS } from "./sectors.ts";

// Mesure simplifiée : chaque caractère fait 0,55 × la taille.
const measure: Measure = (t, _f, s) => t.length * s * 0.55;

test("wrap coupe aux mots et respecte le nombre de lignes", () => {
  assert.deepEqual(wrap("un deux trois", "sans", 10, 60, 2, measure), ["un deux", "trois"]);
  assert.equal(wrap("un deux trois", "sans", 10, 60, 1, measure), null);
  assert.equal(wrap("anticonstitutionnellement", "sans", 10, 60, 3, measure), null);
});

test("fitText réduit la taille quand le texte est trop long", () => {
  const r = fitText("Grande promo de fin d’année", "display", 10, 80, 1, measure);
  assert.ok(r.size < 10 && r.size >= 3.5);
  assert.equal(r.lines.length, 1);
  assert.ok(measure(r.lines[0], "display", r.size) <= 80);
});

test("initiales", () => {
  assert.equal(initials("Okoumé Conseil Gabon"), "OC");
  assert.equal(initials(""), "★");
});

test("familles selon les proportions", () => {
  assert.equal(familyFor(85, 55), "card");
  assert.equal(familyFor(148, 210), "portrait");
  assert.equal(familyFor(850, 2000), "tall");
  assert.equal(familyFor(50, 50), "square");
  assert.equal(familyFor(3000, 1000), "wide");
  for (const f of ["card", "portrait", "tall", "square", "wide"] as const) assert.ok(templatesFor(f).length >= 3, f);
});

test("chaque modèle se calcule sans erreur, textes dans la zone finie", () => {
  const ids = new Set<string>();
  for (const tpl of TEMPLATES) {
    assert.ok(!ids.has(tpl.id), `id en double : ${tpl.id}`); ids.add(tpl.id);
    assert.ok(PALETTES.some((p) => p.id === tpl.palette) && FONT_PAIRS.some((f) => f.id === tpl.fonts));
    const dims: Record<string, [number, number]> = { card: [85, 55], portrait: [148, 210], tall: [850, 2000], square: [50, 50], wide: [3000, 1000] };
    const [w, h] = dims[tpl.family];
    for (const kind of Object.values(KINDS)) {
      const d: Design = { template: tpl.id, palette: tpl.palette, fonts: tpl.fonts, fields: { ...kind.defaults } };
      const sides = resolveDesign(tpl, d, w, h, true, measure);
      assert.equal(sides.length, tpl.sides.length);
      for (const s of sides) {
        const boxes = s.items.filter((it) => it.t === "text").map((it) => {
          const ws = it.lines.map((l) => measure(l.s, it.font, it.size));
          const mw = Math.max(...ws);
          const x0 = it.align === "center" ? it.x - mw / 2 : it.align === "right" ? it.x - mw : it.x;
          return { x0, x1: x0 + mw, y0: it.lines[0].y - it.size * 0.8, y1: it.lines[it.lines.length - 1].y + it.size * 0.2, s: it.lines[0].s };
        });
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], c = boxes[j];
          const overlap = a.x0 < c.x1 - 0.01 && c.x0 < a.x1 - 0.01 && a.y0 < c.y1 - 0.01 && c.y0 < a.y1 - 0.01;
          assert.ok(!overlap, `${tpl.id} : « ${a.s} » chevauche « ${c.s} »`);
        }
      }
      for (const s of sides) for (const it of s.items) if (it.t === "text") {
        for (const l of it.lines) {
          const lw = measure(l.s, it.font, it.size);
          const left = it.align === "center" ? it.x - lw / 2 : it.align === "right" ? it.x - lw : it.x;
          assert.ok(left >= -0.01 && left + lw <= w + 0.01, `${tpl.id} : « ${l.s} » déborde en largeur`);
          assert.ok(l.y > 0 && l.y < h, `${tpl.id} : « ${l.s} » déborde en hauteur`);
        }
      }
    }
  }
});

test("libellés complets pour chaque type de produit", () => {
  for (const k of Object.values(KINDS)) for (const f of FIELDS) assert.equal(typeof k.labels[f], "string");
});

test("secteurs : palette, motif et pictogramme existent, textes complets", () => {
  assert.equal(SECTORS.length, 9);
  for (const s of SECTORS) {
    assert.ok(PALETTES.some((p) => p.id === s.palette), s.id);
    assert.ok(PATTERNS[s.pattern] && ICONS[s.icon], s.id);
    for (const t of Object.values(s.texts)) for (const f of FIELDS) assert.equal(typeof t![f], "string", `${s.id}.${f}`);
  }
});

test("motifs : carreaux limités à la zone et en nombre raisonnable", () => {
  for (const tpl of TEMPLATES.filter((t) => t.sides.some((s) => s.els.some((e) => e.t === "pattern")))) {
    const dims: Record<string, [number, number]> = { card: [85, 55], portrait: [148, 210], tall: [850, 2000], square: [50, 50], wide: [3000, 1000] };
    const [w, h] = dims[tpl.family];
    const d: Design = { template: tpl.id, palette: tpl.palette, fonts: tpl.fonts, fields: { ...KINDS.promo.defaults }, icon: "restaurant" };
    for (const s of resolveDesign(tpl, d, w, h, true, measure)) {
      const groups = s.items.filter((i) => i.t === "group");
      assert.ok(groups.length > 0, tpl.id);
      for (const g of groups) if (g.t === "group") assert.ok(g.prims.length < 6000, `${tpl.id} : ${g.prims.length} formes`);
    }
  }
});

test("ajouts : slogan, photo de fond et logo positionné sur tous les modèles", () => {
  const dims: Record<string, [number, number]> = { card: [85, 55], portrait: [148, 210], tall: [850, 2000], square: [50, 50], wide: [3000, 1000] };
  const img = { src: "data:image/png;base64,AAAA", w: 400, h: 300 };
  for (const tpl of TEMPLATES) {
    const [w, h] = dims[tpl.family];
    for (const sloganPos of ["bas", "haut"] as const) {
      const d: Design = {
        template: tpl.id, palette: tpl.palette, fonts: tpl.fonts, fields: { ...KINDS.promo.defaults },
        logo: img, logoPos: "bd", slogan: "Le goût du Gabon, depuis 2010", sloganPos, bgImage: img, bgVeil: 0.5,
      };
      const [recto] = resolveDesign(tpl, d, w, h, false, measure);
      const photo = recto.items[0];
      assert.ok(photo.t === "image" && photo.clip && photo.w >= w && photo.h >= h, `${tpl.id} : photo de fond`);
      const texts = recto.items.filter((i) => i.t === "text");
      const slogan = texts[texts.length - 1];
      assert.ok(slogan.t === "text" && slogan.lines.map((l) => l.s).join(" ") === d.slogan, `${tpl.id} : slogan`);
      if (slogan.t === "text") for (const l of slogan.lines) {
        assert.ok(measure(l.s, slogan.font, slogan.size) <= w * 0.88 + 0.01, `${tpl.id} : slogan trop large`);
        assert.ok(sloganPos === "haut" ? l.y < h * 0.2 : l.y > h * 0.8, `${tpl.id} : slogan mal placé`);
      }
      const logos = recto.items.filter((i) => i.t === "image" && !i.clip && i.src === img.src);
      assert.equal(logos.length, 1, `${tpl.id} : un seul logo`);
      const lg = logos[0];
      if (lg.t === "image") assert.ok(lg.x + lg.w <= w + 0.01 && lg.y + lg.h <= h + 0.01 && lg.x > w / 2, `${tpl.id} : logo en bas à droite`);
    }
  }
});

test("catalogue : chaque produit a une mise en scène et un modèle de départ", async () => {
  const { readFileSync } = await import("node:fs");
  const { mockupsFor, MOCKUP_LABELS } = await import("./templates.ts");
  const { newDesign, approxMeasure } = await import("./defaults.ts");
  const products = JSON.parse(readFileSync(new URL("../../content/catalogue.json", import.meta.url), "utf8"));
  const kinds = new Set<string>();
  for (const p of products) {
    const scenes = mockupsFor(p.categorySlug, p.slug);
    assert.ok(scenes.length > 0 && scenes.every((k) => MOCKUP_LABELS[k]), p.slug);
    scenes.forEach((k) => kinds.add(k));
    const [w, h] = p.formatMm ?? [2000, 1000];
    const d = newDesign({ slug: p.slug, categorySlug: p.categorySlug, wMm: w, hMm: h }, 2);
    const tpl = TEMPLATES.find((t) => t.id === d.template)!;
    assert.ok(resolveDesign(tpl, d, w, h, true, approxMeasure).length >= 1, p.slug);
  }
  assert.ok(kinds.size >= 14, `seulement ${kinds.size} mises en scène utilisées`);
});

test("perspective : les coins du design tombent exactement sur ceux de la photo", async () => {
  const { homography, project } = await import("./perspective.ts");
  const q: [number, number][] = [[412, 210], [890, 260], [860, 610], [380, 540]];
  const hm = homography(85, 55, q as never);
  const corners: [number, number][] = [[0, 0], [85, 0], [85, 55], [0, 55]];
  corners.forEach((c, i) => {
    const [x, y] = project(hm, c);
    assert.ok(Math.abs(x - q[i][0]) < 1e-6 && Math.abs(y - q[i][1]) < 1e-6, `coin ${i}`);
  });
});
