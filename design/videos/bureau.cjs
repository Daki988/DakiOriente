const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: "fr-FR" });
  await ctx.addInitScript(() => { try { localStorage.setItem("navigoal-cookies-2", "non"); localStorage.setItem("navi-invitation", String(Date.now())); } catch {} });
  await ctx.route(/googletagmanager|google-analytics/, (r) => r.abort());
  const p = await ctx.newPage();
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle" }); await p.waitForTimeout(1200);
  for (let y = 0; y < 5000; y += 500) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(100); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600);
  await p.screenshot({ path: process.argv[2], fullPage: true });
  await b.close();
})();
