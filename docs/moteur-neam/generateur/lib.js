// Outils communs : identité de marque, logos, icônes, contenus par secteur.
const fs = require('fs');
const path = require('path');

const PHOTOS_DIR = process.env.PHOTOS_DIR;
const REAL_LOGOS_DIR = path.join(__dirname, '..', 'logos-reels');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'et').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h); };

// ---------- Photos ----------
const allPhotos = fs.readdirSync(PHOTOS_DIR).filter((f) => f.endsWith('.jpg'));
const byId = (id) => { const f = allPhotos.find((x) => x.includes(id)); return f ? 'file://' + path.join(PHOTOS_DIR, f) : null; };
const sectorPhotos = (k) => allPhotos.filter((f) => f.startsWith(k + '-')).map((f) => 'file://' + path.join(PHOTOS_DIR, f));

// Photos préférées selon le sous-type (sinon celles du secteur)
const SUBTYPE_PHOTOS = [
  [/plage|beach/i, ['1507525428034', '1519046904884', '1559339352', '1504674900247', '1540189549336', '1414235077428']],
  [/boulangerie|caf[ée]/i, ['1509440159596', '1495474472287', '1555396273', '1517248135467', '1540189549336', '1414235077428']],
  [/italien|mamma/i, ['1565299624946', '1414235077428', '1551218808', '1517248135467', '1504674900247', '1555396273']],
  [/burger/i, ['1568901346375', '1555396273', '1504674900247', '1517248135467', '1540189549336', '1551218808']],
  [/musique|music/i, ['1511379938547', '1507838153414', '1503676260728', '1524178232363']],
  [/h[ôo]teli[èe]re/i, ['1556910103', '1414235077428', '1551218808', '1524178232363', '1555396273']],
  [/dentaire|dentiste|sourire/i, ['1629909613654', '1606811971618', '1588776814546', '1519494026892', '1576091160399']],
  [/radiolog|diagnostic/i, ['1530497610245', '1588776814546', '1519494026892', '1581595219315', '1576091160399']],
  [/laborat|biolab/i, ['1581595219315', '1579684385127', '1519494026892', '1576091160399']],
  [/auto-[ée]cole|driving|vtc/i, ['1449965408869', '1503376780353', '1494976388531', '1492144534655']],
  [/pi[èe]ces|garage/i, ['1486262715619', '1619642751034', '1492144534655', '1494976388531', '1503376780353']],
  [/location de voitures/i, ['1494976388531', '1503376780353', '1492144534655', '1449965408869']],
  [/p[êe]che|fishing/i, ['1544551763', '1507525428034', '1500530855697', '1519046904884']],
  [/[ée]cotourisme|aventure/i, ['1516026672322', '1547471080', '1500530855697', '1469854523086', '1544551763']],
  [/onglerie|nail/i, ['1604654894610', '1519014816548', '1570172619644', '1560066984']],
  [/spa/i, ['1544161515', '1570172619644', '1512290923902', '1560066984']],
  [/coiffure|sheba/i, ['1522337360788', '1560066984', '1570172619644', '1596462502278']],
  [/bijou/i, ['1605100804763', '1515562141207', '1490481651871']],
  [/styliste/i, ['1490481651871', '1445205170230', '1515562141207']],
  [/parfum|cosm/i, ['1596462502278', '1512290923902', '1515562141207', '1605100804763']],
  [/fleur/i, ['1487070183336', '1490750967868', '1513885535751']],
  [/jouet/i, ['1558060370', '1513885535751', '1452860606245']],
  [/cadeau|d[ée]co/i, ['1513885535751', '1513519245088', '1490750967868']],
  [/artisanat/i, ['1452860606245', '1513519245088', '1513885535751']],
  [/m[ée]decine du travail/i, ['1576091160399', '1521791136064', '1497366216548', '1556761175']],
];
function photosFor(p, idx) {
  const key = p.s + ' ' + p.n;
  let list = null;
  for (const [re, ids] of SUBTYPE_PHOTOS) if (re.test(key)) { list = ids.map(byId).filter(Boolean); break; }
  if (!list || !list.length) list = sectorPhotos(p.k);
  if (!list.length) list = sectorPhotos('services');
  const off = idx % list.length;
  const rot = list.slice(off).concat(list.slice(0, off));
  // compléter avec des photos du secteur pour avoir toujours 6 visuels
  const extra = sectorPhotos(p.k).filter((x) => !rot.includes(x));
  return rot.concat(extra, rot, rot).slice(0, 8);
}

