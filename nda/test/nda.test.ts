import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALPHABET,
  ZONES_EXEMPLE as Z,
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

const lb1 = Z[0];
const louis = { lat: 0.4185, lon: 9.4425 };

const distanceM = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const dy = (a.lat - b.lat) * 111_320;
  const dx = (a.lon - b.lon) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dx, dy);
};

test("le code a le format PP-ZZZ-XXXXX et un alphabet sans ambiguïté", () => {
  assert.match(encoder(lb1, louis), /^ES-LB1-[23456789BCDFGHJKMNPQRSTVWXYZ]{5}$/);
  assert.ok(!/[01OILAEU]/.test(ALPHABET));
});

test("aller-retour encodage/décodage à moins d'une cellule près", () => {
  for (let i = 0; i < 500; i++) {
    const p = {
      lat: lb1.bbox.south + Math.random() * (lb1.bbox.north - lb1.bbox.south),
      lon: lb1.bbox.west + Math.random() * (lb1.bbox.east - lb1.bbox.west),
    };
    const back = decoderLocal(lb1, encoderLocal(lb1, p));
    assert.ok(distanceM(p, back) <= precisionMetres(lb1), `écart trop grand pour ${JSON.stringify(p)}`);
  }
});

test("précision de quelques mètres, même sur une grande commune (Akanda)", () => {
  assert.ok(precisionMetres(lb1) < 2);
  assert.ok(precisionMetres(Z[2]) < 5);
});

test("adresse officielle complète à Libreville", () => {
  const a = creerAdresse(Z, { position: louis, quartier: "Louis", voieId: "LB1-0001", numero: "45", repere: "Face au cactus" });
  assert.deepEqual(formaterAdresse(a), ["45, Boulevard Quaben", "Louis, 1er arrondissement", "Libreville, Gabon"]);
  assert.equal(a.code.slice(0, 7), "ES-LB1-");
});

test("voie non nommée : le code Nda remplace la ligne de voie", () => {
  const a = creerAdresse(Z, { position: { lat: 0.53, lon: 9.42 }, quartier: "Angondjé" });
  assert.match(formaterAdresse(a)[0], /^Code Nda ES-AKA-/);
  assert.deepEqual(formaterAdresse(a).slice(1), ["Angondjé", "Akanda, Gabon"]);
});

test("refuse une voie hors référentiel et une position hors couverture", () => {
  assert.throws(() => creerAdresse(Z, { position: louis, voieId: "XX-9999" }), ErreurAdresse);
  assert.throws(() => creerAdresse(Z, { position: { lat: -0.7, lon: 8.78 } }), ErreurAdresse); // Port-Gentil, pas encore couvert
});

test("résolution d'un code saisi avec espaces et minuscules", () => {
  const code = encoder(lb1, louis);
  const r = resoudreCode(Z, code.toLowerCase().replace(/-/g, " "));
  assert.equal(r.zone.code, "LB1");
  assert.ok(distanceM(r.position, louis) <= r.precisionM);
});

test("lien WhatsApp contient l'adresse et le code", () => {
  const a = creerAdresse(Z, { position: louis, voieId: "LB1-0001", numero: "45" });
  const txt = decodeURIComponent(lienWhatsApp(a).split("text=")[1]);
  assert.ok(txt.includes("45, Boulevard Quaben") && txt.includes(a.code));
});
