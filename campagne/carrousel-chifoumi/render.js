const { chromium } = require('playwright');
// python3 slides.py && node render.js : NEAM_carrousel_chifoumi_01..06.png
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto('file://' + __dirname + '/slides.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const s = await p.$$('.slide');
  for (let i = 0; i < s.length; i++) await s[i].screenshot({ path: `${__dirname}/NEAM_carrousel_chifoumi_0${i + 1}.png` });
  await b.close();
})();
