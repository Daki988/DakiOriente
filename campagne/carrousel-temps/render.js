// Exporte chaque slide du carrousel en PNG 1080 × 1350
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto('file://' + __dirname + '/slides.html');
  await p.waitForFunction(() => window.READY === true);
  const slides = await p.$$('.slide');
  for (let i = 0; i < slides.length; i++) {
    await slides[i].screenshot({ path: `${__dirname}/NEAM_carrousel_temps_${String(i + 1).padStart(2, '0')}.png` });
  }
  await b.close();
  console.log(slides.length, 'slides exportées');
})();
