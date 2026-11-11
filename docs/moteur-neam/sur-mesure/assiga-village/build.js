// Construit le site sur mesure d'Assiga Village dans neam-moteur/sites/assiga-village/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { AV, PH, FORMULES, OPTIONS, UNIVERS, SAISONS, CARTE, AVIS } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', AV.slug);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const ICON = {
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  boat: 'M20 21c-1.4 0-2.8-.5-4-1.3-2.4 1.7-5.6 1.7-8 0C6.8 20.5 5.4 21 4 21H2v2h2c1.4 0 2.7-.3 4-1 2.5 1.3 5.5 1.3 8 0 1.3.7 2.6 1 4 1h2v-2zM3.9 19H4c1.6 0 3-.9 4-2 1 1.1 2.4 2 4 2s3-.9 4-2c1 1.1 2.4 2 4 2h.1l1.9-6.7c.1-.3 0-.6-.1-.8-.2-.2-.4-.4-.7-.4L20 10.6V6c0-1.1-.9-2-2-2h-3V1H9v3H6a2 2 0 0 0-2 2v4.6l-1.3.4c-.3.1-.5.2-.6.5-.1.2-.2.5-.1.8zM6 6h12v4l-6-2-6 2z',
  sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM2 13h2a1 1 0 0 0 0-2H2a1 1 0 0 0 0 2zm18 0h2a1 1 0 0 0 0-2h-2a1 1 0 0 0 0 2zM11 2v2a1 1 0 0 0 2 0V2a1 1 0 0 0-2 0zm0 18v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-2 0zM6 4.6a1 1 0 0 0-1.4 1.4l1 1a1 1 0 1 0 1.4-1.4zm12.4 12.4a1 1 0 0 0-1.4 1.4l1 1a1 1 0 0 0 1.4-1.4zM19.4 6A1 1 0 0 0 18 4.6l-1 1A1 1 0 1 0 18.4 7zM7 18.4A1 1 0 0 0 5.6 17l-1 1A1 1 0 1 0 6 19.4z',
  leaf: 'M17 8C8 10 5.9 16.2 3.8 21.3l1.9.7 1-2.3c.5.2 1 .3 1.3.3C19 20 22 3 22 3c-1 2-8 2.3-13 3.3S2 11.5 2 13.5s1.8 3.8 1.8 3.8C7 8 17 8 17 8z',
  spa: 'M8.6 12.4c-1.1-.8-2.4-1.3-3.8-1.6L4 10.6V12a8 8 0 0 0 8 8 8 8 0 0 0 8-8v-1.4l-.8.2c-1.4.3-2.7.8-3.8 1.6A8 8 0 0 0 12 3a8 8 0 0 0-3.4 9.4z',
  fish: 'M12 20c-3.5 0-6.5-1.8-8.6-4.2L1 17V7l2.4 1.2C5.5 5.8 8.5 4 12 4c5 0 9 4 11 8-2 4-6 8-11 8zm5-9a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  bed: 'M7 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9a4 4 0 0 0-4-4z',
  fork: 'M11 9H9V2H7v7H5V2H3v7c0 2.1 1.7 3.8 3.8 4V22h2.4v-9c2.1-.2 3.8-1.9 3.8-4V2h-2zm5-3v8h2.5v8H21V2c-2.8 0-5 2.2-5 4z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  star: 'M12 17.3 18.2 21l-1.6-7L22 9.2l-7.2-.6L12 2 9.2 8.6 2 9.2 7.5 14l-1.7 7z',
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
const UI = { 'bien-etre': 'spa', evasion: 'fish', nature: 'leaf' };

// Logo : soleil couchant sur la vague, A de Assiga
const MARK = (s = 48) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#0E5E66"/><circle cx="24" cy="25" r="9" fill="#F2784B"/><path d="M5 30c4 0 4-3 8-3s4 3 8 3 4-3 8-3 4 3 8 3 4-3 6-3v5c-2 0-2 3-6 3s-4-3-8-3-4 3-8 3-4-3-8-3-4 3-8 3z" fill="#F3E9D7"/><path d="M14 22 24 9l10 13" fill="none" stroke="#F3E9D7" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
const LOGO_SVG = MARK(64).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(' aria-hidden="true"', '');
const LOGO = `${MARK()}<span class="t">Assiga<small>Village · Pointe Denis</small></span>`;

