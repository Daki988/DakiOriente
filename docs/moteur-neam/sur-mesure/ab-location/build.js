// Construit le site sur mesure d'AB Location dans neam-moteur/sites/ab-location/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { AB, PH, FLOTTE, CATS, CAT_OF, AVIS } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', AB.slug);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';

const ICON = {
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  user: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z',
  bag: 'M17 6h-2V3a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h1v1h2v-1h4v1h2v-1h1a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-6-2h2v2h-2z',
  gear: 'M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1L11 21h4l.4-2.9c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
  shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  star: 'M12 17.3 18.2 21l-1.6-7L22 9.2l-7.2-.6L12 2 9.2 8.6 2 9.2 7.5 14l-1.7 7z',
  plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm2 16H8v-2h8zm0-4H8v-2h8zm-3-5V3.5L18.5 9z',
  wrench: 'M22.7 19 13.6 9.9c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
  building: 'M15 11V5l-3-3-3 3v2H3v14h18V11zm-8 8H5v-2h2zm0-4H5v-2h2zm0-4H5V9h2zm6 8h-2v-2h2zm0-4h-2v-2h2zm0-4h-2V9h2zm0-4h-2V5h2zm6 12h-2v-2h2zm0-4h-2v-2h2z',
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;

// Silhouettes de véhicules (vue de profil, sans marque)
const SHAPE = {
  citadine: { len: 196, hood: 44, roof: 18, x1: 84, x2: 140, x3: 176, rear: 38 },
  berline: { len: 230, hood: 46, roof: 22, x1: 94, x2: 160, x3: 204, rear: 44 },
  suv: { len: 226, hood: 38, roof: 12, x1: 84, x2: 188, x3: 216, rear: 28 },
  '4x4': { len: 228, hood: 34, roof: 8, x1: 78, x2: 208, x3: 222, rear: 16 },
  minibus: { len: 236, hood: 30, roof: 6, x1: 46, x2: 228, x3: 236, rear: 6 },
};
function car(cat, cls = 'car') {
  let body, win;
  if (cat === 'pickup') {
    body = 'M14 66 L14 40 Q16 34 34 34 L72 34 L90 10 L142 10 L148 34 L236 34 L236 66 Z';
    win = 'M95 15 L138 15 L142 31 L82 31 Z';
  } else {
    const s = SHAPE[cat];
    body = `M14 66 L14 ${s.hood + 6} Q16 ${s.hood} 34 ${s.hood} L${s.x1 - 16} ${s.hood} L${s.x1} ${s.roof} L${s.x2} ${s.roof} L${s.x3} ${s.rear} L${s.len} ${s.rear + 4} L${s.len} 66 Z`;
    win = `M${s.x1 + 6} ${s.roof + 5} L${s.x2 - 4} ${s.roof + 5} L${s.x3 - 10} ${s.hood - 2} L${s.x1 - 8} ${s.hood - 2} Z`;
  }
  const len = cat === 'pickup' ? 236 : SHAPE[cat].len;
  const w = (x) => `<circle cx="${x}" cy="66" r="15" fill="#15161A"/><circle cx="${x}" cy="66" r="9.5" fill="none" stroke="#6B7078" stroke-width="2"/><circle cx="${x}" cy="66" r="6" fill="#C9CDD3"/><circle cx="${x}" cy="66" r="2" fill="#15161A"/>`;
  const arch = (x) => `<circle cx="${x}" cy="66" r="19" fill="#0B0B0D" opacity=".85"/>`;
  return `<svg class="${cls}" viewBox="0 0 250 86" aria-hidden="true"><ellipse cx="${len / 2 + 7}" cy="82" rx="${len / 2}" ry="4" fill="rgba(0,0,0,.25)"/><path d="${body}" fill="url(#ab-g)" stroke="#E6E8EC" stroke-width="5" stroke-linejoin="round"/><path d="${win}" fill="#2A2D33" stroke="#2A2D33" stroke-width="3" stroke-linejoin="round"/><path d="M22 54 L${len - 8} 54" stroke="#E1251B" stroke-width="3" stroke-linecap="round"/><rect x="12" y="${cat === 'pickup' ? 40 : (SHAPE[cat] || {}).hood + 4 || 40}" width="7" height="4" rx="2" fill="#FFD27A"/><rect x="${len - 3}" y="${cat === 'pickup' ? 38 : 50}" width="5" height="5" rx="1.5" fill="#E1251B"/>${arch(54)}${arch(len - 44)}${w(54)}${w(len - 44)}</svg>`;
}
const DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="ab-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2F3F5"/><stop offset=".55" stop-color="#C9CDD3"/><stop offset="1" stop-color="#8E939B"/></linearGradient></defs></svg>';

const LOGO = `<img src="logo.png" alt="AB Location" width="58" height="58">`;
const NAV = [['index.html', 'Accueil'], ['flotte.html', 'Notre flotte'], ['entreprises.html', 'Entreprises'], ['conditions.html', 'Conditions'], ['agence.html', 'L\'agence'], ['contact.html', 'Contact']];
const HOURS = AB.hours.map(([d, h]) => `${d} · ${h}`);

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'AutoRental', name: AB.name, slogan: 'Louez en toute confiance', telephone: '+241' + AB.tel.replace(/\D/g, '').replace(/^0/, ''), email: AB.mail, address: { '@type': 'PostalAddress', postOfficeBoxNumber: '1325', addressLocality: AB.city, addressRegion: 'Ogooué-Maritime', addressCountry: 'GA' }, aggregateRating: { '@type': 'AggregateRating', ratingValue: AB.rating, bestRating: 5 } };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${AB.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${AB.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="logo.png">
<link rel="icon" href="logo.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Russo+One&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="ab.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>${DEFS}
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="AB Location, accueil">${LOGO}<span class="t">AB <b>LOCATION</b><small>Port-Gentil</small></span></a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="reservation.html">Réserver un véhicule</a></nav>
<a class="call" href="${telHref(AB.tel)}">${ic('phone', 16)} ${AB.tel}</a><a class="btn r hcta" href="reservation.html">Réserver</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo" href="index.html">${LOGO}<span class="t">AB <b>LOCATION</b><small>Port-Gentil</small></span></a><p>Location de voitures à Port-Gentil, avec ou sans chauffeur, à la journée, à la semaine ou au mois. Louez en toute confiance.</p><div class="soc" data-soc></div></div>
<div><h5>Louer</h5><p><a href="flotte.html">Notre flotte</a><br><a href="reservation.html">Réserver</a><br><a href="entreprises.html">Entreprises & longue durée</a><br><a href="conditions.html">Conditions de location</a></p></div>
<div><h5>Horaires</h5><p>${HOURS.join('<br>')}</p><p>Livraison à l'aéroport et à l'hôtel</p></div>
<div><h5>Contact</h5><p><a href="${telHref(AB.tel)}">${AB.tel}</a> (WhatsApp)<br><a href="${telHref(AB.tel2)}">${AB.tel2}</a><br><a href="${telHref(AB.tel3)}">${AB.tel3}</a><br><a href="mailto:${AB.mail}">${AB.mail}</a><br>${AB.bp}</p></div>
<div class="cp">© 2026 ${AB.name} · Port-Gentil, Gabon · Tarifs indicatifs, modèles selon disponibilité.</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.AB=${JSON.stringify({ slug: AB.slug, name: AB.name, wa: AB.wa, soc: AB.soc, flotte: FLOTTE.map(({ id, n, mod, pl, prix, caution, vip }) => ({ id, n, mod, pl, prix, caution, vip: !!vip })) })}</script><script src="ab.js"></script>
<script src="../../assets/reco.js" data-slug="${AB.slug}" data-wa="${AB.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const PT = (crumb, h1, p) => `<section class="pt"><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div><div class="road" aria-hidden="true"></div></section>`;
const vcard = (v) => `<article class="vc${v.vip ? ' vip' : ''}" data-cats="${CAT_OF[v.vip ? 'vip' : v.cat].join(' ')}" id="${v.id}"><div class="vi">${car(v.cat)}${v.vip ? '<span class="pill">Avec chauffeur</span>' : ''}</div><div class="vb"><h3>${v.n}</h3><p class="mod">${v.mod}</p><ul class="sp"><li>${ic('user', 15)} ${v.pl} places</li><li>${ic('gear', 15)} ${v.bv}</li><li>${ic('bag', 15)} ${v.bag} bagages</li></ul><ul class="at">${v.at.map((a) => `<li>${a}</li>`).join('')}</ul><div class="vp"><div><small>dès</small><b>${fcfa(v.prix)}</b><small>/ jour</small></div><a class="btn r" href="reservation.html?v=${v.id}">Réserver</a></div></div></article>`;
const CTA = `<section class="cta"><div class="wrap"><div><h2>Besoin d'un véhicule à Port-Gentil ?</h2><p>Réservez en ligne ou appelez-nous : votre voiture vous attend à l'agence, à l'aéroport ou à votre hôtel.</p></div><div class="row"><a class="btn r" href="reservation.html">Réserver un véhicule</a><a class="btn ol" href="https://wa.me/${AB.wa}" target="_blank" rel="noopener">WhatsApp ${AB.tel}</a></div></div></section>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// Accueil
pages.push(page('index.html', {
  title: 'Location de voitures à Port-Gentil', active: 'index.html',
  desc: 'AB Location, location de voitures à Port-Gentil : citadines, SUV, 4x4, pick-up, minibus et véhicule VIP avec chauffeur. Livraison à l\'aéroport, location longue durée.',
  body: `<section class="hero"><div class="wrap hg"><div><span class="kick">${ic('star', 15)} 5/5 sur Google · Port-Gentil</span><h1>Louez en toute <em>confiance</em>.</h1><p>Citadines, SUV, 4x4, pick-up, minibus et véhicule VIP avec chauffeur. À la journée, à la semaine ou au mois, livrés à l'aéroport ou à votre hôtel.</p>
<form class="qb" action="reservation.html"><label><span>Véhicule</span><select name="v">${FLOTTE.map((v) => `<option value="${v.id}">${v.n}</option>`).join('')}</select></label><label><span>Départ</span><input type="date" name="d1" data-q1></label><label><span>Retour</span><input type="date" name="d2" data-q2></label><button class="btn r" type="submit">Voir le prix</button></form></div>
<div class="hv">${car('pickup', 'car big')}<div class="glow"></div></div></div><div class="road" aria-hidden="true"></div></section>
<section class="band"><div class="wrap">${[['plane', 'Livraison aéroport', 'et à votre hôtel'], ['user', 'Avec ou sans chauffeur', 'selon vos besoins'], ['building', 'Longue durée', 'pour les entreprises'], ['wrench', 'Véhicules entretenus', 'remplacement sous 24 h']].map(([i, t, s]) => `<div>${ic(i, 24)}<b>${t}</b><span>${s}</span></div>`).join('')}</div></section>
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Notre flotte</span><h2>Le bon véhicule pour chaque trajet</h2></div><a class="btn line" href="flotte.html">Toute la flotte</a></div><div class="vcs">${FLOTTE.filter((v) => ['citadine', 'suv', '4x4', 'vip'].includes(v.id)).map(vcard).join('')}</div></div></section>
<section class="sec dark"><div class="wrap"><span class="tag">Comment ça marche</span><h2>Votre voiture en 3 étapes</h2><ol class="steps">${[['Choisissez', 'Le véhicule, les dates et le lieu de remise : le prix s\'affiche aussitôt.'], ['Confirmez', 'Envoyez la demande sur WhatsApp, préparez permis et pièce d\'identité.'], ['Roulez', 'Remise des clés à l\'agence, à l\'aéroport ou à votre hôtel, état des lieux en photos.']].map(([t, d], i) => `<li><b>0${i + 1}</b><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol></div></section>
<section class="sec"><div class="wrap split"><img class="big" src="${PH.bureaux}" alt="Bureaux d'entreprise" loading="lazy"><div><span class="tag">Entreprises</span><h2>Location longue durée pour les professionnels</h2><p class="lead">Pétrole, BTP, logistique, ONG : un ou plusieurs véhicules au mois, entretien et assurance inclus, remplacement sous 24 h et facture mensuelle.</p><a class="btn r" href="entreprises.html">Demander un devis entreprise</a></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Avis clients</span><h2>Ils ont roulé avec nous</h2><div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
${CTA}`,
}));

// Flotte
pages.push(page('flotte.html', {
  title: 'Notre flotte', active: 'flotte.html',
  desc: 'La flotte d\'AB Location à Port-Gentil : citadine, berline, SUV, 4x4, pick-up double cabine, minibus 15 places, VIP avec chauffeur. Tarifs à la journée.',
  body: `${PT('Notre flotte', 'Notre flotte', 'Des véhicules récents et entretenus, pour la ville, les pistes de Cap Lopez, les chantiers ou les grands groupes.')}
<section class="sec"><div class="wrap"><div class="chips" role="group" aria-label="Filtrer la flotte" data-vf>${CATS.map(([k, t], i) => `<button type="button" data-k="${k}" aria-pressed="${!i}">${t}</button>`).join('')}</div><p class="cnt" data-vn></p><div class="vcs all">${FLOTTE.map(vcard).join('')}</div><p class="note">Modèles indicatifs, selon disponibilité. Silhouettes d'illustration : photos réelles des véhicules à ajouter.</p></div></section>
${CTA}`,
}));

// Réservation
pages.push(page('reservation.html', {
  title: 'Réserver un véhicule', active: '',
  desc: 'Réservez votre voiture de location à Port-Gentil : véhicule, dates, chauffeur, livraison. Prix calculé immédiatement, remise à la semaine et au mois.',
  body: `${PT('Réserver', 'Réserver un véhicule', 'Le prix s\'affiche immédiatement, remises comprises. Confirmation par WhatsApp.')}
<section class="bk"><div class="wrap"><form data-res novalidate>
<fieldset class="stp"><legend><b>1</b>Le véhicule</legend><div class="vsel">${FLOTTE.map((v, i) => `<label><input type="radio" name="v" value="${v.id}"${i ? '' : ' checked'}><span>${car(v.cat, 'car sm')}<b>${v.n}</b><small>${fcfa(v.prix)} / jour</small></span></label>`).join('')}</div></fieldset>
<fieldset class="stp"><legend><b>2</b>Les dates</legend><div class="g4"><label class="fld"><span>Départ</span><input type="date" name="d1" required></label><label class="fld"><span>Heure</span><input type="time" name="h1" value="09:00"></label><label class="fld"><span>Retour</span><input type="date" name="d2" required></label><label class="fld"><span>Heure</span><input type="time" name="h2" value="09:00"></label></div><p class="msg" data-dmsg hidden></p></fieldset>
<fieldset class="stp"><legend><b>3</b>Options</legend><div class="g2"><label class="fld"><span>Remise du véhicule</span><select name="lieu"><option value="0">À l'agence (gratuit)</option><option value="5000">Aéroport de Port-Gentil (+5 000 FCFA)</option><option value="5000">À votre hôtel ou domicile (+5 000 FCFA)</option></select></label><label class="fld"><span>Restitution</span><select name="ret"><option value="0">À l'agence (gratuit)</option><option value="5000">Aéroport (+5 000 FCFA)</option><option value="5000">Hôtel ou domicile (+5 000 FCFA)</option></select></label></div>
<div class="xs"><label data-chauf><input type="checkbox" name="chauffeur"><span><b>Chauffeur</b><small>+15 000 FCFA / jour</small></span></label><label><input type="checkbox" name="siege"><span><b>Siège enfant</b><small>+3 000 FCFA / jour</small></span></label><label><input type="checkbox" name="cond2"><span><b>Conducteur supplémentaire</b><small>+10 000 FCFA (forfait)</small></span></label><label><input type="checkbox" name="plein"><span><b>Plein fait au retour par nos soins</b><small>Facturé au prix de la pompe</small></span></label></div></fieldset>
<fieldset class="stp"><legend><b>4</b>Vos coordonnées</legend><div class="g2"><label class="fld"><span>Nom et prénom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<div class="g2" style="margin-top:10px"><label class="fld"><span>Permis depuis</span><select name="permis"><option>Plus de 2 ans</option><option>Moins de 2 ans</option></select></label><label class="fld"><span>N° de vol (si livraison aéroport)</span><input name="vol"></label></div><p class="msg" data-pmsg hidden>Permis de moins de 2 ans : nous vous proposons la location avec chauffeur.</p></fieldset></form>
<aside class="sum"><div class="sv" data-s="car"></div><h2 data-s="name"></h2><div class="ln"><span>Durée</span><b data-s="days"></b></div><div class="lines" data-s="lines"></div><div class="tot"><span>Total estimé</span><b data-s="tot"></b><small data-s="per"></small></div><div class="ln dep"><span>Caution (restituée)</span><b data-s="caution"></b></div>
<button class="btn r wide" data-send>Réserver sur WhatsApp</button><a class="btn ol wide" href="${telHref(AB.tel)}">${ic('phone', 16)} ${AB.tel}</a><p class="note">Remise de 10 % dès 7 jours, 25 % dès 30 jours. Paiement à la remise des clés.</p></aside></div></section>`,
}));

// Entreprises
pages.push(page('entreprises.html', {
  title: 'Entreprises et longue durée', active: 'entreprises.html',
  desc: 'Location longue durée de véhicules à Port-Gentil pour les entreprises : SUV, pick-up, minibus, avec ou sans chauffeur, entretien inclus, facture mensuelle.',
  body: `${PT('Entreprises', 'Entreprises et longue durée', 'Une flotte à votre disposition au mois, sans immobiliser votre trésorerie. Entretien, assurance et remplacement inclus.')}
<section class="sec"><div class="wrap"><div class="adv">${[['wrench', 'Entretien inclus', 'Vidanges, pneus et révisions suivis par nos soins.'], ['shield', 'Assurance tous risques', 'Véhicules assurés, franchise précisée au contrat.'], ['clock', 'Remplacement sous 24 h', 'En cas de panne ou de sinistre, un véhicule équivalent.'], ['doc', 'Facture mensuelle', 'Un seul interlocuteur, un relevé clair chaque mois.']].map(([i, t, d]) => `<div>${ic(i, 26)}<h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></section>
<section class="sec soft"><div class="wrap split"><div><span class="tag">Simulateur</span><h2>Votre budget mensuel</h2><p class="lead">Indiquez vos besoins : nous calculons une estimation, à affiner avec un devis personnalisé.</p>
<div class="sim" data-ent><div class="g2"><label class="fld"><span>Véhicule</span><select name="v">${FLOTTE.filter((v) => !v.vip).map((v) => `<option value="${v.id}"${v.id === 'pickup' ? ' selected' : ''}>${v.n}</option>`).join('')}</select></label><label class="fld"><span>Nombre de véhicules</span><select name="n">${[1, 2, 3, 4, 5, 6, 8, 10].map((n) => `<option>${n}</option>`).join('')}</select></label></div>
<div class="g2"><label class="fld"><span>Durée</span><select name="m"><option value="1">1 mois</option><option value="3">3 mois (−5 %)</option><option value="6">6 mois (−10 %)</option><option value="12">12 mois (−15 %)</option></select></label><label class="fld"><span>Chauffeur</span><select name="ch"><option value="0">Sans chauffeur</option><option value="1">Avec chauffeur</option></select></label></div>
<div class="res"><span>Estimation par mois</span><b data-e="tot"></b><small data-e="det"></small></div></div></div>
<form class="form" data-devis novalidate><h2 class="h3">Demander un devis</h2><div class="g2"><label class="fld"><span>Entreprise</span><input name="ent" required></label><label class="fld"><span>Secteur</span><select name="sec"><option>Pétrole et gaz</option><option>BTP</option><option>Logistique / port</option><option>ONG / administration</option><option>Autre</option></select></label></div>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Besoin</span><textarea name="msg" rows="3" placeholder="Nombre de véhicules, date de début, usage (ville, chantier, pistes)…"></textarea></label><button class="btn r" type="submit">Envoyer ma demande</button></form></div></section>
${CTA}`,
}));

// Conditions
pages.push(page('conditions.html', {
  title: 'Conditions de location', active: 'conditions.html',
  desc: 'Conditions de location AB Location : documents à fournir, âge, caution, assurance, carburant, zone de circulation à Port-Gentil. Questions fréquentes.',
  body: `${PT('Conditions', 'Conditions de location', 'Tout ce qu\'il faut savoir avant de prendre le volant.')}
<section class="sec"><div class="wrap cnd"><div><span class="tag">Documents</span><h2>À présenter à la remise des clés</h2><ul class="chk big">${['Permis de conduire valide depuis plus de 2 ans', 'Pièce d\'identité ou passeport', 'Justificatif de domicile ou attestation employeur', 'Caution par chèque ou espèces, restituée au retour'].map((t) => `<li>${ic('check', 18)}<span>${t}</span></li>`).join('')}</ul></div>
<div class="tbl" role="region" aria-label="Cautions par véhicule" tabindex="0"><table><thead><tr><th>Véhicule</th><th>Par jour</th><th>Caution</th></tr></thead><tbody>${FLOTTE.map((v) => `<tr><td>${v.n}</td><td>${fcfa(v.prix)}</td><td>${v.caution ? fcfa(v.caution) : 'Sans caution'}</td></tr>`).join('')}</tbody></table></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Questions fréquentes</span><h2>Bon à savoir</h2><div class="faq">${[['Quel âge faut-il avoir ?', '23 ans minimum et 2 ans de permis. Pour les conducteurs plus jeunes, nous proposons la location avec chauffeur.'], ['Le kilométrage est-il limité ?', 'Non, le kilométrage est illimité à Port-Gentil et dans ses environs (Cap Lopez, Pointe Clairette…).'], ['Quelle est la politique carburant ?', 'Le véhicule est remis avec un niveau de carburant noté à l\'état des lieux, et doit être rendu au même niveau.'], ['Que faire en cas de panne ?', 'Appelez-nous : assistance et véhicule de remplacement selon disponibilité, sous 24 h.'], ['Puis-je récupérer la voiture à l\'aéroport ?', 'Oui, nous livrons à l\'aéroport de Port-Gentil et à votre hôtel pour 5 000 FCFA. Donnez-nous votre numéro de vol.'], ['Comment se passe le paiement ?', 'À la remise des clés, en espèces ou par virement pour les entreprises. La caution est restituée au retour du véhicule.']].map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div></section>
${CTA}`,
}));

// L'agence
pages.push(page('agence.html', {
  title: 'L\'agence', active: 'agence.html',
  desc: 'AB Location, agence de location de voitures à Port-Gentil : notre équipe, nos engagements, nos zones de livraison.',
  body: `${PT('L\'agence', 'Une agence de confiance à Port-Gentil', 'Véhicules entretenus, prix clairs et une équipe joignable sur WhatsApp, 6 jours sur 7.')}
<section class="sec"><div class="wrap split"><img class="big" src="${PH.cles}" alt="Remise des clés" loading="lazy"><div><span class="tag">Notre engagement</span><h2>Louez en toute confiance</h2><p class="lead">Chez AB Location, chaque véhicule est vérifié avant chaque départ, l'état des lieux se fait en photos et le prix annoncé est le prix payé.</p><p class="lead">Particuliers de passage, familles, missions et entreprises : nous trouvons le véhicule qui vous convient, avec ou sans chauffeur.</p>
<div class="kpi"><div><b>5/5</b><span>note Google</span></div><div><b>7</b><span>catégories de véhicules</span></div><div><b>24 h</b><span>remplacement</span></div></div></div></div></section>
<section class="sec dark"><div class="wrap"><span class="tag">Livraison</span><h2>Nous livrons partout à Port-Gentil</h2><div class="qz">${['Aéroport', 'Centre-ville', 'Bord de mer', 'Balise', 'Château', 'Quartier Sud', 'Ntchengue', 'Cap Lopez (4x4)', 'Pointe Clairette'].map((q) => `<span>${ic('pin', 14)} ${q}</span>`).join('')}</div></div></section>
${CTA}`,
}));

// Galerie
const GAL = [[PH.conduite, 'Au volant'], [PH.route, 'Sur la route'], [PH.cles, 'Remise des clés'], [PH.nuit2, 'De nuit'], [PH.chauffeur, 'Chauffeur à disposition'], [PH.accueil, 'Réservation'], [PH.nuit1, 'Service VIP']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: '',
  desc: 'AB Location en images.',
  body: `${PT('Galerie', 'Galerie', 'AB Location en images.')}
<section class="sec"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${p}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles des véhicules de l'agence.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => p))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
}));

// Contact
pages.push(page('contact.html', {
  title: 'Contact', active: 'contact.html',
  desc: `AB Location, Port-Gentil, ${AB.bp}. Tél. ${AB.tel}, ${AB.tel2}, ${AB.tel3}. ${AB.mail}.`,
  body: `${PT('Contact', 'Contact', 'Appelez-nous, écrivez-nous sur WhatsApp ou passez à l\'agence.')}
<section class="wrap ctg"><div><div class="info">
<div>${ic('phone', 22)}<h2>Téléphone</h2><p><a href="${telHref(AB.tel)}">${AB.tel}</a> (WhatsApp)<br><a href="${telHref(AB.tel2)}">${AB.tel2}</a><br><a href="${telHref(AB.tel3)}">${AB.tel3}</a></p></div>
<div>${ic('mail', 22)}<h2>E-mail</h2><p><a href="mailto:${AB.mail}">${AB.mail}</a></p></div>
<div>${ic('pin', 22)}<h2>Adresse</h2><p>${AB.bp}<br>Ogooué-Maritime, Gabon</p></div>
<div>${ic('clock', 22)}<h2>Horaires</h2><p>${HOURS.join('<br>')}</p></div></div>
<div class="map"><iframe title="Plan, Port-Gentil" src="https://www.google.com/maps?q=Port-Gentil,+Gabon&z=13&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Écrivez-nous</h2><p>Une question, un devis, une disponibilité : réponse rapide.</p>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label><div class="row"><button class="btn r" type="submit">Envoyer sur WhatsApp</button><a class="btn line" href="mailto:${AB.mail}">Par e-mail</a></div></form></section>`,
}));

fs.copyFileSync(path.join(__dirname, '../../logos-reels/ab-location.png'), path.join(OUT, 'logo.png'));
for (const f of ['ab.css', 'ab.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', pages.length, 'pages');
