const { chromium } = require('playwright');
// node ecran.js (capture du site) puis node render.js : PDF A4 (6 cartes) + aperçu PNG détouré
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1200, height: 1100 }, deviceScaleFactor: 6 });
  await p.goto('file://' + __dirname + '/carte.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await (await p.$('#apercu')).screenshot({ path: __dirname + '/NEAM_carte-telephone_apercu.png', omitBackground: true });
  await p.evaluate(() => { document.getElementById('apercu').remove(); });
  await p.pdf({ path: __dirname + '/NEAM_carte-telephone_A4.pdf', width: '297mm', height: '210mm', printBackground: true, preferCSSPageSize: true, pageRanges: '1' });
  await b.close();
})();
