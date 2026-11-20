#!/usr/bin/env node
/**
 * Index des textes de Navigoal, pour que Navi puisse répondre à partir des pages du site
 * (couche « RAG ») : conditions d'utilisation, confidentialité, pièces du dossier, guide des écoles,
 * fonctionnement de Navilease et de NaviTravel, page Parents, « Pourquoi Navigoal »…
 *
 * Source : le HTML déjà pré-rendu par `next build` (.next/server/app). L'index suit donc toujours
 * exactement ce que le site affiche, sans texte recopié à la main qui finirait par diverger.
 * Les pages du catalogue (établissements, villes, métiers, formations) sont volontairement exclues :
 * Navi les lit déjà par ses outils, avec des données à jour et structurées.
 *
 * Usage : node scripts/index-documents.mjs   (lancé par `npm run sync` après un build)
 * Sortie : src/data/documents.json — [{ chemin, titre, section, texte }]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, "..");
const APP = path.join(web, ".next", "server", "app");
const SORTIE = path.join(web, "src", "data", "documents.json");

/** Pages du catalogue : Navi les interroge par ses outils, les indexer ferait doublon et bruit. */
const EXCLUS = [/^\/etablissements\/[^/]+$/, /^\/villes\/[^/]+$/, /^\/metiers\/[^/]+$/, /^\/formations\/[^/]+$/,
  /^\/navilease\/residences\/[^/]+$/, /^\/actualites\/[^/]+$/, /^\/_not-found$/, /^\/comparateur$/, /^\/recherche$/];
/** Espaces connectés et authentification : jamais indexés. Comparaison par segment entier,
 *  sinon « /parents » serait pris pour l'espace « /parent ». */
const SEGMENTS_PRIVES = new Set(["admin", "espace", "parent", "bailleur", "compte", "conseiller", "messages",
  "notifications", "orientation", "connexion", "inscription", "mot-de-passe-oublie", "paiement",
  "premiere-connexion", "verification"]);
const estPrive = (chemin) => {
  const [, premier, second] = chemin.split("/");
  if (SEGMENTS_PRIVES.has(premier)) return true;
  return premier === "etablissement" && second !== "guide"; // espace école, sauf son guide public
};

const fichiers = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  return e.isDirectory() ? fichiers(p) : p.endsWith(".html") ? [p] : [];
});

/** Texte lisible d'un fragment HTML (sans balises, entités décodées, espaces normalisés). */
const texteDe = (html) => html
  .replace(/<(script|style|svg|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&(?:apos|rsquo|lsquo);/g, "'").replace(/&(?:laquo|raquo);/g, '"')
  .replace(/&[a-z]+;/gi, " ")
  .replace(/\s+/g, " ").trim();

/** Corps de la page : on retire en-tête, pied, menus et le widget Navi lui-même. */
const corpsDe = (html) => {
  const m = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  return (m ? m[1] : html)
    .replace(/<(header|footer|nav|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
};

/** Découpe en sections : un titre (h1 à h3) et le texte qui le suit. */
function sections(corps) {
  const out = [];
  const parts = corps.split(/(<h[123]\b[^>]*>[\s\S]*?<\/h[123]>)/i);
  let titre = "";
  for (const part of parts) {
    if (/^<h[123]\b/i.test(part)) { titre = texteDe(part); continue; }
    const t = texteDe(part);
    if (t.length >= 120) out.push({ section: titre, texte: t });
    else if (t && out.length) out[out.length - 1].texte += " " + t;
  }
  return out;
}

/** Une section trop longue est recoupée en morceaux de phrases entières (~900 caractères). */
function morceaux(texte, max = 900) {
  if (texte.length <= max) return [texte];
  const out = [];
  let cur = "";
  for (const phrase of texte.split(/(?<=[.!?…])\s+/)) {
    if (cur && (cur + " " + phrase).length > max) { out.push(cur); cur = phrase; }
    else cur = cur ? `${cur} ${phrase}` : phrase;
  }
  if (cur) out.push(cur);
  return out;
}

if (!fs.existsSync(APP)) {
  console.error("index-documents : aucun build trouvé (.next/server/app). Lancez `npm run build` d'abord.");
  process.exit(0); // pas bloquant : le premier build n'a pas encore de HTML à indexer
}

const docs = [];
for (const f of fichiers(APP)) {
  const chemin = "/" + path.relative(APP, f).replace(/\\/g, "/").replace(/\.html$/, "").replace(/^index$/, "");
  if (estPrive(chemin) || EXCLUS.some((r) => r.test(chemin))) continue;
  const html = fs.readFileSync(f, "utf8");
  const titre = texteDe((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ""])[1]).replace(/\s*[|·]\s*Navigoal.*$/, "").trim();
  for (const s of sections(corpsDe(html)))
    for (const t of morceaux(s.texte))
      docs.push({ chemin: chemin === "/" ? "/" : chemin + "/", titre, section: s.section, texte: t });
}

// Doublons (mêmes phrases reprises de page en page) : on garde la première occurrence.
const vus = new Set();
const uniques = docs.filter((d) => { const c = d.texte.slice(0, 160); if (vus.has(c)) return false; vus.add(c); return true; });

fs.writeFileSync(SORTIE, JSON.stringify(uniques));
const pages = new Set(uniques.map((d) => d.chemin));
console.log(`Index des textes : ${uniques.length} passages sur ${pages.size} pages (${Math.round(fs.statSync(SORTIE).size / 1024)} Ko).`);
