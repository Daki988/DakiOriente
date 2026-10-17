import { test } from "node:test";
import assert from "node:assert/strict";
import { optionsToText, textToOptions } from "./options-text.ts";

test("aller-retour texte ↔ options", () => {
  const opts = [
    { name: "Impression", choices: [{ label: "Recto-verso", pct: 0 }, { label: "Recto seul", pct: -10 }] },
    { name: "Pelliculage", choices: [{ label: "Mat", pct: 0 }, { label: "Soft touch", pct: 20 }] },
  ];
  const txt = optionsToText(opts);
  assert.equal(txt, "Impression : Recto-verso | Recto seul -10\nPelliculage : Mat | Soft touch +20");
  assert.deepEqual(textToOptions(txt), opts);
});

test("lignes vides ignorées, « % » accepté", () => {
  assert.deepEqual(textToOptions("\nCoins : Carrés | Arrondis +10%\n"), [{ name: "Coins", choices: [{ label: "Carrés", pct: 0 }, { label: "Arrondis", pct: 10 }] }]);
});

test("ligne sans « : » refusée", () => {
  assert.equal(typeof textToOptions("Pelliculage Mat"), "string");
});