const NAV = [['index.html', 'Accueil'], ['formules.html', 'Formules'], ['chambres.html', 'Chambres'], ['carte.html', 'Restaurant'], ['sorties.html', 'Activités & nature'], ['contact.html', 'Venir']];

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'Resort', name: AV.name, description: 'Hôtel-bar-restaurant à la Pointe Denis, à 15 minutes de Libreville', telephone: '+241' + AV.tel.replace(/\D/g, '').replace(/^0/, ''), email: AV.mail, address: { '@type': 'PostalAddress', addressLocality: 'Pointe Denis', addressRegion: 'Estuaire', addressCountry: 'GA' }, numberOfRooms: 18, aggregateRating: { '@type': 'AggregateRating', ratingValue: AV.rating, bestRating: 5 } };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${AV.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${AV.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${PH.hero}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gloock&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assiga.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="Assiga Village, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="formules.html">Réserver ma journée</a></nav>
<a class="call" href="${telHref(AV.tel)}">${ic('phone', 16)} ${AV.tel}</a><a class="btn s hcta" href="formules.html">Réserver</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><svg class="wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30c120 20 240 20 360 0s240-20 360 0 240 20 360 0 240-20 360 0v30H0z" fill="currentColor"/></svg><div class="wrap">
<div><a class="logo" href="index.html">${LOGO}</a><p>Hôtel, bar et restaurant à la Pointe Denis, blotti entre océan et rivières, à 15 minutes de Libreville.</p><div class="soc" data-soc></div></div>
<div><h5>La journée</h5><p>Navette depuis ${AV.depart}<br>Départ à ${AV.heure}<br><a href="formules.html">Nos formules</a></p></div>
<div><h5>Le village</h5><p><a href="chambres.html">18 chambres et suites</a><br><a href="carte.html">Restaurant</a><br><a href="sorties.html">Activités & nature</a><br><a href="galerie.html">Galerie</a></p></div>
<div><h5>Réservations</h5><p><a href="${telHref(AV.tel)}">${AV.tel}</a> (WhatsApp)<br><a href="mailto:${AV.mail}">${AV.mail}</a></p></div>
<div class="cp">© 2026 ${AV.name} · Pointe Denis, Gabon · Tarifs indicatifs, confirmés à la réservation.</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.AV=${JSON.stringify({ slug: AV.slug, name: AV.name, wa: AV.wa, soc: AV.soc, depart: AV.depart, heure: AV.heure, formules: FORMULES.map(({ id, n, type, ad, en, ch }) => ({ id, n, type, ad, en, ch })), options: OPTIONS, saisons: SAISONS.map(([id, t, m, d, ph]) => ({ id, t, m, d, ph })) })}</script><script src="assiga.js"></script>
<script src="../../assets/reco.js" data-slug="${AV.slug}" data-wa="${AV.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const PT = (crumb, h1, p, ph) => `<section class="pt"${ph ? ` style="--ph:url(${ph})"` : ''}><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div></section>`;
const CTA = `<section class="cta"><div class="wrap"><div><h2>Prêt pour la traversée ?</h2><p>Départ à ${AV.heure} depuis ${AV.depart}. Réservez votre journée ou votre week-end, nous confirmons sur WhatsApp.</p></div><div class="row"><a class="btn s" href="formules.html">Réserver</a><a class="btn ol" href="https://wa.me/${AV.wa}" target="_blank" rel="noopener">WhatsApp ${AV.tel}</a></div></div></section>`;
const fCard = (f) => `<article class="fc${f.id === 'journee' ? ' hot' : ''}"><h3>${f.n}</h3><p>${f.d}</p><div class="fp"><small>dès</small><b>${fcfa(f.type === 'jour' ? f.ad : f.ch)}</b><small>${f.type === 'jour' ? 'par adulte' : 'chambre double'}</small></div><ul>${f.inc.map((t) => `<li>${ic('check', 15)} ${t}</li>`).join('')}</ul><a class="btn ${f.id === 'journee' ? 's' : 'line'}" href="formules.html?f=${f.id}#calc">Choisir</a></article>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// Accueil
pages.push(page('index.html', {
  title: 'Plage, hôtel et restaurant à la Pointe Denis', active: 'index.html',
  desc: 'Assiga Village, à 15 minutes de Libreville : journée à la plage navette et déjeuner inclus, week-ends, 18 chambres et suites, restaurant, soins, excursions à Pongara.',
  body: `<section class="hero"><img class="bg" src="${PH.hero}" alt=""><div class="wrap"><span class="kick">${ic('boat', 16)} À 15 minutes de Libreville</span><h1>Pointe Denis,<br><em>les pieds dans le sable.</em></h1><p>Une journée hors du temps ou un week-end entre océan et rivières : traversée, déjeuner de la mer, plage, soins et nature.</p>
<form class="quick" action="formules.html"><label><span>Formule</span><select name="f">${FORMULES.map((f) => `<option value="${f.id}">${f.n}</option>`).join('')}</select></label><label><span>Date</span><input type="date" name="d" data-qd></label><label><span>Adultes</span><select name="ad">${[1, 2, 3, 4, 5, 6, 8, 10].map((n) => `<option${n === 2 ? ' selected' : ''}>${n}</option>`).join('')}</select></label><button class="btn s" type="submit">Calculer et réserver</button></form></div></section>
<section class="strip"><div class="wrap"><div>${ic('boat', 24)}<b>Navette ${AV.heure}</b><span>depuis ${AV.depart}</span></div><div>${ic('bed', 24)}<b>18 chambres</b><span>et suites, art gabonais</span></div><div>${ic('fork', 24)}<b>Cuisine de la mer</b><span>africaine et européenne</span></div><div>${ic('star', 24)}<b>${String(AV.rating).replace('.', ',')}/5</b><span>sur Google</span></div></div></section>
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Nos formules</span><h2>Une journée, une nuit ou tout le week-end</h2></div><a class="btn line" href="formules.html">Calculer mon séjour</a></div><div class="fcs">${FORMULES.map(fCard).join('')}</div><p class="note">Tarifs enfants sur demande et dans le calculateur. Offres spéciales annoncées sur nos réseaux.</p></div></section>
<section class="sec sand"><div class="wrap"><span class="tag">Trois univers</span><h2>Bien-être, Évasion, Nature</h2><div class="uni">${UNIVERS.map(([id, t, d, ph]) => `<a class="un" href="sorties.html#${id}"><img src="${ph}" alt="" loading="lazy"><div>${ic(UI[id], 22)}<h3>${t}</h3><p>${d}</p></div></a>`).join('')}</div></div></section>
<section class="sec"><div class="wrap split"><div class="pics"><img src="${PH.lodge}" alt="Bungalow face à la plage" loading="lazy"><img src="${PH.porte}" alt="" loading="lazy"></div><div><span class="tag">Dormir au village</span><h2>18 chambres et suites, au rythme des vagues</h2><p class="lead">Décorées avec goût de pièces d'art gabonais, nos chambres et suites offrent tout le confort pour une nuit loin du bruit de la capitale.</p><a class="btn s" href="chambres.html">Voir les chambres</a></div></div></section>
<section class="sec deep"><div class="wrap"><span class="tag">Calendrier de la nature</span><h2>Que voir ce mois-ci à Pongara ?</h2><div class="nat" data-nat></div><a class="btn ol" href="sorties.html#calendrier">Tout le calendrier</a></div></section>
<section class="sec sand"><div class="wrap"><span class="tag">Avis</span><h2>Ils ont traversé</h2><div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
${CTA}`,
}));

// Formules + calculateur
pages.push(page('formules.html', {
  title: 'Formules et réservation', active: 'formules.html',
  desc: 'Journée à la plage dès 40 000 FCFA navette et déjeuner inclus, week-end dès 125 000 FCFA la chambre double : calculez et réservez votre séjour à Assiga Village.',
  body: `${PT('Formules', 'Formules et réservation', `Choisissez votre formule, vos options et vos dates : le total s'affiche, nous confirmons sur WhatsApp. Navette à ${AV.heure} depuis ${AV.depart}.`, PH.sunset)}
<section class="sec"><div class="wrap"><div class="fcs">${FORMULES.map(fCard).join('')}</div></div></section>
<section class="bk" id="calc"><div class="wrap"><form data-calc novalidate>
<fieldset class="stp"><legend><b>1</b>Votre formule</legend><div class="fopt">${FORMULES.map((f, i) => `<label><input type="radio" name="f" value="${f.id}"${i ? '' : ' checked'}><span><b>${f.n}</b><small>${f.type === 'jour' ? `${fcfa(f.ad)} / adulte · ${fcfa(f.en)} / enfant` : `${fcfa(f.ch)} / chambre double · ${fcfa(f.en)} / enfant`}</small></span></label>`).join('')}</div></fieldset>
<fieldset class="stp"><legend><b>2</b>Date et voyageurs</legend><div class="g3"><label class="fld"><span>Date d'arrivée</span><input type="date" name="d" required></label><label class="fld"><span>Adultes</span><select name="ad">${Array.from({ length: 12 }, (_, i) => `<option${i === 1 ? ' selected' : ''}>${i + 1}</option>`).join('')}</select></label><label class="fld"><span>Enfants (3 – 11 ans)</span><select name="en">${[0, 1, 2, 3, 4, 5, 6].map((n) => `<option>${n}</option>`).join('')}</select></label></div>
<div class="g2" data-nuits hidden><label class="fld"><span>Nuits</span><select name="n">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<option>${n}</option>`).join('')}</select></label><label class="fld"><span>Chambres</span><select name="ch">${[1, 2, 3, 4, 5, 6].map((n) => `<option>${n}</option>`).join('')}</select></label></div><p class="msg" data-cmsg hidden></p></fieldset>
<fieldset class="stp"><legend><b>3</b>Options, par personne</legend>${UNIVERS.map(([u, t]) => `<p class="ot">${ic(UI[u], 16)} ${t}</p><div class="xs">${OPTIONS.filter((o) => o[3] === u).map(([id, n, p]) => `<label><input type="checkbox" name="o" value="${id}"><span><b>${n}</b><small>${fcfa(p)}</small><span class="qty">× <select data-q="${id}" aria-label="Nombre de personnes pour ${esc(n)}">${Array.from({ length: 12 }, (_, i) => `<option>${i + 1}</option>`).join('')}</select> pers.</span></span></label>`).join('')}</div>`).join('')}</fieldset>
<fieldset class="stp"><legend><b>4</b>Vos coordonnées</legend><div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div><label class="fld" style="margin-top:10px"><span>Une demande ?</span><textarea name="msg" rows="2" placeholder="Anniversaire, régime alimentaire, groupe…"></textarea></label></fieldset></form>
<aside class="sum"><h2>Votre escapade</h2><div class="trip"><span>${ic('boat', 18)} Départ ${AV.heure}</span><b>${AV.depart}</b></div><div class="ln"><span>Formule</span><b data-s="f"></b></div><div class="ln"><span>Date</span><b data-s="d"></b></div><div class="ln"><span>Voyageurs</span><b data-s="p"></b></div><div class="lines" data-s="lines"></div>
<div class="tot"><span>Total estimé</span><b data-s="tot"></b></div><button class="btn s wide" data-send>Réserver sur WhatsApp</button><p class="note">Acompte demandé à la confirmation. Gilets de sauvetage fournis pour la traversée.</p></aside></div></section>`,
}));

