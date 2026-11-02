// Construit le site sur mesure d'Escapade Travel Agency dans neam-moteur/sites/escapade-travel-agency/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { AG, DEST, ROUTES, AVIS, TEAM, PH } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', AG.slug);
const IMG = '../../assets/photos/';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
const img = (f) => IMG + f;

const ICON = {
  plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z',
  bed: 'M7 14c1.66 0 3-1.34 3-3S8.66 8 7 8s-3 1.34-3 3 1.34 3 3 3zm12-7h-8v8H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z',
  id: 'M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-6 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm5 12H7v-1c0-1.7 3.3-2.5 5-2.5s5 .8 5 2.5z',
  shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9z',
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  bolt: 'M7 2v11h3v9l7-12h-4l4-8z',
  card: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 14H4v-6h16zm0-10H4V6h16z',
  swap: 'M6.99 11 3 15l3.99 4v-3H14v-2H6.99zM21 9l-3.99-4v3H10v2h7.01v3z',
  group: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
};
const ic = (n, s = 22, c = '#fff') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
const LOGO = (cls = '') => `<a class="logo ${cls}" href="index.html" aria-label="Escapade Travel Agency, accueil"><span class="mk"><i></i><b></b></span><span class="t">Escapade<small>TRAVEL AGENCY</small></span></a>`;

const NAV = [['index.html', 'Accueil'], ['destinations.html', 'Destinations'], ['billetterie.html', 'Billetterie'], ['sur-mesure.html', 'Voyage sur mesure'], ['agence.html', 'L\'agence'], ['contact.html', 'Contact']];

