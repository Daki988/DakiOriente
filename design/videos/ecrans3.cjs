// Recapture du devis (origine Gabon, F CFA), après défilement complet pour déclencher les blocs révélés au scroll.
const { chromium } = require("playwright");
const BASE = "http://localhost:3000", OUT = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "fr-FR", timezoneId: "Africa/Libreville" });
  await ctx.addInitScript(() => { try { localStorage.setItem("navigoal-cookies-2", "non"); localStorage.setItem("navi-invitation", String(Date.now())); localStorage.setItem("navigoal-pays", "GA"); } catch {} });
  await ctx.route(/googletagmanager|google-analytics/, (r) => r.abort());
  const p = await ctx.newPage();
  await p.goto(BASE + "/devis/?o=GA", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  for (let y = 0; y < 9000; y += 400) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(120); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/devis.png`, fullPage: true });
  console.log(await p.evaluate(() => document.body.innerText.match(/Montants en [^\n]{0,60}/)?.[0]));
  await b.close();
})();
