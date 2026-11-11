// Socle commun des sites d'hôtel sur mesure (Héliconia, Le Jomonia…).
// build(H, dir) écrit les pages dans neam-moteur/sites/<H.slug>/ à partir des données de l'hôtel H.
// Chaque hôtel garde son identité : polices, couleurs (theme.css), textes, chambres, options et sections propres.
const fs = require('fs');
const path = require('path');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
const ICON = {
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  bed: 'M7 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9a4 4 0 0 0-4-4z',
  user: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z',
  area: 'M3 3h7v2H5v5H3zm11 0h7v7h-2V5h-5zM3 14h2v5h5v2H3zm16 5v-5h2v7h-7v-2z',
  wifi: 'M12 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7-5 2 2a7 7 0 0 1 10 0l2-2a10 10 0 0 0-14 0zM1 9l2 2a13 13 0 0 1 18 0l2-2A16 16 0 0 0 1 9z',
  pool: 'M22 21c-1.1 0-1.7-.4-2.2-.7-.4-.3-.7-.4-1.3-.4s-.8.1-1.2.4c-.5.3-1.1.7-2.3.7s-1.7-.4-2.2-.7c-.4-.3-.7-.4-1.3-.4s-.8.1-1.2.4c-.5.3-1.1.7-2.3.7s-1.7-.4-2.2-.7c-.4-.3-.7-.4-1.3-.4s-.8.1-1.2.4c-.5.3-1.1.7-2.3.7v-2c.6 0 .8-.1 1.2-.4.5-.3 1.1-.7 2.3-.7s1.7.4 2.2.7c.4.3.7.4 1.3.4s.8-.1 1.2-.4c.5-.3 1.1-.7 2.3-.7s1.7.4 2.2.7c.4.3.7.4 1.3.4s.8-.1 1.2-.4c.5-.3 1.1-.7 2.3-.7s1.7.4 2.2.7c.4.3.7.4 1.3.4zM8.7 14l1.2-1.7L7.5 8.8 9 7.2l3.6 4.8-1.1 1.5c.3 0 .6.1.9.2.4.2.8.3 1.3.3s.8-.1 1.2-.4l.1-.1L12 9.3a2 2 0 1 1 3-2.6l3.5 6.6c-.4.1-.7.3-1 .4-.5.3-1.1.7-2.3.7s-1.7-.4-2.2-.7c-.4-.3-.7-.4-1.3-.4s-.8.1-1.2.4c-.5.3-1.1.7-2.3.7s-1.7-.4-2.2-.7z',
  fork: 'M11 9H9V2H7v7H5V2H3v7c0 2.1 1.7 3.8 3.8 4V22h2.4v-9c2.1-.2 3.8-1.9 3.8-4V2h-2zm5-3v8h2.5v8H21V2c-2.8 0-5 2.2-5 4z',
  car: 'M18.9 6c-.2-.6-.8-1-1.4-1h-11c-.7 0-1.2.4-1.4 1L3 12v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8zM6.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 11l1.5-4.5h11L19 11z',
  plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z',
  gym: 'M20.6 14.9 22 13.4 20.6 12l-3.6 3.6-8.5-8.6L12 3.4 10.6 2 9.2 3.4 7.8 2 5.6 4.1 4.2 2.7 2.8 4.1l1.4 1.4L2 7.8l1.4 1.4L2 10.6 3.4 12l3.6-3.6 8.6 8.5L12 20.6l1.4 1.4 1.4-1.4 1.4 1.4 2.1-2.2 1.4 1.4 1.4-1.4-1.4-1.4 2.2-2.1z',
  meet: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-1 .1 1.2.8 2 1.9 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z',
  park: 'M13 3H6v18h4v-6h3a6 6 0 0 0 0-12zm.2 8H10V7h3.2a2 2 0 0 1 0 4z',
  wash: 'M18 2.01 6 2a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-1.99zM11 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM8 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 14a5 5 0 1 1 0-10 5 5 0 0 1 0 10z',
  shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  star: 'M12 17.3 18.2 21l-1.6-7L22 9.2l-7.2-.6L12 2 9.2 8.6 2 9.2 7.5 14l-1.7 7z',
  desk: 'M2 6v2h2v12h2v-6h12v6h2V8h2V6zm16 6H6V8h12z',
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICON[n] || ICON.check}"/></svg>`;