// ---------- Palettes et typographies par secteur ----------
const P = (bg, ink, accent, accent2, soft) => ({ bg, ink, accent, accent2, soft });
const PALETTES = {
  hotel: [P('#0f1d17', '#f4efe6', '#c9a45c', '#2f5d4a', '#e9e2d3'), P('#f7f3ec', '#1d1a16', '#9b6b3d', '#24383f', '#ece4d6'), P('#0b1530', '#f2f4fa', '#d4af6a', '#3a5a9b', '#dfe6f3'), P('#fbf8f4', '#2a1f1a', '#b5523b', '#e7b65a', '#f1e6dc'), P('#13110f', '#efe9df', '#e3b66f', '#7d5a3c', '#2a2520'), P('#eef3f1', '#10302a', '#0f766e', '#d9a441', '#dceae5')],
  resto: [P('#0e0d0c', '#f6efe4', '#e8a33d', '#b23a2b', '#1c1a18'), P('#fff7ec', '#2b1d12', '#c2572b', '#2f6b4f', '#f6e7d2'), P('#05232e', '#f2fbfc', '#ffcf5a', '#12a3b8', '#e6f6f8'), P('#1a0f0a', '#fdf2e6', '#f05a28', '#ffd23f', '#2a1a12'), P('#f4efe6', '#1f2a24', '#6d8b5c', '#c7623c', '#e6ddcd'), P('#120a1f', '#f6f0ff', '#ff4fa3', '#ffd166', '#21143a')],
  beaute: [P('#f7efe9', '#3b2a26', '#b07a62', '#7c8b74', '#efe1d8'), P('#f2f5ef', '#22301f', '#6f8b5e', '#d9a790', '#e3eadc'), P('#f6f1fa', '#2d2338', '#8e6bb3', '#e7a9b8', '#e9def4'), P('#0e0c0b', '#f6eee6', '#d7b17a', '#9a6b5b', '#1d1916'), P('#fff4f1', '#40221e', '#e0766a', '#f2c14e', '#fbe2dc'), P('#edf4f4', '#1d3335', '#3e8a8c', '#d9a07a', '#d8e9e9')],
  immo: [P('#0d1b2a', '#f1f4f8', '#c8a24b', '#3b6ea5', '#e3e9f1'), P('#ffffff', '#14213d', '#2a6f4f', '#e09f3e', '#eef4f0'), P('#f6f1ea', '#2b2118', '#b5651d', '#355c4b', '#ebe2d4'), P('#ffffff', '#111827', '#2563eb', '#f59e0b', '#eef2ff'), P('#101418', '#eef1f4', '#4fd1c5', '#a3e635', '#1b232b'), P('#fbfaf7', '#1e2a2f', '#7a1f3d', '#c8a24b', '#f0e9ea')],
  sante: [P('#ffffff', '#0f2a3d', '#0e8fa8', '#22c55e', '#e6f6f9'), P('#f7fbff', '#132a4a', '#2563eb', '#14b8a6', '#e7efff'), P('#ffffff', '#183028', '#16a34a', '#0ea5e9', '#e9f7ef'), P('#fbfaff', '#2a2350', '#6d5bd0', '#22b8cf', '#efeaff')],
  voyage: [P('#0b0f0c', '#f5f1e8', '#f2b134', '#e0623a', '#1a211c'), P('#fdf7ee', '#1c2a33', '#e2652f', '#1f7a8c', '#f4e6d4'), P('#06263a', '#eef8fb', '#ffd166', '#06d6a0', '#0b3550'), P('#f3f6f1', '#1b2e1f', '#2f7d4a', '#e6a23c', '#e1eadb')],
  auto: [P('#0b0b0b', '#f5f5f5', '#ffcc00', '#e10600', '#1a1a1a'), P('#f4f5f7', '#0e1116', '#e11d48', '#0e1116', '#e5e7eb'), P('#0a1220', '#eef2f7', '#22d3ee', '#f97316', '#13213a'), P('#ffffff', '#111111', '#16a34a', '#facc15', '#f1f5f1')],
  ecole: [P('#14112b', '#f5f3ff', '#ff6b6b', '#ffd93d', '#221d45'), P('#fffdf6', '#1d2340', '#3d5af1', '#ff8a3d', '#eef1ff'), P('#0f2a24', '#f1f8f5', '#f4b942', '#4ecdc4', '#173a32'), P('#fff8f2', '#2a1d14', '#c0392b', '#2c3e50', '#f6e9dd')],
  luxe: [P('#0a0a0a', '#f3ede3', '#c8a96a', '#8a7350', '#161513'), P('#f5f0e8', '#141210', '#8c6a3f', '#141210', '#ebe3d6'), P('#1a1020', '#f5eef8', '#d6a4c4', '#c8a96a', '#271a30'), P('#f2efe9', '#0e1a17', '#1f5c4a', '#c8a96a', '#e3ded4'), P('#fdfbf8', '#121212', '#b08d57', '#6b6b6b', '#f1ece4')],
  boutique: [P('#fff6ea', '#2b1a10', '#ff6b35', '#2ec4b6', '#ffe7cc'), P('#f6fff8', '#16302b', '#e84a5f', '#2a9d8f', '#dff5e7'), P('#fffbf0', '#2d2a5a', '#6c5ce7', '#fdcb6e', '#f0edff'), P('#fdf2f6', '#3a1530', '#d63384', '#20c997', '#fbe0ec')],
  services: [P('#0a1628', '#eef3fb', '#3b82f6', '#22d3ee', '#12233d'), P('#ffffff', '#101828', '#7c3aed', '#06b6d4', '#f4f0ff')],
};
const FONTS = {
  hotel: [['Cormorant Garamond', 'Jost'], ['Playfair Display', 'Inter'], ['Italiana', 'Montserrat'], ['Fraunces', 'Work Sans'], ['DM Serif Display', 'DM Sans'], ['Bodoni Moda', 'Manrope']],
  resto: [['Bebas Neue', 'Inter'], ['Fraunces', 'Work Sans'], ['Abril Fatface', 'Lato'], ['Anton', 'Manrope'], ['DM Serif Display', 'DM Sans'], ['Syne', 'Inter']],
  beaute: [['Cormorant Garamond', 'Jost'], ['Italiana', 'Lato'], ['Playfair Display', 'Montserrat'], ['Bodoni Moda', 'Manrope'], ['Marcellus', 'Jost'], ['Fraunces', 'Inter']],
  immo: [['Manrope', 'Manrope'], ['DM Serif Display', 'DM Sans'], ['Fraunces', 'Inter'], ['Space Grotesk', 'Inter'], ['Syne', 'Manrope'], ['Playfair Display', 'Jost']],
  sante: [['Plus Jakarta Sans', 'Plus Jakarta Sans'], ['Outfit', 'Inter'], ['Manrope', 'Manrope'], ['DM Sans', 'DM Sans']],
  voyage: [['Anton', 'Inter'], ['Fraunces', 'Work Sans'], ['Unbounded', 'Manrope'], ['Bebas Neue', 'Jost']],
  auto: [['Archivo Black', 'Archivo'], ['Anton', 'Inter'], ['Russo One', 'Manrope'], ['Bebas Neue', 'Barlow']],
  ecole: [['Unbounded', 'Manrope'], ['Fredoka', 'Nunito'], ['Syne', 'Inter'], ['DM Serif Display', 'DM Sans']],
  luxe: [['Bodoni Moda', 'Jost'], ['Italiana', 'Montserrat'], ['Cormorant Garamond', 'Manrope'], ['Playfair Display', 'Inter'], ['Marcellus', 'Jost']],
  boutique: [['Fredoka', 'Nunito'], ['Syne', 'Inter'], ['Unbounded', 'Manrope'], ['Abril Fatface', 'Lato']],
  services: [['Space Grotesk', 'Inter'], ['Outfit', 'Inter']],
};
const FIT_LOGO = `<script>document.fonts.ready.then(()=>{document.querySelectorAll('text[data-max]').forEach(t=>{const m=+t.dataset.max;if(t.getComputedTextLength()>m){t.setAttribute('textLength',m);t.setAttribute('lengthAdjust','spacingAndGlyphs')}});document.documentElement.dataset.logofit=1})</script>`;
const fontLink = (fonts) => {
  const fam = [...new Set(fonts)].map((f) => 'family=' + f.replace(/ /g, '+') + ':ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500').join('&');
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?${fam}&display=block" rel="stylesheet">${FIT_LOGO}`;
};

