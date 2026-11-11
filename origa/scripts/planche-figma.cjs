// Planche des écrans Origa pour Figma : capture le DOM réel de l'application, styles calculés en ligne, dans un
// seul fichier HTML autonome que l'outil Figma « html_to_figma » convertit en calques.
//
// Usage (Playwright doit être installé) :
//   npm run build && npx vite preview --port 4173 &
//   node scripts/planche-figma.cjs planche.html
// Les écrans « À valider » sont des maquettes injectées dans la coque réelle ; les autres sont les écrans en service.
const { chromium } = require('playwright');
const fs = require('fs');
const QRCode = require('qrcode');
const BASE = process.env.ORIGA_URL || 'http://127.0.0.1:4173/';
const OUT = process.argv[2] || 'planche.html';

const U = {
  eleveur: { role: 'eleveur', userLabel: 'M. Ndong · Ferme Nkoltang', userId: 'u-eleveur', farmId: 'GA1-0042' },
  dge: { role: 'dge', userLabel: 'DGE · Programme POUFA', userId: 'u-dge' },
  vet: { role: 'veterinaire', userLabel: 'Services vétérinaires', userId: 'u-vet' },
  admin: { role: 'admin', userLabel: 'Administrateur Origa', userId: 'u-admin' },
  operateur: { role: 'operateur', userLabel: 'Abattoir de Ntoum', userId: 'u-operateur', operatorId: 'OP-001' },
  maedr: { role: 'maedr', userLabel: 'MAEDR · Cabinet du ministre', userId: 'u-maedr' },
};
const M = { width: 390, height: 844 }, W = { width: 1440, height: 900 };

