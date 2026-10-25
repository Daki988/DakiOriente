import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boxNet, composeBox, cutFor, supportFor, withVerso } from "./supports.ts";
import { resolveDesign, type Measure } from "./layout.ts";
import { TEMPLATES } from "./templates.ts";
import type { Design } from "./model.ts";

const measure: Measure = (t, _f, s) => t.length * s * 0.55;
const catalogue = JSON.parse(readFileSync(new URL("../../content/catalogue.json", import.meta.url), "utf8")) as { slug: string; categorySlug: string }[];

test("chaque produit du catalogue a un profil de support précis", () => {
  for (const p of catalogue) assert.notEqual(supportFor(p.categorySlug, p.slug).id, "autre", p.slug);
});

test("patron de boîte : dimensions et panneaux", () => {
  const net = boxNet({ L: 100, l: 50, H: 150 });
  assert.equal(net.panels.front.w, 100);
  assert.equal(net.panels.back.x, 50 + 100 + 50);
  assert.ok(net.w > 300 && net.w < 320, `largeur ${net.w}`);
  assert.ok(net.h > 150 + 2 * 50);
  assert.ok(net.cut.folds!.length >= 10);
});

test("la boîte reçoit les deux faces sur ses panneaux", () => {
  const tpl = withVerso(TEMPLATES.find((t) => t.id === "c-cabinet")!);
  const d: Design = { template: tpl.id, palette: tpl.palette, fonts: tpl.fonts, fields: { titre: "A", sousTitre: "B", texte: "C", l1: "1", l2: "2", l3: "3" } };
  const faces = resolveDesign(tpl, d, 100, 150, true, measure);
  const sheet = composeBox(faces, boxNet({ L: 100, l: 50, H: 150 }), 1);
  assert.equal(sheet.items.length, 1 + faces[0].items.length + faces[1].items.length);
  assert.equal(sheet.cut?.focus?.x, 200);
});

test("formes de découpe et zones techniques", () => {
  const sticker = supportFor("stickers-etiquettes", "stickers-decoupe-a-la-forme");
  const d: Design = { template: "x", palette: "violet", fonts: "moderne", fields: { titre: "", sousTitre: "", texte: "", l1: "", l2: "", l3: "" } };
  assert.ok(cutFor(sticker, d, 50, 50).shaped);
  assert.ok(cutFor(sticker, { ...d, shape: "rond" }, 50, 50).d.includes("A"));
  assert.equal(cutFor(supportFor("roll-up-plv", "roll-up-85x200"), d, 850, 2000).hatch?.length, 1);
  assert.equal(cutFor(supportFor("roll-up-plv", "plaque-professionnelle-plexiglas"), d, 300, 200).holes?.length, 4);
  assert.ok((cutFor(supportFor("grand-format", "bache-440-g-brillante-ou-mate"), d, 2000, 1000, { eyelets: true }).holes?.length ?? 0) >= 10);
  assert.ok(cutFor(supportFor("cartes-de-visite", "carte-de-visite-standard"), d, 85, 55, { rounded: true }).shaped);
});

test("verso générique pour les supports recto-verso à modèle d'une face", () => {
  const one = TEMPLATES.find((t) => t.sides.length === 1)!;
  assert.equal(withVerso(one).sides.length, 2);
});
