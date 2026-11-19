// Signale les pages du plan du site aux moteurs IndexNow (Bing, et à travers lui la recherche de ChatGPT ; Yandex,
// Naver, Seznam…) : ils viennent les explorer tout de suite au lieu d'attendre leur passage. Lancé à la fin de
// chaque mise en ligne (.github/workflows/deploiement.yml). La clé est publique par nature (fichier à la racine du site).
// Usage : SITE=https://navigoal.net node scripts/indexnow.mjs
const SITE = (process.env.SITE || "https://navigoal.net").replace(/\/$/, "");
export const CLE = "d31cad4618851b434427d5a52ff019a8";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const xml = await (await fetch(`${SITE}/sitemap.xml`, { headers: { "user-agent": UA } })).text();
const urls = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()))].slice(0, 10000);
if (!urls.length) { console.error("Plan du site vide ou illisible : rien à signaler."); process.exit(1); }
const r = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: CLE, keyLocation: `${SITE}/${CLE}.txt`, urlList: urls }),
});
console.log(`IndexNow : ${urls.length} pages signalées → réponse ${r.status} ${r.status === 200 || r.status === 202 ? "(acceptée)" : await r.text().catch(() => "")}`);
if (r.status >= 400) process.exitCode = 1;
