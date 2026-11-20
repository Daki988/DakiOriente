// Rend une page d'animation (window.render(t), window.DUREE) en vidéo : images JPEG envoyées à ffmpeg.
// Usage : node rendu.cjs page.html sortie.mp4 [fps] [largeur] [hauteur] [aperçu: temps séparés par des virgules]
const { chromium } = require("playwright");
const { spawn } = require("child_process");
(async () => {
  const [page, sortie, fpsS = "30", wS = "1920", hS = "1080", apercu] = process.argv.slice(2);
  const fps = +fpsS, W = +wS, H = +hS;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto("file://" + page);
  await p.waitForFunction(() => document.fonts.ready.then(() => true));
  await p.evaluate(() => Promise.all([...document.images].map((i) => i.complete ? 1 : new Promise((r) => { i.onload = i.onerror = r; }))));
  const duree = await p.evaluate(() => window.DUREE);
  if (apercu) {
    for (const t of apercu.split(",").map(Number)) { await p.evaluate((t) => window.render(t), t); await p.screenshot({ path: `${sortie}-${t}.jpg`, type: "jpeg", quality: 80 }); }
    await b.close(); return;
  }
  const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(fps), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", sortie], { stdio: ["pipe", "inherit", "inherit"] });
  const n = Math.round(duree * fps);
  for (let i = 0; i < n; i++) {
    await p.evaluate((t) => window.render(t), i / fps);
    const img = await p.screenshot({ type: "jpeg", quality: 92 });
    if (!ff.stdin.write(img)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 300 === 0) console.log(`${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await b.close();
  console.log("durée", duree.toFixed(1), "s");
})();
