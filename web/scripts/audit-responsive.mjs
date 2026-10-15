// Audit de responsivité : chaque page à plusieurs tailles d'écran (téléphones, tablette, ordinateurs),
// détection du débordement horizontal et des cibles tactiles trop petites, captures d'écran.
// Usage : BASE=http://localhost:3000 OUT=dossier [COMPTES='[{"identifiant":"…","motDePasse":"…","pages":["/espace/"]}]'] node scripts/audit-responsive.mjs
import fs from "node:fs";
import path from "node:path";
import { chromium, devices } from "playwright";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT || "audit-responsive";
const PUBLIQUES = (process.env.PAGES || "/,/etablissements/,/etablissements/ma-emsi/,/formations/,/metiers/,/villes/,/ressources/,/recherche/?q=informatique,/comparateur/,/devis/,/navilease/,/navilease/logements/,/pays/ma/,/connexion/,/inscription/,/mot-de-passe-oublie/").split(",");
const COMPTES = JSON.parse(process.env.COMPTES || "[]");
const APPAREILS = {
  "galaxy-s8": devices["Galaxy S8"], "iphone-se": devices["iPhone SE"], "iphone-13": devices["iPhone 13"],
  "ipad": devices["iPad (gen 7)"], "laptop": { viewport: { width: 1280, height: 800 } }, "desktop": { viewport: { width: 1920, height: 1080 } },
};
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined }).catch(() => chromium.launch());
const rapport = [];

async function auditer(ctx, nom, pages) {
  const page = await ctx.newPage();
  for (const url of pages) {
    try {
      await page.goto(BASE + url, { waitUntil: "networkidle", timeout: 45000 });
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
      await page.waitForTimeout(400);
      const r = await page.evaluate(() => {
        const W = document.documentElement.clientWidth;
        const deborde = [...document.querySelectorAll("body *")].filter((e) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 0 && b.right > W + 1 && s.position !== "fixed" && !e.closest("[data-scroll-x], .overflow-x-auto, .overflow-x-scroll, .overflow-hidden"); })
          .slice(0, 5).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(" ").slice(0, 3).join(".")} (${Math.round(e.getBoundingClientRect().right)}px)`);
        const petits = [...document.querySelectorAll("a, button, input, select, textarea")].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && (b.height < 32 || b.width < 32) && getComputedStyle(e).visibility !== "hidden"; }).length;
        return { scroll: document.documentElement.scrollWidth, W, deborde, petits };
      });
      const fichier = path.join(OUT, `${nom}${url.replace(/[^a-z0-9]+/gi, "_")}.png`);
      await page.screenshot({ path: fichier, fullPage: false });
      rapport.push({ appareil: nom, url, debordement: r.scroll > r.W + 1, largeur: r.W, scrollWidth: r.scroll, elements: r.deborde, petites_cibles: r.petits, capture: fichier });
    } catch (e) {
      rapport.push({ appareil: nom, url, erreur: String(e.message).slice(0, 160) });
    }
  }
  await page.close();
}

for (const [nom, d] of Object.entries(APPAREILS)) {
  const ctx = await browser.newContext({ ...d, locale: "fr-FR" });
  await auditer(ctx, nom, PUBLIQUES);
  for (const c of COMPTES) {
    const r = await ctx.request.post(`${BASE}/api/auth/connexion/`, { data: { identifiant: c.identifiant, motDePasse: c.motDePasse }, headers: { origin: BASE } });
    if (r.ok()) await auditer(ctx, `${nom}-${c.nom ?? "compte"}`, c.pages);
    else rapport.push({ appareil: nom, compte: c.identifiant, erreur: `connexion ${r.status()}` });
    await ctx.clearCookies();
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, "rapport.json"), JSON.stringify(rapport, null, 1));
const ko = rapport.filter((r) => r.debordement || r.erreur);
console.log(`${rapport.length} vérifications, ${ko.length} problème(s)`);
for (const r of ko) console.log(`✗ ${r.appareil} ${r.url ?? r.compte} ${r.erreur ?? `débordement ${r.scrollWidth}/${r.largeur} : ${r.elements.join(", ")}`}`);
