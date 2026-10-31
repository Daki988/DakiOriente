// Capture les pages générées en images. Usage : node render.js <dossier_html> <dossier_images> [slug…]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [src, dst, ...only] = process.argv.slice(2);
// Ajustements faits après chargement des polices : noms de logos et grands titres.
const FIT = () => {
  document.querySelectorAll('text[data-max]').forEach((t) => { const m = +t.dataset.max; t.removeAttribute('textLength'); if (t.getComputedTextLength() > m) { t.setAttribute('textLength', m); t.setAttribute('lengthAdjust', 'spacingAndGlyphs'); } });
  document.querySelectorAll('h1').forEach((h) => { const lh = () => parseFloat(getComputedStyle(h).lineHeight) || parseFloat(getComputedStyle(h).fontSize); let fs = parseFloat(getComputedStyle(h).fontSize); let n = 0; while (n++ < 40 && (h.scrollWidth > h.clientWidth + 2 || h.getBoundingClientRect().height / lh() > 3.2)) { fs *= 0.94; h.style.fontSize = fs + 'px'; } });
};
const VIEWS = [
  ['site', 1440, { fullPage: true, type: 'jpeg', quality: 72 }],
  ['logo', 1600, { type: 'png' }],
  ['fiche', 1440, { fullPage: true, type: 'png' }],
  ['reseaux', 1440, { fullPage: true, type: 'jpeg', quality: 80 }],
  ['posts', 2040, { fullPage: true, type: 'jpeg', quality: 82 }],
];
(async () => {
  const browser = await chromium.launch();
  const slugs = fs.readdirSync(src).filter((d) => fs.statSync(path.join(src, d)).isDirectory() && (!only.length || only.includes(d)));
  let n = 0;
  const worker = async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    while (slugs.length) {
      const slug = slugs.shift();
      fs.mkdirSync(path.join(dst, slug), { recursive: true });
      for (const [v, w, opt] of VIEWS) {
        await page.setViewportSize({ width: w, height: v === 'logo' ? 900 : 500 });
        await page.goto('file://' + path.resolve(src, slug, v + '.html'), { waitUntil: 'networkidle', timeout: 60000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
        await page.evaluate(FIT);
        await page.waitForFunction(() => document.documentElement.dataset.logofit, null, { timeout: 8000 }).catch(() => {});
        if (v === 'site') await page.waitForFunction(() => document.body.dataset.fit, null, { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(150);
        const ext = opt.type === 'png' ? 'png' : 'jpg';
        await page.screenshot({ path: path.join(dst, slug, `${v}.${ext}`), ...opt });
      }
      // Logo seul en PNG transparent (pour réutilisation)
      await page.setViewportSize({ width: 1600, height: 900 });
      await page.goto('file://' + path.resolve(src, slug, 'logo.html'), { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      await page.evaluate(FIT);
      await page.waitForFunction(() => document.documentElement.dataset.logofit, null, { timeout: 8000 }).catch(() => {});
      await (await page.$('#lg')).screenshot({ path: path.join(dst, slug, 'logo-seul.png'), omitBackground: true });
      console.log(++n, slug);
    }
    await page.close();
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  await browser.close();
})();
