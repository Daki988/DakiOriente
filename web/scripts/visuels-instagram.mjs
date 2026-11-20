#!/usr/bin/env node
/**
 * Visuels Instagram de Navigoal, rendus au format 1080 × 1350 depuis le HTML, avec les polices
 * (Anton, Plus Jakarta Sans) et les couleurs du site : ce qui est publié ressemble au site.
 *
 * Entrée : un fichier JSON [{ id, type, titre, surtitre, texte, lignes, photo, source, cta }]
 *   type « photo » : photo plein cadre, dégradé sombre, titre en bas (métiers, villes, témoignages)
 *   type « chiffre » : un grand nombre sur aplat, pour les prix et les statistiques
 *   type « liste »  : titre + lignes numérotées, pour les étapes et les comparaisons
 * Sortie : un PNG par visuel dans le dossier demandé.
 *
 * Usage : node scripts/visuels-instagram.mjs <posts.json> <dossier-de-sortie>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, "..");
const PUBLIC = path.join(web, "public");
const FONTS = path.join(web, "node_modules");

const [, , entree, sortie] = process.argv;
if (!entree || !sortie) { console.error("Usage : node scripts/visuels-instagram.mjs <posts.json> <dossier>"); process.exit(1); }

const posts = JSON.parse(fs.readFileSync(entree, "utf8"));
fs.mkdirSync(sortie, { recursive: true });

/** Tout est intégré en base64 : la page rendue n'a pas d'origine, les URL file:// y sont refusées
 *  (polices non appliquées, photos et logo absents). */