function page(file, { title, desc, active, overlay = false, body, og }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'TravelAgency', name: AG.name, telephone: '+241' + AG.tel.replace(/\D/g, '').replace(/^0/, ''), email: AG.mail, address: { '@type': 'PostalAddress', streetAddress: AG.addr, addressLocality: AG.city, addressCountry: 'GA' }, openingHours: ['Mo-Fr 08:00-18:00', 'Sa 09:00-13:00'] };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${AG.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${AG.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${og || img(DEST[0].ph[0])}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="escapade.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body class="${overlay ? 'ov' : ''}">
<header class="hd${overlay ? ' clear' : ''}"><div class="in">${LOGO()}<nav aria-label="Menu principal">${nav}</nav><a class="btn sun hcall" href="tel:+241${AG.tel.replace(/\D/g, '').replace(/^0/, '')}">${ic('phone', 16)} ${AG.tel}</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div class="fc">${LOGO('light')}<p>Billetterie nationale et internationale, voyages clés en main depuis Libreville.</p><div class="soc" data-soc></div></div>
<div class="fc"><h5>Agence</h5><p>${AG.addr.replace(', ', '<br>')}, ${AG.city}<br>${AG.hours.join('<br>')}</p></div>
<div class="fc"><h5>Contact</h5><p><a href="tel:+241${AG.tel.replace(/\D/g, '').replace(/^0/, '')}">${AG.tel}</a><br><a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener">${AG.tel2} (WhatsApp)</a><br><a href="mailto:${AG.mail}">${AG.mail}</a></p></div>
<div class="fc"><h5>Liens</h5><p><a href="destinations.html">Destinations</a><br><a href="billetterie.html">Billetterie</a><br><a href="sur-mesure.html">Voyage sur mesure</a><br><a href="galerie.html">Galerie photos</a></p></div>
<div class="cp">© 2026 ${AG.name} · ${AG.city}, Gabon</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.AG=${JSON.stringify({ slug: AG.slug, wa: AG.wa })}</script><script src="escapade.js"></script>
<script src="../../assets/reco.js" data-slug="${AG.slug}" data-wa="${AG.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

// ---------- blocs réutilisés ----------
const card = (d) => `<a class="card" href="${d.id}.html" data-zone="${d.zone}" data-tags="${d.tags.join(' ')}" data-price="${d.pr}"><div class="im"><img src="${img(d.ph[0])}" alt="${esc(d.n)}" loading="lazy"><span>${d.zone}</span></div><div class="bd"><h3>${esc(d.n)}</h3><p>${esc(d.short)}</p><div class="pr"><div><small>À partir de</small><b>${fcfa(d.pr)}</b></div><span class="go">Voir →</span></div></div></a>`;
const SERV = [['plane', 'Billetterie', 'Vols nationaux et internationaux au meilleur prix, toutes compagnies.', 'billetterie.html'], ['bed', 'Séjours clés en main', 'Vol, hôtel, transferts et excursions réunis dans un seul forfait.', 'destinations.html'], ['id', 'Visas & formalités', 'Constitution du dossier, rendez-vous et suivi jusqu\'à l\'obtention.', 'contact.html'], ['shield', 'Assurance voyage', 'Santé, annulation et bagages : partez couvert, en toute sérénité.', 'contact.html']];
const STEPS = `<div class="steps"><div><b>1</b><div><h4>Dites-nous votre envie</h4><p>Formulaire, appel ou WhatsApp : destination, dates, budget.</p></div></div><div><b>2</b><div><h4>Recevez votre devis sous 24 h</h4><p>Plusieurs options comparées, sans frais cachés.</p></div></div><div><b>3</b><div><h4>Partez, on reste joignables</h4><p>Billets, réservations et assistance avant, pendant et après.</p></div></div></div>`;
const ctaBand = (t = 'Un projet de voyage ? Votre devis gratuit sous 24 h.') => `<section class="cta" style="background-image:url(${img(PH.avion)})"><div><h2>${t}</h2><p>Écrivez-nous sur WhatsApp ou passez à l'agence, ${AG.addr.toLowerCase().replace('anciens', 'anciens')}.</p><div class="row"><a class="btn wa" href="https://wa.me/${AG.wa}" target="_blank" rel="noopener" data-wa-ic>WhatsApp · ${AG.tel2}</a><a class="btn ghost" href="sur-mesure.html">Demander un devis</a></div></div></section>`;
const opts = DEST.map((d) => `<option value="${esc(d.n)}">`).join('');

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'Agence de voyage à Libreville', active: 'index.html', overlay: true,
  desc: 'Billets d\'avion, séjours clés en main, visas et assurance au départ de Libreville. Devis gratuit sous 24 h.',
  body: `<section class="hero" style="background-image:url(${img('x-zanzibar-1.jpg')})"><div class="wrap"><div class="in">
<span class="tag">Agence de voyage à Libreville</span><h1>Partez l'esprit léger, <em>on s'occupe de tout.</em></h1>
<p>Billets d'avion nationaux et internationaux, hôtels, visas et séjours clés en main. Un conseiller dédié vous suit sur WhatsApp, du devis jusqu'au retour.</p>
<div class="row"><a class="btn sun" href="sur-mesure.html">Demander un devis gratuit</a><a class="btn ghost" href="destinations.html">Voir les destinations</a></div></div></div></section>
<form class="search wrap" data-quick action="sur-mesure.html"><div class="f"><label for="q-dep">Départ</label><input id="q-dep" value="Libreville (LBV)" readonly></div>
<div class="f"><label for="q-dest">Destination</label><input id="q-dest" name="dest" list="dl" placeholder="Zanzibar, Dubaï, Paris…"><datalist id="dl">${opts}</datalist></div>
<div class="f"><label for="q-date">Départ le</label><input id="q-date" name="date" type="date"></div>
<div class="f"><label for="q-pax">Voyageurs</label><select id="q-pax" name="pax"><option value="1">1 adulte</option><option value="2" selected>2 adultes</option><option value="3">3 adultes</option><option value="4">4 adultes</option><option value="5">Famille ou groupe</option></select></div>
<button class="btn sun" type="submit">Recevoir mon devis</button></form>
<section class="sec"><div class="wrap"><span class="tag">Nos services</span><h2>Un seul interlocuteur pour tout votre voyage</h2><p class="lead">Fini les heures passées à comparer : nous trouvons le meilleur tarif et gérons chaque étape.</p>
<div class="srv">${SERV.map(([i, t, d, h]) => `<a href="${h}"><span class="ic">${ic(i, 24)}</span><h3>${t}</h3><p>${d}</p></a>`).join('')}</div></div></section>
<section class="sec" style="padding-top:0"><div class="wrap"><div class="hdx"><div><span class="tag">Destinations coups de cœur</span><h2>Où partez-vous cette année ?</h2></div><a class="more" href="destinations.html">Toutes les destinations →</a></div>
<div class="grid g3">${DEST.slice(0, 6).map(card).join('')}</div></div></section>
<section class="band"><div class="ph" style="background-image:url(${img(PH.team)})"></div><div class="tx"><span class="tag lt">Comment ça marche</span><h2>Votre voyage prêt en 3 étapes</h2>${STEPS}
<div class="stats"><div><b>24 h</b><span>pour votre devis</span></div><div><b>40+</b><span>destinations</span></div><div><b>7j/7</b><span>assistance WhatsApp</span></div></div></div></section>
<section class="sec"><div class="wrap"><span class="tag">Ils ont voyagé avec nous</span><h2>Avis de nos voyageurs</h2>
<div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${esc(w)}</small></figcaption></figure>`).join('')}</div></div></section>
${ctaBand()}`,
}));

// ---------- Destinations ----------
pages.push(page('destinations.html', {
  title: 'Destinations', active: 'destinations.html',
  desc: '8 séjours au départ de Libreville : Zanzibar, Île Maurice, Dubaï, Le Cap, Marrakech, Paris, Istanbul et Dakar. Vol, hôtel et excursions compris.',
  body: `<section class="ph1" style="background-image:url(${img(PH.PLAGE[1])})"><div class="wrap"><div class="crumb"><a href="index.html">Accueil</a> / Destinations</div><span class="tag lt">${DEST.length} séjours au départ de Libreville</span><h1>Nos destinations</h1><p>Des séjours testés et négociés par l'agence : vol, hôtel, transferts et excursions compris.</p></div></section>
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="bar"><div class="chips" data-filter role="group" aria-label="Filtrer les destinations">
<button class="on" data-f="all">Toutes (${DEST.length})</button><button data-f="zone:Afrique">Afrique (${DEST.filter((d) => d.zone === 'Afrique').length})</button><button data-f="zone:Monde">Monde (${DEST.filter((d) => d.zone === 'Monde').length})</button><button data-f="tag:plage">Plage</button><button data-f="tag:ville">Ville &amp; shopping</button><button data-f="tag:lune">Lune de miel</button></div>
<label class="sel"><span class="sr">Trier</span><select data-sort><option value="">Nos coups de cœur</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option></select></label></div>
<div class="grid g3 g4" data-list>${DEST.map(card).join('')}</div><p class="empty" hidden>Aucune destination dans cette catégorie pour l'instant.</p></div></section>
<section class="wrap"><div class="strip"><div><h3>Votre destination n'est pas dans la liste ?</h3><p>Nous organisons des voyages vers plus de 40 pays. Dites-nous où vous rêvez d'aller.</p></div><a class="btn sun" href="sur-mesure.html">Créer mon voyage sur mesure</a></div></section>`,
}));

// ---------- Fiches destination ----------
for (const d of DEST) {
  const i = DEST.indexOf(d);
  const hot = [PH.PISC[i % 5], PH.CHAMB[(i + 2) % 5]];
  page(d.id + '.html', {
    title: d.t, active: 'destinations.html', og: img(d.ph[0]),
    desc: `${d.short}. ${d.hot}, ${d.pens.toLowerCase()}. À partir de ${fcfa(d.pr)} par personne au départ de Libreville.`,
    body: `<section class="wrap"><div class="gal fiche-gal" data-gal>${d.ph.slice(0, 5).map((p, k) => `<button style="background-image:url(${img(p)})" data-i="${k}" aria-label="Agrandir la photo ${k + 1}">${k === 4 || (k === d.ph.length - 1 && k < 4) ? `<span class="more">Voir les ${d.ph.length} photos</span>` : ''}</button>`).join('')}</div></section>
