const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
// Usage : node render.js <page.html> <sortie.mp4> <durée en s> [audio]
// Chaque page anime tout en CSS ; on fige les animations et on avance le temps image par image (30 i/s, 1080 × 1920).
const [page, out, dur, audio] = process.argv.slice(2);
const FPS = 30, N = Math.round(parseFloat(dur) * FPS);
(async () => {
  const tmp = fs.mkdtempSync('/tmp/claude-0/-home-user-DakiOriente/e66c4dd8-e9b6-5ddb-b357-f3de3e171d7a/scratchpad/frames-');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(page), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  for (let i = 0; i < N; i++) {
    const t = i / FPS;
    await p.evaluate(t => {
      document.getAnimations().forEach(a => { a.pause(); a.currentTime = t * 1000; });
      if (window.seek) window.seek(t);
    }, t);
    await p.screenshot({ path: `${tmp}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  await b.close();
  const args = ['-v', 'error', '-y', '-framerate', String(FPS), '-i', `${tmp}/f%05d.jpg`];
  if (audio) args.push('-i', audio, '-shortest', '-c:a', 'aac', '-b:a', '160k');
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out);
  execFileSync('ffmpeg', args);
  fs.rmSync(tmp, { recursive: true });
  console.log('ok', out, N, 'images');
})();
