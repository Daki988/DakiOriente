// Usage : node agent/render.mjs <fichier.html> <dossier_sortie>
// Rend chaque <div class="p" id="..."> en JPEG 1440x1800 (format Instagram 4:5).
import { createRequire } from 'module'; import path from 'path'; import fs from 'fs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const [,, file, out='out'] = process.argv; fs.mkdirSync(out, { recursive: true });
const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1440/1080 });
await p.goto('file://' + path.resolve(file), { waitUntil: 'networkidle' }); await p.evaluate(() => window.ready);
for (const id of await p.$$eval('.p[id]', els => els.map(e => e.id))) {
  await p.locator('#' + id).screenshot({ path: `${out}/${id}.jpg`, type: 'jpeg', quality: 90 }); console.log(`${out}/${id}.jpg`);
}
await b.close();