// ---------- Nom court, initiales, domaine ----------
const PREFIXES = [/^cabinet dentaire (dr )?/i, /^cabinet m[ée]dical /i, /^cabinet de radiologie /i, /^h[ôo]tel /i, /^institut de beaut[ée] /i, /^[ée]cole de musique /i, /^appart'h[ôo]tel /i, /^bijouterie de /i, /^agence immobili[èe]re de /i];
function brandOf(p, idx, sectorIdx) {
  let main = p.n, kicker = p.s;
  for (const re of PREFIXES) if (re.test(main)) { main = main.replace(re, ''); main = main.charAt(0).toUpperCase() + main.slice(1); break; }
  if (/^agence immobili[èe]re de libreville$/i.test(p.n)) main = 'AIL';
  const words = main.replace(/['’]/g, ' ').split(/[\s-]+/).filter((w) => w && !/^(le|la|les|de|du|des|l|d|et|&|by|chez|co)$/i.test(w));
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase();
  const slug = slugify(p.n);
  const pals = PALETTES[p.k], fts = FONTS[p.k];
  const pal = pals[(sectorIdx + hash(slug)) % pals.length];
  const font = fts[sectorIdx % fts.length];
  const domain = p.dom && !/fattal|beachclub|hotel-orchidee/.test(p.dom) ? p.dom : (p.dom || slug.replace(/-/g, '') + '.ga');
  const handle = slugify(main).replace(/-/g, '').slice(0, 18) + (/libreville|lbv/.test(slug) ? '' : '241');
  return { main, kicker, initials, slug, pal, font, domain, handle, variant: p.vr ?? sectorIdx % 3, logoStyle: (sectorIdx + hash(slug)) % 4, photos: photosFor(p, sectorIdx) };
}

// ---------- Logos réels récupérés ----------
const REAL_LOGOS = {
  'ab-location': 'ab-location.png', afram: 'afram.png', biolab: 'biolab.png', 'gabon-management-services': 'gabon-management-services.png',
  'home-et-co': 'home-co.jpg', 'hotel-hibiscus': 'hotel-hibiscus.png', 'wanted-immobilier': 'wanted-immobilier.jpg', 'yeshua-real-estate': 'yeshua-real-estate.png',
};
const realLogo = (slug) => (REAL_LOGOS[slug] ? 'file://' + path.join(REAL_LOGOS_DIR, REAL_LOGOS[slug]) : null);

// ---------- Icônes (traits 24px) ----------
const ICONS = {
  hotel: 'M3 19v-7a2 2 0 012-2h14a2 2 0 012 2v7M3 15h18M7 10V7.5A1.5 1.5 0 018.5 6h2A1.5 1.5 0 0112 7.5V10',
  resto: 'M7 3v8M4.5 3v5a2.5 2.5 0 005 0V3M7 11v10M17.5 21V3c-2.5 1-3.5 4-3.5 8h3.5',
  beaute: 'M12 21c-5-3-8-7-8-11a8 8 0 018-7 8 8 0 018 7c0 4-3 8-8 11zM12 21V9M12 13l-3-3M12 16l3-3',
  immo: 'M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6',
  sante: 'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z',
  voyage: 'M12 3a9 9 0 100 18 9 9 0 000-18zM15.5 8.5l-2 5-5 2 2-5z',
  auto: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 9a3 3 0 100 6 3 3 0 000-6zM12 3v6M12 15v6M3.5 9.5l5.6 1.6M14.9 12.9l5.6 1.6M5.6 18.4l4.2-4M14.2 9.6l4.2-4',
  ecole: 'M9 18V5l11-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z',
  ecole2: 'M2 8l10-5 10 5-10 5zM6 10v5c3 3 9 3 12 0v-5M22 8v6',
  luxe: 'M6 3h12l4 6-10 12L2 9zM2 9h20M9 3l3 6 3-6M12 21L9 9M12 21l3-12',
  boutique: 'M3 10h18v11H3zM12 10v11M2 7h20v3H2zM12 7C10 3 6 3 6 6s4 1 6 1 6 2 6-1-4-3-6 1',
  services: 'M3 7h18v13H3zM8 7V4h8v3M3 12h18',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11zM12 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
  phone: 'M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A17 17 0 013 5a2 2 0 012-2',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',
  star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
  check: 'M4 12l5 5L20 6',
  cal: 'M4 5h16v15H4zM4 10h16M8 3v4M16 3v4',
  chat: 'M4 5h16v11H9l-5 4z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  wifi: 'M2 9a15 15 0 0120 0M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 19.5h.01',
  pool: 'M2 18c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M7 15V5a2 2 0 014 0M15 15V5a2 2 0 014 0M7 9h8',
  car: 'M3 13l2-5a2 2 0 012-1.3h10A2 2 0 0119 8l2 5v5h-3v-2H6v2H3zM3 13h18M7 16h.01M17 16h.01',
  heart: 'M12 20s-8-4.6-8-10.2A4.8 4.8 0 0112 6a4.8 4.8 0 018 3.8C20 15.4 12 20 12 20z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  users: 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21a7 7 0 0114 0M17 11a3 3 0 100-6M22 21a6 6 0 00-5-6',
  bag: 'M5 8h14l-1 13H6zM9 8V6a3 3 0 016 0v2',
  leaf: 'M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l7-7',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  wrench: 'M14.5 6.5a4 4 0 00-5.4 5L3 17.6 6.4 21l6.1-6.1a4 4 0 005-5.4l-2.6 2.6-2.4-.6-.6-2.4z',
  book: 'M4 4h7a3 3 0 013 3v13a2.5 2.5 0 00-2.5-2.5H4zM20 4h-6M20 4v13.5h-6',
  plane: 'M10.5 13.5L3 11l1.5-1.5 7 1 4-4.5c1-1 3-1.5 3.5-1s0 2.5-1 3.5l-4.5 4 1 7L13 21l-2.5-7.5',
  tooth: 'M7 3c-2 0-4 2-4 5 0 4 2 5 2.5 9 .3 2.5 1 4 2 4s1.5-1.5 2-4 1-3 2.5-3 2 .5 2.5 3 1 4 2 4 1.7-1.5 2-4C19 13 21 12 21 8c0-3-2-5-4-5-2 0-3 1-5 1S9 3 7 3z',
};
const ico = (name, size = 22, color = 'currentColor', sw = 1.7) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${name === 'star' ? color : 'none'}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[name] || ICONS.sparkle}"/></svg>`;
const sectorIcon = (p) => (/dent|sourire/i.test(p.n + p.s) ? 'tooth' : /[ée]cole h|grande [ée]cole|langues/i.test(p.s) ? 'ecole2' : /voyage|tourisme/i.test(p.s) && !/[ée]co/i.test(p.s) ? 'plane' : /fleur/i.test(p.s) ? 'leaf' : p.k);

const isLight = (hex) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150; };
const darkOf = (pal) => (isLight(pal.ink) ? pal.bg : pal.ink);
const lightOf = (pal) => (isLight(pal.ink) ? pal.ink : pal.bg);
const lead = (s) => s.split(':')[0].trim().replace(/[.\s]+$/, '');
const itemTitle = (it) => (Array.isArray(it) ? (it.length === 2 && /^[a-z0-9]+$/.test(it[0]) ? it[1] : it[0]) : String(it));
const itemSub = (it) => (Array.isArray(it) ? (it.length === 2 && /^[a-z0-9]+$/.test(it[0]) ? '' : it[1] || '') : '');
// ---------- Logo généré (SVG) ----------
function logoSVG(p, b, opts = {}) {
  const { pal, font } = b; const head = font[0], body = font[1];
  const accent = opts.mono ? opts.mono : pal.accent; const ink = opts.mono ? opts.mono : (opts.ink || pal.ink); const chip = darkOf(pal);
  const icon = ICONS[sectorIcon(p)];
  const name = b.main; const long = name.length > 16;
  const fs1 = long ? 30 : 40;
  switch (b.logoStyle) {
    case 0: // pastille ronde + nom
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 120" width="${opts.w || 440}"><circle cx="60" cy="60" r="48" fill="${accent}"/><circle cx="60" cy="60" r="41" fill="none" stroke="${opts.mono ? '#fff' : chip}" stroke-width="1.5" opacity=".6"/><text x="60" y="73" text-anchor="middle" font-family="${head}" font-size="36" font-weight="700" fill="${opts.mono ? '#fff' : chip}">${esc(b.initials)}</text><text data-max="300" x="126" y="${long ? 64 : 68}" font-family="${head}" font-size="${fs1}" font-weight="700" fill="${ink}" textLength="${long ? 300 : ''}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text><text x="128" y="94" font-family="${body}" font-size="13" letter-spacing="4" fill="${ink}" opacity=".7">${esc(b.kicker.toUpperCase())}</text></svg>`.replace(' textLength=""', '');
    case 1: // icône sectorielle + nom
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 120" width="${opts.w || 440}"><g transform="translate(14 18) scale(3.5)" fill="none" stroke="${accent}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="${icon}"/></g><line x1="112" y1="24" x2="112" y2="96" stroke="${accent}" stroke-width="1.5"/><text data-max="300" x="128" y="${long ? 64 : 68}" font-family="${head}" font-size="${fs1}" font-weight="600" fill="${ink}" ${long ? 'textLength="300" lengthAdjust="spacingAndGlyphs"' : ''}>${esc(name)}</text><text x="130" y="94" font-family="${body}" font-size="12" letter-spacing="5" fill="${accent}">${esc(b.kicker.toUpperCase())}</text></svg>`;
    case 2: // mot-symbole centré, filets
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 120" width="${opts.w || 440}"><text data-max="410" x="220" y="${long ? 66 : 70}" text-anchor="middle" font-family="${head}" font-size="${long ? 34 : 48}" font-weight="500" fill="${ink}" letter-spacing="${long ? 1 : 3}" ${name.length > 20 ? 'textLength="420" lengthAdjust="spacingAndGlyphs"' : ''}>${esc(name.toUpperCase())}</text><line x1="40" y1="92" x2="150" y2="92" stroke="${accent}" stroke-width="1.5"/><line x1="290" y1="92" x2="400" y2="92" stroke="${accent}" stroke-width="1.5"/><g transform="translate(206 79) scale(1.15)" fill="none" stroke="${accent}" stroke-width="1.6"><path d="${icon}"/></g></svg>`;
    default: // carré arrondi + initiales en italique
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 120" width="${opts.w || 440}"><rect x="10" y="12" width="96" height="96" rx="26" fill="${opts.mono ? opts.mono : chip}"/><text x="58" y="76" text-anchor="middle" font-family="${head}" font-style="italic" font-size="44" font-weight="600" fill="${opts.mono ? '#fff' : accent}">${esc(b.initials)}</text><circle cx="94" cy="24" r="7" fill="${accent}"/><text data-max="304" x="124" y="${long ? 64 : 68}" font-family="${head}" font-size="${fs1}" font-weight="700" fill="${ink}" ${long ? 'textLength="300" lengthAdjust="spacingAndGlyphs"' : ''}>${esc(name)}</text><text x="126" y="94" font-family="${body}" font-size="13" fill="${ink}" opacity=".65">${esc(b.kicker)} · ${esc(p.c)}</text></svg>`;
  }
}
// Pastille carrée (photo de profil réseaux)
function avatarSVG(p, b) {
  const real = realLogo(b.slug);
  if (real) return `<div style="width:100%;height:100%;background:#fff url('${real}') center/80% no-repeat;border-radius:inherit"></div>`;
  const icon = ICONS[sectorIcon(p)];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" style="width:100%;height:100%;display:block;border-radius:inherit"><rect width="200" height="200" fill="${darkOf(b.pal)}"/><circle cx="100" cy="100" r="78" fill="none" stroke="${b.pal.accent}" stroke-width="3"/><text x="100" y="${b.logoStyle === 1 ? 128 : 122}" text-anchor="middle" font-family="${b.font[0]}" font-size="${b.logoStyle === 1 ? 40 : 64}" font-weight="700" ${b.logoStyle === 3 ? 'font-style="italic"' : ''} fill="${b.pal.accent}">${esc(b.initials)}</text>${b.logoStyle === 1 ? `<g transform="translate(76 40) scale(2)" fill="none" stroke="${b.pal.accent}" stroke-width="1.5"><path d="${icon}"/></g>` : ''}</svg>`;
}
// Logo pour en-tête de site (réel si dispo)
function headerLogo(p, b, opts = {}) {
  const real = realLogo(b.slug);
  if (real) { const h = Math.round((opts.h || 52) * 1.5); return `<div style="height:${h}px;width:${h * 2.6}px;display:flex;align-items:center;${opts.onDark ? 'background:#fff;padding:6px 12px;border-radius:10px;width:auto;' : ''}"><img src="${real}" style="max-height:100%;max-width:${h * 2.6}px;object-fit:contain" alt="${esc(p.n)}"></div>`; }
  return `<div style="height:${opts.h || 52}px;display:flex;align-items:center">${logoSVG(p, b, { w: (opts.h || 52) * 3.66, ink: opts.ink, mono: opts.mono })}</div>`;
}

// ---------- Contenus par secteur ----------
const HOURS = { hotel: ['Ouvert 24 h/24', 'Réception 24 h/24 · 7 j/7'], resto: ['Ferme à 23 h', 'Lun – Dim · 11 h – 23 h'], beaute: ['Ferme à 19 h', 'Lun – Sam · 9 h – 19 h'], immo: ['Ferme à 17 h 30', 'Lun – Ven · 8 h – 17 h 30'], sante: ['Ferme à 18 h', 'Lun – Ven · 8 h – 18 h · Sam 8 h – 12 h'], voyage: ['Ferme à 18 h', 'Lun – Sam · 8 h 30 – 18 h'], auto: ['Ferme à 18 h', 'Lun – Sam · 8 h – 18 h'], ecole: ['Ferme à 19 h', 'Lun – Sam · 8 h – 19 h'], luxe: ['Ferme à 20 h', 'Lun – Sam · 10 h – 20 h'], boutique: ['Ferme à 19 h', 'Lun – Sam · 9 h – 19 h'], services: ['Ferme à 17 h', 'Lun – Ven · 8 h – 17 h'] };
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/ | /g, ' ') + ' FCFA';