<div class="lb" hidden data-photos='${JSON.stringify(d.ph.map(img))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
<section class="wrap fx"><div>
<div class="crumb dk"><a href="destinations.html">Destinations</a> / ${d.zone} / ${esc(d.n)}</div><h1>${esc(d.t)}</h1>
<div class="meta"><span><b>${d.j} jours</b> · ${d.nu} nuits</span><span>${esc(d.hot)}</span><span><b>${d.pens}</b></span><span>Départ <b>Libreville</b></span><span class="ok">★ ${d.note} · ${d.nb} voyageurs</span></div>
<h2>Le programme</h2><div class="prog" data-prog>${d.prog.map(([j, t, p], k) => `<div${k > 3 ? ' class="xtra"' : ''}><div class="d">JOUR<br>${j}</div><div><h4>${esc(t)}</h4><p>${esc(p)}</p></div></div>`).join('')}</div>
${d.prog.length > 4 ? `<button class="lnk" data-more>Voir les ${d.j} jours ▾</button>` : ''}
<h2>Ce qui est compris</h2><div class="inc"><div class="yes"><h4>${ic('check', 18, '#14A3A0')} Inclus</h4><ul>${d.inc.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div><div class="no"><h4>Non inclus</h4><ul>${d.exc.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
<h2>Votre hébergement</h2><p class="lead">${esc(d.hot)} · ${d.pens.toLowerCase()}.</p><div class="hot">${hot.map((p) => `<img src="${img(p)}" alt="" loading="lazy">`).join('')}</div>
<h2>Autres destinations</h2><div class="grid g3">${DEST.filter((x) => x !== d).slice(i % 5, (i % 5) + 3).map(card).join('')}</div>
</div>
<aside class="box" id="reserver" data-book data-price="${d.pr}" data-name="${esc(d.t)}"><small>À partir de</small><div class="p">${fcfa(d.pr)} <span>/ pers.</span></div><small>Base 2 personnes en chambre double</small>
<label class="fld"><span>Date de départ</span><input type="date" data-date></label>
<div class="fld"><span>Voyageurs</span><div class="cnt"><span><b data-n>2</b> adulte(s)</span><span><button type="button" data-m aria-label="Retirer un voyageur">–</button><button type="button" data-p aria-label="Ajouter un voyageur">+</button></span></div></div>
<label class="fld chk"><input type="checkbox" data-ins> <span>Assurance voyage <em>+ 35 000 FCFA / pers.</em></span></label>
<div class="tot"><span>Total estimé</span><b data-tot>${fcfa(d.pr * 2)}</b></div>
<button class="btn sun" data-go>Réserver ce séjour</button><a class="btn wa" href="https://wa.me/${AG.wa}?text=${encodeURIComponent('Bonjour Escapade, j\'ai une question sur le séjour « ' + d.t + ' ».')}" target="_blank" rel="noopener" data-wa-ic>Poser une question sur WhatsApp</a>
<p class="note">Acompte de 30 % · solde 30 jours avant le départ</p></aside></section>
<div class="sticky-book"><div><small>À partir de</small><b>${fcfa(d.pr)}</b></div><a class="btn sun" href="#reserver" data-jump>Réserver</a></div>`,
  });
}

// ---------- Billetterie ----------
pages.push(page('billetterie.html', {
  title: 'Billetterie', active: 'billetterie.html',
  desc: 'Billets d\'avion nationaux et internationaux au départ de Libreville : Paris, Dubaï, Casablanca, Johannesburg, Dakar, Douala, Port-Gentil, Franceville.',
  body: `<section class="bh"><div class="avi" style="background-image:url(${img(PH.avion)})"></div><div class="wrap"><div class="in"><span class="tag lt">Billetterie nationale et internationale</span><h1>Vos billets d'avion au meilleur prix</h1><p>Nous comparons toutes les compagnies pour vous et réservons en quelques minutes. Paiement en espèces, par carte ou Mobile Money.</p></div></div></section>
<form class="fs wrap" data-flight><div class="tabs" role="tablist"><button type="button" class="on" data-trip="AR">Aller-retour</button><button type="button" data-trip="AS">Aller simple</button><button type="button" data-trip="MD">Multi-destinations</button></div>
<div class="fr"><label class="fld"><span>De</span><input name="from" value="Libreville (LBV)" required></label><button type="button" class="swap" data-swap aria-label="Inverser départ et arrivée">${ic('swap', 20, '#0E2A47')}</button><label class="fld"><span>Vers</span><input name="to" placeholder="Paris, Dubaï, Douala…" list="dl2" required><datalist id="dl2">${ROUTES.map((r) => `<option value="${r[1]}">`).join('')}</datalist></label>
<label class="fld"><span>Départ</span><input type="date" name="d1" required></label><label class="fld" data-ret><span>Retour</span><input type="date" name="d2"></label>
<label class="fld"><span>Passagers · classe</span><select name="pax"><option>1 adulte · Économique</option><option>2 adultes · Économique</option><option>3 adultes · Économique</option><option>1 adulte · Affaires</option><option>Famille ou groupe</option></select></label>
<button class="btn sun" type="submit">Demander le tarif</button></div></form>
<section class="sec" style="padding-top:80px"><div class="wrap"><span class="tag">Au départ de Libreville</span><h2>Lignes les plus demandées</h2>
<div class="rt">${ROUTES.map(([c, n, t, p]) => `<div><div class="c">${c}</div><h3>${n}</h3><div class="t">${t}</div><div class="pp"><div><small>A/R dès</small><b>${fcfa(p)}</b></div><button class="lnk sun" data-route="${n}">Réserver →</button></div></div>`).join('')}</div>
<p class="note">Prix indicatifs aller-retour en classe économique, taxes comprises, selon disponibilité.</p>
<div class="adv"><div><span class="ic">${ic('bolt', 22, '#14A3A0')}</span><div><h4>Réponse rapide</h4><p>Votre tarif en moins d'une heure, aux heures d'ouverture.</p></div></div><div><span class="ic">${ic('card', 22, '#14A3A0')}</span><div><h4>Paiement facile</h4><p>Espèces, carte bancaire ou Mobile Money.</p></div></div><div><span class="ic">${ic('swap', 22, '#14A3A0')}</span><div><h4>Changement de date</h4><p>Nous gérons modifications et remboursements avec la compagnie.</p></div></div><div><span class="ic">${ic('group', 22, '#14A3A0')}</span><div><h4>Groupes et entreprises</h4><p>Tarifs négociés et facturation mensuelle.</p></div></div></div></div></section>`,
}));

// ---------- Sur mesure ----------
const ENVIES = [['🏝️', 'Plage & détente', 'Zanzibar, Maurice…'], ['💍', 'Lune de miel', 'Romantique et sur mesure'], ['🛍️', 'Ville & shopping', 'Dubaï, Istanbul, Paris'], ['👨‍👩‍👧', 'En famille', 'Activités pour les enfants'], ['💼', 'Affaires', 'Salons, séminaires'], ['🕌', 'Pèlerinage', 'Organisation complète']];
pages.push(page('sur-mesure.html', {
  title: 'Voyage sur mesure', active: 'sur-mesure.html',
  desc: 'Demandez votre voyage sur mesure : destination, dates, voyageurs et budget. Devis gratuit sous 24 h par WhatsApp.',
  body: `<section class="ph1 sm" style="background-image:url(${img('x-maurice-1.jpg')})"><div class="wrap"><div class="crumb"><a href="index.html">Accueil</a> / Voyage sur mesure</div><span class="tag lt">Devis gratuit sous 24 h</span><h1>Créons votre voyage</h1><p>Trois questions, et un conseiller vous propose un séjour à votre goût et à votre budget.</p></div></section>
<section class="smg"><div class="wrap"><form data-custom data-budget novalidate>
<fieldset class="stp"><legend><b>1</b>Quel voyage vous fait envie ?</legend><div class="opt">${ENVIES.map(([e, t, s], k) => `<label><input type="radio" name="envie" value="${t}"${k === 0 ? ' checked' : ''}><span>${e} ${t}<small>${s}</small></span></label>`).join('')}</div></fieldset>
<fieldset class="stp"><legend><b>2</b>Où, quand et avec qui ?</legend><div class="g2"><label class="fld"><span>Destination souhaitée</span><input name="dest" list="dl3" placeholder="Zanzibar ou Maurice"><datalist id="dl3">${opts}</datalist></label><label class="fld"><span>Date de départ</span><input type="date" name="date"></label>
<div class="fld"><span>Adultes</span><div class="cnt"><b data-c="adultes">2</b><span><button type="button" data-dec="adultes" aria-label="Moins d'adultes">–</button><button type="button" data-inc="adultes" aria-label="Plus d'adultes">+</button></span></div></div><div class="fld"><span>Enfants</span><div class="cnt"><b data-c="enfants">0</b><span><button type="button" data-dec="enfants" aria-label="Moins d'enfants">–</button><button type="button" data-inc="enfants" aria-label="Plus d'enfants">+</button></span></div></div>
<label class="fld"><span>Durée</span><select name="duree"><option>Week-end</option><option>4 à 6 jours</option><option selected>7 à 10 jours</option><option>2 semaines et plus</option></select></label><label class="fld"><span>Hébergement</span><select name="heb"><option>3★ confortable</option><option selected>4★ supérieur</option><option>5★ luxe</option></select></label></div>
<div class="rng"><label for="bud">Budget par personne : <b data-bud>1 500 000 FCFA</b></label><input id="bud" type="range" name="budget" min="300000" max="5000000" step="100000" value="1500000"><div class="rlb"><span>300 000</span><span>5 000 000 FCFA</span></div></div></fieldset>
<fieldset class="stp"><legend><b>3</b>Comment vous joindre ?</legend><div class="g2"><label class="fld"><span>Prénom</span><input name="prenom" required autocomplete="given-name"></label><label class="fld"><span>WhatsApp</span><input name="tel" type="tel" required placeholder="0X XX XX XX" autocomplete="tel"></label><label class="fld full"><span>Une précision ?</span><textarea name="msg" rows="3" placeholder="Anniversaire de mariage, chambre avec vue mer…"></textarea></label></div></fieldset>
</form>
<aside class="sum"><img src="${img(PH.PLAGE[0])}" alt=""><div class="bd"><h4>Votre demande</h4>
<div class="ln"><span>Envie</span><b data-s="envie">Plage &amp; détente</b></div><div class="ln"><span>Destination</span><b data-s="dest">À définir</b></div><div class="ln"><span>Départ</span><b data-s="date">À définir</b></div><div class="ln"><span>Voyageurs</span><b data-s="pax">2 adultes</b></div><div class="ln"><span>Budget</span><b data-s="budget">1 500 000 FCFA / pers.</b></div>
<button class="btn sun" data-send>Recevoir mon devis gratuit</button><p class="note">Réponse sous 24 h par WhatsApp · sans engagement</p></div></aside></div></section>`,
}));

// ---------- L'agence ----------
pages.push(page('agence.html', {
  title: 'L\'agence', active: 'agence.html',
  desc: 'Escapade Travel Agency, agence de voyage à Libreville : un conseiller unique, des prix clairs et une assistance pendant tout le voyage.',
  body: `<section class="sec ag"><div class="wrap"><div><span class="tag">L'agence</span><h1 class="h2">Des voyageurs au service des voyageurs</h1>
<p>Escapade Travel Agency accompagne les familles, les couples et les entreprises de Libreville dans tous leurs déplacements : un simple billet pour Port-Gentil comme un séjour complet à l'autre bout du monde.</p>
<p>Notre engagement : un conseiller unique, des prix clairs et une assistance joignable pendant tout le voyage.</p><a class="btn sun" href="contact.html">Passer nous voir</a></div>
<img class="ph" src="${img(PH.team)}" alt="L'équipe d'Escapade avec des voyageurs" loading="lazy"></div></section>
<section class="sec" style="padding-top:0"><div class="wrap"><span class="tag">Nos engagements</span><h2>Pourquoi voyager avec nous</h2>
<div class="vals"><div><div class="n">01</div><h3>Le meilleur prix</h3><p>Nous comparons toutes les compagnies et nos hôtels partenaires pour chaque demande.</p></div><div><div class="n">02</div><h3>Zéro mauvaise surprise</h3><p>Devis détaillé : ce qui est inclus est écrit, ce qui ne l'est pas aussi.</p></div><div><div class="n">03</div><h3>Toujours joignables</h3><p>Un retard, une correspondance manquée ? Votre conseiller répond sur WhatsApp, 7j/7.</p></div></div>
<h2 style="margin-top:80px">L'équipe</h2><div class="team">${TEAM.map(([n, r, c]) => `<div><span class="av" style="background:${c}">${n[0]}</span><div><h4>${n}</h4><p>${esc(r)}</p></div></div>`).join('')}</div></div></section>
${ctaBand('Venez préparer votre prochain voyage avec nous')}`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Contact', active: 'contact.html',
  desc: `Escapade Travel Agency, ${AG.addr}, ${AG.city}. Tél. ${AG.tel} · WhatsApp ${AG.tel2}. ${AG.hours.join(', ')}.`,
  body: `<section class="ph1 ct" style="background-image:url(${img(PH.passeport)})"><div class="wrap"><div class="crumb"><a href="index.html">Accueil</a> / Contact</div><h1>Parlons de votre voyage</h1><p>Par téléphone, sur WhatsApp ou directement à l'agence.</p></div></section>
<section class="wrap ctg"><div><div class="info">
<div><span class="ic">${ic('pin', 20)}</span><h4>Adresse</h4><p>${AG.addr.replace(', ', '<br>')}, ${AG.city}</p></div>
<div><span class="ic">${ic('phone', 20)}</span><h4>Téléphone</h4><p><a href="tel:+241${AG.tel.replace(/\D/g, '').replace(/^0/, '')}">${AG.tel}</a><br><a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener">${AG.tel2}</a></p></div>
<div><span class="ic">${ic('mail', 20)}</span><h4>E-mail</h4><p class="sm"><a href="mailto:${AG.mail}">escapadetravelagency<br>@gmail.com</a></p></div>
<div><span class="ic">${ic('clock', 20)}</span><h4>Horaires</h4><p>${AG.hours.join('<br>')}</p></div></div>
<div class="map"><iframe title="Plan d'accès : ${esc(AG.addr)}, ${AG.city}" src="${AG.map}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><div class="pin"><span>Escapade · face Gaboprix</span></div></div></div>
<form class="form" data-contact><h2 class="h3">Écrivez-nous</h2><p>Réponse le jour même, aux heures d'ouverture.</p>
<div class="g2"><label class="fld"><span>Prénom</span><input name="prenom" required autocomplete="given-name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Objet</span><select name="objet"><option>Billet d'avion</option><option>Séjour clés en main</option><option>Visa et formalités</option><option>Assurance voyage</option><option>Voyage d'entreprise ou de groupe</option><option>Autre demande</option></select></label>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required placeholder="Bonjour, je souhaite un billet Libreville – Paris pour le…"></textarea></label>
<div class="row"><button class="btn sun" type="submit">Envoyer</button><a class="btn wa" href="https://wa.me/${AG.wa}" target="_blank" rel="noopener" data-wa-ic>WhatsApp</a></div></form></section>`,
}));

// ---------- Galerie ----------
const GAL = [...new Set(DEST.flatMap((d) => d.ph.slice(0, 2)).concat(PH.PLAGE, PH.plongee, PH.PISC.slice(0, 3)))];
pages.push(page('galerie.html', {
  title: 'Galerie photos', active: '',
  desc: 'Les plus belles images de nos destinations : Zanzibar, Maurice, Dubaï, Le Cap, Marrakech, Paris, Istanbul, Dakar.',
  body: `<section class="ph1 sm" style="background-image:url(${img('x-zanzibar-2.jpg')})"><div class="wrap"><div class="crumb"><a href="index.html">Accueil</a> / Galerie</div><h1>Galerie photos</h1><p>Un avant-goût de vos prochaines vacances.</p></div></section>
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="gal masonry" data-gal>${GAL.map((p, k) => `<button data-i="${k}" aria-label="Agrandir la photo ${k + 1}"><img src="${img(p)}" alt="" loading="lazy"></button>`).join('')}</div></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(img))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${ctaBand()}`,
}));

// Logo (aussi utilisé comme icône)
fs.writeFileSync(path.join(OUT, 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><clipPath id="c"><circle cx="50" cy="50" r="48"/></clipPath></defs><g clip-path="url(#c)"><rect width="100" height="100" fill="#F28C28"/><rect y="55" width="100" height="45" fill="#14A3A0"/><rect x="20" y="33" width="60" height="7" rx="3.5" fill="#fff" transform="rotate(-18 50 36)"/></g></svg>');
for (const f of ['escapade.css', 'escapade.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
// Pages du menu, lues par gen-live.js pour le moteur et le digital score
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
