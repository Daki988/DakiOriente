// Construit le site sur mesure d'AFRAM (refonte « grande école de commerce ») dans neam-moteur/sites/afram/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { AF, PH, DOM, PROGRAMMES, FRAIS, DOSSIER, NEWS } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', AF.slug);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
const DN = Object.fromEntries(DOM);

const ICON = {
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  search: 'M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 14 15.5l.3.3v.8l5 5 1.5-1.5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z',
  arrow: 'M12 4l-1.4 1.4 5.6 5.6H4v2h12.2l-5.6 5.6L12 20l8-8z',
  cap: 'M12 3 1 9l11 6 9-4.9V17h2V9zm-7 9.2v4L12 20l7-3.8v-4L12 16z',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm2 16H8v-2h8zm0-4H8v-2h8zm-3-5V3.5L18.5 9z',
  build: 'M12 7V3H2v18h20V7zM6 19H4v-2h2zm0-4H4v-2h2zm0-4H4V9h2zm0-4H4V5h2zm4 12H8v-2h2zm0-4H8v-2h2zm0-4H8V9h2zm0-4H8V5h2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8zm-2-8h-2v2h2zm0 4h-2v2h2z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-3a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4zM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16 16 0 0 0 0 4zm.8 2h3a15.7 15.7 0 0 0 1.4 3.6A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.4-3.6C8 5.6 7.6 6.8 8.1 8zM12 20c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.3 5.6c.6-1.1 1.1-2.4 1.4-3.6h3a8 8 0 0 1-4.4 3.6zm1.7-5.6a16 16 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4z',
  users: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-1 .1 1.2.8 2 1.9 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z',
  screen: 'M21 3H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7v2H8v2h8v-2h-2v-2h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 13H3V5h18z',
  book: 'M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 4h5v8l-2.5-1.5L6 12z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  handshake: 'M12.2 5.2 9 8.4a1.5 1.5 0 0 0 2.1 2.1l2-2 5.5 5.5 1.4-1.4V6.2l-2-2h-3.6zM3.4 12.6l1.4-1.4 3.6-3.6-2.1-2.1L1 10.8zm8.8 6.4 1.4-1.4-5-5-1.4 1.4 1.4 1.4-1.4 1.4 1.4 1.4 1.4-1.4 1.4 1.4zm4.2-4.2-1.4 1.4-1.4-1.4 1.4-1.4z',
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;

const MENU = [
  ['ecole.html', 'L\'École', [['ecole.html', 'Qui sommes-nous ?'], ['ecole.html#vision', 'Vocation, vision, mission'], ['ecole.html#campus', 'Nos campus'], ['actualites.html', 'Actualités']]],
  ['programmes.html', 'Programmes', [['programmes.html?niv=Bachelor', 'Bachelor (Licence)'], ['programmes.html?niv=Master', 'Masters'], ['entreprises.html#continue', 'Formation continue'], ['entreprises.html#certif', 'Certifications']]],
  ['admissions.html', 'Admissions', [['admissions.html', 'Comment candidater'], ['admissions.html#frais', 'Frais de scolarité'], ['admissions.html#simulateur', 'Simulateur de financement'], ['candidater.html', 'Candidater en ligne']]],
  ['entreprises.html', 'Entreprises', [['entreprises.html', 'Recruter nos talents'], ['entreprises.html#continue', 'Former vos équipes'], ['entreprises.html#contact', 'Devenir partenaire']]],
  ['vie-etudiante.html', 'Vie étudiante', [['vie-etudiante.html', 'Junior-Entreprise et associations'], ['vie-etudiante.html#engagements', 'Engagements solidaires'], ['vie-etudiante.html#alumni', 'Alumni'], ['galerie.html', 'Galerie']]],
];

function page(file, { title, desc, active, body, sub }) {
  const nav = MENU.map(([f, t, items]) => `<div class="mi${f === active ? ' on' : ''}"><a href="${f}"${f === active ? ' aria-current="page"' : ''}>${esc(t)}</a><div class="dd">${items.map(([h, l]) => `<a href="${h}">${esc(l)}</a>`).join('')}</div></div>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'CollegeOrUniversity', name: AF.long, alternateName: AF.name, url: 'https://' + AF.dom, foundingDate: '2003-03-28', telephone: '+241' + AF.tel.replace(/\D/g, '').replace(/^0/, ''), email: AF.mail, address: { '@type': 'PostalAddress', streetAddress: AF.addr, addressLocality: AF.city, addressCountry: 'GA' }, sameAs: [`https://www.facebook.com/${AF.fb}`, `https://www.linkedin.com/company/${AF.li}/`] };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${AF.name}, ${AF.long}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${AF.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${PH.hero}">
<link rel="icon" href="logo.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="afram.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<div class="ub"><div class="wrap"><nav aria-label="Accès rapides"><a href="vie-etudiante.html">Étudiants</a><a href="entreprises.html">Entreprises</a><a href="vie-etudiante.html#alumni">Alumni</a><a href="actualites.html">Actualités</a></nav><div><a href="${telHref(AF.tel)}">${ic('phone', 13)} ${AF.tel}</a><a href="contact.html">Nous contacter</a></div></div></div>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="AFRAM, accueil"><img src="logo.png" alt="AFRAM" width="62" height="53"><span>Académie Franco-Américaine<br>de Management</span></a>
<nav class="mn" aria-label="Menu principal">${nav}<a class="mnav-cta" href="candidater.html">Candidater</a></nav>
<div class="act"><a class="btn line sm" href="admissions.html#brochure">Brochure</a><a class="btn g sm" href="candidater.html">Candidater</a></div><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
${sub || ''}<main>${body}</main>
<section class="pre"><div class="wrap"><div><h2>Votre avenir commence ici.</h2><p>Bachelor, Master, formation continue : rejoignez une école habilitée et reconnue par l'État gabonais.</p></div><div class="row"><a class="btn g" href="candidater.html">Candidater</a><a class="btn ghost" href="admissions.html#brochure">Recevoir la brochure</a></div></div></section>
<footer class="ft"><div class="wrap">
<div class="fb"><img src="logo-blanc.png" alt="AFRAM" width="90" height="77"><p><b>${AF.long}</b><br>Établissement privé d'enseignement supérieur habilité et reconnu par l'État gabonais depuis 2003.</p><div class="soc" data-soc></div></div>
<div><h5>Programmes</h5>${PROGRAMMES.map((p) => `<a href="${p.id}.html">${esc(p.t.replace('Bachelor ', 'Bachelor · ').replace('Master ', 'Master · '))}</a>`).join('')}</div>
<div><h5>L'École</h5><a href="ecole.html">Qui sommes-nous ?</a><a href="ecole.html#campus">Nos campus</a><a href="admissions.html">Admissions</a><a href="entreprises.html">Entreprises</a><a href="vie-etudiante.html">Vie étudiante</a><a href="actualites.html">Actualités</a><a href="galerie.html">Galerie</a></div>
<div><h5>Contact</h5><p>${AF.addr}<br>${AF.repere}<br>${AF.city}, Gabon</p><p><a href="${telHref(AF.tel)}">${AF.tel}</a><br><a href="https://wa.me/${AF.wa}" target="_blank" rel="noopener">WhatsApp ${AF.waTxt}</a><br><a href="mailto:${AF.mail}">${AF.mail}</a></p><p>${AF.hours.map(([d, h]) => `${d} : ${h}`).join('<br>')}</p></div>
<div class="cp"><span>© 2026 ${AF.long}</span><span>${AF.base}</span></div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.AF=${JSON.stringify({ slug: AF.slug, wa: AF.wa, mail: AF.mail, frais: FRAIS, dossier: DOSSIER, progs: PROGRAMMES.map((p) => ({ id: p.id, niv: p.niv, dom: p.dom, t: p.t })) })}</script><script src="afram.js"></script>
<script src="../../assets/reco.js" data-slug="${AF.slug}" data-wa="${AF.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const PT = (crumbs, h1, p, ph) => `<section class="pt${ph ? ' ph' : ''}"${ph ? ` style="background-image:url(${ph})"` : ''}><div class="wrap"><div class="cr"><a href="index.html">Accueil</a>${crumbs.map(([h, t]) => ` <span>›</span> ${h ? `<a href="${h}">${t}</a>` : t}`).join('')}</div><h1>${h1}</h1>${p ? `<p>${p}</p>` : ''}</div></section>`;
const pcard = (p) => `<a class="pc" href="${p.id}.html" data-niv="${p.niv}" data-dom="${p.dom}"><div class="im"><img src="${p.ph}" alt="" loading="lazy"><span class="nv ${p.niv.toLowerCase()}">${p.niv}</span></div><div class="bd"><span class="dm">${DN[p.dom]}</span><h3>${esc(p.t)}</h3><p>${esc(p.a)}</p><ul><li>${ic('clock', 14)} ${p.dur}</li><li>${ic('cap', 14)} ${p.niv === 'Bachelor' ? 'Bac' : 'Bac + 3'} → ${p.niv === 'Bachelor' ? 'Bac + 3' : 'Bac + 5'}</li></ul><span class="go">Découvrir le programme ${ic('arrow', 16)}</span></div></a>`;
const FIG = `<section class="figs"><div class="wrap"><div><b data-count="20">20</b><small>+</small><span>ans d'excellence académique</span></div><div><b>2</b><span>sites au cœur de Libreville</span></div><div><b data-count="15">15</b><small>+</small><span>salles climatisées par site</span></div><div><b>${PROGRAMMES.length}</b><span>programmes Bachelor et Master</span></div></div></section>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'Business school à Libreville', active: '',
  desc: 'AFRAM, Académie Franco-Américaine de Management : business school habilitée et reconnue par l\'État gabonais. Bachelor et Master en management, droit, QHSE et informatique à Libreville.',
  body: `<section class="hero"><img class="bg" src="${PH.hero}" alt=""><div class="wrap"><span class="eyebrow">Business school · Libreville · depuis 2003</span><h1>Former les leaders<br>de demain, ici, au Gabon.</h1><p>L'exigence des business schools nord-américaines et européennes, au cœur de Libreville. Bachelor, Master, formation continue.</p>
<form class="finder" action="programmes.html" role="search"><b>Trouver mon programme</b><label><span>Je suis</span><select name="niv"><option value="Bachelor">Bachelier ou étudiant en licence</option><option value="Master">Titulaire d'une licence</option><option value="">Professionnel en activité</option></select></label><label><span>Domaine</span><select name="dom"><option value="">Tous les domaines</option>${DOM.map(([id, n]) => `<option value="${id}">${n}</option>`).join('')}</select></label><button class="btn g" type="submit">${ic('search', 18)} Rechercher</button></form></div></section>
${FIG}
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="kick">Nos programmes</span><h2>Une formation pour chaque ambition</h2></div><a class="lnk" href="programmes.html">Tous les programmes ${ic('arrow', 16)}</a></div>
<div class="lv"><a href="programmes.html?niv=Bachelor" class="lvc"><img src="${PH.equipe}" alt="" loading="lazy"><div><span>Bac → Bac + 3</span><h3>Bachelor</h3><p>Management des organisations, Droit, QHSE, Informatique.</p></div></a><a href="programmes.html?niv=Master" class="lvc"><img src="${PH.diplomee}" alt="" loading="lazy"><div><span>Bac + 3 → Bac + 5</span><h3>Masters</h3><p>Entrepreneuriat et innovation, Droit, QHSE, Informatique.</p></div></a><a href="entreprises.html#continue" class="lvc"><img src="${PH.bureau}" alt="" loading="lazy"><div><span>Cadres et salariés</span><h3>Formation continue</h3><p>Programmes sur mesure et certifications pour les professionnels.</p></div></a></div></div></section>
<section class="sec grey"><div class="wrap split"><div><span class="kick">Pourquoi AFRAM ?</span><h2>L'approche franco-américaine du management</h2><p class="lead">Créée en 2003 avec des spécialistes en sciences de gestion venus du Canada et de France, l'AFRAM offre sur place, à Libreville, des programmes conçus aux standards internationaux.</p>
<div class="why">${[['globe', 'Standards internationaux', 'Des programmes inspirés des business schools nord-américaines et européennes.'], ['build', 'Reconnue par l\'État', 'Établissement habilité et reconnu par l\'État gabonais.'], ['screen', 'Équipements modernes', 'Tableaux numériques tactiles, salle informatique, vidéoprojecteurs.'], ['book', 'Bibliothèque numérique', 'Accessible à tous les étudiants, enseignants et membres de l\'administration.']].map(([i, t, d]) => `<div>${ic(i, 24)}<h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div><img src="${PH.duo}" alt="Deux diplômées en toge" loading="lazy"></div></section>
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="kick">Programmes phares</span><h2>Bachelor et Masters</h2></div><div class="tg" role="tablist" data-ht><button class="on" data-n="Bachelor">Bachelor</button><button data-n="Master">Masters</button></div></div>
<div class="pcs" data-hp>${PROGRAMMES.map(pcard).join('')}</div></div></section>
<section class="quote"><div class="wrap"><blockquote>« Préparer des professionnels compétents et engagés pour répondre aux besoins des organisations et accomplir efficacement leurs responsabilités futures. »</blockquote><span>La vocation de l'AFRAM</span></div></section>
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="kick">Actualités</span><h2>La vie de l'École</h2></div><a class="lnk" href="actualites.html">Toutes les actualités ${ic('arrow', 16)}</a></div>
<div class="news">${NEWS.map(([k, t, c, ph]) => `<a class="nw" href="actualites.html"><img src="${ph}" alt="" loading="lazy"><span class="c">${c} · ${k}</span><h3>${esc(t)}</h3></a>`).join('')}</div></div></section>
<section class="sec grey"><div class="wrap adm"><div><span class="kick">Admissions</span><h2>Candidater en 4 étapes</h2><ol class="tl">${[['Choisissez votre programme', 'Bachelor, Master ou formation continue.'], ['Déposez votre dossier', 'En ligne ou au secrétariat, avec les pièces demandées.'], ['Entretien de motivation', 'Un échange avec l\'équipe pédagogique.'], ['Inscription', 'Frais administratifs, uniforme, et c\'est la rentrée.']].map(([t, d], i) => `<li><b>${i + 1}</b><div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}</ol><div class="row"><a class="btn g" href="candidater.html">Candidater en ligne</a><a class="btn line" href="admissions.html#frais">Frais de scolarité</a></div></div><img src="${PH.costume}" alt="Diplômé en toge" loading="lazy"></div></section>`,
}));

// ---------- Programmes ----------
pages.push(page('programmes.html', {
  title: 'Nos programmes', active: 'programmes.html',
  desc: 'Tous les programmes de l\'AFRAM : Bachelor (Licence) et Masters en management, droit, QHSE et informatique, formation continue et certifications.',
  sub: PT([[null, 'Programmes']], 'Nos programmes', 'Bachelor, Masters, formation continue : filtrez par niveau et par domaine.', PH.remise),
  body: `<section class="sec" style="padding-top:44px"><div class="wrap"><div class="flt" data-flt><div class="tg" role="tablist" aria-label="Niveau"><button data-n="">Tous les niveaux</button><button data-n="Bachelor">Bachelor</button><button data-n="Master">Masters</button></div>
<div class="tg" role="tablist" aria-label="Domaine"><button data-d="">Tous les domaines</button>${DOM.map(([id, n]) => `<button data-d="${id}">${n}</button>`).join('')}</div></div>
<p class="nb" data-nb></p><div class="pcs all">${PROGRAMMES.map(pcard).join('')}</div>
<div class="more2"><a href="entreprises.html#continue" class="mc">${ic('users', 28)}<div><h3>Formation continue</h3><p>Des programmes pour les cadres et salariés, sur mesure pour les entreprises.</p></div>${ic('arrow', 20)}</a><a href="entreprises.html#certif" class="mc">${ic('doc', 28)}<div><h3>Certifications</h3><p>Des certifications professionnelles courtes pour valider une compétence.</p></div>${ic('arrow', 20)}</a></div></div></section>`,
}));

// ---------- Fiches programmes ----------
for (const p of PROGRAMMES) {
  const f = FRAIS[p.niv];
  pages.push(page(`${p.id}.html`, {
    title: p.t, active: 'programmes.html',
    desc: `${p.t} à l'AFRAM, Libreville : ${p.a} Durée ${p.dur}. Admission : ${p.adm}.`,
    sub: `<section class="ph2" style="background-image:url(${p.ph})"><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> <span>›</span> <a href="programmes.html">Programmes</a> <span>›</span> ${p.niv}</div><span class="nv ${p.niv.toLowerCase()}">${p.niv} · ${DN[p.dom]}</span><h1>${esc(p.t)}</h1><p>${esc(p.a)}</p></div></section>
<section class="kf"><div class="wrap"><div><span>Niveau</span><b>${p.niv === 'Bachelor' ? 'Bac + 3' : 'Bac + 5'}</b></div><div><span>Durée</span><b>${p.dur}</b></div><div><span>Admission</span><b>${p.niv === 'Bachelor' ? 'Après le bac' : 'Après une licence'}</b></div><div><span>Rythme</span><b>Temps plein, stages</b></div><div><span>Lieu</span><b>Libreville, Batterie IV</b></div></div></section>`,
    body: `<section class="sec pg"><div class="wrap"><div><nav class="ptabs" data-ptabs aria-label="Sections du programme">${[['presentation', 'Présentation'], ['programme', 'Programme'], ['admission', 'Admission'], ['frais', 'Frais'], ['debouches', 'Débouchés']].map(([id, t], i) => `<a href="#${id}"${i ? '' : ' class="on"'}>${t}</a>`).join('')}</nav>
<section id="presentation" class="blk"><h2>Présentation</h2><p class="lead">${esc(p.a)} Le ${p.t.split(' ')[0]} ${p.t.replace(/^(Bachelor|Master) /, '')} allie enseignements fondamentaux, cas pratiques et immersion en entreprise, avec des intervenants issus du monde professionnel.</p>
<ul class="chk">${['Pédagogie active : études de cas, projets, présentations', 'Stages en entreprise chaque année', 'Anglais professionnel tout au long du cursus', 'Accès à la bibliothèque numérique et à la salle informatique'].map((x) => `<li>${ic('check', 18)} ${x}</li>`).join('')}</ul></section>
<section id="programme" class="blk"><h2>Programme</h2><div class="acc">${p.an.map(([y, mods], i) => `<details${i ? '' : ' open'}><summary>${y}<i aria-hidden="true"></i></summary><ul>${mods.map((m) => `<li>${m}</li>`).join('')}</ul></details>`).join('')}</div><p class="note">Programme indicatif, susceptible d'évoluer.</p></section>
<section id="admission" class="blk"><h2>Admission</h2><p><b>Conditions :</b> ${esc(p.adm)}.</p><h3>Pièces du dossier</h3><ul class="chk">${DOSSIER[p.niv].map((x) => `<li>${ic('check', 18)} ${x}</li>`).join('')}</ul></section>
<section id="frais" class="blk"><h2>Frais de scolarité</h2><table class="tb"><thead><tr><th scope="col">Étudiants</th><th scope="col">Frais administratifs</th><th scope="col">Scolarité annuelle</th><th scope="col">Uniforme</th></tr></thead><tbody><tr><th scope="row">Non boursiers</th><td>${fcfa(f.admin.non)}</td><td>${fcfa(f.scol)}${p.niv === 'Bachelor' ? `<small>soit ${fcfa(f.scol / f.mois)} × ${f.mois} mois</small>` : '<small>paiement mensuel possible</small>'}</td><td>${fcfa(FRAIS.uniforme)}<small>paiement en tranches possible</small></td></tr><tr><th scope="row">Boursiers</th><td>${fcfa(f.admin.boursier)}</td><td>—</td><td>${fcfa(FRAIS.uniforme)}</td></tr></tbody></table><p class="note">Conditions financières publiées par l'AFRAM, à confirmer pour l'année en cours. <a href="admissions.html#simulateur">Simuler mon budget</a>.</p></section>
<section id="debouches" class="blk"><h2>Débouchés</h2><div class="jobs">${p.deb.map((d) => `<span>${d}</span>`).join('')}</div></section></div>
<aside class="side"><div class="sc"><h3>Intéressé(e) par ce programme ?</h3><a class="btn g" href="candidater.html?prog=${p.id}">Candidater</a><a class="btn line" href="admissions.html?prog=${p.id}#brochure">Recevoir la brochure</a><a class="btn line" href="https://wa.me/${AF.wa}?text=${encodeURIComponent('Bonjour AFRAM, j\'ai une question sur le ' + p.t + '.')}" target="_blank" rel="noopener">Poser une question</a><p>${ic('phone', 14)} ${AF.tel}</p></div>
<div class="sc rel"><h4>Autres programmes ${p.niv === 'Bachelor' ? 'Bachelor' : 'Master'}</h4>${PROGRAMMES.filter((x) => x.niv === p.niv && x.id !== p.id).map((x) => `<a href="${x.id}.html">${esc(x.t)}</a>`).join('')}</div></aside></div></section>`,
  }));
}

