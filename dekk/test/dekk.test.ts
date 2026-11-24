import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALPHABET,
  COMMUNES_EXEMPLE as C,
  creerAdresse,
  decoderLocal,
  encoder,
  encoderLocal,
  ErreurAdresse,
  formaterAdresse,
  lienWhatsApp,
  precisionMetres,
  resoudreCode,
} from "../src/index.ts";

const sicap = C[0];
const maison = { lat: 14.7142, lon: -17.4613 };

const distanceM = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const dy = (a.lat - b.lat) * 111_320;
  const dx = (a.lon - b.lon) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dx, dy);
};

test("le code a le format RR-CCC-XXXXX et un alphabet sans ambiguïté", () => {
  const code = encoder(sicap, maison);
  assert.match(code, /^DK-SLB-[23456789BCDFGHJKMNPQRSTVWXYZ]{5}$/);
  assert.ok(!/[01OIL AEU]/.test(ALPHABET));
});

test("aller-retour encodage/décodage à moins d'une cellule près", () => {
  for (let i = 0; i < 500; i++) {
    const p = {
      lat: sicap.bbox.south + Math.random() * (sicap.bbox.north - sicap.bbox.south),
      lon: sicap.bbox.west + Math.random() * (sicap.bbox.east - sicap.bbox.west),
    };
    const back = decoderLocal(sicap, encoderLocal(sicap, p));
    assert.ok(distanceM(p, back) <= precisionMetres(sicap), `écart trop grand pour ${JSON.stringify(p)}`);
  }
});

test("précision urbaine inférieure à 1 m sur une commune de Dakar", () => {
  assert.ok(precisionMetres(sicap) < 1);
});

test("adresse officielle complète", () => {
  const a = creerAdresse(C, { position: maison, quartier: "Liberté 2", voieCode: "SL-41", numero: "12", repere: "Portail bleu" });
  assert.deepEqual(formaterAdresse(a), ["12, Rue SL-41", "Liberté 2, Sicap-Liberté", "Dakar, Sénégal"]);
  assert.equal(a.code.slice(0, 7), "DK-SLB-");
});

test("rue non codifiée : le code Dëkk remplace la ligne de voie", () => {
  const a = creerAdresse(C, { position: { lat: 14.77, lon: -17.44 }, quartier: "Cité Soprim" });
  assert.match(formaterAdresse(a)[0], /^Code Dëkk DK-PAU-/);
});

test("refuse une voie hors référentiel et une position hors couverture", () => {
  assert.throws(() => creerAdresse(C, { position: maison, voieCode: "XX-99" }), ErreurAdresse);
  assert.throws(() => creerAdresse(C, { position: { lat: 14.0, lon: -16.0 } }), ErreurAdresse);
});

test("résolution d'un code saisi avec espaces et minuscules", () => {
  const code = encoder(sicap, maison);
  const r = resoudreCode(C, code.toLowerCase().replace(/-/g, " "));
  assert.equal(r.commune.code, "SLB");
  assert.ok(distanceM(r.position, maison) <= r.precisionM);
});

test("lien WhatsApp contient l'adresse et le code", () => {
  const a = creerAdresse(C, { position: maison, voieCode: "SL-41", numero: "12" });
  const txt = decodeURIComponent(lienWhatsApp(a).split("text=")[1]);
  assert.ok(txt.includes("12, Rue SL-41") && txt.includes(a.code));
});
