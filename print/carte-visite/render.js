const { chromium } = require('playwright');
// Usage : node render.js — produit le PDF d'impression (fond perdu 3 mm) et les aperçus PNG 600 dpi au format fini
const path = require('path');
const DIR = __dirname, MM = 96 / 25.4;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 600, height: 600 }, deviceScaleFactor: 600 / 96 });
  await p.goto('file://' + path.join(DIR, 'carte-visite.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  console.log('polices :', await p.evaluate(() => [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight))].join(', ')));
  // Contrôle : rien d'important hors de la zone sûre (4 mm du trait de coupe = 7 mm du bord)
  const hors = await p.evaluate(mm => [...document.querySelectorAll('.face')].flatMap((f, i) => {
    const r = f.getBoundingClientRect(), s = 7 * mm;
    return [...f.querySelectorAll('img, p, li, .pied, .qr')].filter(el => {
      const e = el.getBoundingClientRect();
      return e.left < r.left + s - 1 || e.top < r.top + s - 1 || e.right > r.right - s + 1 || e.bottom > r.bottom - s + 1;
    }).map(el => `face ${i + 1} : ${el.className || el.tagName}`);
  }), MM);
  console.log(hors.length ? 'HORS ZONE SÛRE : ' + hors.join(' | ') : 'zone sûre respectée');
  const faces = await p.$$('.face');
  for (const [i, nom] of ['recto', 'verso'].entries()) {
    const bb = await faces[i].boundingBox();
    await p.screenshot({ path: path.join(DIR, `carte-${nom}.png`), clip: { x: bb.x + 3 * MM, y: bb.y + 3 * MM, width: 85 * MM, height: 55 * MM } });
  }
  await p.emulateMedia({ media: 'print' });
  await p.pdf({ path: path.join(DIR, 'NEAM_Carte-visite_Daril-OYE-MBA.pdf'), width: '91mm', height: '61mm', printBackground: true, preferCSSPageSize: true });
  await b.close();
})();