// ---------- Admissions ----------
pages.push(page('admissions.html', {
  title: 'Admissions', active: 'admissions.html',
  desc: 'Admissions à l\'AFRAM : étapes, pièces du dossier, frais de scolarité Bachelor et Master, simulateur de financement et brochure.',
  sub: PT([[null, 'Admissions']], 'Admissions', 'Rejoindre l\'AFRAM : les étapes, le dossier, les frais et le financement.', PH.duo),
  body: `<section class="sec"><div class="wrap"><span class="kick">Le parcours</span><h2>Comment candidater ?</h2><ol class="steps">${[['Choisir', 'Votre programme et votre niveau d\'entrée.'], ['Constituer', 'Votre dossier avec les pièces demandées.'], ['Déposer', 'En ligne ou au secrétariat de Batterie IV.'], ['Échanger', 'Lors d\'un entretien de motivation.'], ['S\'inscrire', 'Frais administratifs et uniforme réglés.']].map(([t, d], i) => `<li><b>0${i + 1}</b><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol></div></section>
<section class="sec grey"><div class="wrap two"><div><span class="kick">Le dossier</span><h2>Pièces à fournir</h2><div class="tg" role="tablist" data-dt><button class="on" data-n="Bachelor">Bachelor</button><button data-n="Master">Master</button></div><ul class="chk dos" data-dos></ul></div>
<div id="frais"><span class="kick">Frais de scolarité</span><h2>Les conditions financières</h2><table class="tb"><thead><tr><th scope="col"></th><th scope="col">Bachelor</th><th scope="col">Master</th></tr></thead><tbody>
<tr><th scope="row">Frais administratifs (non boursiers)</th><td>${fcfa(FRAIS.Bachelor.admin.non)}</td><td>${fcfa(FRAIS.Master.admin.non)}</td></tr><tr><th scope="row">Frais administratifs (boursiers)</th><td>${fcfa(FRAIS.Bachelor.admin.boursier)}</td><td>${fcfa(FRAIS.Master.admin.boursier)}</td></tr>
<tr><th scope="row">Scolarité annuelle (non boursiers)</th><td>${fcfa(FRAIS.Bachelor.scol)}<small>110 000 FCFA × 9 mois</small></td><td>${fcfa(FRAIS.Master.scol)}<small>paiement mensuel possible</small></td></tr><tr><th scope="row">Uniforme complet</th><td colspan="2">${fcfa(FRAIS.uniforme)} · costume, chemise, polo, cravate, pantalon ou jupe, blouson · paiement en tranches possible</td></tr></tbody></table><p class="note">Conditions publiées par l'AFRAM, à confirmer pour l'année en cours.</p></div></div></section>
<section class="sec" id="simulateur"><div class="wrap sim"><div><span class="kick">Simulateur</span><h2>Mon budget de l'année</h2><p class="lead">Choisissez votre niveau et votre statut : nous calculons le montant à prévoir à l'inscription, puis chaque mois.</p>
<div class="tg" role="tablist" data-sn><button class="on" data-n="Bachelor">Bachelor</button><button data-n="Master">Master</button></div><div class="tg" role="tablist" data-ss><button class="on" data-n="non">Non boursier</button><button data-n="boursier">Boursier</button></div><label class="ck"><input type="checkbox" data-su checked> Uniforme en 3 tranches</label></div>
<div class="res"><div class="rl"><span>À l'inscription</span><b data-r="ins"></b></div><div class="rl"><span>Puis chaque mois</span><b data-r="mois"></b></div><div class="rl tot"><span>Total de l'année</span><b data-r="tot"></b></div><p data-r="det"></p></div></div></section>
<section class="sec grey" id="brochure"><div class="wrap two"><div><span class="kick">Brochure</span><h2>Recevoir la brochure</h2><p class="lead">Programmes, modules, frais et calendrier : recevez la brochure de l'AFRAM sur WhatsApp ou par e-mail.</p><img src="${PH.diplome}" alt="" loading="lazy" class="bimg"></div>
<form class="form" data-broch novalidate><label class="fld"><span>Programme</span><select name="prog">${PROGRAMMES.map((p) => `<option value="${p.id}">${esc(p.t)}</option>`).join('')}<option value="continue">Formation continue</option></select></label><div class="g2"><label class="fld"><span>Prénom et nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div><label class="fld"><span>E-mail (facultatif)</span><input name="mail" type="email" autocomplete="email"></label><div class="row"><button class="btn g" type="submit">Recevoir sur WhatsApp</button><button class="btn line" type="button" data-bmail>Par e-mail</button></div></form></div></section>`,
}));

// ---------- Candidater ----------
pages.push(page('candidater.html', {
  title: 'Candidater en ligne', active: 'admissions.html',
  desc: 'Candidatez en ligne à l\'AFRAM : programme, parcours, coordonnées. Votre dossier est transmis au service des admissions.',
  sub: PT([['admissions.html', 'Admissions'], [null, 'Candidater']], 'Candidater en ligne', 'Trois étapes, cinq minutes. Le service des admissions vous recontacte pour la suite.'),
  body: `<section class="sec apply"><div class="wrap"><ol class="prog3" data-steps>${['Programme', 'Parcours', 'Coordonnées'].map((t, i) => `<li${i ? '' : ' class="on"'}><b>${i + 1}</b>${t}</li>`).join('')}</ol>
<form class="form big" data-apply novalidate>
<fieldset data-st="0"><legend>Votre programme</legend><label class="fld"><span>Programme souhaité</span><select name="prog" required>${PROGRAMMES.map((p) => `<option value="${p.id}">${esc(p.t)}</option>`).join('')}</select></label>
<div class="g2"><label class="fld"><span>Année d'entrée</span><select name="annee" data-annee></select></label><label class="fld"><span>Rentrée</span><select name="rentree"><option>Rentrée 2026-2027</option><option>Rentrée 2027-2028</option></select></label></div></fieldset>
<fieldset data-st="1" hidden><legend>Votre parcours</legend><div class="g2"><label class="fld"><span>Dernier diplôme obtenu</span><select name="diplome" data-dipl></select></label><label class="fld"><span>Année d'obtention</span><input name="an" type="number" min="1990" max="2027" value="2026"></label></div>
<label class="fld"><span>Établissement d'origine</span><input name="etab" required placeholder="Lycée ou université"></label><p class="lbl">Statut</p><div class="chips"><label><input type="radio" name="statut" value="Non boursier" checked><span>Non boursier</span></label><label><input type="radio" name="statut" value="Boursier"><span>Boursier</span></label></div></fieldset>
<fieldset data-st="2" hidden><legend>Vos coordonnées</legend><div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="family-name"></label><label class="fld"><span>Prénom</span><input name="prenom" required autocomplete="given-name"></label></div>
<div class="g2"><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label><label class="fld"><span>E-mail</span><input name="mail" type="email" autocomplete="email"></label></div><label class="fld"><span>Votre motivation en quelques lignes</span><textarea name="moti" rows="4"></textarea></label>
<div class="recap" data-recap></div></fieldset>
<div class="nav3"><button class="btn line" type="button" data-prev hidden>Précédent</button><button class="btn g" type="button" data-next>Continuer</button><button class="btn g" type="submit" data-submit hidden>Envoyer ma candidature</button></div></form></div></section>`,
}));

// ---------- L'École ----------
pages.push(page('ecole.html', {
  title: 'L\'École', active: 'ecole.html',
  desc: 'L\'Académie Franco-Américaine de Management : créée le 28 mars 2003, habilitée et reconnue par l\'État gabonais. Histoire, vocation, vision, mission et campus.',
  sub: PT([[null, 'L\'École']], 'L\'Académie Franco-Américaine de Management', 'Une business school nationale et africaine de référence, au cœur de Libreville.', PH.remise),
  body: `<section class="sec"><div class="wrap split"><div><span class="kick">Notre histoire</span><h2>Former sur place les talents qui partaient à l'étranger</h2><p class="lead">L'AFRAM est un établissement privé d'enseignement supérieur créé le ${AF.created}. Sa création répond à un constat : trop d'étudiants gabonais devaient s'expatrier pour suivre des formations de qualité, avec des difficultés de visas et un coût élevé pour les familles et l'État.</p>
<p class="lead">Des spécialistes en sciences de gestion venus du Canada et de France ont accompagné les promoteurs gabonais pour donner ces programmes sur place, à Libreville. L'école est habilitée et reconnue par l'État gabonais (décrets n° 0071 et 0072/PR/MESRSIT du 14 février 2024).</p></div><img src="${PH.costume}" alt="" loading="lazy"></div></section>
<section class="sec navy" id="vision"><div class="wrap"><div class="vvm">${[['Vocation', 'Préparer des professionnels compétents et engagés pour répondre aux besoins des organisations et accomplir efficacement leurs responsabilités futures.'], ['Vision', 'Être une business school nationale et africaine de référence.'], ['Mission', 'Promouvoir des formations de l\'enseignement supérieur répondant aux standards internationaux.']].map(([t, d]) => `<div><span>${t}</span><p>${d}</p></div>`).join('')}</div></div></section>
${FIG}
<section class="sec" id="campus"><div class="wrap split rev"><div><span class="kick">Nos campus</span><h2>Deux sites au cœur de la capitale</h2><ul class="chk">${['Deux sites de plus de 15 salles de classe climatisées chacun', 'Vidéoprojecteurs et tableaux numériques tactiles de dernière génération', 'Salle informatique moderne et équipée', 'Bibliothèque numérique accessible à tous', 'Rue André MINTSA, Batterie IV, près de l\'École conventionnée Gros Bouquet 1'].map((x) => `<li>${ic('check', 18)} ${x}</li>`).join('')}</ul><a class="btn line" href="contact.html">Plan d'accès</a></div><img src="${PH.couloir}" alt="" loading="lazy"></div></section>`,
}));