// Chambres
const ROOMS = [
  ['Chambre Jardin', 'Lit double ou deux lits, salle de douche, terrasse sur le jardin tropical.', [PH.chambre, PH.sdb], ['Climatisation', 'Terrasse', 'Art gabonais']],
  ['Chambre Océan', 'Ouverte sur la plage : le bruit des vagues pour seul réveil.', [PH.porte, PH.lodge], ['Vue mer', 'Climatisation', 'Moustiquaire']],
  ['Suite Assiga', 'Chambre, salon et grande salle de bain : le confort d\'une suite face à l\'océan.', [PH.suite, PH.nuit], ['Salon', 'Vue mer', 'Peignoirs']],
];
pages.push(page('chambres.html', {
  title: 'Chambres et suites', active: 'chambres.html',
  desc: '18 chambres et suites décorées d\'art gabonais à Assiga Village, Pointe Denis. Week-end dès 125 000 FCFA la chambre double avec petit-déjeuner.',
  body: `${PT('Chambres', '18 chambres et suites', 'Confort, décoration d\'art gabonais et le bruit des vagues : la nuit à la Pointe Denis, loin de l\'agitation de la capitale.', PH.lodge)}
<section class="sec"><div class="wrap rooms">${ROOMS.map(([n, d, ph, eq]) => `<article class="room"><div class="rimg"><img src="${ph[0]}" alt="${esc(n)}" loading="lazy"><img src="${ph[1]}" alt="" loading="lazy"></div><div><h2>${n}</h2><p class="lead">${d}</p><ul class="eq">${eq.map((e) => `<li>${e}</li>`).join('')}</ul><a class="btn s" href="formules.html?f=weekend#calc">Réserver un week-end</a></div></article>`).join('')}<p class="note">Répartition exacte des 18 chambres et suites à confirmer avec l'hôtel. Photos d'illustration.</p></div></section>
${CTA}`,
}));

