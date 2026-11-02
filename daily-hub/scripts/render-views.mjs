// Rend les 33 vues de référence en JPEG (renders/NN_id.jpg) + une planche.
// Usage : npm run render:views [-- --w 1600 --h 1000 --only 7,16]
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
import { VIEWS } from '../src/model/views.js';

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const W = +arg('w', 1600), H = +arg('h', 1000);
const only = arg('only', '').split(',').filter(Boolean).map(Number);
const OUT = new URL('../renders/', import.meta.url).pathname;
const PORT = 5179;

await mkdir(OUT, { recursive: true });
const up = () => fetch(`http://localhost:${PORT}/preview.html`).then((r) => r.ok, () => false);
const server = (await up()) ? null : spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 60 && !(await up()); i++) await new Promise((r) => setTimeout(r, 500));

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(`http://localhost:${PORT}/preview.html?w=${W}&h=${H}&view=1`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 180000 });
  for (const v of VIEWS.filter((x) => !only.length || only.includes(x.n))) {
    const t = Date.now();
    await page.evaluate((n) => window.renderView(n), v.n);
    const url = await page.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', 0.9));
    const file = `${OUT}${String(v.n).padStart(2, '0')}_${v.id}.jpg`;
    await writeFile(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log(`${v.n}\t${v.title}\t${Date.now() - t} ms`);
  }
} finally {
  await browser.close();
  server?.kill();
}
