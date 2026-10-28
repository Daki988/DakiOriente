const { chromium } = require('playwright');
// Usage : python3 lignes.py && node render.js — produit NEAM_carrousel_emoji_01..06.png (1080 × 1350)
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 5400, height: 1400 }, deviceScaleFactor: 1 });
  await p.goto('file://' + __dirname + '/slides.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const pano = await p.$('#pano'), box = await pano.boundingBox();
  for (let i = 0; i < 5; i++)
    await p.screenshot({ path: `${__dirname}/NEAM_carrousel_emoji_0${i + 1}.png`, clip: { x: box.x + i * 1080, y: box.y, width: 1080, height: 1350 } });
  await (await p.$('#fin')).screenshot({ path: `${__dirname}/NEAM_carrousel_emoji_06.png` });
  await b.close();
})();
