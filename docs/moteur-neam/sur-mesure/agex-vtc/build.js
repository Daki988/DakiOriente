// Construit le site sur mesure d'Agex VTC dans neam-moteur/sites/agex-vtc/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { AG, PH, ZONES, CLASSES, SERVICES, AVIS } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', AG.slug);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';

const ICON = {
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  dot: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  car: 'M18.9 6c-.2-.6-.8-1-1.4-1h-11c-.7 0-1.2.4-1.4 1L3 12v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8zM6.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 11l1.5-4.5h11L19 11z',
  plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z',
  star: 'M12 17.3 18.2 21l-1.6-7L22 9.2l-7.2-.6L12 2 9.2 8.6 2 9.2 7.5 14l-1.7 7z',
  shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  user: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z',
  bag: 'M17 6h-2V3a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h1v1h2v-1h4v1h2v-1h1a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-6-2h2v2h-2z',
  heart: 'M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z',
  route: 'M19 15.2V7a4 4 0 0 0-8 0v10a2 2 0 0 1-4 0V8.8a3 3 0 1 0-2 0V17a4 4 0 0 0 8 0V7a2 2 0 0 1 4 0v8.2a3 3 0 1 0 2 0z',
  wallet: 'M21 7h-1V5a2 2 0 0 0-2-2H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zm-3 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 7a1 1 0 0 1 0-2h13v2z',
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;

// Logo : écusson or, double chevron « express » et monogramme A
const MARK = (s = 44) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#F2B705"/><path d="M13 35 24 11l11 24h-6l-5-11.5L19 35z" fill="#0B0D12"/><path d="M20.5 29h7l1.8 4h-10.6z" fill="#0B0D12"/><path d="M34 14l5 5-5 5M38 14l5 5-5 5" fill="none" stroke="#0B0D12" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/></svg>`;
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#F2B705"/><path d="M13 35 24 11l11 24h-6l-5-11.5L19 35z" fill="#0B0D12"/><path d="M20.5 29h7l1.8 4h-10.6z" fill="#0B0D12"/></svg>`;
const LOGO = `${MARK()}<span class="t">AGEX <b>VTC</b><small>Assistance Gabon Express</small></span>`;

const NAV = [['index.html', 'Accueil'], ['services.html', 'Services'], ['tarifs.html', 'Tarifs'], ['abonnements.html', 'Abonnements'], ['devenir-chauffeur.html', 'Devenir chauffeur'], ['agence.html', 'Qui sommes-nous'], ['contact.html', 'Contact']];

// Estimation du prix (même formule que agex.js)
const dist = (a, b) => { const A = ZONES.find((z) => z[0] === a), B = ZONES.find((z) => z[0] === b); return Math.max(2, Math.hypot(A[2] - B[2], A[3] - B[3]) * 1.3 + 1); };
const price = (a, b, c) => Math.max(3000, Math.round((c.base + c.km * dist(a, b)) / 500) * 500);

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'TaxiService', name: AG.full, alternateName: AG.name, slogan: AG.slogan, telephone: '+241' + AG.tel.replace(/\D/g, '').replace(/^0/, ''), email: AG.mail, areaServed: AG.zone, provider: { '@type': 'LocalBusiness', name: AG.name, address: { '@type': 'PostalAddress', streetAddress: AG.addr, postOfficeBoxNumber: '2616', addressLocality: AG.city, addressCountry: 'GA' }, openingHours: 'Mo-Su 00:00-23:59', aggregateRating: { '@type': 'AggregateRating', ratingValue: AG.rating, bestRating: 5 } } };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${AG.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${AG.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${PH.hero}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="agex.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="Agex VTC, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="tarifs.html">Estimer ma course</a></nav>
<a class="call" href="${telHref(AG.tel)}"><span class="live"></span>${AG.tel}</a><a class="btn y hcta" href="tarifs.html">Commander</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo" href="index.html">${LOGO}</a><p>${AG.full} · ${AG.slogan}<br>Chauffeurs professionnels 24 h/24 dans le Grand Libreville.</p><div class="soc" data-soc></div></div>
<div><h5>Services</h5><p>${SERVICES.slice(0, 5).map(([id, n]) => `<a href="services.html#${id}">${n}</a>`).join('<br>')}</p></div>
<div><h5>Agex</h5><p><a href="tarifs.html">Tarifs et estimation</a><br><a href="abonnements.html">Abonnements</a><br><a href="devenir-chauffeur.html">Devenir chauffeur</a><br><a href="agence.html">Qui sommes-nous</a><br><a href="galerie.html">Galerie</a></p></div>
<div><h5>24 h/24, 7 j/7</h5><p><a href="${telHref(AG.tel)}">${AG.tel}</a><br><a href="${telHref(AG.tel2)}">${AG.tel2}</a><br><a href="mailto:${AG.mail}">${AG.mail}</a><br>${AG.addr}<br>${AG.bp}</p></div>
<div class="cp">© 2026 ${AG.full} · Akanda, Gabon · Prix indicatifs, confirmés à la commande.</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.AG=${JSON.stringify({ slug: AG.slug, wa: AG.wa, soc: AG.soc, zones: ZONES, classes: CLASSES, services: SERVICES.map(([id, n]) => [id, n]) })}</script><script src="agex.js"></script>
<script src="../../assets/reco.js" data-slug="${AG.slug}" data-wa="${AG.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const PT = (crumb, h1, p, ph) => `<section class="pt"${ph ? ` style="--ph:url(${ph})"` : ''}><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div></section>`;
const zoneOpts = (sel) => ZONES.map(([id, n]) => `<option value="${id}"${id === sel ? ' selected' : ''}>${n}</option>`).join('');
const CTA = `<section class="cta"><div class="wrap"><div><h2>Un chauffeur, maintenant ?</h2><p>Appelez ou écrivez-nous sur WhatsApp : prise en charge rapide, 24 h/24, partout dans le Grand Libreville.</p></div><div class="row"><a class="btn y" href="${telHref(AG.tel)}">${ic('phone', 18)} ${AG.tel}</a><a class="btn ol" href="https://wa.me/${AG.wa}" target="_blank" rel="noopener">WhatsApp</a></div></div></section>`;
const STARS = (n) => `<span class="stars" aria-label="${n} sur 5">${'★★★★★'.slice(0, Math.round(n))}${'☆☆☆☆☆'.slice(0, 5 - Math.round(n))}</span>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// Accueil
pages.push(page('index.html', {
  title: 'Chauffeur VTC 24 h/24 à Libreville et Akanda', active: 'index.html',
  desc: 'Agex VTC : chauffeurs professionnels 24 h/24 dans le Grand Libreville. Courses, aéroport, abonnements scolaires et entreprises, mariages. Estimation immédiate.',
  body: `<section class="hero"><img class="bg" src="${PH.hero}" alt="Chauffeur Agex au volant"><div class="wrap hg">
<div><span class="kick"><span class="live"></span> Disponible maintenant · 24 h/24</span><h1>Votre chauffeur privé dans le Grand Libreville.</h1><p>${AG.slogan} Courses, aéroport, abonnements scolaires et entreprises : un chauffeur professionnel, un prix annoncé avant de partir.</p>
<ul class="trust"><li>${ic('star', 18)}<b>${String(AG.rating).replace('.', ',')}/5</b> sur Google</li><li>${ic('shield', 18)}Chauffeurs vérifiés</li><li>${ic('clock', 18)}Jour et nuit</li></ul></div>
<form class="qe" data-qe action="tarifs.html"><h2>Où allez-vous ?</h2>
<label class="fld"><span>${ic('dot', 14)} Départ</span><select name="from">${zoneOpts('akanda')}</select></label>
<button type="button" class="swap" data-swap aria-label="Inverser départ et arrivée">⇅</button>
<label class="fld"><span>${ic('pin', 14)} Arrivée</span><select name="to">${zoneOpts('aeroport')}</select></label>
<div class="qr" data-qr aria-live="polite"></div>
<button class="btn y wide" type="submit">Voir le prix et commander</button><p class="note">Prix indicatif · confirmé par l'opérateur</p></form></div></section>
<section class="band"><div class="wrap"><div><b>24 h/24</b><span>appels et WhatsApp</span></div><div><b>9</b><span>services sur mesure</span></div><div><b>3</b><span>gammes de véhicules</span></div><div><b>${String(AG.rating).replace('.', ',')}★</b><span>note Google</span></div></div></section>
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Nos services</span><h2>Un trajet pour chaque besoin</h2></div><a class="btn line" href="services.html">Tous les services</a></div>
<div class="svg3">${SERVICES.slice(0, 6).map(([id, n, d, ph, p]) => `<a class="sc" href="services.html#${id}"><img src="${ph}" alt="" loading="lazy"><div><small>${p}</small><h3>${n}</h3><p>${d}</p></div></a>`).join('')}</div></div></section>
<section class="sec dark"><div class="wrap"><span class="tag">Comment ça marche</span><h2>Commander en 3 étapes</h2><ol class="steps">
<li><b>1</b><h3>Estimez</h3><p>Choisissez départ, arrivée et véhicule : le prix s'affiche immédiatement.</p></li>
<li><b>2</b><h3>Confirmez</h3><p>Envoyez la demande sur WhatsApp ou appelez : l'opérateur confirme en quelques minutes.</p></li>
<li><b>3</b><h3>Montez à bord</h3><p>Vous recevez le nom du chauffeur et la plaque du véhicule. Paiement en espèces ou mobile money.</p></li></ol></div></section>
<section class="sec"><div class="wrap"><span class="tag">Nos véhicules</span><h2>Trois gammes, toutes climatisées</h2><div class="cls">${CLASSES.map((c) => `<div><h3>${c.n}</h3><p>${c.d}</p><ul><li>${ic('user', 16)} ${c.pax} passagers</li><li>${ic('bag', 16)} ${c.bag} bagages</li></ul><b>dès ${fcfa(c.base + c.km * 2 < 3000 ? 3000 : Math.round((c.base + c.km * 2) / 500) * 500)}</b><small>${fcfa(c.h)} de l'heure en mise à disposition</small></div>`).join('')}</div></div></section>
<section class="sec soft"><div class="wrap split"><div><span class="tag">Abonnements</span><h2>École et bureau, l'esprit tranquille</h2><p class="lead">Un même chauffeur chaque jour, des horaires fixes, une facture par mois. Pour vos enfants comme pour vos employés.</p><div class="row"><a class="btn y" href="abonnements.html">Calculer mon abonnement</a><a class="btn line" href="services.html#pro">Offre entreprises</a></div></div><img class="big" src="${PH.ecole}" alt="Élève souriant en classe" loading="lazy"></div></section>
<section class="rose"><div class="wrap">${ic('heart', 28)}<div><h2>Agex s'engage contre les cancers féminins</h2><p>Chaque année, Agex soutient la sensibilisation au dépistage des cancers du sein et du col de l'utérus, et facilite les trajets vers les journées de dépistage.</p></div><a class="btn wh" href="agence.html#engagement">Notre engagement</a></div></section>
<section class="sec"><div class="wrap"><span class="tag">Avis clients</span><h2>Ils roulent avec nous</h2><div class="avis">${AVIS.map(([n, w, t]) => `<figure>${STARS(5)}<blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
${CTA}`,
}));

// Services
pages.push(page('services.html', {
  title: 'Nos services', active: 'services.html', desc: 'Course simple, course à l\'heure, aéroport, abonnements scolaires et professionnels, affrètements, mariages, sorties en famille et de nuit.',
  body: `${PT('Services', 'Nos services', 'Neuf façons de rouler avec Agex, de la course de 5 minutes au cortège de mariage.', PH.nuit1)}
<section class="sec"><div class="wrap"><nav class="chips" aria-label="Aller au service">${SERVICES.map(([id, n]) => `<a href="#${id}">${n}</a>`).join('')}</nav><div class="svl">${SERVICES.map(([id, n, d, ph, p], i) => `<article class="sv" id="${id}"><img src="${ph}" alt="" loading="lazy"><div><span class="num">${String(i + 1).padStart(2, '0')}</span><h2>${n}</h2><p class="lead">${d}</p><p class="pill">${p}</p><div class="row"><a class="btn y" href="${id === 'scolaire' || id === 'pro' ? 'abonnements.html' + (id === 'pro' ? '?t=pro' : '') : `tarifs.html?svc=${id}`}">${id === 'scolaire' || id === 'pro' ? 'Calculer l\'abonnement' : ['affretement', 'mariage'].includes(id) ? 'Demander un devis' : 'Estimer et commander'}</a></div></div></article>`).join('')}</div></div></section>
${CTA}`,
}));

// Tarifs et estimation
const SAMPLES = [['akanda', 'aeroport'], ['akanda', 'centre'], ['angondje', 'louis'], ['aeroport', 'glass'], ['akanda', 'owendo'], ['centre', 'pk12'], ['akanda', 'cap'], ['centre', 'ntoum']];
pages.push(page('tarifs.html', {
  title: 'Tarifs et estimation de course', active: 'tarifs.html', desc: 'Estimez le prix de votre course Agex VTC dans le Grand Libreville : départ, arrivée, véhicule, horaire. Commande sur WhatsApp.',
  body: `${PT('Tarifs', 'Estimez votre course', 'Le prix s\'affiche avant de partir. L\'opérateur le confirme avec votre commande.')}
<section class="est"><div class="wrap"><form data-est novalidate>
<fieldset class="stp"><legend><b>1</b>Trajet</legend><div class="g2"><label class="fld"><span>Service</span><select name="svc">${SERVICES.filter(([id]) => !['scolaire', 'pro'].includes(id)).map(([id, n]) => `<option value="${id}">${n}</option>`).join('')}</select></label><label class="fld" data-hours hidden><span>Durée de mise à disposition</span><select name="h">${[1, 2, 3, 4, 6, 8, 10].map((h) => `<option value="${h}">${h} h${h === 8 ? ' (journée)' : ''}</option>`).join('')}</select></label></div>
<div class="g2 tr"><label class="fld"><span>${ic('dot', 14)} Départ</span><select name="from">${zoneOpts('akanda')}</select></label><label class="fld"><span>${ic('pin', 14)} Arrivée</span><select name="to">${zoneOpts('aeroport')}</select></label></div>
<div class="g3"><label class="fld"><span>Date</span><input type="date" name="date" required></label><label class="fld"><span>Heure</span><input type="time" name="time" value="08:00" required></label><label class="fld"><span>Passagers</span><select name="pax">${[1, 2, 3, 4, 5, 6].map((n) => `<option>${n}</option>`).join('')}</select></label></div>
<label class="tog"><input type="checkbox" name="ar"><span>Aller-retour (−10 % sur le retour)</span></label></fieldset>
<fieldset class="stp"><legend><b>2</b>Véhicule</legend><div class="veh">${CLASSES.map((c, i) => `<label><input type="radio" name="cls" value="${c.id}"${i ? '' : ' checked'}><span><b>${c.n}</b><small>${c.d}</small><em data-cp="${c.id}"></em></span></label>`).join('')}</div><p class="msg" data-paxmsg hidden></p></fieldset>
<fieldset class="stp"><legend><b>3</b>Vos coordonnées</legend><div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld" style="margin-top:10px"><span>Précisions (adresse exacte, n° de vol, bagages…)</span><textarea name="msg" rows="2"></textarea></label></fieldset></form>
<aside class="sum"><h2>Votre course</h2><div class="ln"><span>Trajet</span><b data-s="trip"></b></div><div class="ln"><span>Distance estimée</span><b data-s="km"></b></div><div class="ln"><span>Véhicule</span><b data-s="cls"></b></div><div class="ln"><span>Départ</span><b data-s="when"></b></div><div class="lines" data-s="lines"></div>
<div class="tot"><span>Prix estimé</span><b data-s="tot"></b><small data-s="range"></small></div><button class="btn y wide" data-send>Commander sur WhatsApp</button><a class="btn ol wide" href="${telHref(AG.tel)}">${ic('phone', 16)} Appeler le ${AG.tel}</a><p class="note">Paiement au chauffeur : espèces ou mobile money. Majoration de nuit (22 h – 6 h) : +30 %.</p></aside></div></section>
<section class="sec"><div class="wrap"><span class="tag">Grille indicative</span><h2>Exemples de trajets</h2><div class="tbl" role="region" aria-label="Exemples de prix" tabindex="0"><table><thead><tr><th>Trajet</th>${CLASSES.map((c) => `<th>${c.n}</th>`).join('')}</tr></thead><tbody>${SAMPLES.map(([a, b]) => `<tr><td>${ZONES.find((z) => z[0] === a)[1]} → ${ZONES.find((z) => z[0] === b)[1]}</td>${CLASSES.map((c) => `<td>${fcfa(price(a, b, c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
<p class="note">Prix de jour, aller simple. Attente au-delà de 15 minutes : 2 500 FCFA par quart d'heure. Péages et parkings en sus.</p></div></section>
${CTA}`,
}));

// Abonnements
pages.push(page('abonnements.html', {
  title: 'Abonnements scolaires et professionnels', active: 'abonnements.html', desc: 'Abonnements Agex VTC : transport scolaire quotidien et trajets des employés. Calculez votre forfait mensuel.',
  body: `${PT('Abonnements', 'Abonnements école et entreprise', 'Un chauffeur attitré, des horaires fixes, une facture par mois.', PH.ecole)}
<section class="sec"><div class="wrap"><div class="abo" data-abo><div class="tabs" role="tablist"><button role="tab" aria-selected="true" data-t="scol">${ic('user', 18)} Scolaire</button><button role="tab" aria-selected="false" data-t="pro">${ic('wallet', 18)} Professionnel</button></div>
<div class="ab"><form><div data-p="scol"><div class="g2"><label class="fld"><span>Nombre d'enfants</span><select name="enf">${[1, 2, 3, 4].map((n) => `<option>${n}</option>`).join('')}</select></label><label class="fld"><span>Trajets</span><select name="sens"><option value="2">Aller et retour</option><option value="1">Aller seulement</option><option value="1r">Retour seulement</option></select></label></div></div>
<div data-p="pro" hidden><div class="g2"><label class="fld"><span>Nombre d'employés transportés</span><select name="emp">${[1, 2, 3, 4, 5, 6, 8, 10, 15].map((n) => `<option>${n}</option>`).join('')}</select></label><label class="fld"><span>Trajets</span><select name="psens"><option value="2">Domicile ↔ travail</option><option value="1">Aller seulement</option></select></label></div></div>
<div class="g2"><label class="fld"><span>Quartier de départ</span><select name="from">${zoneOpts('akanda')}</select></label><label class="fld"><span>Établissement / bureau</span><select name="to">${zoneOpts('louis')}</select></label></div>
<div class="g2"><label class="fld"><span>Jours par semaine</span><select name="j"><option value="5">5 jours (lun – ven)</option><option value="6">6 jours (lun – sam)</option></select></label><label class="fld"><span>Durée d'engagement</span><select name="m"><option value="1">1 mois</option><option value="3">Trimestre (−5 %)</option><option value="9">Année scolaire (−12 %)</option></select></label></div></form>
<div class="res"><span>Forfait mensuel estimé</span><b data-ab="tot"></b><small data-ab="det"></small><ul class="chk">${['Même chauffeur chaque jour', 'Message à chaque dépôt et prise en charge', 'Véhicule de remplacement garanti', 'Facture mensuelle'].map((t) => `<li>${ic('check', 16)} ${t}</li>`).join('')}</ul><button class="btn y wide" data-ab-send>Demander cet abonnement</button></div></div></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Questions fréquentes</span><h2>Bon à savoir</h2><div class="faq">${[['Qui conduit mes enfants ?', 'Toujours le même chauffeur, présenté avant le premier jour, avec un remplaçant connu en cas d\'absence. Vous avez son numéro et celui de l\'opérateur.'], ['Que se passe-t-il pendant les vacances ?', 'L\'abonnement scolaire est suspendu pendant les vacances : vous ne payez que les mois de classe.'], ['Comment se passe la facturation entreprise ?', 'Une facture mensuelle au nom de votre société, avec le détail des trajets. Paiement par virement ou chèque.'], ['Peut-on ajouter des trajets ponctuels ?', 'Oui, les abonnés bénéficient de −10 % sur toutes leurs courses ponctuelles.']].map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div></section>
${CTA}`,
}));

// Devenir chauffeur
pages.push(page('devenir-chauffeur.html', {
  title: 'Devenir chauffeur Agex', active: 'devenir-chauffeur.html', desc: 'Agex VTC recrute des chauffeurs professionnels à Libreville et Akanda : conditions, avantages, candidature en ligne.',
  body: `${PT('Devenir chauffeur', 'Rejoignez l\'équipe Agex', 'Nous recrutons des chauffeurs sérieux, ponctuels et souriants dans le Grand Libreville.', PH.chauffeur)}
<section class="sec"><div class="wrap split"><div><span class="tag">Le profil</span><h2>Ce que nous attendons</h2><ul class="chk big">${['Permis B depuis au moins 3 ans', 'Excellente connaissance du Grand Libreville', 'Casier judiciaire vierge', 'Présentation soignée et sens du service', 'Smartphone avec WhatsApp', 'Disponibilité de jour, de nuit ou le week-end'].map((t) => `<li>${ic('check', 18)}<span>${t}</span></li>`).join('')}</ul></div>
<div><span class="tag">Les avantages</span><h2>Ce que nous offrons</h2><div class="adv">${[['wallet', 'Revenus réguliers', 'Abonnements scolaires et entreprises : un planning stable chaque mois.'], ['car', 'Véhicule fourni', 'Ou intégration de votre propre véhicule, selon son état.'], ['shield', 'Cadre sécurisé', 'Clients identifiés, opérateur joignable 24 h/24.'], ['star', 'Formation', 'Accueil client, conduite préventive, protocole aéroport.']].map(([i, t, d]) => `<div>${ic(i, 24)}<h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></div></section>
<section class="sec soft"><div class="wrap split"><div><span class="tag">Recrutement</span><h2>Comment ça se passe</h2><ol class="steps lt"><li><b>1</b><h3>Candidature</h3><p>Remplissez le formulaire : réponse sous 72 h.</p></li><li><b>2</b><h3>Entretien et essai</h3><p>Rencontre à l'agence d'Akanda et trajet d'essai.</p></li><li><b>3</b><h3>Documents</h3><p>Permis, pièce d'identité, casier judiciaire, photo.</p></li><li><b>4</b><h3>Première course</h3><p>Formation d'une journée, puis vos premiers clients.</p></li></ol></div>
<form class="form" data-cand novalidate><h2 class="h3">Postuler</h2>
<div class="g2"><label class="fld"><span>Prénom et nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<div class="g2"><label class="fld"><span>Quartier</span><select name="q">${zoneOpts('akanda')}</select></label><label class="fld"><span>Permis B depuis</span><select name="permis"><option>3 à 5 ans</option><option>5 à 10 ans</option><option>Plus de 10 ans</option><option>Moins de 3 ans</option></select></label></div>
<div class="g2"><label class="fld"><span>Véhicule</span><select name="veh"><option>Je n'ai pas de véhicule</option><option>J'ai un véhicule personnel</option></select></label><label class="fld"><span>Disponibilités</span><select name="dispo"><option>Journée</option><option>Nuit</option><option>Week-end</option><option>Temps plein</option></select></label></div>
<label class="fld"><span>Expérience (VTC, taxi, chauffeur de direction…)</span><textarea name="exp" rows="3"></textarea></label><p class="msg" data-permis hidden>Nous demandons au moins 3 ans de permis : vous pouvez tout de même postuler pour une prochaine session.</p><button class="btn y" type="submit">Envoyer ma candidature</button></form></div></section>
${CTA}`,
}));

// Qui sommes-nous
pages.push(page('agence.html', {
  title: 'Qui sommes-nous', active: 'agence.html', desc: 'Assistance Gabon Express VTC, basée à Akanda : chauffeurs professionnels 24 h/24 dans le Grand Libreville. Nos valeurs, nos zones, notre engagement.',
  body: `${PT('Qui sommes-nous', 'Assistance Gabon Express', `${AG.slogan} Une entreprise d'Akanda au service des familles, des entreprises et des voyageurs.`, PH.nuit2)}
<section class="sec"><div class="wrap split"><img class="big" src="${PH.chauffeur}" alt="Chauffeur Agex" loading="lazy"><div><span class="tag">Notre histoire</span><h2>Le transport privé, version professionnelle</h2><p class="lead">Agex est née d'un constat simple : à Libreville, trouver un chauffeur ponctuel, courtois et au prix clair n'était pas toujours facile.</p><p class="lead">Depuis notre base d'Akanda, nous proposons des chauffeurs formés, des véhicules entretenus et un opérateur joignable jour et nuit, par appel ou WhatsApp.</p>
<div class="vals">${[['clock', 'Ponctualité'], ['shield', 'Sécurité'], ['star', 'Courtoisie'], ['wallet', 'Prix clairs']].map(([i, t]) => `<span>${ic(i, 18)} ${t}</span>`).join('')}</div></div></div></section>
<section class="sec dark"><div class="wrap"><span class="tag">Zones desservies</span><h2>Tout le Grand Libreville… et au-delà</h2><div class="qz">${ZONES.map(([, n]) => `<span>${ic('pin', 14)} ${n}</span>`).join('')}<span>${ic('route', 14)} Kango, Cocobeach, Lambaréné sur devis</span></div></div></section>
<section class="sec" id="engagement"><div class="wrap split"><div><span class="tag rose-t">Engagement</span><h2>Contre les cancers féminins</h2><p class="lead">Agex soutient la sensibilisation au dépistage des cancers du sein et du col de l'utérus. Pendant Octobre rose, nous facilitons les trajets des femmes vers les journées de dépistage organisées dans le Grand Libreville.</p><p class="lead">Parce que se faire dépister, c'est aussi pouvoir s'y rendre.</p><a class="btn y" href="https://wa.me/${AG.wa}?text=${encodeURIComponent('Bonjour Agex, je souhaite en savoir plus sur votre engagement Octobre rose.')}" target="_blank" rel="noopener">En savoir plus</a></div><div class="rosebox">${ic('heart', 64)}<b>Octobre rose</b><span>Dépistage · prévention · accompagnement</span></div></div></section>
${CTA}`,
}));

// Galerie
const GAL = [[PH.hero, 'Nos chauffeurs'], [PH.nuit2, 'De nuit, en sécurité'], [PH.avion, 'Transferts aéroport'], [PH.mariage, 'Mariages et réceptions'], [PH.route, 'Le Grand Libreville'], [PH.chauffeur, 'Toujours à l\'heure'], [PH.ecole, 'Abonnements scolaires'], [PH.nature, 'Sorties en famille'], [PH.nuit1, 'Affrètements privés'], [PH.bureau, 'Abonnements entreprises'], [PH.passeport, 'Accueil des voyageurs']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: '', desc: 'Agex VTC en images : chauffeurs, véhicules, transferts aéroport, mariages, abonnements.',
  body: `${PT('Galerie', 'Galerie', 'Agex en images, de jour comme de nuit.')}
<section class="sec"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${p}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles de la flotte Agex.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => p))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
}));

// Contact
pages.push(page('contact.html', {
  title: 'Contact', active: 'contact.html', desc: `Agex VTC, ${AG.addr}. Tél. et WhatsApp ${AG.tel} / ${AG.tel2}, 24 h/24. ${AG.mail}.`,
  body: `${PT('Contact', 'Contact', 'Un opérateur vous répond 24 h/24, par téléphone ou WhatsApp.')}
<section class="wrap ctg"><div><div class="info">
<div>${ic('phone', 22)}<h2>Téléphone 24 h/24</h2><p><a href="${telHref(AG.tel)}">${AG.tel}</a><br><a href="${telHref(AG.tel2)}">${AG.tel2}</a></p></div>
<div>${ic('mail', 22)}<h2>E-mail</h2><p><a href="mailto:${AG.mail}">${AG.mail}</a></p></div>
<div>${ic('pin', 22)}<h2>Agence</h2><p>${AG.addr}<br>${AG.bp}</p></div>
<div>${ic('clock', 22)}<h2>Disponibilité</h2><p>24 h/24, 7 j/7<br>Grand Libreville</p></div></div>
<div class="map"><iframe title="Plan d'accès, Agex VTC à Akanda" src="https://www.google.com/maps?q=Akanda+Gabon&z=13&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Écrivez-nous</h2><p>Devis entreprise, mariage, affrètement, réclamation : nous répondons rapidement.</p>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Objet</span><select name="obj"><option>Devis entreprise</option><option>Mariage / événement</option><option>Affrètement privé</option><option>Abonnement</option><option>Réclamation</option><option>Autre</option></select></label>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label><div class="row"><button class="btn y" type="submit">Envoyer sur WhatsApp</button><a class="btn line" href="mailto:${AG.mail}">Par e-mail</a></div></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), LOGO_SVG);
for (const f of ['agex.css', 'agex.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', pages.length, 'pages');
