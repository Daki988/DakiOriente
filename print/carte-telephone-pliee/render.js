const { chromium } = require('playwright');
// node render.js : PDF A4 recto verso (2 cartes par feuille) + aperçus PNG (fermée, dos, ouverte)
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 5 });
  await p.goto('file://' + __dirname + '/carte.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  for (const id of ['ferme', 'dos', 'ouvert'])
    await (await p.$('#ap-' + id)).screenshot({ path: `${__dirname}/apercu-${id}.png`, omitBackground: true });
  await p.evaluate(() => document.getElementById('apercus').remove());
  await p.pdf({ path: __dirname + '/NEAM_carte-smartphone_A4_recto-verso.pdf', width: '210mm', height: '297mm', printBackground: true, preferCSSPageSize: true, pageRanges: '1-2' });
  await b.close();
})();
