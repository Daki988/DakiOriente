import { test } from "node:test";
import assert from "node:assert/strict";
import { quote, tierFor, type Priceable } from "./pricing.ts";

const cartes: Priceable = {
  pricing: "pack",
  tiers: [{ qty: 100, price: 11000 }, { qty: 250, price: 12500 }, { qty: 500, price: 15500 }],
  options: [
    { name: "Impression", choices: [{ label: "Recto-verso", pct: 0 }, { label: "Recto seul", pct: -10 }] },
    { name: "Pelliculage", choices: [{ label: "Mat", pct: 0 }, { label: "Soft touch", pct: 20 }] },
  ],
};
const bache: Priceable = { pricing: "area", tiers: [{ qty: 10, price: 3400 }, { qty: 25, price: 3200 }, { qty: 50, price: 3000 }], options: [] };
const badge: Priceable = { pricing: "unit", tiers: [{ qty: 1, price: 300 }], options: [] };

test("pack : prix du palier exact, options par défaut", () => {
  const q = quote(cartes, { qty: 250 });
  assert.ok(q.ok);
  assert.equal(q.total, 12500);
  assert.deepEqual(q.choices, { Impression: "Recto-verso", Pelliculage: "Mat" });
});

test("pack : quantité hors palier refusée", () => {
  assert.equal(quote(cartes, { qty: 300 }).ok, false);
});

test("options en pourcentage, arrondies à 50 FCFA", () => {
  const q = quote(cartes, { qty: 100, choices: { Impression: "Recto seul", Pelliculage: "Soft touch" } });
  assert.ok(q.ok);
  assert.equal(q.optionsDelta, 1100); // +10 % de 11 000
  assert.equal(q.total, 12100);
});

test("option inconnue refusée", () => {
  assert.equal(quote(cartes, { qty: 100, choices: { Pelliculage: "Doré" } }).ok, false);
});

test("forfait graphiste ajouté", () => {
  const q = quote(cartes, { qty: 100, design: true }, 10000);
  assert.ok(q.ok);
  assert.equal(q.total, 21000);
});

test("surface : palier selon les m² totaux, minimum 1 m²", () => {
  const q = quote(bache, { qty: 1, widthCm: 300, heightCm: 100 });
  assert.ok(q.ok);
  assert.equal(q.area, 3);
  assert.equal(q.total, 10200);
  const big = quote(bache, { qty: 2, widthCm: 500, heightCm: 300 }); // 30 m²
  assert.ok(big.ok);
  assert.equal(big.total, 96000);
  const tiny = quote(bache, { qty: 1, widthCm: 20, heightCm: 20 });
  assert.ok(tiny.ok);
  assert.equal(tiny.area, 1);
});

test("surface : dimensions manquantes refusées", () => {
  assert.equal(quote(bache, { qty: 1 }).ok, false);
});

test("unité : prix unitaire × quantité", () => {
  const q = quote(badge, { qty: 37 });
  assert.ok(q.ok);
  assert.equal(q.total, 11100);
});

test("tierFor choisit le plus grand palier atteint", () => {
  assert.equal(tierFor(bache.tiers, 30).qty, 25);
  assert.equal(tierFor(bache.tiers, 2).qty, 10);
});
