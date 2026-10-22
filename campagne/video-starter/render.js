// Rendu image par image de index.html (30 i/s, 1080 × 1920), puis montage avec ffmpeg.
// Usage : node render.js <dossier temporaire des images>
const { chromium } = require('playwright');
const fs = require('fs');
const FPS = 30;
(async () => {
  const dir = process.argv[2];
  fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + __dirname + '/index.html');
  await p.waitForFunction(() => window.READY === true);
  const dur = await p.evaluate(() => window.DUR);
  const total = Math.round(dur * FPS);
  for (let f = 0; f < total; f++) {
    await p.evaluate(t => renderAt(t), f / FPS);
    await p.screenshot({ path: `${dir}/f${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
    if (f % 150 === 0) console.log(`${f}/${total}`);
  }
  await b.close();
  console.log('images', total);
})();
