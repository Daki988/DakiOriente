// Audit « avant publication » de toutes les pages du plan du site (sitemap) : titre et description (présents, uniques,
// longueur), image d'aperçu, balise canonique, un seul titre h1, images sans texte alternatif, liens internes cassés,
// page 404 personnalisée, robots.txt et sitemap. Sans navigateur (HTML du serveur), rapide.
// Usage : BASE=http://localhost:3000 [MAX=0] node scripts/audit-publication.mjs   (MAX : nombre de pages, 0 = toutes)
const BASE = (process.env.BASE || "http://localhost:3000").replace(/\/$/, "");
const MAX = Number(process.env.MAX || 0);
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1";
const get = (u, opts = {}) => fetch(u, { headers: { "user-agent": UA }, redirect: "manual", ...opts });
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i"))?.[1] ?? null;
const decode = (s) => s.replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const problemes = [];
const pb = (page, type, detail = "") => problemes.push({ page, type, detail });

// robots.txt et sitemap
const robots = await get(`${BASE}/robots.txt`);
if (robots.status !== 200 || !/sitemap/i.test(await robots.text())) pb("/robots.txt", "robots.txt absent ou sans Sitemap");
const sm = await get(`${BASE}/sitemap.xml`);
const xml = await sm.text();
let urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
if (!urls.length) pb("/sitemap.xml", "sitemap vide ou absent");
urls = [...new Set(urls)];
if (MAX) urls = urls.slice(0, MAX);

const titres = new Map(), descriptions = new Map(), liens = new Map();
const parLot = async (xs, n, f) => { for (let i = 0; i < xs.length; i += n) await Promise.all(xs.slice(i, i + n).map(f)); };
await parLot(urls, 8, async (p) => {
  const r = await get(BASE + p);
  if (r.status !== 200) { pb(p, `statut ${r.status}`); return; }
  const html = await r.text();
  const titre = decode(html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? "");
  const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
  if (!titre) pb(p, "titre absent"); else { titres.set(titre, [...(titres.get(titre) ?? []), p]); if (titre.length > 70) pb(p, "titre long (> 70 caractères)", `${titre.length} : ${titre}`); }
  if (!desc) pb(p, "description absente"); else { descriptions.set(desc, [...(descriptions.get(desc) ?? []), p]); if (desc.length < 50 || desc.length > 170) pb(p, "description hors 50–170 caractères", `${desc.length}`); }
  if (!/<meta property="og:image"/.test(html)) pb(p, "image d'aperçu (og:image) absente");
  const canon = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  if (!canon) pb(p, "balise canonique absente");
  // Une canonique qui pointe ailleurs (ex. vers l'accueil, héritée du gabarit) fait disparaître la page de Google.
  else if (new URL(canon, BASE).pathname !== p) pb(p, "canonique vers une autre page", canon);
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) pb(p, `${h1} titre(s) h1`);
  for (const img of html.match(/<img\b[^>]*>/g) ?? []) if (attr(img, "alt") === null) pb(p, "image sans attribut alt", attr(img, "src") ?? "");
  for (const a of html.match(/<a\b[^>]*href="\/[^"]*"/g) ?? []) {
    const h = attr(a, "href").split("#")[0];
    if (h && !h.startsWith("//") && !/^\/(api|_next)\//.test(h)) liens.set(h, [...(liens.get(h) ?? []), p]);
  }
});
for (const [t, ps] of titres) if (ps.length > 1) pb(ps[0], `titre identique sur ${ps.length} pages`, `${t} — ${ps.slice(0, 4).join(", ")}`);
for (const [d, ps] of descriptions) if (ps.length > 1) pb(ps[0], `description identique sur ${ps.length} pages`, ps.slice(0, 4).join(", "));

// Liens internes : chaque cible distincte est demandée une fois (redirections suivies jusqu'à 3 fois).
const cibles = [...liens.keys()];
await parLot(cibles, 8, async (h) => {
  let u = BASE + h, st = 0;
  for (let i = 0; i < 4; i++) { const r = await get(u); st = r.status; if (st >= 300 && st < 400 && r.headers.get("location")) u = new URL(r.headers.get("location"), u).href; else break; }
  // Pages réservées aux comptes : la redirection vers la connexion est normale.
  if (st >= 400 && !(st === 401 || st === 403)) pb(liens.get(h)[0], `lien cassé (${st})`, `${h} (sur ${liens.get(h).length} page(s))`);
});

// Page 404 personnalisée
const nf = await get(`${BASE}/page-inexistante-${Date.now()}/`);
const nfHtml = await nf.text();
if (nf.status !== 404) pb("/404", `statut ${nf.status} au lieu de 404`);
if (!/introuvable|n'existe pas|perdu/i.test(nfHtml)) pb("/404", "page 404 non personnalisée");
if (!/<title>[^<]*(introuvable|404)/i.test(nfHtml)) pb("/404", "titre de la page 404 générique");

const parType = {};
for (const x of problemes) parType[x.type.replace(/\(\d+\)|\d+ titre\(s\)/, (m) => m)] = (parType[x.type] ?? 0) + 1;
console.log(`${urls.length} pages, ${cibles.length} liens internes distincts vérifiés, ${problemes.length} problème(s)`);
for (const [t, n] of Object.entries(parType).sort((a, b) => b[1] - a[1])) console.log(`  ${n} × ${t}`);
for (const x of problemes.slice(0, Number(process.env.DETAIL || 40))) console.log(`  - ${x.page} : ${x.type}${x.detail ? ` — ${x.detail}` : ""}`);
if (process.env.OUT) { const fs = await import("node:fs"); fs.writeFileSync(process.env.OUT, JSON.stringify(problemes, null, 1)); }
if (problemes.length) process.exitCode = 1;