async function qr(text, size) { return QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#0B3D2E', light: '#FFFFFF' }, width: size }); }

async function mocks() {
  const ids = Array.from({ length: 12 }, (_, i) => `GA1-0042-B08-L${String(i + 1).padStart(2, '0')}`);
  const qrs = await Promise.all(ids.map((id) => qr(`https://origa-ten.vercel.app/#/p/${id}.signature`, 84)));
  const label = (id, i) => `<div style="display:flex;gap:10px;align-items:center;border:1px dashed #9AA8A2;border-radius:10px;padding:8px 10px;background:#fff"><div style="width:84px;height:84px;flex:none">${qrs[i]}</div><div style="display:flex;flex-direction:column;gap:2px;font-size:11px;color:#4A5A53;min-width:0"><b style="font-size:12.5px;color:#10201A;font-family:ui-monospace,monospace">${id}</b><span>Ferme Nkoltang · Ntoum</span><span>Élevé au Gabon · origa</span></div></div>`;
  const rouleau = `
<div class="top"><div><h1>Étiquettes QR pré-signées</h1><span class="muted">Un rouleau d'étiquettes déjà signées par le serveur : l'éleveur colle un QR valide même sans réseau.</span></div>
  <div class="row"><button class="sel">Renouveler la réserve</button><button class="sel dark">Imprimer le rouleau</button></div></div>
<div class="grid2" style="grid-template-columns:1fr 1.7fr">
  <div class="panel"><h3>Préparer un rouleau</h3>
    <label class="f">Ferme<select class="input"><option>GA1-0042 · Ferme Nkoltang</option></select></label>
    <label class="f">Bande en cours<select class="input"><option>GA1-0042-B08 · mise en place le 3 novembre</option></select></label>
    <label class="f">Nombre d'étiquettes<input class="input" value="12"></label>
    <div class="note">Les étiquettes portent les 12 prochains numéros de lot de la bande. Un numéro ne sert qu'une fois : à la cession, le lot prend l'étiquette suivante.</div>
    <button class="sel dark" style="align-self:flex-start">Préparer le rouleau</button>
    <div class="kv"><span>Réserve sur le téléphone de l'éleveur</span><b>5 étiquettes</b></div>
    <div class="kv"><span>Dernier rouleau émis</span><b>3 novembre · 12 étiquettes</b></div>
    <div class="kv"><span>Émission journalisée</span><b>Oui</b></div>
  </div>
  <div class="panel"><div class="row between"><h3>Aperçu du rouleau · 12 étiquettes de 90 × 30 mm</h3><span class="pill on">Signées par le serveur</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">${ids.map(label).join('')}</div>
  </div>
</div>`;
  const reserve = `
<div class="back"><button class="iconbtn" aria-label="Retour"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button><div style="flex:1;min-width:0"><h2>Mes étiquettes QR</h2><div class="sub">Valables sans réseau</div></div></div>
<div class="content">
  <div class="qrbox"><div style="width:200px;height:200px">${await qr('https://origa-ten.vercel.app/#/p/GA1-0042-B08-L01.signature', 200)}</div><span class="lotid">GA1-0042-B08-L01</span>
    <span class="pill on"><span class="dot" style="background:var(--green)"></span>Prochaine étiquette · déjà signée</span></div>
  <div class="note">Hors ligne, le QR de votre prochain lot est déjà valable. Sans réserve, il faudrait attendre le réseau.</div>
  <div class="card" style="gap:0">
    <div class="kv"><span>Bande</span><b>GA1-0042-B08</b></div>
    <div class="kv"><span>Étiquettes en réserve</span><b class="ok">5</b></div>
    <div class="kv"><span>Numéros</span><b>L01 à L05</b></div>
    <div class="kv"><span>Réserve renouvelée</span><b>aujourd'hui, 08:12</b></div>
  </div>
  <button class="cta green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>Renouveler la réserve</button>
  <button class="cta light">Imprimer mes étiquettes</button>
</div>`;
  const rapports = `
<div class="top"><div><h1>Rapports</h1><span class="muted">Générés automatiquement, exportables en PDF et envoyés par e-mail aux destinataires.</span></div>
  <div class="row"><button class="sel">Exporter en PDF</button><button class="sel dark">Envoyer maintenant</button></div></div>
<div class="grid2">
  <div class="panel"><h3>Derniers envois</h3>
    <table class="tbl"><thead><tr><th>Envoyé le</th><th>Rapport</th><th>Période</th><th>Destinataires</th><th>État</th></tr></thead><tbody>
      <tr><td>lun. 9 nov., 06:00</td><td>Hebdomadaire</td><td>Semaine 45 · 2 au 8 nov.</td><td>4</td><td><span class="pill on">Envoyé</span></td></tr>
      <tr><td>jeu. 5 nov., 17:42</td><td>Fin de bande</td><td>GA1-0042-B07</td><td>4</td><td><span class="pill on">Envoyé</span></td></tr>
      <tr><td>lun. 2 nov., 06:00</td><td>Hebdomadaire</td><td>Semaine 44 · 26 oct. au 1er nov.</td><td>4</td><td><span class="pill on">Envoyé</span></td></tr>
      <tr><td>dim. 1er nov., 06:00</td><td>Mensuel</td><td>Octobre 2026</td><td>4</td><td><span class="pill on">Envoyé</span></td></tr>
      <tr><td>lun. 26 oct., 06:00</td><td>Hebdomadaire</td><td>Semaine 43 · 19 au 25 oct.</td><td>3</td><td><span class="pill red">Échec · réessai prévu</span></td></tr>
    </tbody></table>
    <div class="note">Chaque envoi contient le rapport en PDF et le détail par ferme en CSV. Un rapport n'est jamais envoyé deux fois pour la même période.</div>
  </div>
  <div class="panel"><h3>Envoi automatique par e-mail</h3>
    <label class="check"><input type="checkbox" checked><span><b>Hebdomadaire</b> · chaque lundi, pour la semaine écoulée</span></label>
    <label class="check"><input type="checkbox" checked><span><b>Mensuel</b> · le 1er du mois, pour le mois écoulé</span></label>
    <label class="check"><input type="checkbox" checked><span><b>Fin de bande</b> · à la clôture de chaque bande</span></label>
    <div class="f">Destinataires
      <div class="chips"><span class="chip">dge@agriculture.gouv.ga ✕</span><span class="chip">cabinet@agriculture.gouv.ga ✕</span><span class="chip">poufa@cgi.ga ✕</span><span class="chip">suivi@bceg.ga ✕</span></div>
      <div class="row"><input class="input" placeholder="adresse@exemple.ga"><button class="sel">Ajouter</button></div>
    </div>
    <button class="sel dark" style="align-self:flex-start">Enregistrer</button>
  </div>
</div>`;
  const epcis = `
<div class="top"><div><h1>Traçabilité et rappel de lot</h1><span class="muted">Ferme (GA1-0042), bande (GA1-0042-B06), lot ou numéro de lot d'aliment.</span></div></div>
<div class="panel">
  <div class="row wrap" style="gap:8px"><input class="sel" style="flex:1;min-width:240px" value="GA1-0042-B07"><button class="sel dark">Rechercher</button><button class="sel">Exporter pour l'AGASA (CSV)</button><button class="sel">Exporter EPCIS 2.0 (JSON)</button></div>
  <span class="muted">3 lot(s) trouvé(s).</span>
  <table class="tbl"><thead><tr><th>Lot</th><th>Ferme</th><th>Cédé le</th><th>Poulets</th><th>Poids vif</th><th>Destinataire</th><th>Réception</th></tr></thead><tbody>
    <tr><td><span class="lotid" style="font-size:13px">GA1-0042-B07-L01</span></td><td>GA1-0042</td><td>28 oct. 2026</td><td>1 800</td><td>3 780 kg</td><td>Abattoir de Ntoum</td><td><span class="pill on">Validée</span></td></tr>
    <tr><td><span class="lotid" style="font-size:13px">GA1-0042-B07-L02</span></td><td>GA1-0042</td><td>30 oct. 2026</td><td>1 500</td><td>3 150 kg</td><td>Abattoir de Ntoum</td><td><span class="pill on">Validée</span></td></tr>
    <tr><td><span class="lotid" style="font-size:13px">GA1-0042-B07-L03</span></td><td>GA1-0042</td><td>2 nov. 2026</td><td>1 420</td><td>2 980 kg</td><td>Supermarché Mbolo</td><td><span class="pill off">En attente</span></td></tr>
  </tbody></table>
  <div class="note">EPCIS 2.0 est le format international GS1 d'échange des événements de traçabilité. Le fichier contient, pour chaque lot : cession, transport, réception, transformation et contrôle du distributeur.</div>
</div>`;
  return { rouleau, reserve, rapports, epcis };
}

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
  const m = await mocks();
  const screens = [
    // Nouveaux écrans à valider
    { g: 'À valider', t: 'N1 · Étiquettes QR pré-signées (DGE, agent)', u: U.dge, r: '/fermes', vp: W, mock: ['.main', m.rouleau] },
    { g: 'À valider', t: 'N2 · Mes étiquettes QR (éleveur, hors ligne)', u: U.eleveur, r: '/plus', vp: M, mockRoot: m.reserve },
    { g: 'À valider', t: 'N3 · Rapports : envoi automatique par e-mail', u: U.dge, r: '/rapports', vp: W, mock: ['.main', m.rapports] },
    { g: 'À valider', t: 'N4 · Rappel de lot : export EPCIS 2.0', u: U.dge, r: '/tracer', vp: W, mock: ['.main', m.epcis] },
    // Écrans existants
    { g: 'Éleveur', t: 'Connexion', u: null, r: '/', vp: M },
    { g: 'Éleveur', t: 'Accueil de la bande', u: U.eleveur, r: '/', vp: M },
    { g: 'Éleveur', t: 'Fiche du jour', u: U.eleveur, r: '/fiche', vp: M },
    { g: 'Éleveur', t: 'Bandes', u: U.eleveur, r: '/bandes', vp: M },
    { g: 'Éleveur', t: 'Lots cédés', u: U.eleveur, r: '/lots', vp: M },
    { g: 'Éleveur', t: 'Plus', u: U.eleveur, r: '/plus', vp: M },
    { g: 'Éleveur', t: 'Biosécurité', u: U.eleveur, r: '/biosecurite', vp: M },
    { g: 'Éleveur', t: 'Vaccinations', u: U.eleveur, r: '/vaccinations', vp: M },
    { g: 'Opérateur', t: 'Réception des lots', u: U.operateur, r: '/', vp: M },
    { g: 'Public', t: 'Statistiques publiques', u: null, r: '/statistiques', vp: M },
    { g: 'Pilotage', t: 'Vue nationale', u: U.dge, r: '/national', vp: W },
    { g: 'Pilotage', t: 'Registre des fermes', u: U.dge, r: '/fermes', vp: W },
    { g: 'Pilotage', t: 'Classement des fermes', u: U.dge, r: '/classement', vp: W },
    { g: 'Pilotage', t: 'Économie de la filière', u: U.dge, r: '/economie', vp: W },
    { g: 'Pilotage', t: 'Alertes sanitaires', u: U.vet, r: '/alertes', vp: W },
    { g: 'Pilotage', t: 'Diffusion des statistiques', u: U.maedr, r: '/diffusion', vp: W },
    { g: 'Administration', t: 'Tableau de bord administrateur', u: U.admin, r: '/', vp: W },
    { g: 'Administration', t: 'Matrice des droits', u: U.admin, r: '/admin/droits', vp: W },
    { g: 'Administration', t: 'Paramètres', u: U.admin, r: '/parametres', vp: W },
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
    if (s.mock) await p.evaluate(([sel, html]) => { document.querySelector(sel).innerHTML = html; }, s.mock);
    if (s.mockRoot) await p.evaluate((html) => { const tb = document.querySelector('.tabbar'); const host = tb.parentElement; [...host.children].forEach((c) => { if (c !== tb) c.remove(); }); tb.insertAdjacentHTML('beforebegin', html); }, s.mockRoot);
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
  let out = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Origa — Écrans v1.2</title><style>*{box-sizing:border-box}body{margin:0;padding:60px;background:#DDE4E0;font-family:Inter,Arial,sans-serif;color:#10201A;width:max-content}
  h1.board{font-size:44px;font-weight:800;margin:0 0 6px;color:#0B3D2E}p.board{font-size:18px;color:#4A5A53;margin:0 0 40px}
  h2.grp{font-size:28px;font-weight:800;margin:50px 0 18px;color:#0B3D2E}.rowf{display:flex;gap:48px;align-items:flex-start}
  .cap{font-size:16px;font-weight:700;margin-bottom:10px;color:#10201A}.frame{position:relative;overflow:hidden;transform:translateZ(0);box-shadow:0 10px 40px rgba(11,61,46,.12)}.frame *{margin:0;padding:0;border:0 solid}</style></head><body>
  <h1 class="board">Origa · écrans v1.2</h1><p class="board">Première section : 4 nouveaux écrans à valider avant développement. Sections suivantes : écrans de l'application en service.</p>`;
  for (const g of groups) {
    out += `<h2 class="grp">${g}</h2><div class="rowf">`;
    for (const f of frames.filter((x) => x.g === g)) out += `<div><div class="cap">${f.t}</div><div class="frame" style="width:${f.vp.width}px;height:${f.h}px;background:${f.r.bg};font-family:${f.r.font};color:${f.r.color};font-size:${f.r.fs};line-height:${f.r.lh}">${f.r.html}</div></div>`;
    out += '</div>';
  }
  out += '</body></html>';
  fs.writeFileSync(OUT, out);
  console.log('→', OUT, Math.round(out.length / 1024) + ' Ko');
})();