// Restaurant
pages.push(page('carte.html', {
  title: 'Restaurant', active: 'carte.html',
  desc: 'Le restaurant d\'Assiga Village : spécialités africaines et européennes, poissons et fruits de mer frais, face à l\'océan.',
  body: `${PT('Restaurant', 'Le restaurant face à l\'océan', 'Spécialités africaines et européennes, préparées avec des produits frais de qualité, et le poisson qui arrive du large.', PH.terrasse)}
<section class="sec"><div class="wrap split"><div><span class="tag">À table</span><h2>Le déjeuner de la mer</h2><p class="lead">Poisson braisé du jour, langouste grillée, gambas à l'ail… et les grands classiques gabonais pour ceux qui préfèrent la terre ferme.</p><ul class="chk">${['Déjeuner inclus dans la formule journée', 'Service à table ou les pieds dans le sable', 'Cocktails et jus frais au bar de plage', 'Menus groupes et anniversaires'].map((t) => `<li>${ic('check', 16)} ${t}</li>`).join('')}</ul></div><div class="pics"><img src="${PH.langouste}" alt="Langouste grillée" loading="lazy"><img src="${PH.poisson}" alt="" loading="lazy"></div></div></section>
<section class="sec sand"><div class="wrap"><span class="tag">Exemples de plats</span><h2>La carte</h2><div class="menu">${CARTE.map(([c, it]) => `<div><h3>${c}</h3><ul>${it.map(([n, d, p]) => `<li><div><b>${n}</b><small>${d}</small></div><span>${fcfa(p)}</span></li>`).join('')}</ul></div>`).join('')}</div><p class="note">Carte indicative selon la pêche et le marché.</p></div></section>
${CTA}`,
}));

