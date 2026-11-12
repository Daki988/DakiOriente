// Planche des écrans Origa pour Figma : capture le DOM réel de l'application, styles calculés en ligne, dans un
// seul fichier HTML autonome que l'outil Figma « html_to_figma » convertit en calques.
//
// Usage (Playwright doit être installé) :
//   npm run build && npx vite preview --port 4173 &
//   node scripts/planche-figma.cjs planche.html
// Tous les écrans sont ceux de l'application en service (données de démonstration).
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.ORIGA_URL || 'http://127.0.0.1:4173/';
const OUT = process.argv[2] || 'planche.html';

const U = {
  eleveur: { role: 'eleveur', userLabel: 'M. Ndong · Ferme Nkoltang', userId: 'u-eleveur', farmId: 'GA1-0042' },
  agent: { role: 'agent', userLabel: 'Agent technique · Estuaire', userId: 'u-agent', farmId: 'GA1-0042', farmIds: ['GA1-0042', 'GA1-0003', 'GA1-0017'] },
  bceg: { role: 'bceg', userLabel: 'BCEG · Suivi des financements', userId: 'u-bceg' },
  dge: { role: 'dge', userLabel: 'DGE · Programme POUFA', userId: 'u-dge' },
  vet: { role: 'veterinaire', userLabel: 'Services vétérinaires', userId: 'u-vet' },
  admin: { role: 'admin', userLabel: 'Administrateur Origa', userId: 'u-admin' },
  operateur: { role: 'operateur', userLabel: 'Abattoir de Ntoum', userId: 'u-operateur', operatorId: 'OP-001' },
  maedr: { role: 'maedr', userLabel: 'MAEDR · Cabinet du ministre', userId: 'u-maedr' },
};
const M = { width: 390, height: 844 }, W = { width: 1440, height: 900 };

