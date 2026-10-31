// Génère la version en ligne du moteur : sites animés, pages réseaux et données de recherche.
// Usage : PHOTOS_DIR=../../../neam-moteur/assets/photos node gen-live.js
const fs = require('fs');
const path = require('path');
const APP = path.resolve(__dirname, '../../../neam-moteur');
process.env.PHOTOS_DIR = process.env.PHOTOS_DIR || path.join(APP, 'assets/photos');
process.env.PHOTO_URL = '../../assets/photos/';
process.env.LOGO_URL = '../../assets/logos/';
const lib = require('./lib');
const sites = require('./sites');
const views = require('./views');
const prospects = require('../data/prospects.json');

const SIGNATURES = ['chouchou-lazare', 'artemis-luxury-co', 'skin-technology-by-latania', 'hotel-le-refuge', 'akae-beach', 'bella-mamma'];

// Animations ajoutées aux sites générés : apparition au défilement, zoom lent du haut de page, bouton retour.
const LIVE = `<style>
.rv{opacity:0;transform:translateY(46px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
.rv.in{opacity:1;transform:none}
header .ph{animation:fi 1.6s ease-out both}
@keyframes fi{from{opacity:0;filter:blur(8px)}to{opacity:1;filter:none}}
header h1{animation:up 1.1s .15s cubic-bezier(.2,.7,.2,1) both}
@keyframes up{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
section .ph{transition:transform .8s cubic-bezier(.2,.7,.2,1)}
section .ph:hover{transform:scale(1.03)}
.btn{transition:transform .25s,box-shadow .25s;cursor:pointer}.btn:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(0,0,0,.25)}
.neam-back{position:fixed;left:18px;bottom:18px;z-index:100;background:#111;color:#fff;font:600 14px Arial;padding:12px 16px;border-radius:999px;text-decoration:none;box-shadow:0 8px 24px rgba(0,0,0,.3)}
.neam-back b{color:#f5b301}
</style>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>Neam</b> · retour aux résultats</a>
<script>
document.querySelectorAll('body>section, body>footer, section>div>div, section>div').forEach(e=>e.classList.add('rv'));
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.rv').forEach(e=>io.observe(e));
const fitH=()=>document.querySelectorAll('h1').forEach(h=>{const lh=()=>parseFloat(getComputedStyle(h).lineHeight)||parseFloat(getComputedStyle(h).fontSize);let fs=parseFloat(getComputedStyle(h).fontSize),n=0;while(n++<40&&(h.scrollWidth>h.clientWidth+2||h.getBoundingClientRect().height/lh()>3.2)){fs*=.94;h.style.fontSize=fs+'px'}});
const fitL=()=>document.querySelectorAll('text[data-max]').forEach(t=>{const m=+t.dataset.max;t.removeAttribute('textLength');if(t.getComputedTextLength()>m){t.setAttribute('textLength',m);t.setAttribute('lengthAdjust','spacingAndGlyphs')}});
document.fonts.ready.then(()=>{fitH();fitL()});window.addEventListener('load',()=>{fitH();fitL()});
</script>`;

const meta = '<meta name="viewport" content="width=1440"><meta name="robots" content="noindex,nofollow">';
const engine = [];
const counter = {};
for (const p of prospects) {
  counter[p.k] = counter[p.k] || 0;
  const b = lib.brandOf(p, 0, counter[p.k]++);
  const c = lib.content(p, b);
  const sig = SIGNATURES.includes(b.slug);
  // Site généré (les sites signature sont écrits à la main dans neam-moteur/sites/<slug>/)
  const sdir = path.join(APP, 'sites', b.slug);
  fs.mkdirSync(sdir, { recursive: true });
  const siteHtml = sites[p.k](p, b, c).replace('<head>', '<head>' + meta + `<title>${lib.esc(p.n)} — ${lib.esc(c.tagline)}</title>`).replace(/<\/body>/, LIVE + '</body>');
  fs.writeFileSync(path.join(sdir, sig ? 'classique.html' : 'index.html'), siteHtml);
  // Profils réseaux
  const rdir = path.join(APP, 'reseaux', b.slug);
  fs.mkdirSync(rdir, { recursive: true });
  fs.writeFileSync(path.join(rdir, 'index.html'), views.reseaux(p, b, c).replace('<head>', '<head>' + meta + `<title>${lib.esc(p.n)} — réseaux sociaux</title>`).replace('</body>', LIVE.split('<script>')[0].replace(/\.rv[^]*?\.neam-back\{/, '.neam-back{') + '</body>'));
  // Données pour le moteur
  const st = lib.stats(p, b);
  engine.push({
    slug: b.slug, n: p.n, main: b.main, s: p.s, k: p.k, c: p.c, t: p.t, e: c.email, d: p.d || null, r: p.r || null, v: p.v || 0,
    so: p.so, sc: p.sc, a: p.a, domain: b.domain, handle: b.handle, tagline: c.tagline, intro: c.intro, cta: c.cta,
    hours: c.hours, address: c.address, pal: b.pal, font: b.font, sig,
    photos: b.photos.slice(0, 5).map((u) => u.replace('../../', '')),
    avatar: lib.avatarSVG(p, b).replace(/\.\.\/\.\.\//g, ''),
    items: c.items.slice(0, 3).map((it) => lib.itemTitle(it)),
    ig: st.ig, fb: st.fb,
  });
}
fs.mkdirSync(path.join(APP, 'data'), { recursive: true });
fs.writeFileSync(path.join(APP, 'data', 'prospects.js'), 'window.PROSPECTS = ' + JSON.stringify(engine) + ';\n');
console.log('ok', engine.length, 'signatures:', engine.filter((x) => x.sig).length);