// Activités & nature
pages.push(page('sorties.html', {
  title: 'Activités, soins et nature', active: 'sorties.html',
  desc: 'Bien-être, Évasion, Nature : massages, pêche, kayak, excursions dans le parc de Pongara, tortues luth et baleines à bosse depuis Assiga Village.',
  body: `${PT('Activités & nature', 'Trois univers, mille façons de profiter', 'Se faire masser face à l\'océan, pêcher, pagayer, ou partir à la rencontre des tortues et des baleines de Pongara.', PH.mangrove)}
<section class="sec"><div class="wrap univ">${UNIVERS.map(([id, t, d, ph]) => `<article id="${id}"><img src="${ph}" alt="" loading="lazy"><div><span class="tag">${ic(UI[id], 16)} Univers ${t}</span><h2>${t}</h2><p class="lead">${d}</p><ul class="olist">${OPTIONS.filter((o) => o[3] === id).map(([, n, p]) => `<li><span>${n}</span><b>${fcfa(p)}</b></li>`).join('')}</ul><a class="btn line" href="formules.html#calc">Ajouter à mon séjour</a></div></article>`).join('')}</div></section>
<section class="sec deep" id="calendrier"><div class="wrap"><span class="tag">Calendrier de la nature</span><h2>Quand venir pour voir quoi ?</h2><p class="lead">Choisissez un mois : nous vous disons ce que la nature vous réserve autour de la Pointe Denis.</p><div class="months" role="radiogroup" aria-label="Mois" data-months>${MOIS.map((m, i) => `<label><input type="radio" name="m" value="${i + 1}"><span>${m}</span></label>`).join('')}</div><div class="nat" data-nat2></div><p class="note">Saisons indicatives : la nature décide. Les sorties tortues et baleines se font avec des guides agréés, dans le respect du parc national.</p></div></section>
${CTA}`,
}));