function content(p, b) {
  const pick = (arr) => arr[(hash(b.slug) + b.variant) % arr.length];
  const s = (p.s + ' ' + p.n).toLowerCase(); const c = p.c; const n = b.main;
  const base = { hours: HOURS[p.k], phone: p.t, email: p.e || `contact@${b.domain}`, address: `${c}, Gabon` };
  if (p.k === 'hotel') return { ...base, tagline: pick([`Votre adresse d'exception à ${c}`, `Le calme, au cœur de ${c}`, `Séjournez autrement à ${c}`, 'Comme à la maison, en mieux', `L'hospitalité gabonaise à ${c}`, 'Dormez bien, voyagez mieux']), intro: `${p.n} vous accueille dans un cadre soigné : chambres confortables, service attentionné et toutes les commodités pour un séjour d'affaires ou de détente à ${c}.`,
    items: [['Chambre Standard', 'Lit double · Wi-Fi · Climatisation', 35000], ['Chambre Supérieure', 'Lit queen · Bureau · Vue jardin', 48000], ['Suite Junior', 'Salon séparé · Minibar · Balcon', 75000]], feats: [['wifi', 'Wi-Fi gratuit'], ['pool', /refuge|lagon|bambou|dounia/i.test(s) ? 'Piscine & jardin' : 'Espace détente'], ['resto', 'Restaurant & bar'], ['car', 'Parking sécurisé'], ['shield', 'Sécurité 24 h/24'], ['plane', 'Navette sur demande']], cta: 'Réserver' };
  if (p.k === 'resto') {
    let menu, tagline, cta = 'Réserver une table';
    if (/boulangerie|caf[ée]/.test(s)) { tagline = /boko/i.test(s) ? 'Café, brunch & bonne humeur' : 'Le bon pain, chaque matin'; menu = [['Croissant pur beurre', 'Feuilletage maison', 600], ['Pain au chocolat', 'Deux barres de chocolat noir', 700], ['Baguette tradition', 'Levain naturel', 500], ['Formule petit-déjeuner', 'Boisson chaude + viennoiserie + jus', 3500], ['Tarte aux fruits', 'Fruits de saison', 2500], ['Cappuccino', 'Lait mousseux', 2000]]; }
    else if (/italien|mamma/.test(s)) { tagline = "L'arte della cucina italiana"; menu = [['Pizza Margherita', 'Tomate San Marzano, mozzarella, basilic', 7500], ['Pizza Diavola', 'Salami piquant, mozzarella', 9000], ['Tagliatelle al ragù', 'Pâtes fraîches maison', 8500], ['Lasagne della Mamma', 'Recette familiale', 9000], ['Tiramisu', 'Mascarpone, café', 4000], ['Panna cotta', 'Coulis de fruits rouges', 3500]]; }
    else if (/burger/.test(s)) { tagline = 'Smash. Melt. Repeat.'; cta = 'Commander'; menu = [['Black Classic', 'Bœuf 150 g, cheddar, sauce maison', 6500], ['Double Smash', '2 × 100 g, double cheddar, oignons', 8500], ['Chicken Crispy', 'Poulet pané, coleslaw', 6000], ['Frites maison', 'Sel fumé', 2000], ['Milkshake', 'Vanille, chocolat ou fraise', 3500], ['Menu complet', 'Burger + frites + boisson', 9500]]; }
    else if (/plage|beach|village/.test(s)) { tagline = /assiga/i.test(s) ? 'Pointe Denis, les pieds dans le sable' : /akaé|akae/i.test(s) ? 'Océan, saveurs & good vibes' : 'Les pieds dans le sable, face à l\'océan'; menu = [['Poisson braisé', 'Capitaine ou bar, banane plantain', 12000], ['Gambas grillées', 'Beurre citronné', 15000], ['Salade océane', 'Crevettes, avocat, mangue', 8000], ['Brochettes de bœuf', 'Sauce piment maison', 7000], ['Cocktail signature', 'Rhum, passion, citron vert', 5000], ['Jus frais', 'Ananas, gingembre ou bissap', 2000]]; }
    else { tagline = /akwaba/i.test(s) ? 'Lounge, saveurs & soirées' : pick(['Saveurs du Gabon et d\'ailleurs', 'Le goût du partage', 'Ici, on mange bien', 'Cuisine généreuse, ambiance unique']); menu = [['Poulet DG', 'Plantain, légumes sautés', 8000], ['Poisson braisé', 'Accompagnement au choix', 10000], ['Nyembwe', 'Poulet à la sauce graine de palme', 8500], ['Brochettes mixtes', 'Bœuf & poulet marinés', 6500], ['Salade du chef', 'Produits frais du marché', 5000], ['Dessert du jour', 'Fait maison', 3000]]; }
    return { ...base, tagline, intro: `${p.n} vous reçoit à ${c} pour un moment de partage : cuisine généreuse, produits frais et accueil chaleureux.`, items: menu, cta };
  }
  if (p.k === 'beaute') {
    let items;
    if (/ongl|nail/.test(s)) items = [['Pose gel', 'Couleur au choix', 15000], ['Semi-permanent mains', 'Tenue 3 semaines', 10000], ['Nail art', 'Par ongle', 1000], ['Beauté des pieds', 'Soin complet + vernis', 12000]];
    else if (/spa/.test(s)) items = [['Massage relaxant', '60 min · huiles chaudes', 25000], ['Hammam & gommage', '45 min', 20000], ['Soin du visage éclat', '60 min', 22000], ['Rituel duo', '90 min · à deux', 45000]];
    else if (/coiffure|sheba/.test(s)) items = [['Tresses', 'Selon longueur', 15000], ['Brushing', 'Soin inclus', 8000], ['Pose perruque', 'Lace & personnalisation', 20000], ['Soin du visage', '45 min', 18000]];
    else if (/skin|latania/.test(s)) items = [['Diagnostic de peau', 'Analyse et protocole', 10000], ['Peeling éclat', 'Taches et teint terne', 35000], ['Microneedling', 'Texture et cicatrices', 50000], ['Hydrafacial', 'Nettoyage profond', 40000]];
    else items = [['Soin du visage', '60 min · tous types de peau', 20000], ['Épilation', 'Cire tiède', 5000], ['Manucure & pédicure', 'Soin + vernis', 15000], ['Maquillage', 'Jour, soirée ou mariée', 25000]];
    return { ...base, tagline: pick(['Prenez soin de vous', 'La beauté, en douceur', 'Votre moment, rien qu\'à vous', 'Révélez votre éclat', 'Belle, tout simplement', 'Le soin qui vous ressemble']), intro: `À ${c}, ${p.n} vous propose des soins sur mesure dans un espace calme et raffiné, avec des produits de qualité.`, items, cta: 'Prendre rendez-vous' };
  }
  if (p.k === 'immo') return { ...base, tagline: pick([`Trouvez le bien qui vous ressemble`, 'Acheter, louer, investir sereinement', `L'immobilier de confiance à ${c}`, 'Votre projet, notre expertise', 'Chez vous, enfin', 'La clé de votre avenir']), intro: /expertise/.test(s) ? `${p.n} réalise vos expertises et évaluations immobilières à ${c} : rapports détaillés, délais tenus, valeur juste.` : `${p.n} vous accompagne dans tous vos projets immobiliers à ${c} : location, vente, gestion locative et conseil.`,
    items: [['Villa 4 chambres avec piscine', /port-gentil/i.test(c) ? 'Port-Gentil, Balise' : 'Libreville, Batterie IV', 'Vente', 185000000, '320 m²', 4], ['Appartement meublé F3', /port-gentil/i.test(c) ? 'Port-Gentil, Centre' : 'Libreville, Glass', 'Location', 650000, '95 m²', 2], ['Duplex moderne', /port-gentil/i.test(c) ? 'Port-Gentil, Grand Village' : 'Akanda, Angondjé', 'Vente', 120000000, '210 m²', 3]], cta: 'Voir les biens' };
  if (p.k === 'sante') {
    let items, title;
    if (/dent|sourire/.test(s)) { title = pick(['Votre sourire entre de bonnes mains', 'Des soins dentaires tout en douceur', 'Souriez, on s\'occupe du reste', 'Le sourire, notre spécialité']); items = [['tooth', 'Soins & détartrage'], ['sparkle', 'Blanchiment'], ['shield', 'Implants'], ['users', 'Orthodontie'], ['heart', 'Soins des enfants'], ['clock', 'Urgences dentaires']]; }
    else if (/radiolog/.test(s)) { title = 'Imagerie médicale de précision'; items = [['sante', 'Radiographie numérique'], ['sparkle', 'Échographie'], ['shield', 'Scanner'], ['heart', 'Mammographie'], ['clock', 'Résultats rapides'], ['users', 'Comptes-rendus en ligne']]; }
    else if (/labor|biolab/.test(s)) { title = 'Des analyses fiables, des résultats rapides'; items = [['sante', 'Bilan sanguin'], ['sparkle', 'Analyses spécialisées'], ['clock', 'Résultats en 24 h'], ['shield', 'Résultats en ligne'], ['car', 'Prélèvement à domicile'], ['users', 'Entreprises & assurances']]; }
    else if (/angiolog/.test(s)) { title = 'Votre santé vasculaire, notre priorité'; items = [['heart', 'Consultation cardiologie'], ['sante', 'Écho-doppler'], ['shield', 'Bilan vasculaire'], ['sparkle', 'Traitement des varices'], ['clock', 'Suivi personnalisé'], ['users', 'Prévention']]; }
    else { title = 'Diagnostic et soins de confiance'; items = [['sante', 'Consultations'], ['sparkle', 'Ophtalmologie'], ['shield', 'Examens & bilans'], ['heart', 'Prévention'], ['clock', 'Rendez-vous rapide'], ['users', 'Médecine d\'entreprise']]; }
    return { ...base, tagline: title, intro: `${p.n} vous accueille à ${c} avec une équipe à l'écoute, des équipements modernes et une prise de rendez-vous simplifiée.`, items, cta: 'Prendre rendez-vous', doctor: p.d };
  }
  if (p.k === 'voyage') {
    const fish = /p[êe]che|fishing/.test(s), eco = /[ée]co|aventure|batrhotour/.test(s);
    const items = fish ? [['Pêche au gros', 'Cap Estérias · journée', 250000], ['Pêche au tarpon', 'Estuaire · demi-journée', 150000], ['Séjour pêche', '3 jours · Sette Cama', 950000]] : eco ? [['Parc de la Lopé', '3 jours · savane et forêt', 450000], ['Loango, la mer et la faune', '4 jours · éléphants & baleines', 780000], ['Pongara', 'Week-end · tortues luth', 180000]] : [['Dubaï', '5 jours · vol + hôtel', 890000], ['Paris', 'Billet aller-retour', 650000], ['Zanzibar', '7 jours · plage & culture', 1250000]];
    const vt = pick(['Le monde commence ici', 'Partez loin, partez serein', 'Votre prochain voyage commence ici', 'Voyagez malin']);
    return { ...base, tagline: fish ? 'La pêche sportive au Gabon' : eco ? pick(['Le Gabon grandeur nature', 'L\'aventure au naturel', 'Explorez le Gabon sauvage']) : vt, intro: `${p.n} organise vos voyages de A à Z depuis ${c} : billets, séjours, visas et accompagnement personnalisé.`, items, cta: 'Demander un devis' };
  }
  if (p.k === 'auto') {
    if (/auto-[ée]cole|driving|franstel/.test(s)) return { ...base, tagline: pick(['Votre permis, sans stress', 'Prenez la route en confiance', 'Le permis, en toute sérénité']), intro: `${p.n} vous forme au permis de conduire à ${c} : moniteurs patients, véhicules récents et taux de réussite élevé.`, items: [['Code de la route', 'Cours + examens blancs', 75000], ['Permis B', '20 h de conduite incluses', 350000], ['Formule accélérée', 'Permis en 6 semaines', 450000]], cta: "S'inscrire", mode: 'ecole' };
    if (/location/.test(s)) return { ...base, tagline: 'Louez en toute liberté', intro: `${p.n} met à votre disposition des véhicules récents et entretenus à ${c}, avec ou sans chauffeur.`, items: [['Citadine', 'Toyota Yaris ou similaire', 35000], ['SUV', 'Toyota RAV4 ou similaire', 60000], ['4x4', 'Toyota Prado ou similaire', 90000]], cta: 'Réserver un véhicule', mode: 'loc' };
    if (/garage|first stop/.test(s)) return { ...base, tagline: 'Entretien et réparation, sans surprise', intro: `${p.n} entretient et répare votre véhicule à ${c} : diagnostic, mécanique, pneus et vidange.`, items: [['Vidange complète', 'Huile + filtres', 45000], ['Diagnostic électronique', 'Toutes marques', 25000], ['Freinage', 'Plaquettes + disques', 'Sur devis']], cta: 'Prendre rendez-vous', mode: 'garage' };
    return { ...base, tagline: pick(['La bonne pièce, au bon prix', 'Toutes les pièces, toutes les marques', 'Pièces garanties, conseils d\'experts', 'Roulez l\'esprit tranquille']), intro: `${p.n} fournit des pièces détachées neuves et garanties à ${c}, pour toutes les grandes marques.`, items: [['Freinage', 'Plaquettes, disques, étriers', 'Dès 15 000 FCFA'], ['Filtration', 'Huile, air, carburant', 'Dès 5 000 FCFA'], ['Pneumatiques', 'Toutes dimensions', 'Dès 45 000 FCFA'], ['Batteries', 'Garantie 12 mois', 'Dès 55 000 FCFA']], cta: 'Trouver une pièce', mode: 'pieces' };
  }
  if (p.k === 'ecole') {
    if (/musique|music/.test(s)) return { ...base, tagline: 'Fais vibrer ton talent', intro: `${p.n} enseigne la musique à tous les âges à ${c} : cours individuels ou en groupe, du débutant au confirmé.`, items: [['Piano', 'Dès 6 ans'], ['Guitare', 'Acoustique & électrique'], ['Chant', 'Technique vocale'], ['Batterie', 'Rythme & groove'], ['Solfège', 'Théorie musicale'], ['MAO', 'Production musicale']], cta: "S'inscrire", music: true };
    if (/langues/.test(s)) return { ...base, tagline: 'Parlez le monde', intro: `${p.n} vous fait progresser en langues à ${c} : cours en petits groupes, préparation aux certifications et formations en entreprise.`, items: [['Anglais', 'Tous niveaux · TOEIC'], ['Espagnol', 'Débutant à avancé'], ['Chinois', 'Initiation'], ['Français FLE', 'Pour expatriés'], ['Allemand', 'Préparation Goethe'], ['Entreprises', 'Formations sur site']], cta: "S'inscrire" };
    return { ...base, tagline: /h[ôo]teli/.test(s) ? 'L\'excellence du service' : 'Former les leaders de demain', intro: `${p.n} forme aux métiers d'avenir à ${c} avec des enseignants expérimentés et des stages en entreprise.`, items: /h[ôo]teli/.test(s) ? [['Cuisine', 'CAP & BTS'], ['Service en salle', 'Sommellerie'], ['Réception', 'Accueil & front office'], ['Pâtisserie', 'Arts sucrés'], ['Management hôtelier', 'Bac +3'], ['Stages', 'Hôtels partenaires']] : [['Management', 'Bachelor & Master'], ['Informatique', 'Développement & réseaux'], ['Droit', 'Droit des affaires'], ['Environnement', 'QHSE'], ['Formation continue', 'Cours du soir'], ['International', 'Double diplôme']], cta: 'Candidater' };
  }
  if (p.k === 'luxe') {
    let items, tag;
    if (/bijou/.test(s)) { tag = 'L\'éclat qui vous ressemble'; items = [['Bague solitaire', 'Or 18 carats', 450000], ['Collier de perles', 'Perles de culture', 280000], ['Alliance', 'Or jaune ou blanc', 180000]]; }
    else if (/styliste/.test(s)) { tag = 'Couture africaine, regard universel'; items = [['Collection Héritage', 'Prêt-à-porter', 'Sur demande'], ['Sur-mesure', 'Pièces uniques', 'Sur rendez-vous'], ['Mariage', 'Tenues de cérémonie', 'Sur rendez-vous']]; }
    else if (/cosm/.test(s)) { tag = 'Des soins qui révèlent votre peau'; items = [['Sérum éclat', 'Vitamine C · 30 ml', 18000], ['Beurre de karité', 'Pur, non raffiné', 7500], ['Huile sèche', 'Corps & cheveux', 12000]]; }
    else { tag = 'Signez votre présence'; items = [['Eau de parfum Oud', '100 ml', 85000], ['Musc blanc', '50 ml', 45000], ['Coffret découverte', '5 × 10 ml', 60000]]; }
    return { ...base, tagline: tag, intro: `${p.n} sélectionne à ${c} des pièces d'exception pour celles et ceux qui ne font aucun compromis sur le style.`, items, cta: /styliste/.test(s) ? 'Prendre rendez-vous' : 'Découvrir la collection' };
  }
  if (p.k === 'boutique') {
    let items, tag;
    if (/fleur/.test(s)) { tag = 'Des fleurs pour tous vos moments'; items = [['Bouquet du jour', 'Fleurs de saison', 15000], ['Composition mariage', 'Sur mesure', 'Sur devis'], ['Roses rouges × 12', 'Livraison incluse', 25000], ['Plante verte', 'Avec cache-pot', 18000]]; }
    else if (/jouet/.test(s)) { tag = 'Des étoiles plein les yeux'; items = [['Jeux d\'éveil', '0 – 3 ans', 12000], ['Poupées & figurines', '3 – 8 ans', 15000], ['Jeux de société', 'En famille', 18000], ['Vélos & trottinettes', 'Plein air', 65000]]; }
    else if (/artisanat/.test(s)) { tag = 'Fait main, au Gabon'; items = [['Masque Punu', 'Bois sculpté', 85000], ['Panier tressé', 'Fibres naturelles', 15000], ['Statuette', 'Pierre de Mbigou', 45000], ['Tissu wax', 'Coupon 6 yards', 20000]]; }
    else { tag = 'Le cadeau qui fait mouche'; items = [['Coffret cadeau', 'Personnalisable', 25000], ['Bougie parfumée', 'Cire de soja', 9000], ['Cadre photo', 'Bois & laiton', 12000], ['Vase céramique', 'Pièce unique', 18000]]; }
    return { ...base, tagline: tag, intro: `${p.n} vous accueille à ${c} et livre partout en ville : commande simple sur WhatsApp.`, items, cta: 'Commander sur WhatsApp' };
  }
  // services
  if (/vtc/.test(s)) return { ...base, tagline: 'Vos trajets en toute confiance', intro: `${p.n} vous conduit à ${c} : chauffeurs professionnels, véhicules climatisés, transferts aéroport et mise à disposition.`, items: [['car', 'Course en ville'], ['plane', 'Transfert aéroport'], ['clock', 'Mise à disposition'], ['users', 'Entreprises']], cta: 'Réserver une course' };
  return { ...base, tagline: 'La santé au travail, simplement', intro: `${p.n} accompagne les entreprises de ${c} : visites médicales, prévention des risques et conformité.`, items: [['sante', 'Visites médicales'], ['shield', 'Prévention des risques'], ['users', 'Formation SST'], ['book', 'Document unique']], cta: 'Demander un devis' };
}

