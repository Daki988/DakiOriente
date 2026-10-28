const { chromium } = require('playwright');
// Capture l'accueil du site (format paysage) pour l'écran du téléphone
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 900, height: 420 }, deviceScaleFactor: 3, reducedMotion: 'reduce' });
  await p.goto('file:///home/user/DakiOriente/index.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => { document.querySelectorAll('[class*=reveal],[data-reveal]').forEach(e => e.classList.add('is-in')); document.documentElement.classList.add('is-loaded'); document.querySelectorAll('.preloader,#preloader').forEach(e => e.remove()); });
  await p.waitForTimeout(800);
  await p.screenshot({ path: __dirname + '/ecran-site.png' });
  await b.close();
})();