// ---------- Entreprises ----------
pages.push(page('entreprises.html', {
  title: 'Entreprises', active: 'entreprises.html',
  desc: 'Entreprises : recrutez les talents de l\'AFRAM, accueillez des stagiaires, formez vos équipes (formation continue, certifications).',
  sub: PT([[null, 'Entreprises']], 'Entreprises', 'Recruter nos talents, former vos équipes, construire un partenariat.', PH.main),
  body: `<section class="sec"><div class="wrap"><div class="ent">${[['users', 'Recruter nos talents', 'Stagiaires et jeunes diplômés en management, droit, QHSE et informatique.'], ['handshake', 'Accueillir des stagiaires', 'Des stages chaque année du cursus, encadrés par l\'école.'], ['cap', 'Former vos équipes', 'Formation continue et programmes sur mesure pour vos salariés.'], ['doc', 'Certifier les compétences', 'Certifications professionnelles courtes.']].map(([i, t, d]) => `<div>${ic(i, 28)}<h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></section>
<section class="sec grey" id="continue"><div class="wrap split"><div><span class="kick">Formation continue</span><h2>Former vos équipes</h2><p class="lead">Management, QHSE, droit des affaires, informatique : l'AFRAM conçoit des programmes adaptés à vos métiers et à vos contraintes, en soirée, le samedi ou en intra-entreprise.</p><h3 id="certif" class="h3s">Certifications</h3><p class="lead">Pour vos programmes de certification, l'équipe vous propose un parcours adapté à vos objectifs.</p></div><img src="${PH.equipe}" alt="" loading="lazy"></div></section>
<section class="sec" id="contact"><div class="wrap two"><div><span class="kick">Partenariat</span><h2>Parlons de vos besoins</h2><p class="lead">Stages, recrutement, formation : un interlocuteur dédié vous répond.</p></div>
<form class="form" data-ent novalidate><div class="g2"><label class="fld"><span>Entreprise</span><input name="soc" required></label><label class="fld"><span>Votre besoin</span><select name="besoin"><option>Recruter un stagiaire</option><option>Recruter un jeune diplômé</option><option>Formation continue</option><option>Certification</option><option>Autre partenariat</option></select></label></div><div class="g2"><label class="fld"><span>Nom et fonction</span><input name="nom" required></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required></label></div><label class="fld"><span>Précisions</span><textarea name="msg" rows="3"></textarea></label><button class="btn g" type="submit">Envoyer</button></form></div></section>`,
}));

// ---------- Vie étudiante ----------
pages.push(page('vie-etudiante.html', {
  title: 'Vie étudiante', active: 'vie-etudiante.html',
  desc: 'Vie étudiante à l\'AFRAM : Junior-Entreprise, engagements solidaires (Octobre rose, Novembre bleu), uniforme, alumni.',
  sub: PT([[null, 'Vie étudiante']], 'Vie étudiante', 'Au-delà des salles de cours et des amphis, il y a des combats qui nous rassemblent.', PH.duo),
  body: `<section class="sec"><div class="wrap split"><img src="${PH.equipe}" alt="" loading="lazy"><div><span class="kick">Junior-Entreprise</span><h2>Entreprendre dès l'école</h2><p class="lead">La Junior-Entreprise de l'AFRAM permet aux étudiants de mener de vrais projets, d'organiser des événements et des campagnes, et de se frotter au terrain avant le diplôme.</p></div></div></section>
<section class="sec grey" id="engagements"><div class="wrap"><span class="kick">Engagements</span><h2>Une école solidaire</h2><div class="news">${NEWS.slice(0, 2).map(([k, t, c, ph]) => `<a class="nw" href="actualites.html"><img src="${ph}" alt="" loading="lazy"><span class="c">${c} · ${k}</span><h3>${esc(t)}</h3></a>`).join('')}<div class="nw tx"><span class="c">Tenue</span><h3>L'uniforme AFRAM</h3><p>Costume, chemise, polo, cravate, pantalon ou jupe et blouson : une tenue professionnelle qui prépare au monde de l'entreprise.</p></div></div></div></section>
<section class="sec" id="alumni"><div class="wrap split rev"><div><span class="kick">Alumni</span><h2>Plus de 20 ans de diplômés</h2><p class="lead">Les anciens de l'AFRAM travaillent dans les entreprises, les administrations et les organisations du Gabon et d'ailleurs. Chaque rentrée, ils reviennent partager leur expérience avec les nouveaux étudiants.</p><a class="btn line" href="https://www.linkedin.com/company/${AF.li}/" target="_blank" rel="noopener">Rejoindre le réseau sur LinkedIn</a></div><img src="${PH.diplome}" alt="" loading="lazy"></div></section>`,
}));

// ---------- Actualités ----------
pages.push(page('actualites.html', {
  title: 'Actualités', active: '',
  desc: 'Les actualités de l\'AFRAM : événements, vie étudiante, campus.',
  sub: PT([[null, 'Actualités']], 'Actualités', 'Événements, vie étudiante et vie du campus.'),
  body: `<section class="sec"><div class="wrap"><div class="news big">${NEWS.map(([k, t, c, ph]) => `<article class="nw"><img src="${ph}" alt="" loading="lazy"><span class="c">${c} · ${k}</span><h3>${esc(t)}</h3><p>Retrouvez l'article complet et les photos sur les réseaux de l'AFRAM.</p></article>`).join('')}</div><p class="note">Actualités reprises du site de l'AFRAM. Photos d'illustration.</p></div></section>`,
}));

// ---------- Galerie ----------
const GAL = [[PH.hero, 'Remise des diplômes'], [PH.duo, 'Diplômées'], [PH.info, 'Salle informatique'], [PH.costume, 'Diplômé'], [PH.equipe, 'Travail en groupe'], [PH.remise, 'Cérémonie'], [PH.bureau, 'Projet personnel'], [PH.diplomee, 'Fierté']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: '',
  desc: 'L\'AFRAM en images : cérémonies, campus et vie étudiante.',
  sub: PT([['vie-etudiante.html', 'Vie étudiante'], [null, 'Galerie']], 'Galerie', 'Cérémonies, campus et vie étudiante.'),
  body: `<section class="sec"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${p}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles de l'école.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => p))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Contact et accès', active: '',
  desc: `AFRAM, ${AF.addr}, ${AF.repere}, ${AF.city}. Tél. ${AF.tel}, WhatsApp ${AF.waTxt}, ${AF.mail}.`,
  sub: PT([[null, 'Contact']], 'Contact et accès', `${AF.addr}, ${AF.repere.toLowerCase()}.`),
  body: `<section class="sec"><div class="wrap two"><div><div class="info">
<div>${ic('pin', 22)}<h2>Adresse</h2><p>${AF.addr}<br>${AF.repere}<br>${AF.city}</p></div>
<div>${ic('phone', 22)}<h2>Téléphone</h2><p><a href="${telHref(AF.tel)}">${AF.tel}</a><br><a href="https://wa.me/${AF.wa}" target="_blank" rel="noopener">WhatsApp ${AF.waTxt}</a></p></div>
<div>${ic('mail', 22)}<h2>E-mail</h2><p><a href="mailto:${AF.mail}">${AF.mail}</a></p></div>
<div>${ic('clock', 22)}<h2>Horaires</h2><p>${AF.hours.map(([d, h]) => `${d} : ${h}`).join('<br>')}</p></div></div>
<div class="map"><iframe title="Plan d'accès à l'AFRAM, Batterie IV" src="https://www.google.com/maps?q=${AF.mapq}&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Écrire à l'AFRAM</h2><label class="fld"><span>Je suis</span><select name="qui"><option>Futur étudiant</option><option>Parent</option><option>Étudiant ou ancien</option><option>Entreprise</option><option>Autre</option></select></label>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div><label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label><button class="btn g" type="submit">Envoyer sur WhatsApp</button></form></div></section>`,
}));

fs.copyFileSync(path.join(__dirname, 'afram-logo.png'), path.join(OUT, 'logo.png'));
fs.copyFileSync(path.join(__dirname, 'afram-logo-blanc.png'), path.join(OUT, 'logo-blanc.png'));
for (const f of ['afram.css', 'afram.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