const SNAP = `async () => {
  const P = ['display','position','top','right','bottom','left','z-index','flex-direction','flex-wrap','justify-content','align-items','align-self','align-content','flex-grow','flex-shrink','flex-basis','row-gap','column-gap','order',
    'grid-template-columns','grid-template-rows','grid-column-start','grid-column-end','grid-row-start','grid-row-end','grid-auto-flow','width','height','min-width','min-height','max-width','max-height',
    'margin-top','margin-right','margin-bottom','margin-left','padding-top','padding-right','padding-bottom','padding-left',
    'border-top-width','border-right-width','border-bottom-width','border-left-width','border-top-style','border-right-style','border-bottom-style','border-left-style',
    'border-top-color','border-right-color','border-bottom-color','border-left-color','border-top-left-radius','border-top-right-radius','border-bottom-left-radius','border-bottom-right-radius',
    'background-color','background-image','background-size','background-position','background-repeat','color','font-family','font-size','font-weight','font-style','line-height','letter-spacing',
    'text-align','text-transform','text-decoration-line','white-space','overflow-x','overflow-y','opacity','box-shadow','object-fit','text-overflow','vertical-align','box-sizing','border-collapse','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin'];
  const SKIP = { 'position':'static','top':'auto','right':'auto','bottom':'auto','left':'auto','z-index':'auto','flex-wrap':'nowrap','align-self':'auto','align-content':'normal','flex-grow':'0','flex-shrink':'1','flex-basis':'auto','row-gap':'normal','column-gap':'normal','order':'0',
    'grid-template-columns':'none','grid-template-rows':'none','grid-column-start':'auto','grid-column-end':'auto','grid-row-start':'auto','grid-row-end':'auto','grid-auto-flow':'row','min-width':'auto','min-height':'auto','max-width':'none','max-height':'none',
    'margin-top':'0px','margin-right':'0px','margin-bottom':'0px','margin-left':'0px','padding-top':'0px','padding-right':'0px','padding-bottom':'0px','padding-left':'0px',
    'border-top-width':'0px','border-right-width':'0px','border-bottom-width':'0px','border-left-width':'0px','border-top-style':'none','border-right-style':'none','border-bottom-style':'none','border-left-style':'none',
    'border-top-left-radius':'0px','border-top-right-radius':'0px','border-bottom-left-radius':'0px','border-bottom-right-radius':'0px','background-color':'rgba(0, 0, 0, 0)','background-image':'none','background-size':'auto','background-position':'0% 0%','background-repeat':'repeat',
    'font-style':'normal','letter-spacing':'normal','text-transform':'none','text-decoration-line':'none','white-space':'normal','overflow-x':'visible','overflow-y':'visible','opacity':'1','box-shadow':'none','object-fit':'fill','text-overflow':'clip','vertical-align':'baseline','border-collapse':'separate','stroke-linecap':'butt','stroke-linejoin':'miter' };
  const esc = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const cache = new Map();
  async function dataUrl(u) {
    if (!u || u.startsWith('data:')) return u;
    if (cache.has(u)) return cache.get(u);
    try { const b = await (await fetch(u)).blob(); const d = await new Promise((r) => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); cache.set(u, d); return d; } catch { return ''; }
  }
  async function shrink(u, maxW) {
    const d = await dataUrl(u); if (!d) return d;
    return new Promise((res) => { const im = new Image(); im.onload = () => { const s = Math.min(1, maxW / im.naturalWidth); const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.8)); }; im.onerror = () => res(d); im.src = d; });
  }
  async function css(el, pseudo) {
    const cs = getComputedStyle(el, pseudo); let out = '';
    const svgChild = el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg';
    for (const p of P) {
      let v = cs.getPropertyValue(p);
      if (!v || SKIP[p] === v) continue;
      if (svgChild && !['fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','opacity'].includes(p)) continue;
      if (p === 'background-image' && v.includes('url(')) { const m = v.match(/url\\("?([^")]+)"?\\)/); if (m) v = v.replace(m[0], 'url(' + (await shrink(m[1], 1200)) + ')'); }
      if ((p === 'width' || p === 'height') && (cs.display === 'inline' || v === 'auto')) continue;
      out += p + ':' + v.replace(/"/g, "'") + ';';
    }
    return out;
  }
  async function ser(node) {
    if (node.nodeType === 3) return esc(node.textContent);
    if (node.nodeType !== 1) return '';
    const el = node; const tag = el.tagName.toLowerCase();
    if (['script','style','link','noscript'].includes(tag)) return '';
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return '';
    let st = await css(el);
    if (el instanceof SVGElement) {
      if (tag === 'svg') { const c = el.cloneNode(true); c.removeAttribute('class'); const r = el.getBoundingClientRect(); c.setAttribute('style', 'width:' + r.width + 'px;height:' + r.height + 'px;flex:none;color:' + cs.color + ';display:' + cs.display);
        c.querySelectorAll('*').forEach((x) => x.removeAttribute('class')); let h = c.outerHTML; return h.replace(/currentColor/g, cs.color); }
      return '';
    }
    if (tag === 'img') return '<img src="' + (await shrink(el.currentSrc || el.src, 900)) + '" style="' + st + '">';
    if (tag === 'input' && (el.type === 'checkbox' || el.type === 'radio')) return '<span style="' + st + 'display:inline-block;border:1.5px solid ' + (el.checked ? '#12805C' : '#B7C4BE') + ';border-radius:' + (el.type === 'radio' ? '50%' : '5px') + ';background:' + (el.checked ? '#12805C' : '#fff') + ';color:#fff;font-size:13px;line-height:17px;text-align:center">' + (el.checked ? '✓' : '') + '</span>';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      const txt = tag === 'select' ? (el.selectedOptions[0] ? el.selectedOptions[0].textContent : '') : (el.value || el.placeholder || '');
      const ph = tag !== 'select' && !el.value;
      return '<div style="' + st + 'display:flex;align-items:center;overflow:hidden;white-space:nowrap;' + (ph ? 'color:#8A9A93;' : '') + (cs.textAlign === 'center' ? 'justify-content:center;' : '') + '">' + esc(txt) + '</div>';
    }
    let inner = '';
    for (const ps of ['::before', '::after']) {
      const pc = getComputedStyle(el, ps); const content = pc.content;
      if (content && content !== 'none' && content !== 'normal') { const html = '<span style="' + (await css(el, ps)) + '">' + esc(content.replace(/^"|"$/g, '')) + '</span>'; if (ps === '::before') inner += html; else el.__after = html; }
    }
    for (const c of el.childNodes) inner += await ser(c);
    if (el.__after) { inner += el.__after; delete el.__after; }
    const t = ['a','button','label','main','aside','nav','header','footer','section','form'].includes(tag) ? 'div' : tag;
    if (t === 'br' || t === 'hr') return '<' + t + ' style="' + st + '">';
    return '<' + t + ' style="' + st + '">' + inner + '</' + t + '>';
  }
  const body = document.body; const cs = getComputedStyle(body);
  const h = Math.max(document.documentElement.scrollHeight, innerHeight);
  let html = ''; for (const c of body.childNodes) html += await ser(c);
  return { html, h, bg: cs.backgroundColor, font: cs.fontFamily.replace(/"/g, "'"), color: cs.color, fs: cs.fontSize, lh: cs.lineHeight };
}`;

