// Export PNG / JPG du visuel « Zoomez… » (publication 1080 × 1350 et story 1080 × 1920)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [file, h, out] of [['zoom.html', 1350, 'NEAM_Zoomez_publication'], ['zoom-story.html', 1920, 'NEAM_Zoomez_story']]) {
    for (const scale of [1, 2]) {
      const p = await b.newPage({ viewport: { width: 1080, height: h }, deviceScaleFactor: scale });
      await p.goto('file://' + __dirname + '/' + file);
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(300);
      const suffix = scale === 2 ? '_HD' : '';
      await p.screenshot({ path: `${__dirname}/${out}${suffix}.png` });
      await p.close();
    }
  }
  await b.close();
  console.log('exporté');
})();
