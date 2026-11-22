#!/usr/bin/env node
/**
 * Un document Markdown de `docs/` en PDF aux couleurs de Navigoal, prêt à imprimer ou à envoyer.
 *
 * Markdown pris en charge : titres (# ## ###), tableaux, listes à puces et numérotées, gras, italique,
 * liens, citations (>), traits de séparation. Les pseudos @comptetiktok deviennent des liens cliquables
 * vers le profil — un document de comptes à suivre s'utilise alors directement depuis le PDF.
 *
 * Usage : node scripts/doc-en-pdf.mjs ../docs/mon-document.md [sortie.pdf]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, "..");
const [, , entree, sortieArg] = process.argv;
if (!entree) { console.error("Usage : node scripts/doc-en-pdf.mjs <document.md> [sortie.pdf]"); process.exit(1); }
const src = path.resolve(process.cwd(), entree);
const sortie = path.resolve(process.cwd(), sortieArg || src.replace(/\.md$/, ".pdf"));

const TYPES = { ".woff2": "font/woff2", ".png": "image/png" };
const donnees = (p) => `data:${TYPES[path.extname(p)] ?? "application/octet-stream"};base64,${fs.readFileSync(p).toString("base64")}`;
const JAKARTA = donnees(path.join(web, "node_modules", "@fontsource-variable", "plus-jakarta-sans", "files", "plus-jakarta-sans-latin-wght-normal.woff2"));
const LOGO = donnees(path.join(web, "public", "brand", "navigoal-wordmark.png"));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Gras, italique, liens, code, et pseudos TikTok rendus cliquables. */
function ligne(t) {
  let s = esc(t);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  // @pseudo (hors adresse e-mail et hors lien déjà posé) → profil TikTok
  s = s.replace(/(^|[\s(|])@([a-z0-9._]{2,30})\b(?![^<]*<\/a>)/gi, '$1<a href="https://www.tiktok.com/@$2">@$2</a>');
  return s;
}

function versHtml(md) {
  const out = [];
  const blocs = md.replace(/\r/g, "").split(/\n{2,}/);
  for (const bloc of blocs) {
    const lignes = bloc.split("\n").filter((l) => l.trim() !== "");
    if (!lignes.length) continue;
    if (/^---+$/.test(lignes[0])) { out.push("<hr>"); continue; }
    if (/^#\s/.test(lignes[0])) { out.push(`<h1>${ligne(lignes[0].replace(/^#\s+/, ""))}</h1>`); continue; }
    if (/^##\s/.test(lignes[0])) { out.push(`<h2>${ligne(lignes[0].replace(/^##\s+/, ""))}</h2>`); continue; }
    if (/^###\s/.test(lignes[0])) { out.push(`<h3>${ligne(lignes[0].replace(/^###\s+/, ""))}</h3>`); continue; }
    if (lignes.every((l) => l.startsWith("|"))) {
      const rangs = lignes.filter((l) => !/^\|[-|\s:]+\|$/.test(l)).map((l) => l.replace(/^\||\|$/g, "").split("|").map((c) => ligne(c.trim())));
      const [tete, ...corps] = rangs;
      out.push(`<table><thead><tr>${tete.map((c) => `<th>${c}</th>`).join("")}</tr></thead>`
        + `<tbody>${corps.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    // Les lignes de suite d'une puce (indentées ou simplement repliées) appartiennent à la puce précédente :
    // sinon un gras ou un lien coupé par un retour à la ligne se retrouve affiché avec ses astérisques.
    const grouper = (motif) => {
      const items = [];
      for (const l of lignes) {
        if (motif.test(l)) items.push(l.replace(motif, ""));
        else if (items.length) items[items.length - 1] += " " + l.trim();
      }
      return items;
    };
    if (/^\s*[-*]\s/.test(lignes[0]) && lignes.filter((l) => /^\s*[-*]\s/.test(l)).length >= 1 && !lignes.some((l) => /^\s*\d+\.\s/.test(l))) {
      out.push(`<ul>${grouper(/^\s*[-*]\s+/).map((t) => `<li>${ligne(t)}</li>`).join("")}</ul>`);
      continue;
    }
    if (/^\s*\d+\.\s/.test(lignes[0])) {
      out.push(`<ol>${grouper(/^\s*\d+\.\s+/).map((t) => `<li>${ligne(t)}</li>`).join("")}</ol>`);
      continue;
    }
    if (lignes.every((l) => /^>\s?/.test(l))) {
      out.push(`<blockquote>${ligne(lignes.map((l) => l.replace(/^>\s?/, "")).join(" "))}</blockquote>`);
      continue;
    }
    out.push(`<p>${ligne(lignes.join(" "))}</p>`);
  }
  return out.join("\n");
}

const md = fs.readFileSync(src, "utf8");
const titre = (md.match(/^#\s+(.+)$/m) || [, path.basename(src, ".md")])[1];

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(titre)}</title><style>
  @font-face { font-family: Jakarta; src: url('${JAKARTA}') format('woff2'); font-weight: 200 800; }
  @page { size: A4; margin: 16mm 14mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: Jakarta, system-ui, sans-serif; color: #0b1533; font-size: 10.5pt; line-height: 1.5; margin: 0; }
  h1 { font-size: 22pt; line-height: 1.15; margin: 0 0 4mm; letter-spacing: -.02em; }
  h2 { font-size: 13pt; margin: 8mm 0 2.5mm; padding-top: 2.5mm; border-top: 2px solid #ffc21f; break-after: avoid; }
  h3 { font-size: 11pt; margin: 5mm 0 2mm; break-after: avoid; }
  p { margin: 0 0 2.5mm; }
  ul, ol { margin: 0 0 3mm; padding-left: 5mm; }
  li { margin-bottom: 1.2mm; }
  a { color: #1336e0; text-decoration: none; }
  strong { color: #0b1533; }
  code { background: #eef1f8; border-radius: 3px; padding: 0 1mm; font-size: .92em; }
  hr { border: 0; border-top: 1px solid #dfe4f0; margin: 5mm 0; }
  blockquote { margin: 0 0 3mm; padding: 2.5mm 4mm; background: #f4f7ff; border-left: 3px solid #1a47f5; border-radius: 0 6px 6px 0; }
  table { width: 100%; border-collapse: collapse; margin: 0 0 4mm; font-size: 9.5pt; break-inside: auto; }
  th { text-align: left; background: #0b1533; color: #fff; padding: 2mm 2.5mm; font-weight: 700; }
  td { padding: 1.8mm 2.5mm; border-bottom: 1px solid #e6eaf4; vertical-align: top; }
  tr { break-inside: avoid; }
  tbody tr:nth-child(even) { background: #f8fafe; }
  .entete { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6mm; padding-bottom: 3mm; border-bottom: 2px solid #0b1533; }
  .entete img { height: 9mm; }
  .entete span { font-size: 8.5pt; color: #5f6886; }
</style></head><body>
  <div class="entete"><img src="${LOGO}" alt="Navigoal"><span>${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span></div>
  ${versHtml(md)}
</body></html>`;

const CHROME = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";
const navigateur = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME, args: ["--no-sandbox"] } : {});
const page = await navigateur.newPage();
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: sortie, format: "A4", printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<div></div>",
  footerTemplate: `<div style="width:100%;font-size:8pt;color:#5f6886;font-family:sans-serif;padding:0 14mm;display:flex;justify-content:space-between">
    <span>${esc(titre)} · Navigoal</span><span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
  margin: { top: "16mm", bottom: "18mm", left: "14mm", right: "14mm" },
});
await navigateur.close();
console.log(`${path.basename(sortie)} — ${Math.round(fs.statSync(sortie).size / 1024)} Ko`);
