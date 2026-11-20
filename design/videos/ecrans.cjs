// Captures mobiles (390 × 844, ×2) des écrans de Navigoal pour les vidéos de présentation.
const { chromium } = require("playwright");
const BASE = "http://localhost:3000", OUT = process.argv[2];
const PUBLICS = [
  ["accueil", "/"], ["orientation", "/orientation/"], ["metiers", "/metiers/"], ["metier", "/metiers/developpeur-web-mobile/"],
  ["ecoles", "/etablissements/"], ["ecole", "/etablissements/ma-esa-casa/"], ["devis", "/devis/"], ["bourses", "/bourses/"],
  ["navilease", "/navilease/"], ["navitravel", "/navitravel/"],
];
const PRIVES = [["espace", "/espace/"], ["candidature", "/espace/candidatures/20d5a545-15fd-4ff7-b646-b9dd11e4bed3/"], ["profil", "/espace/profil/"]];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, extraHTTPHeaders: { Origin: BASE } });
  await ctx.addInitScript(() => { try { localStorage.setItem("navigoal-cookies-2", "non"); localStorage.setItem("navi-invitation", String(Date.now())); } catch {} });
  await ctx.route(/googletagmanager|google-analytics/, (r) => r.abort());
  const prendre = async (nom, url) => {
    const p = await ctx.newPage();
    await p.goto(BASE + url, { waitUntil: "networkidle" }).catch(() => {});
    await p.waitForTimeout(900);
    await p.addStyleTag({ content: "[data-navi-bulle],.navi-bulle{display:none!important}" });
    await p.screenshot({ path: `${OUT}/${nom}.png`, fullPage: true });
    console.log(nom); await p.close();
  };
  for (const [n, u] of PUBLICS) await prendre(n, u);
  const r = await ctx.request.post(`${BASE}/api/auth/connexion`, { data: { identifiant: "amina.demo@demo.navigoal.net", motDePasse: "Navigoal2026" } });
  console.log("connexion", r.status());
  for (const [n, u] of PRIVES) await prendre(n, u);
  await b.close();
})();
