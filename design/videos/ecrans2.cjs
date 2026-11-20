const { chromium } = require("playwright");
const BASE = "http://localhost:3000", OUT = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try { localStorage.setItem("navigoal-cookies-2", "non"); localStorage.setItem("navi-invitation", String(Date.now())); } catch {} });
  await ctx.route(/googletagmanager|google-analytics/, (r) => r.abort());
  let p = await ctx.newPage();
  await p.goto(BASE + "/metiers/met-developpeur-web-mobile/", { waitUntil: "networkidle" }); await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/metier.png`, fullPage: true });
  p = await ctx.newPage();
  await p.goto(BASE + "/orientation/", { waitUntil: "networkidle" }); await p.waitForTimeout(600);
  await p.getByRole("button", { name: /Commencer le test/ }).click(); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/test-question.png` });
  // répondre aux questions pour atteindre le résultat
  for (let i = 0; i < 40; i++) {
    const choix = p.locator("main button:not([disabled])").filter({ hasNotText: /Précédent|Retour/ });
    const n = await choix.count(); if (!n) break;
    await choix.nth(i % Math.max(1, Math.min(n, 3))).click().catch(() => {});
    await p.waitForTimeout(350);
    if (await p.getByText(/Ton profil|profil dominant|Tes résultats/i).first().isVisible().catch(() => false)) break;
  }
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/test-resultat.png`, fullPage: true });
  console.log("ok");
  await b.close();
})();