(async () => {
  const prepare = async (p) => { await p.click('button:has-text("Préparer le rouleau")'); await p.waitForTimeout(900); };
  const renew = async (p) => { await p.click('button:has-text("Renouveler la réserve")'); await p.waitForTimeout(900); };
  const search = async (p) => { await p.fill('input.sel', 'GA1-0042'); await p.click('button:has-text("Rechercher")'); await p.waitForTimeout(600); };
  const menu = async (p) => { await p.click('[data-nav]'); await p.waitForTimeout(400); };
  const S = { width: 360, height: 740 };
  const screens = [
    // Tableaux de bord propres à chaque profil
    { g: 'Tableaux de bord par profil', t: 'Vétérinaires : situation sanitaire', u: U.vet, r: '/', vp: W },
    { g: 'Tableaux de bord par profil', t: 'BCEG : portefeuille', u: U.bceg, r: '/', vp: W },
    { g: 'Tableaux de bord par profil', t: 'MAEDR : tableau de bord', u: U.maedr, r: '/', vp: W },
    { g: 'Tableaux de bord par profil', t: 'Agent technique : mes fermes', u: U.agent, r: '/', vp: M },
    // Version 1.3 : écrans ajoutés ou corrigés
    { g: 'Version 1.3', t: 'Étiquettes QR pré-signées (DGE)', u: U.dge, r: '/etiquettes', vp: W, act: prepare },
    { g: 'Version 1.3', t: 'Mes étiquettes QR (éleveur)', u: U.eleveur, r: '/etiquettes', vp: M, act: renew },
    { g: 'Version 1.3', t: 'Rapports : envoi par e-mail', u: U.dge, r: '/rapports', vp: W },
    { g: 'Version 1.3', t: 'Rappel de lot : export EPCIS 2.0', u: U.dge, r: '/tracer', vp: W, act: search },
    { g: 'Version 1.3', t: 'Registre : modifier, supprimer', u: U.eleveur, r: '/charges', vp: M },
    { g: 'Version 1.3', t: 'Corriger une fiche du jour', u: U.eleveur, r: '/saisies/fiches', vp: M },
    { g: 'Version 1.3', t: 'DGE sur téléphone : menu', u: U.dge, r: '/', vp: S, act: menu },
    { g: 'Version 1.3', t: 'DGE sur téléphone : vue nationale', u: U.dge, r: '/', vp: S },
    { g: 'Version 1.3', t: 'Administrateur sur téléphone : droits', u: U.admin, r: '/admin/droits', vp: S },
    // Écrans existants
    { g: 'Éleveur', t: 'Connexion', u: null, r: '/', vp: M },
    { g: 'Éleveur', t: 'Accueil de la bande', u: U.eleveur, r: '/', vp: M },
    { g: 'Éleveur', t: 'Fiche du jour', u: U.eleveur, r: '/fiche', vp: M },
    { g: 'Éleveur', t: 'Bandes', u: U.eleveur, r: '/bandes', vp: M },
    { g: 'Éleveur', t: 'Lots cédés', u: U.eleveur, r: '/lots', vp: M },
    { g: 'Éleveur', t: 'Plus', u: U.eleveur, r: '/plus', vp: M },
    { g: 'Éleveur', t: 'Biosécurité', u: U.eleveur, r: '/biosecurite', vp: M },
    { g: 'Opérateur', t: 'Réception des lots', u: U.operateur, r: '/', vp: M },
    { g: 'Public', t: 'Statistiques publiques', u: null, r: '/statistiques', vp: M },
    { g: 'Pilotage', t: 'Vue nationale', u: U.dge, r: '/national', vp: W },
    { g: 'Pilotage', t: 'Registre des fermes', u: U.dge, r: '/fermes', vp: W },
    { g: 'Pilotage', t: 'Classement des fermes', u: U.dge, r: '/classement', vp: W },
    { g: 'Pilotage', t: 'Alertes sanitaires', u: U.vet, r: '/alertes', vp: W },
    { g: 'Administration', t: 'Tableau de bord administrateur', u: U.admin, r: '/', vp: W },
    { g: 'Administration', t: 'Matrice des droits', u: U.admin, r: '/admin/droits', vp: W },
  ];
  const b = await chromium.launch();
  const frames = [];
  for (const s of screens) {
    const ctx = await b.newContext({ viewport: s.vp, serviceWorkers: 'block', deviceScaleFactor: 1 });
    if (s.u) await ctx.addInitScript((u) => localStorage.setItem('origa.session', JSON.stringify(u)), s.u);
    const p = await ctx.newPage();
    await p.goto(BASE + '#' + s.r, { waitUntil: 'networkidle' });
    await p.waitForTimeout(2600);
    if (s.r !== '/' ) { await p.goto(BASE + '#' + s.r); await p.waitForTimeout(700); }
    if (s.act) await s.act(p);
    await p.evaluate(() => { const x = document.getElementById('boot'); if (x) x.remove(); document.querySelectorAll('.update-bar').forEach((e) => e.remove()); });
    await p.waitForTimeout(300);
    const r = await p.evaluate(`(${SNAP})()`);
    const h = Math.min(Math.max(r.h, s.vp.height), s.vp.width > 500 ? 2000 : 1900);
    frames.push({ ...s, h, r });
    console.log(s.t, s.vp.width + 'x' + h, Math.round(r.html.length / 1024) + ' Ko');
    await ctx.close();
  }
  await b.close();
  const groups = [...new Set(frames.map((f) => f.g))];
  let out = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Origa — Écrans v1.3</title><style>*{box-sizing:border-box}body{margin:0;padding:60px;background:#DDE4E0;font-family:Inter,Arial,sans-serif;color:#10201A;width:max-content}
  h1.board{font-size:44px;font-weight:800;margin:0 0 6px;color:#0B3D2E}p.board{font-size:18px;color:#4A5A53;margin:0 0 40px}
  h2.grp{font-size:28px;font-weight:800;margin:50px 0 18px;color:#0B3D2E}.rowf{display:flex;gap:48px;align-items:flex-start}
  .cap{font-size:16px;font-weight:700;margin-bottom:10px;color:#10201A}.frame{position:relative;overflow:hidden;transform:translateZ(0);box-shadow:0 10px 40px rgba(11,61,46,.12)}.frame *{margin:0;padding:0;border:0 solid}</style></head><body>
  <h1 class="board">Origa · écrans v1.3 · tableaux de bord</h1><p class="board">Première section : écrans ajoutés ou corrigés dans la version 1.3. Sections suivantes : écrans de l'application en service.</p>`;
  for (const g of groups) {
    out += `<h2 class="grp">${g}</h2><div class="rowf">`;
    for (const f of frames.filter((x) => x.g === g)) out += `<div><div class="cap">${f.t}</div><div class="frame" style="width:${f.vp.width}px;height:${f.h}px;background:${f.r.bg};font-family:${f.r.font};color:${f.r.color};font-size:${f.r.fs};line-height:${f.r.lh}">${f.r.html}</div></div>`;
    out += '</div>';
  }
  out += '</body></html>';
  fs.writeFileSync(OUT, out);
  console.log('→', OUT, Math.round(out.length / 1024) + ' Ko');
})();
