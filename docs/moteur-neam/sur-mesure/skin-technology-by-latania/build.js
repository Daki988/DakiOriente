// Construit le site sur mesure de Skin Technology by Latania dans neam-moteur/sites/skin-technology-by-latania/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { SK, PH, GAMMES, PRODUITS, CONCERNS, SOINS, AVIS } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', SK.slug);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');
const fcfa = (n) => n ? n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA' : 'Offert';
const G = Object.fromEntries(GAMMES.map((g) => [g[0], g]));
const CN = Object.fromEntries(CONCERNS);

const ICON = {
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  bag: 'M18 6h-2a4 4 0 0 0-8 0H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-6-2a2 2 0 0 1 2 2h-4a2 2 0 0 1 2-2zm6 16H6V8h2v2h2V8h4v2h2V8h2z',
  spark: 'M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z',
  leaf: 'M17 8C8 10 5.9 16.2 3.8 21.3l1.9.7.9-2.3c.5.2 1 .3 1.4.3C19 20 22 3 22 3c-1 2-8 2.3-13 3.3S2 11.5 2 13.5 3.8 17.3 3.8 17.3C7 8 17 8 17 8z',
  shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9z',
  user: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;

// Logo réel redessiné : écusson doré, tête d'aigle stylisée
const MARK = (s = 44) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3DD9A"/><stop offset=".5" stop-color="#C9A24A"/><stop offset="1" stop-color="#8E6A22"/></linearGradient></defs><path d="M24 3 43 10v13c0 11-8 19-19 22C13 42 5 34 5 23V10z" fill="none" stroke="url(#gd)" stroke-width="2.4" stroke-linejoin="round"/><path d="M12 30c1-9 7-16 17-17 4 0 8 2 10 5-3-1-6-1-8 1 3 0 5 2 5 4-3-1-6 0-8 2 2 1 3 3 3 5-4-2-9-2-13 1 0-2 1-4 2-5-3 1-6 2-8 4z" fill="url(#gd)"/><circle cx="31" cy="18.5" r="1.4" fill="#0E0D0C"/></svg>`;
const LOGO = `<span class="mk">${MARK()}</span><span class="t"><b>SKIN</b><i>TECHNOLOGY</i><em>by Latania</em></span>`;

// Flacon dessiné (produits de la marque)
const bottle = (shape, col, label) => {
  const dark = col === '#1A1816';
  const lab = `<rect x="22" y="58" width="56" height="34" rx="3" fill="${dark ? '#C9A24A' : '#0E0D0C'}"/><text x="50" y="72" text-anchor="middle" font-family="Jost,Arial" font-size="7.5" letter-spacing="1.5" fill="${dark ? '#0E0D0C' : '#E6CB86'}">SKIN TECH</text><text x="50" y="84" text-anchor="middle" font-family="Jost,Arial" font-size="6.5" letter-spacing="1" fill="${dark ? '#0E0D0C' : '#fff'}">${esc(label.toUpperCase())}</text>`;
  const S = {
    drop: `<rect x="40" y="10" width="20" height="16" rx="8" fill="#0E0D0C"/><rect x="44" y="24" width="12" height="10" fill="#C9A24A"/><rect x="26" y="34" width="48" height="80" rx="10" fill="${col}"/>${lab}`,
    jar: `<rect x="18" y="36" width="64" height="16" rx="4" fill="#C9A24A"/><rect x="14" y="50" width="72" height="56" rx="12" fill="${col}"/>${lab.replace(/y="58"/, 'y="62"').replace(/y="72"/, 'y="76"').replace(/y="84"/, 'y="88"')}`,
    tube: `<path d="M30 14h40l-6 92H36z" fill="${col}"/><rect x="38" y="104" width="24" height="12" rx="2" fill="#C9A24A"/>${lab.replace('width="56"', 'width="40"').replace('x="22"', 'x="30"')}`,
    pump: `<rect x="44" y="6" width="22" height="6" rx="3" fill="#0E0D0C"/><rect x="47" y="10" width="6" height="14" fill="#0E0D0C"/><rect x="40" y="22" width="20" height="10" rx="2" fill="#C9A24A"/><rect x="24" y="32" width="52" height="84" rx="12" fill="${col}"/>${lab}`,
    bar: `<rect x="12" y="52" width="76" height="46" rx="18" fill="${col}"/><rect x="26" y="66" width="48" height="18" rx="9" fill="none" stroke="${dark ? '#C9A24A' : '#0E0D0C'}" stroke-width="1.4"/><text x="50" y="78" text-anchor="middle" font-family="Jost,Arial" font-size="7" letter-spacing="1.5" fill="${dark ? '#C9A24A' : '#0E0D0C'}">SKIN TECH</text>`,
  };
  return `<svg viewBox="0 0 100 120" aria-hidden="true">${S[shape]}<ellipse cx="50" cy="118" rx="34" ry="2" fill="rgba(0,0,0,.08)"/></svg>`;
};

const NAV = [['index.html', 'Accueil'], ['diagnostic.html', 'Diagnostic'], ['produits.html', 'Produits'], ['soins.html', 'Soins'], ['maison.html', 'La maison'], ['contact.html', 'Showroom']];
const HOURS = SK.hours.map(([d, h]) => `${d} · ${h}`);

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'BeautySalon', name: SK.name, founder: SK.founder, telephone: ['+241' + SK.tel.replace(/\D/g, '').replace(/^0/, ''), '+241' + SK.tel2.replace(/\D/g, '').replace(/^0/, '')], email: SK.mail, address: { '@type': 'PostalAddress', streetAddress: SK.addr, addressLocality: 'Akanda', addressRegion: 'Estuaire', addressCountry: 'GA' }, geo: { '@type': 'GeoCoordinates', latitude: SK.geo[0], longitude: SK.geo[1] }, openingHours: 'Mo-Sa 09:00-19:00', sameAs: [`https://www.instagram.com/${SK.ig}/`, `https://www.tiktok.com/@${SK.tt}`] };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${SK.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${SK.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${PH.glow}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@300;400;500;600&family=Allura&display=swap" rel="stylesheet">
<link rel="stylesheet" href="skin.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<div class="top"><div class="wrap"><span>Showroom Beaulieu, Angondjé · ${HOURS[0]}</span><a href="https://wa.me/${SK.wa}" target="_blank" rel="noopener">WhatsApp ${SK.tel2}</a></div></div>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="Skin Technology by Latania, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="rendez-vous.html">Prendre rendez-vous</a></nav>
<a class="selb" href="produits.html#sel" aria-label="Ma sélection">${ic('bag', 20)}<span data-count>0</span></a><a class="btn g hcta" href="rendez-vous.html">Rendez-vous</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo" href="index.html">${LOGO}</a><p>Soin, réparation et rajeunissement de la peau. Nos produits et nos soins sont pensés pour les peaux noires et métissées.</p><div class="soc" data-soc></div></div>
<div><h5>Showroom</h5><p>${SK.addr}<br>${SK.city}</p><p><a href="contact.html">Plan d'accès</a> · <a href="galerie.html">Galerie</a></p></div>
<div><h5>Horaires</h5><p>${HOURS.join('<br>')}</p></div>
<div><h5>Contact</h5><p><a href="${telHref(SK.tel)}">${SK.tel}</a><br><a href="${telHref(SK.tel2)}">${SK.tel2}</a> (WhatsApp)<br><a href="mailto:${SK.mail}">${SK.mail}</a></p></div>
<div class="cp">© 2026 ${SK.name} · Akanda, Gabon · Les résultats varient selon les peaux. En cas de doute, demandez un diagnostic.</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.SK=${JSON.stringify({ slug: SK.slug, wa: SK.wa, p: Object.fromEntries(PRODUITS.map(([id, n, g, f, p]) => [id, [n, G[g][1], f, p]])), s: Object.fromEntries(SOINS.map(([id, n, d, p]) => [id, [n, d, p]])) })}</script><script src="skin.js"></script>
<script src="../../assets/reco.js" data-slug="${SK.slug}" data-wa="${SK.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const PT = (crumb, h1, p) => `<section class="pt"><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div></section>`;
const CTA = `<section class="cta"><div class="wrap"><div><span class="tag">Premier rendez-vous</span><h2>Votre peau mérite un <em>diagnostic</em></h2><p>Offert avant votre premier soin : nous analysons votre peau et vous proposons une routine adaptée.</p></div><div class="row"><a class="btn g" href="rendez-vous.html?soin=diagnostic">Réserver mon diagnostic</a><a class="btn line light" href="diagnostic.html">Faire le test en ligne</a></div></div></section>`;
const prod = ([id, n, g, f, p, sh, cs]) => `<article class="pr" data-g="${g}" data-c="${cs.join(' ')}"><div class="vis" style="--gc:${G[g][3]}">${bottle(sh, G[g][3], G[g][1])}<span class="gm">${G[g][1]}</span></div><h3>${n}</h3><p>${f} · ${cs.map((c) => CN[c]).join(', ')}</p><div class="pb"><b>${fcfa(p)}</b><button class="add" data-add="${id}" aria-label="Ajouter ${esc(n)} à ma sélection">+ Ajouter</button></div></article>`;
const soin = ([id, n, d, p, t]) => `<article class="so" id="${id}"><div><span class="du">${ic('clock', 14)} ${d}</span><h3>${n}</h3><p>${t}</p></div><div class="sp"><b>${fcfa(p)}</b><a class="btn line sm" href="rendez-vous.html?soin=${id}">Réserver</a></div></article>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'Soin et rajeunissement de la peau', active: 'index.html',
  desc: 'Skin Technology by Latania : produits de soin et institut pour les peaux noires et métissées. Taches, imperfections, éclat, anti-âge. Showroom au Beaulieu, Angondjé.',
  body: `<section class="hero"><div class="wrap"><div class="tx"><span class="tag">Showroom Beaulieu · Angondjé</span><h1>La science<br>de votre <em>éclat.</em></h1><p>Soin, réparation et rajeunissement de la peau. Des produits et des soins experts pensés pour les peaux noires et métissées.</p>
<div class="row"><a class="btn g" href="diagnostic.html">Faire mon diagnostic</a><a class="btn line light" href="produits.html">Découvrir les produits</a></div>
<ul class="hl"><li><b>5</b> gammes de soin</li><li><b>8</b> soins à l'institut</li><li><b>1</b> diagnostic offert</li></ul></div>
<div class="vis"><span class="halo"></span><img src="${PH.hero}" alt="Femme à la peau lumineuse"><span class="badge">${MARK(30)}<em>Peaux noires<br>et métissées</em></span></div></div></section>
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Nos gammes</span><h2>Un soin pour chaque <em>besoin</em></h2></div><a class="btn line" href="produits.html">Tous les produits</a></div>
<div class="gms">${GAMMES.map(([id, n, t, c]) => `<a class="gmc" href="produits.html?gamme=${id}" style="--gc:${c}"><span class="dot"></span><h3>${n}</h3><p>${t}</p><i>Voir la gamme →</i></a>`).join('')}</div></div></section>
<section class="sec dk"><div class="wrap split"><img src="${PH.curls}" alt="" loading="lazy"><div><span class="tag">Diagnostic en ligne</span><h2>Quelle routine pour <em>votre peau</em> ?</h2><p class="lead">Quatre questions sur votre type de peau, vos préoccupations et votre âge : nous vous proposons une routine matin et soir, et le soin institut le plus adapté.</p><ol class="steps"><li>Type de peau</li><li>Préoccupation</li><li>Sensibilité</li><li>Âge</li></ol><a class="btn g" href="diagnostic.html">Commencer le test</a></div></div></section>
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Les incontournables</span><h2>Nos best-sellers</h2></div><a class="btn line" href="produits.html">La boutique</a></div>
<div class="prs">${['serum-clarifiant', 'creme-nuit-caviar', 'serum-pure', 'lait-corps'].map((id) => prod(PRODUITS.find((p) => p[0] === id))).join('')}</div></div></section>
<section class="sec nude"><div class="wrap split rev"><div><span class="tag">À l'institut</span><h2>Des soins <em>experts</em></h2><p class="lead">Nettoyage profond, soin anti-taches, peeling, microneedling, lift caviar : chaque soin commence par l'analyse de votre peau.</p><ul class="mini">${SOINS.slice(1, 6).map(([id, n, d, p]) => `<li><a href="soins.html#${id}">${n}</a><span>${d} · ${fcfa(p)}</span></li>`).join('')}</ul><a class="btn g" href="soins.html">Tous les soins</a></div><img src="${PH.cream}" alt="Application d'un soin sur le visage" loading="lazy"></div></section>
<section class="sec"><div class="wrap"><span class="tag">Elles en parlent</span><h2>Avis clientes</h2><div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
${CTA}`,
}));

// ---------- Diagnostic ----------
const Q = [
  ['type', 'Quel est votre type de peau ?', [['seche', 'Sèche', 'Tiraillements, peau qui pèle'], ['mixte', 'Mixte', 'Brillances sur la zone T'], ['grasse', 'Grasse', 'Brillances, pores visibles'], ['normale', 'Normale', 'Ni grasse ni sèche']]],
  ['concern', 'Votre préoccupation principale ?', CONCERNS.map(([id, n]) => [id, n, { taches: 'Taches, teint irrégulier', imperfections: 'Boutons, points noirs', eclat: 'Peau fatiguée, sans éclat', rides: 'Ridules, relâchement', secheresse: 'Inconfort, peau rêche' }[id]])],
  ['sens', 'Votre peau est-elle sensible ?', [['non', 'Non', 'Elle tolère bien les soins'], ['oui', 'Oui', 'Rougeurs, picotements, réactions']]],
  ['age', 'Votre tranche d\'âge ?', [['25', 'Moins de 25 ans', ''], ['40', '25 à 40 ans', ''], ['plus', 'Plus de 40 ans', '']]],
];
pages.push(page('diagnostic.html', {
  title: 'Diagnostic de peau en ligne', active: 'diagnostic.html',
  desc: 'Quatre questions pour connaître la routine Skin Technology by Latania adaptée à votre peau : nettoyant, sérum, crème, soin institut.',
  body: `${PT('Diagnostic', 'Diagnostic de peau', 'Quatre questions, une routine personnalisée. Le diagnostic à l\'institut reste offert pour aller plus loin.')}
<section class="sec dg"><div class="wrap"><div class="quiz" data-quiz><div class="prog"><span data-prog></span></div>
${Q.map(([k, q, opts], i) => `<fieldset class="qs" data-q="${i}"${i ? ' hidden' : ''}><legend><small>Question ${i + 1} / ${Q.length}</small>${q}</legend><div class="ans">${opts.map(([v, n, d]) => `<label><input type="radio" name="${k}" value="${v}"><span><b>${n}</b>${d ? `<small>${d}</small>` : ''}</span></label>`).join('')}</div>${i ? '<button type="button" class="back" data-back>← Question précédente</button>' : ''}</fieldset>`).join('')}
<div class="res" data-res hidden></div></div></div></section>
${CTA}`,
}));

// ---------- Produits ----------
pages.push(page('produits.html', {
  title: 'Nos produits', active: 'produits.html',
  desc: 'Gammes Clarifiante, Caviar, Pure, Hydra et Corps : les produits Skin Technology by Latania, à réserver en ligne et à retirer au showroom ou en livraison.',
  body: `${PT('Produits', 'Nos produits', 'Composez votre sélection : nous la préparons au showroom ou la livrons à Libreville et Akanda.')}
<section class="sec shop"><div class="wrap"><div class="flt" data-flt><button class="on" data-f="">Tout</button>${GAMMES.map(([id, n]) => `<button data-f="${id}">${n}</button>`).join('')}<label class="fsel"><span class="sr">Préoccupation</span><select data-fc><option value="">Toutes les préoccupations</option>${CONCERNS.map(([id, n]) => `<option value="${id}">${n}</option>`).join('')}</select></label></div>
<p class="cnt" data-nb></p><div class="prs all">${PRODUITS.map(prod).join('')}</div>
<div class="sel" id="sel"><div><h2>Ma sélection</h2><div data-list><p class="empty">Votre sélection est vide. Ajoutez des produits ou faites le <a href="diagnostic.html">diagnostic</a>.</p></div></div>
<form class="ord" data-order novalidate><div class="tot"><span>Total</span><b data-total>0 FCFA</b></div><div class="chips"><label><input type="radio" name="mode" value="Retrait au showroom" checked><span>Retrait au showroom</span></label><label><input type="radio" name="mode" value="Livraison Libreville / Akanda (+2 000 FCFA)"><span>Livraison (+2 000 FCFA)</span></label></div>
<label class="fld"><span>Prénom</span><input name="nom" required autocomplete="given-name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label><label class="fld" data-adr hidden><span>Adresse de livraison</span><input name="adr" placeholder="Quartier, repère"></label>
<button class="btn g" type="submit">Commander sur WhatsApp</button><p class="note">Paiement au retrait ou à la livraison. Prix indicatifs.</p></form></div></div></section>`,
}));

// ---------- Soins ----------
pages.push(page('soins.html', {
  title: 'Soins à l\'institut', active: 'soins.html',
  desc: 'Diagnostic de peau, nettoyage profond, soin anti-taches, anti-imperfections, peeling, microneedling, lift caviar et soins du corps : tarifs et durées.',
  body: `${PT('Soins', 'Soins à l\'institut', 'Chaque soin commence par l\'analyse de votre peau. Tarifs indicatifs.')}
<section class="sec"><div class="wrap sgrid"><div class="sos">${SOINS.map(soin).join('')}</div><aside class="sac"><img src="${PH.mask}" alt="Masque de soin du visage" loading="lazy"><div><h3>Les cures</h3><p>Pour les taches et les imperfections, une cure de 4 à 6 séances donne les meilleurs résultats. Demandez votre programme lors du diagnostic.</p><a class="btn g sm" href="rendez-vous.html?soin=diagnostic">Diagnostic offert</a></div></aside></div></section>
${CTA}`,
}));

// ---------- Rendez-vous ----------
pages.push(page('rendez-vous.html', {
  title: 'Prendre rendez-vous', active: '',
  desc: 'Réservez votre soin chez Skin Technology by Latania : choisissez le soin, le jour et l\'heure, confirmation sur WhatsApp.',
  body: `${PT('Rendez-vous', 'Prendre rendez-vous', 'Choisissez votre soin et votre créneau : nous confirmons sur WhatsApp.')}
<section class="bk"><div class="wrap"><form data-rdv novalidate>
<fieldset class="stp"><legend><b>1</b>Votre soin</legend><div class="opts">${SOINS.map(([id, n, d, p], i) => `<label><input type="radio" name="soin" value="${id}"${i === 0 ? ' checked' : ''}><span><b>${n}</b><small>${d} · ${fcfa(p)}</small></span></label>`).join('')}</div></fieldset>
<fieldset class="stp"><legend><b>2</b>Jour et heure</legend><div class="days" data-days></div><p class="lbl">Créneaux disponibles</p><div class="slots" data-slots></div></fieldset>
<fieldset class="stp"><legend><b>3</b>Vous</legend><div class="g2"><label class="fld"><span>Prénom</span><input name="nom" required autocomplete="given-name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<p class="lbl">Première visite ?</p><div class="chips"><label><input type="radio" name="first" value="oui" checked><span>Oui</span></label><label><input type="radio" name="first" value="non"><span>Non, je suis déjà cliente</span></label></div></fieldset></form>
<aside class="sum"><h2>Votre rendez-vous</h2><div class="ln"><span>Soin</span><b data-s="soin"></b></div><div class="ln"><span>Durée</span><b data-s="duree"></b></div><div class="ln"><span>Jour</span><b data-s="jour"></b></div><div class="ln"><span>Heure</span><b data-s="slot"></b></div>
<div class="tot"><span>Tarif</span><b data-s="prix"></b></div><p class="tip" data-s="tip"></p><button class="btn g" data-send>Confirmer sur WhatsApp</button><p class="note">Merci de venir sans maquillage. Annulation gratuite jusqu'à la veille.</p></aside></div></section>`,
}));

