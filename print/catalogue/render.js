const { chromium } = require('playwright');
// Usage : node render.js <dossier des aperçus PNG> <fichier PDF> (Playwright requis)
const OUT = process.argv[2], PDF = process.argv[3];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1000, height: 1300 }, deviceScaleFactor: 1.5 });
  await p.goto('file:///home/user/DakiOriente/print/catalogue/catalogue.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const fonts = await p.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight + ' ' + f.style).join(', '));
  // Contenu qui dépasse de sa page (hors éléments décoratifs)
  const issues = await p.evaluate(() => [...document.querySelectorAll('.page')].map((pg, i) => {
    const r = pg.getBoundingClientRect(); const bad = [];
    pg.querySelectorAll('*').forEach(el => {
      if (el.closest('.chev') || el.closest('.founder__photo') || el.closest('svg')) return;
      const e = el.getBoundingClientRect(); if (!e.width || !e.height) return;
      if (e.bottom > r.bottom - 12 || e.right > r.right + 1) bad.push(`${el.tagName.toLowerCase()}.${el.className} b=${Math.round(e.bottom - r.top)}/${Math.round(r.height)}`);
      if (el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow === 'hidden' && !el.matches('.page, .founder__photo, .prod__shot, .case__img, .sa__img, .gauge__bar, .off__bar')) bad.push('CLIP ' + el.className);
    });
    return bad.length ? `p${i + 1}: ` + [...new Set(bad)].slice(0, 6).join(' | ') : null;
  }).filter(Boolean));
  console.log('fonts:', fonts.slice(0, 300));
  console.log(issues.join('\n') || 'aucun débordement');
  const pages = await p.$$('.page');
  for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: `${OUT}/p${String(i + 1).padStart(2, '0')}.png` });
  await p.emulateMedia({ media: 'print' });
  await p.pdf({ path: PDF, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close();
})();
