// Génère les pages HTML (site, logo, fiche, réseaux, posts) pour chaque prospect.
// Usage : PHOTOS_DIR=/chemin/photos node gen.js <dossier_sortie> [slug…]
const fs = require('fs');
const path = require('path');
const { brandOf, content } = require('./lib');
const sites = require('./sites');
const views = require('./views');

const out = process.argv[2];
const only = process.argv.slice(3);
const prospects = require('../data/prospects.json');
const counter = {};
const index = [];
for (const p of prospects) {
  counter[p.k] = (counter[p.k] || 0);
  const b = brandOf(p, 0, counter[p.k]++);
  const c = content(p, b);
  index.push({ slug: b.slug, n: p.n, s: p.s, c: p.c, k: p.k, sc: p.sc, a: p.a, domain: b.domain, handle: b.handle, realLogo: !!require('./lib').realLogo(b.slug) });
  if (only.length && !only.includes(b.slug)) continue;
  const dir = path.join(out, b.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'site.html'), sites[p.k](p, b, c));
  fs.writeFileSync(path.join(dir, 'logo.html'), views.logo(p, b));
  fs.writeFileSync(path.join(dir, 'fiche.html'), views.fiche(p, b, c));
  fs.writeFileSync(path.join(dir, 'reseaux.html'), views.reseaux(p, b, c));
  fs.writeFileSync(path.join(dir, 'posts.html'), views.posts(p, b, c));
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index, null, 1));
console.log('ok', only.length || prospects.length);