// ---------- La maison ----------
pages.push(page('maison.html', {
  title: 'La maison', active: 'maison.html',
  desc: `Skin Technology by Latania, fondée par ${SK.founder} : une marque et un institut dédiés au soin, à la réparation et au rajeunissement de la peau.`,
  body: `${PT('La maison', 'La maison', 'Une marque gabonaise de soin de la peau, et un institut pour l\'accompagner.')}
<section class="sec"><div class="wrap split"><img src="${PH.glow}" alt="" loading="lazy"><div><span class="tag">La fondatrice</span><h2>${SK.founder}</h2><p class="lead">Passionnée par la peau et ses besoins, elle a créé Skin Technology by Latania pour offrir aux femmes des soins efficaces, adaptés aux peaux noires et métissées, et une vraie écoute.</p>
<blockquote class="q">« Une femme qui prend soin d'elle, c'est une femme pleine d'assurance. »</blockquote></div></div></section>
<section class="sec dk"><div class="wrap"><span class="tag">Nos engagements</span><h2>Soigner, réparer, <em>rajeunir</em></h2><div class="grid g3 why">
<div>${ic('user', 26)}<h3>Écoute</h3><p>Un diagnostic avant chaque soin et des conseils honnêtes, même quand le bon choix est de ne rien acheter.</p></div><div>${ic('leaf', 26)}<h3>Respect de la peau</h3><p>Des formules qui respectent la barrière cutanée : pas de produits agressifs, pas de promesses miracles.</p></div><div>${ic('shield', 26)}<h3>Suivi</h3><p>Un suivi sur WhatsApp entre deux rendez-vous pour ajuster votre routine.</p></div></div></div></section>
<section class="sec"><div class="wrap split rev"><div><span class="tag">Le showroom</span><h2>Beaulieu, <em>1er étage</em></h2><p class="lead">Tous nos produits sont disponibles au showroom du Beaulieu, à Angondjé, en face de la salle des fêtes. Venez découvrir les textures et demander conseil.</p><a class="btn g" href="contact.html">Venir au showroom</a></div><img src="${PH.robe}" alt="" loading="lazy"></div></section>
${CTA}`,
}));