// Galerie
const GAL = [[PH.hero, 'La plage'], [PH.lodge, 'Le village'], [PH.langouste, 'Langouste grillée'], [PH.tortue, 'Tortues de Pongara'], [PH.sunset, 'Coucher de soleil'], [PH.massage, 'Univers Bien-être'], [PH.baleine, 'Baleines au large'], [PH.terrasse, 'La terrasse'], [PH.porte, 'Chambre Océan'], [PH.mangrove, 'Mangroves'], [PH.peche, 'Pêche du bord']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: '',
  desc: 'Assiga Village en images : plage, chambres, restaurant, soins, tortues et baleines de Pongara.',
  body: `${PT('Galerie', 'Galerie', 'Un avant-goût de la Pointe Denis.')}
<section class="sec"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${p}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles du village.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => p))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
}));

// Venir / contact
pages.push(page('contact.html', {
  title: 'Venir et nous contacter', active: 'contact.html',
  desc: `Venir à Assiga Village : navette à ${AV.heure} depuis ${AV.depart}, traversée de 15 minutes vers la Pointe Denis. Réservations ${AV.tel}.`,
  body: `${PT('Venir', 'Venir à la Pointe Denis', `La Pointe Denis se rejoint en bateau depuis Libreville : la navette part à ${AV.heure} depuis ${AV.depart}.`)}
<section class="wrap ctg"><div><ol class="route">${[['Rendez-vous', `${AV.depart}, 15 minutes avant le départ.`], ['Traversée', `Départ à ${AV.heure}, environ 15 minutes de bateau, gilets fournis.`], ['Arrivée', 'Accueil au ponton, cocktail de bienvenue.'], ['Retour', 'En fin d\'après-midi pour la formule journée (horaire précisé à la réservation).']].map(([t, d], i) => `<li><b>${i + 1}</b><div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}</ol>
<div class="info"><div>${ic('phone', 22)}<h2>Réservations</h2><p><a href="${telHref(AV.tel)}">${AV.tel}</a><br>Appel et WhatsApp</p></div><div>${ic('mail', 22)}<h2>E-mail</h2><p><a href="mailto:${AV.mail}">${AV.mail}</a></p></div></div>
<div class="map"><iframe title="Plan, Pointe Denis" src="https://www.google.com/maps?q=Pointe+Denis,+Gabon&z=12&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Une question ?</h2><p>Groupe, séminaire au vert, anniversaire, mariage sur la plage : écrivez-nous.</p>
<label class="fld"><span>Objet</span><select name="obj"><option>Journée / week-end</option><option>Groupe ou entreprise</option><option>Mariage / anniversaire</option><option>Autre</option></select></label>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label><button class="btn s" type="submit">Envoyer sur WhatsApp</button></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), LOGO_SVG);
for (const f of ['assiga.css', 'assiga.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', pages.length, 'pages');