const TYPES = { ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
const fichier = (p) => `data:${TYPES[path.extname(p).toLowerCase()] ?? "application/octet-stream"};base64,${fs.readFileSync(p).toString("base64")}`;
const ANTON = fichier(path.join(FONTS, "@fontsource/anton/files/anton-latin-400-normal.woff2"));
const JAKARTA = fichier(path.join(FONTS, "@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2"));
const LOGO = fichier(path.join(PUBLIC, "brand", "navigoal-wordmark.png"));

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** « *mot* » met le mot en jaune, comme les titres du site. */
const accent = (s = "") => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');

const STYLE = `
  @font-face { font-family: Anton; src: url('${ANTON}') format('woff2'); }
  @font-face { font-family: Jakarta; src: url('${JAKARTA}') format('woff2'); font-weight: 200 800; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1350px; font-family: Jakarta, sans-serif; color: #0b1533; overflow: hidden; }
  .cadre { position: relative; width: 1080px; height: 1350px; display: flex; flex-direction: column; }
  .logo { position: absolute; top: 56px; left: 64px; height: 46px; z-index: 3; }
  .logo.clair { filter: brightness(0) invert(1); }
  .pied { position: absolute; bottom: 52px; left: 64px; right: 64px; display: flex; justify-content: space-between;
          align-items: flex-end; font-size: 26px; font-weight: 600; z-index: 3; }
  .cta { background: #1a47f5; color: #fff; padding: 16px 30px; border-radius: 999px; font-size: 27px; }
  .src { font-size: 21px; font-weight: 500; opacity: .72; max-width: 560px; line-height: 1.3; }
  em { font-style: normal; color: #ffc21f; }

  /* photo plein cadre */
  .photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .voile { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,21,51,.55) 0%, rgba(11,21,51,.15) 32%, rgba(11,21,51,.80) 72%, rgba(11,21,51,.95) 100%); }
  .photo-texte { position: absolute; left: 64px; right: 64px; bottom: 150px; z-index: 2; color: #fff; }
  .surtitre { font-size: 26px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #ffc21f; margin-bottom: 22px; }
  .titre { font-family: Anton, sans-serif; font-size: 92px; line-height: .98; text-transform: uppercase; }
  .titre.court { font-size: 112px; }
  .sous { font-size: 34px; line-height: 1.35; margin-top: 26px; font-weight: 500; opacity: .95; }

  /* chiffre */
  .chiffre { background: #0b1533; color: #fff; height: 100%; display: flex; flex-direction: column;
             justify-content: center; padding: 0 76px; }
  .chiffre .nombre { font-family: Anton, sans-serif; font-size: 190px; line-height: .9; color: #ffc21f; }
  .chiffre .nombre.petit { font-size: 132px; }
  .chiffre .quoi { font-size: 44px; font-weight: 700; margin-top: 30px; line-height: 1.2; }
  .chiffre .detail { font-size: 31px; font-weight: 500; margin-top: 26px; line-height: 1.45; opacity: .85; }

  /* liste */
  .liste { background: #f4f7ff; height: 100%; padding: 150px 76px 170px; display: flex; flex-direction: column; }
  .liste h1 { font-family: Anton, sans-serif; font-size: 76px; line-height: 1.02; text-transform: uppercase; }
  .liste .intro { font-size: 30px; font-weight: 500; color: #3b4566; margin-top: 22px; line-height: 1.4; }
  .rangs { margin-top: 46px; display: flex; flex-direction: column; gap: 20px; }
  .rang { background: #fff; border-radius: 26px; padding: 26px 30px; display: flex; gap: 24px; align-items: baseline;
          box-shadow: 0 10px 30px -14px rgba(11,21,51,.22); }
  .rang .n { font-family: Anton, sans-serif; font-size: 38px; color: #1a47f5; min-width: 46px; }
  .rang .t { font-size: 31px; font-weight: 600; line-height: 1.3; }
  .rang .t small { display: block; font-size: 25px; font-weight: 500; color: #5f6886; margin-top: 7px; }
`;

function corps(p) {
  if (p.type === "photo") {
    const img = p.photo ? `<img class="photo" src="${fichier(path.join(PUBLIC, p.photo))}">` : "";
    return `<div class="cadre">${img}<div class="voile"></div>
      <img class="logo clair" src="${LOGO}">
      <div class="photo-texte">
        ${p.surtitre ? `<div class="surtitre">${esc(p.surtitre)}</div>` : ""}
        <div class="titre ${String(p.titre || "").length < 34 ? "court" : ""}">${accent(p.titre)}</div>
        ${p.texte ? `<div class="sous">${accent(p.texte)}</div>` : ""}
      </div>
      <div class="pied" style="color:#fff">
        <span class="src">${esc(p.source || "")}</span>
        ${p.cta ? `<span class="cta">${esc(p.cta)}</span>` : ""}
      </div></div>`;
  }
  if (p.type === "chiffre") {
    return `<div class="cadre"><div class="chiffre">
      <div class="nombre ${String(p.nombre || "").length > 7 ? "petit" : ""}">${esc(p.nombre)}</div>
      <div class="quoi">${accent(p.titre)}</div>
      ${p.texte ? `<div class="detail">${accent(p.texte)}</div>` : ""}
    </div>
    <img class="logo clair" src="${LOGO}">
    <div class="pied" style="color:#fff">
      <span class="src">${esc(p.source || "")}</span>
      ${p.cta ? `<span class="cta">${esc(p.cta)}</span>` : ""}
    </div></div>`;
  }
  const rangs = (p.lignes || []).map((l, i) => `<div class="rang"><span class="n">${p.numerote === false ? "·" : String(i + 1).padStart(2, "0")}</span>
    <span class="t">${accent(l.t ?? l)}${l.s ? `<small>${accent(l.s)}</small>` : ""}</span></div>`).join("");
  return `<div class="cadre"><div class="liste">
      <h1>${accent(p.titre)}</h1>
      ${p.texte ? `<div class="intro">${accent(p.texte)}</div>` : ""}
      <div class="rangs">${rangs}</div>
    </div>
    <img class="logo" src="${LOGO}">
    <div class="pied">
      <span class="src">${esc(p.source || "")}</span>
      ${p.cta ? `<span class="cta">${esc(p.cta)}</span>` : ""}
    </div></div>`;
}

// Le navigateur pré-installé de l'environnement : la version de Playwright du projet n'a pas le sien.
const CHROME = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";
const navigateur = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME, args: ["--no-sandbox"] } : {});
const page = await navigateur.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
let n = 0;
for (const p of posts) {
  await page.setContent(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${STYLE}</style></head><body>${corps(p)}</body></html>`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  const f = path.join(sortie, `${p.id}.png`);
  await page.screenshot({ path: f });
  n++;
  console.log(`  · ${p.id}`);
}
await navigateur.close();
console.log(`${n} visuel(s) → ${sortie}`);