// ---------- Galerie ----------
const GAL = [[PH.glow, 'Éclat'], [PH.cream, 'Soin du visage'], [PH.mask, 'Masque'], [PH.touch, 'Routine'], [PH.curls, 'Peau nette'], [PH.robe, 'Moment pour soi']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: '',
  desc: 'Skin Technology by Latania en images : soins, routines et peaux lumineuses.',
  body: `${PT('Galerie', 'Galerie', 'Nos soins et nos routines en images. Suivez-nous sur Instagram et TikTok.')}
<section class="sec"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${p}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles de l'institut et des clientes (avec leur accord).</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => p))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Showroom et contact', active: 'contact.html',
  desc: `Skin Technology by Latania, ${SK.addr}, ${SK.city}. Tél. ${SK.tel} · ${SK.tel2}. ${SK.mail}.`,
  body: `${PT('Showroom', 'Venir au showroom', `${SK.addr}, ${SK.city}.`)}
<section class="wrap ctg"><div><div class="info">
<div>${ic('pin', 22)}<h2>Adresse</h2><p>${SK.addr}<br>${SK.city}</p></div>
<div>${ic('phone', 22)}<h2>Téléphone</h2><p><a href="${telHref(SK.tel)}">${SK.tel}</a><br><a href="${telHref(SK.tel2)}">${SK.tel2}</a> (WhatsApp)</p></div>
<div>${ic('clock', 22)}<h2>Horaires</h2><p>${HOURS.join('<br>')}</p></div>
<div>${ic('mail', 22)}<h2>E-mail</h2><p><a href="mailto:${SK.mail}">${SK.mail}</a></p></div></div>
<div class="map"><iframe title="Plan d'accès au showroom Skin Technology by Latania" src="https://www.google.com/maps?q=${SK.geo.join(',')}&z=16&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Une question ?</h2><p>Conseil produit, partenariat, revendeuse : écrivez-nous. Pour un soin, <a href="rendez-vous.html">prenez rendez-vous</a>.</p>
<div class="g2"><label class="fld"><span>Prénom</span><input name="nom" required autocomplete="given-name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label>
<div class="row"><button class="btn g" type="submit">Envoyer sur WhatsApp</button><a class="btn line" href="mailto:${SK.mail}">Par e-mail</a></div></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#0E0D0C"/><g transform="translate(4 4) scale(.833)">${MARK(48).replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</g></svg>`);
for (const f of ['skin.css', 'skin.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