// Statistiques réseaux : réelles si connues, sinon compte neuf
const KNOWN = { 'even-jet-by-coco': { ig: 6240 }, 'boko-s-cafe': { ig: 10000 }, 'beach-club': { fb: 33000 }, 'wanted-immobilier': { fb: 875 }, 'cabinet-dentaire-dr-abbas': { fb: 1959 }, 'fattal-travel-et-tourism': { fb: 1700 }, 'bella-mamma': { ig: 1500 }, 'eva-spa-chez-clarisse': { ig: 8 }, 'institut-ozenga': { fb: 199 } };
function stats(p, b) {
  const k = KNOWN[b.slug] || {}; const has = (x) => p.so.includes(x);
  const est = (m) => 300 + (hash(b.slug + m) % 2700);
  return { ig: k.ig ?? (has('instagram') ? est('ig') : 0), fb: k.fb ?? (has('facebook') ? est('fb') : 0), posts: has('instagram') ? 40 + (hash(b.slug) % 120) : 9 };
}
const nf = (n) => (n == null ? '—' : n >= 10000 ? (n / 1000).toFixed(1).replace('.', ',').replace(',0', '') + ' k' : n.toLocaleString('fr-FR').replace(/ | /g, ' '));

module.exports = { isLight, darkOf, lightOf, lead, itemTitle, itemSub, esc, slugify, hash, brandOf, logoSVG, avatarSVG, headerLogo, realLogo, ico, ICONS, sectorIcon, fontLink, content, fcfa, stats, nf, HOURS };