function build(H, dir) {
  const OUT = path.resolve(dir, '../../../../neam-moteur/sites', H.slug);
  const NAV = [['index.html', 'Accueil'], ['chambres.html', H.roomsLabel || 'Chambres'], ['restaurant.html', H.restoLabel || 'Restaurant'], [H.extraPage[0], H.extraPage[1]], ['hotel.html', 'L\'hôtel'], ['contact.html', 'Contact']];
  const HOURS = H.hours;
  const R = H.rooms;

  function page(file, { title, desc, active, body }) {
    const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
    const ld = { '@context': 'https://schema.org', '@type': 'Hotel', name: H.name, description: H.intro, telephone: '+241' + H.tel.replace(/\D/g, '').replace(/^0/, ''), email: H.mail, address: { '@type': 'PostalAddress', streetAddress: H.addr, addressLocality: H.city, addressCountry: 'GA' }, checkinTime: H.checkin, checkoutTime: H.checkout, amenityFeature: H.amen.map(([, n]) => ({ '@type': 'LocationFeatureSpecification', name: n, value: true })), priceRange: `${fcfa(Math.min(...R.map((r) => r.price)))} – ${fcfa(Math.max(...R.map((r) => r.wkd || r.price)))}` };
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${H.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${H.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${H.ph.hero}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${H.fonts}" rel="stylesheet"><link rel="stylesheet" href="hotel.css"><link rel="stylesheet" href="theme.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="${esc(H.name)}, accueil">${H.logo}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="reservation.html">Réserver</a></nav>
<a class="call" href="${telHref(H.tel)}">${ic('phone', 16)} ${H.tel}</a><a class="btn p hcta" href="reservation.html">Réserver</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo" href="index.html">${H.logo}</a><p>${esc(H.footer)}</p><div class="soc" data-soc></div></div>
<div><h5>L'hôtel</h5><p>${H.addr}<br>${H.city}, Gabon</p><p>Arrivée dès ${H.checkin.replace(':', ' h ')} · départ avant ${H.checkout.replace(':', ' h ')}</p></div>
<div><h5>Séjourner</h5><p><a href="chambres.html">${H.roomsLabel || 'Chambres'}</a><br><a href="restaurant.html">${H.restoLabel || 'Restaurant'}</a><br><a href="${H.extraPage[0]}">${H.extraPage[1]}</a><br><a href="galerie.html">Galerie</a></p></div>
<div><h5>Réservations</h5><p><a href="${telHref(H.tel)}">${H.tel}</a> (WhatsApp)<br><a href="mailto:${H.mail}">${H.mail}</a><br>${HOURS}</p></div>
<div class="cp">© 2026 ${H.name} · ${H.city}, Gabon · Tarifs indicatifs, confirmés à la réservation.</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.H=${JSON.stringify({ slug: H.slug, name: H.name, wa: H.wa, mail: H.mail, soc: H.soc, rooms: R.map((r) => ({ id: r.id, n: r.n, cap: r.cap, price: r.price, wkd: r.wkd || r.price })), extras: H.extras, stay: H.longStay || [] })}</script><script src="hotel.js"></script>
<script src="../../assets/reco.js" data-slug="${H.slug}" data-wa="${H.wa}"></script>
</body></html>`;
    fs.writeFileSync(path.join(OUT, file), html);
    return [file, title];
  }

  const PT = (crumb, h1, p, ph) => `<section class="pt"${ph ? ` style="background-image:url(${ph})"` : ''}><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div></section>`;
  const BOOK = (cls = '') => `<form class="book ${cls}" action="reservation.html" data-book><label><span>Arrivée</span><input type="date" name="in" required></label><label><span>Départ</span><input type="date" name="out" required></label><label><span>Adultes</span><select name="ad">${[1, 2, 3, 4, 5, 6].map((n) => `<option${n === 2 ? ' selected' : ''}>${n}</option>`).join('')}</select></label><label><span>Enfants</span><select name="en">${[0, 1, 2, 3, 4].map((n) => `<option>${n}</option>`).join('')}</select></label><button class="btn p" type="submit">Voir les disponibilités</button></form>`;
  const room = (r) => `<article class="rm" id="${r.id}"><div class="rg" data-rg><img src="${r.ph[0]}" alt="${esc(r.n)}" loading="lazy">${r.ph.length > 1 ? `<div class="dots">${r.ph.map((p, i) => `<button type="button" data-src="${p}" aria-label="Photo ${i + 1}"${i ? '' : ' class="on"'}></button>`).join('')}</div>` : ''}</div>
<div class="rb"><h3>${esc(r.n)}</h3><ul class="rf"><li>${ic('user', 15)} ${r.cap} pers.</li><li>${ic('area', 15)} ${r.m2} m²</li><li>${ic('bed', 15)} ${esc(r.bed)}</li></ul><p>${esc(r.d)}</p><ul class="eq">${r.eq.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>
<div class="rp"><div><small>à partir de</small><b>${fcfa(r.price)}</b><small>la nuit${r.wkd && r.wkd !== r.price ? ` · ${fcfa(r.wkd)} le week-end` : ''}</small></div><a class="btn p" href="reservation.html?room=${r.id}">Réserver</a></div></div></article>`;
  const AVIS = `<div class="avis">${H.reviews.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div>`;
  const AMEN = `<div class="amen">${H.amen.map(([i, n, d]) => `<div>${ic(i, 26)}<h3>${n}</h3><p>${d}</p></div>`).join('')}</div>`;
  const CTA = `<section class="cta"><div class="wrap"><div><h2>${esc(H.ctaTitle)}</h2><p>${esc(H.ctaText)}</p></div><div class="row"><a class="btn p" href="reservation.html">Réserver maintenant</a><a class="btn ghost" href="https://wa.me/${H.wa}" target="_blank" rel="noopener">WhatsApp ${H.tel}</a></div></div></section>`;

  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
  const pages = [];

  // Accueil
  pages.push(page('index.html', {
    title: H.title, active: 'index.html', desc: H.intro,
    body: `<section class="hero"><img class="bg" src="${H.ph.hero}" alt=""><div class="wrap"><span class="kick">${esc(H.kicker)}</span><h1>${H.h1}</h1><p>${esc(H.lead)}</p></div><div class="wrap bw">${BOOK()}</div></section>
<section class="sec intro"><div class="wrap split"><div><span class="tag">${esc(H.introTag)}</span><h2>${H.introTitle}</h2><p class="lead">${esc(H.intro)}</p><ul class="hl">${H.highlights.map(([b, s]) => `<li><b>${b}</b><span>${s}</span></li>`).join('')}</ul></div><div class="duo"><img src="${H.ph.side1}" alt="" loading="lazy"><img src="${H.ph.side2}" alt="" loading="lazy"></div></div></section>
<section class="sec soft"><div class="wrap"><div class="hdx"><div><span class="tag">Hébergement</span><h2>${esc(H.roomsTitle)}</h2></div><a class="btn line" href="chambres.html">Tout voir</a></div><div class="rms3">${R.map((r) => `<a class="rc" href="chambres.html#${r.id}"><img src="${r.ph[0]}" alt="" loading="lazy"><div><h3>${esc(r.n)}</h3><p>${r.cap} pers. · ${r.m2} m²</p><b>dès ${fcfa(r.price)}</b></div></a>`).join('')}</div></div></section>
<section class="sec"><div class="wrap"><span class="tag">Services</span><h2>${esc(H.amenTitle)}</h2>${AMEN}</div></section>
${H.homeExtra || ''}
<section class="sec soft"><div class="wrap"><span class="tag">Avis</span><h2>Ce que disent nos hôtes</h2>${AVIS}</div></section>
${CTA}`,
  }));

  // Chambres
  pages.push(page('chambres.html', {
    title: H.roomsLabel || 'Chambres', active: 'chambres.html', desc: `${H.roomsTitle} : ${R.map((r) => r.n).join(', ')}. Tarifs et réservation en ligne.`,
    body: `${PT(H.roomsLabel || 'Chambres', H.roomsTitle, H.roomsLead, H.ph.rooms)}
<section class="sec" style="padding-top:40px"><div class="wrap"><div class="bkm">${BOOK('mini')}</div><div class="rms">${R.map(room).join('')}</div><p class="note">Tarifs indicatifs par nuit, à confirmer à la réservation.${H.longStay ? ' Remises long séjour appliquées automatiquement.' : ''}</p></div></section>
${CTA}`,
  }));

  // Réservation
  pages.push(page('reservation.html', {
    title: 'Réserver', active: '', desc: `Réservez votre séjour à ${H.name} : dates, voyageurs, chambre, options. Total calculé et confirmation sur WhatsApp.`,
    body: `${PT('Réserver', 'Réserver votre séjour', 'Choisissez vos dates et votre chambre : le total est calculé immédiatement, la réservation est confirmée sur WhatsApp.')}
<section class="bk"><div class="wrap"><form data-res novalidate>
<fieldset class="stp"><legend><b>1</b>Vos dates</legend><div class="g4"><label class="fld"><span>Arrivée</span><input type="date" name="in" required></label><label class="fld"><span>Départ</span><input type="date" name="out" required></label><label class="fld"><span>Adultes</span><select name="ad">${[1, 2, 3, 4, 5, 6].map((n) => `<option${n === 2 ? ' selected' : ''}>${n}</option>`).join('')}</select></label><label class="fld"><span>Enfants</span><select name="en">${[0, 1, 2, 3, 4].map((n) => `<option>${n}</option>`).join('')}</select></label></div><p class="msg" data-dmsg hidden></p></fieldset>
<fieldset class="stp"><legend><b>2</b>Votre ${H.unit || 'chambre'}</legend><div class="opts">${R.map((r, i) => `<label><input type="radio" name="room" value="${r.id}"${i ? '' : ' checked'}><span><img src="${r.ph[0]}" alt=""><span><b>${esc(r.n)}</b><small>${r.cap} pers. · dès ${fcfa(r.price)}</small></span></span></label>`).join('')}</div>
<div class="g2" style="margin-top:12px"><label class="fld"><span>Nombre de ${H.unit === 'logement' ? 'logements' : 'chambres'}</span><select name="nb">${[1, 2, 3, 4, 5].map((n) => `<option>${n}</option>`).join('')}</select></label><div class="msg" data-cap hidden></div></div></fieldset>
<fieldset class="stp"><legend><b>3</b>Options</legend><div class="xs">${H.extras.map((x) => `<label><input type="checkbox" name="x" value="${x.id}"><span><b>${esc(x.n)}</b><small>${fcfa(x.p)} ${x.u}</small></span></label>`).join('')}</div></fieldset>
<fieldset class="stp"><legend><b>4</b>Vos coordonnées</legend><div class="g2"><label class="fld"><span>Nom et prénom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div><label class="fld" style="margin-top:10px"><span>Demande particulière</span><textarea name="msg" rows="2" placeholder="Heure d'arrivée, lit bébé, facture au nom de l'entreprise…"></textarea></label></fieldset></form>
<aside class="sum"><h2>Votre séjour</h2><div class="ln"><span>Dates</span><b data-s="dates"></b></div><div class="ln"><span>${H.unit === 'logement' ? 'Logement' : 'Chambre'}</span><b data-s="room"></b></div><div class="ln"><span>Voyageurs</span><b data-s="pax"></b></div><div data-s="lines" class="lines"></div>
<div class="tot"><span>Total estimé</span><b data-s="tot"></b><small data-s="per"></small></div><button class="btn p" data-send>Demander la réservation</button><p class="note">Aucun paiement en ligne : confirmation et paiement à l'arrivée ou par virement.</p></aside></div></section>`,
  }));

  // Restaurant
  pages.push(page('restaurant.html', {
    title: H.restoLabel || 'Restaurant', active: 'restaurant.html', desc: H.resto.desc,
    body: `${PT(H.restoLabel || 'Restaurant', H.resto.title, H.resto.lead, H.ph.resto)}
<section class="sec"><div class="wrap split"><div><span class="tag">À table</span><h2>${H.resto.h2}</h2><p class="lead">${esc(H.resto.text)}</p><ul class="hrs">${H.resto.hours.map(([m, h]) => `<li><span>${m}</span><b>${h}</b></li>`).join('')}</ul></div><div class="duo"><img src="${H.ph.food1}" alt="" loading="lazy"><img src="${H.ph.food2}" alt="" loading="lazy"></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Exemples de plats</span><h2>La carte</h2><div class="menu">${H.resto.menu.map(([cat, items]) => `<div><h3>${cat}</h3><ul>${items.map(([n, d, p]) => `<li><div><b>${esc(n)}</b><small>${esc(d)}</small></div><span>${p ? fcfa(p) : ''}</span></li>`).join('')}</ul></div>`).join('')}</div><p class="note">Carte indicative, selon le marché et la saison.</p></div></section>
${CTA}`,
  }));

  // Page propre à l'hôtel (séminaires, long séjour…)
  pages.push(page(H.extraPage[0], { title: H.extraPage[1], active: H.extraPage[0], desc: H.extraDesc, body: `${PT(H.extraPage[1], H.extraTitle, H.extraLead, H.ph.extra)}${H.extraBody}${CTA}` }));

  // L'hôtel
  pages.push(page('hotel.html', {
    title: 'L\'hôtel', active: 'hotel.html', desc: H.aboutDesc,
    body: `${PT('L\'hôtel', H.aboutTitle, H.aboutLead, H.ph.about)}
<section class="sec"><div class="wrap split"><img src="${H.ph.side1}" alt="" loading="lazy" class="big"><div><span class="tag">Notre histoire</span><h2>${H.aboutH2}</h2>${H.aboutText.map((t) => `<p class="lead">${esc(t)}</p>`).join('')}</div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Équipements</span><h2>${esc(H.amenTitle)}</h2>${AMEN}</div></section>
<section class="sec"><div class="wrap"><span class="tag">Bon à savoir</span><h2>Infos pratiques</h2><div class="faq">${H.faq.map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div></section>
${CTA}`,
  }));

  // Galerie
  const GAL = H.gallery;
  pages.push(page('galerie.html', {
    title: 'Galerie', active: '', desc: `${H.name} en images : chambres, espaces communs, restaurant.`,
    body: `${PT('Galerie', 'Galerie', 'Découvrez l\'hôtel en images.')}
<section class="sec" style="padding-top:40px"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${p}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles de l'hôtel.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => p))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
  }));

  // Contact
  pages.push(page('contact.html', {
    title: 'Contact et accès', active: 'contact.html', desc: `${H.name}, ${H.addr}, ${H.city}. Tél. et WhatsApp ${H.tel}. ${H.mail}.`,
    body: `${PT('Contact', 'Contact et accès', `${H.addr}, ${H.city}.`)}
<section class="wrap ctg"><div><div class="info">
<div>${ic('pin', 22)}<h2>Adresse</h2><p>${H.addr}<br>${H.city}</p></div>
<div>${ic('phone', 22)}<h2>Réservations</h2><p><a href="${telHref(H.tel)}">${H.tel}</a><br>Appel et WhatsApp</p></div>
<div>${ic('mail', 22)}<h2>E-mail</h2><p><a href="mailto:${H.mail}">${H.mail}</a></p></div>
<div>${ic('clock', 22)}<h2>Réception</h2><p>${HOURS}<br>Arrivée ${H.checkin.replace(':', ' h ')} · départ ${H.checkout.replace(':', ' h ')}</p></div></div>
<div class="access">${H.access.map(([i, t, d]) => `<div>${ic(i, 20)}<b>${t}</b><span>${d}</span></div>`).join('')}</div>
<div class="map"><iframe title="Plan d'accès, ${esc(H.name)}" src="https://www.google.com/maps?q=${H.mapq}&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Une question ?</h2><p>Groupe, séminaire, long séjour, facture entreprise : écrivez-nous.</p>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label><div class="row"><button class="btn p" type="submit">Envoyer sur WhatsApp</button><a class="btn line" href="mailto:${H.mail}">Par e-mail</a></div></form></section>`,
  }));

  fs.writeFileSync(path.join(OUT, 'logo.svg'), H.logoSvg);
  fs.copyFileSync(path.join(__dirname, 'hotel.css'), path.join(OUT, 'hotel.css'));
  fs.copyFileSync(path.join(__dirname, 'hotel.js'), path.join(OUT, 'hotel.js'));
  fs.copyFileSync(path.join(dir, 'theme.css'), path.join(OUT, 'theme.css'));
  fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
  console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
}

module.exports = { build, ic, fcfa, esc, telHref };
