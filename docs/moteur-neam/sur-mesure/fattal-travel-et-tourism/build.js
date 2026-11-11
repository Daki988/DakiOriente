// Construit le site sur mesure de Fattal Travel & Tourism dans neam-moteur/sites/fattal-travel-et-tourism/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { FT, PH, DEST, THEMES, VISAS, VISA_LABEL, SERVICES, AVIS } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', FT.slug);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';

const ICON = {
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm2 16H8v-2h8zm0-4H8v-2h8zm-3-5V3.5L18.5 9z',
  bed: 'M7 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9a4 4 0 0 0-4-4z',
  car: 'M18.9 6c-.2-.6-.8-1-1.4-1h-11c-.7 0-1.2.4-1.4 1L3 12v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8zM6.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 11l1.5-4.5h11L19 11z',
  shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5z',
  users: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-1 .1 1.2.8 2 1.9 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z',
  star: 'M12 17.3 18.2 21l-1.6-7L22 9.2l-7.2-.6L12 2 9.2 8.6 2 9.2 7.5 14l-1.7 7z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.9a15.6 15.6 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.4 1.1-2.8 1.9-4zM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4zm.8 2h2.9c.3 1.3.8 2.5 1.4 3.6A8 8 0 0 1 5.1 16zM8 8H5.1a8 8 0 0 1 4.3-3.6C8.8 5.5 8.3 6.7 8 8zm4 12c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.4-1.1 2.8-1.9 4zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.3 5.6c.6-1.1 1.1-2.3 1.4-3.6h2.9a8 8 0 0 1-4.3 3.6zm1.8-5.6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4z',
  wallet: 'M21 7h-1V5a2 2 0 0 0-2-2H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zm-3 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 7a1 1 0 0 1 0-2h13v2z',
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;

// Logo : globe orbité par un avion, initiale F
const MARK = (s = 46) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="#0B2545"/><path d="M10 31c6 6 22 7 29-4" fill="none" stroke="#FF7A45" stroke-width="2.6" stroke-linecap="round"/><path d="M38 25.5l4-1.2-1.6 3.9z" fill="#FF7A45"/><path d="M19 13h12v3.6h-8v4.4h7v3.5h-7V34h-4z" fill="#fff"/></svg>`;
const LOGO_SVG = MARK(64).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(' aria-hidden="true"', '');
const LOGO = `${MARK()}<span class="t">FATTAL<small>Travel &amp; Tourism</small></span>`;

const NAV = [['index.html', 'Accueil'], ['destinations.html', 'Destinations'], ['services.html', 'Services'], ['visas.html', 'Guide visas'], ['agence.html', 'L\'agence'], ['contact.html', 'Contact']];
const HOURS = FT.hours.map(([d, h]) => `${d} · ${h}`);

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'TravelAgency', name: FT.name, slogan: FT.slogan, telephone: '+241' + FT.tel.replace(/\D/g, '').replace(/^0/, ''), email: FT.mail, address: { '@type': 'PostalAddress', streetAddress: '140 rue Bretonnet', postOfficeBoxNumber: '10868', addressLocality: FT.city, addressCountry: 'GA' }, aggregateRating: { '@type': 'AggregateRating', ratingValue: FT.rating, bestRating: 5 } };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${FT.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${FT.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${DEST[0].ph[0]}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="fattal.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="Fattal Travel & Tourism, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="devis.html">Demander un devis</a></nav>
<a class="call" href="${telHref(FT.tel)}">${ic('phone', 16)} ${FT.tel}</a><a class="btn o hcta" href="devis.html">Demander un devis</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo" href="index.html">${LOGO}</a><p>${FT.slogan} Billets d'avion, visas, hôtels, location de voitures et assurance voyage au départ de Libreville.</p><div class="soc" data-soc></div></div>
<div><h5>Voyager</h5><p><a href="destinations.html">Destinations</a><br><a href="devis.html">Demander un devis</a><br><a href="visas.html">Guide visas</a><br><a href="galerie.html">Galerie</a></p></div>
<div><h5>L'agence</h5><p>${FT.addr}<br>${FT.bp}</p><p>${HOURS.join('<br>')}</p></div>
<div><h5>Contact</h5><p><a href="${telHref(FT.tel)}">${FT.tel}</a> (WhatsApp)<br><a href="${telHref(FT.tel2)}">${FT.tel2}</a><br>Fixe <a href="${telHref(FT.fixe)}">${FT.fixe}</a><br><a href="mailto:${FT.mail}">${FT.mail}</a></p></div>
<div class="cp">© 2026 ${FT.name} · Libreville, Gabon · Prix « à partir de » indicatifs, selon saison et disponibilité.</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.FT=${JSON.stringify({ slug: FT.slug, name: FT.name, wa: FT.wa, soc: FT.soc, dest: DEST.map(({ id, n, pays, prix, visa }) => ({ id, n, pays, prix, visa })), visas: VISAS })}</script><script src="fattal.js"></script>
<script src="../../assets/reco.js" data-slug="${FT.slug}" data-wa="${FT.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const PT = (crumb, h1, p, ph) => `<section class="pt"${ph ? ` style="--ph:url(${ph})"` : ''}><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div></section>`;
const destOpts = (sel) => DEST.map((d) => `<option value="${d.id}"${d.id === sel ? ' selected' : ''}>${d.n} (${d.pays})</option>`).join('') + '<option value="autre">Autre destination</option>';
const card = (d) => `<article class="dc" data-th="${d.th.join(' ')}"><div class="im"><img src="${d.ph[0]}" alt="${esc(d.n)}" loading="lazy"><span class="vz v-${d.visa}">${VISA_LABEL[d.visa]}</span></div><div class="bd"><p class="py">${d.pays}</p><h3>${d.n}</h3><p>${esc(d.d)}</p><ul><li>${ic('plane', 15)} ${d.vol}</li></ul><div class="pr"><div><small>A/R dès</small><b>${fcfa(d.prix)}</b></div><a class="btn o sm" href="devis.html?dest=${d.id}">Devis</a></div></div></article>`;
const CTA = `<section class="cta"><div class="wrap"><div><h2>Où partez-vous ?</h2><p>Dites-nous où et quand : nous vous envoyons les meilleures options sous 24 h, sur WhatsApp ou par e-mail.</p></div><div class="row"><a class="btn o" href="devis.html">Demander un devis</a><a class="btn ol" href="https://wa.me/${FT.wa}" target="_blank" rel="noopener">WhatsApp ${FT.tel}</a></div></div></section>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// Accueil
pages.push(page('index.html', {
  title: 'Agence de voyage à Libreville', active: 'index.html',
  desc: 'Fattal Travel & Tourism, agence de voyage à Libreville : billets d\'avion, visas, hôtels, location de voitures, assurance voyage. Devis sous 24 h.',
  body: `<section class="hero"><img class="bg" src="${PH.hero}" alt=""><div class="wrap"><span class="kick">${ic('star', 15)} ${String(FT.rating).replace('.', ',')}/5 sur Google · centre-ville de Libreville</span><h1>Faire l'expérience <em>du monde</em>.</h1><p>Billets d'avion, visas, hôtels, voitures et assurance : votre voyage organisé de A à Z, au départ de Libreville.</p>
<div class="srch" data-srch><div class="tabs" role="tablist">${[['vol', 'plane', 'Vol'], ['sejour', 'bed', 'Vol + hôtel'], ['visa', 'doc', 'Visa']].map(([k, i, t], n) => `<button type="button" role="tab" aria-selected="${!n}" data-k="${k}">${ic(i, 16)} ${t}</button>`).join('')}</div>
<form action="devis.html"><input type="hidden" name="type" value="vol"><label class="fld"><span>Départ</span><input value="Libreville (LBV)" readonly></label><label class="fld"><span>Destination</span><select name="dest">${destOpts('paris')}</select></label><label class="fld"><span>Aller</span><input type="date" name="aller" required></label><label class="fld" data-ret><span>Retour</span><input type="date" name="retour"></label><label class="fld"><span>Voyageurs</span><select name="ad">${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}">${n} adulte${n > 1 ? 's' : ''}</option>`).join('')}</select></label><button class="btn o" type="submit">Recevoir mon devis</button></form></div></div></section>
<section class="band"><div class="wrap">${SERVICES.slice(0, 5).map(([id, t, , i]) => `<a href="services.html#${id}">${ic(i, 22)}<span>${t}</span></a>`).join('')}</div></section>
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Destinations</span><h2>Nos destinations phares</h2></div><a class="btn line" href="destinations.html">Toutes les destinations</a></div><div class="dcs">${DEST.slice(0, 4).map(card).join('')}</div></div></section>
<section class="sec soft"><div class="wrap split"><div class="stack"><img src="${PH.agent}" alt="Conseillère voyage" loading="lazy"><div class="badge">${ic('users', 22)}<b>Un conseiller dédié</b><span>du devis au retour</span></div></div><div><span class="tag">Pourquoi Fattal</span><h2>Votre voyage, sans stress</h2><ul class="why">${[['wallet', 'Le meilleur tarif, vraiment', 'Nous comparons les compagnies et les horaires pour vous, sans frais cachés.'], ['doc', 'Visas maîtrisés', 'Dossier vérifié avant dépôt : moins de refus, moins d\'allers-retours.'], ['clock', 'Réponse sous 24 h', 'Devis détaillé sur WhatsApp ou par e-mail, même le samedi.'], ['shield', 'Assistance pendant le voyage', 'Vol annulé, correspondance manquée : un numéro joignable.']].map(([i, t, d]) => `<li>${ic(i, 22)}<div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}</ul></div></div></section>
<section class="sec"><div class="wrap split"><div><span class="tag">Guide visas</span><h2>Quels documents pour votre visa ?</h2><p class="lead">Choisissez votre destination : la liste des pièces s'affiche, cochez ce que vous avez déjà et faites vérifier votre dossier par nos conseillers.</p><a class="btn o" href="visas.html">Ouvrir le guide visas</a></div><img class="big" src="${PH.passeport}" alt="Passeport et carte d'embarquement" loading="lazy"></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Avis clients</span><h2>Ils ont voyagé avec nous</h2><div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
${CTA}`,
}));

// Destinations
pages.push(page('destinations.html', {
  title: 'Destinations', active: 'destinations.html',
  desc: 'Paris, Dubaï, Istanbul, Marrakech, Dakar, Le Cap, Zanzibar, Île Maurice : prix aller-retour indicatifs au départ de Libreville et visa.',
  body: `${PT('Destinations', 'Où voulez-vous aller ?', 'Prix aller-retour en classe économique au départ de Libreville, à titre indicatif. Le devis précise le tarif du jour.', DEST[1].ph[0])}
<section class="sec"><div class="wrap"><div class="chips" role="group" aria-label="Filtrer par envie" data-df>${THEMES.map(([k, t], i) => `<button type="button" data-k="${k}" aria-pressed="${!i}">${t}</button>`).join('')}</div><p class="cnt" data-dn></p><div class="dcs all">${DEST.map(card).join('')}</div>
<div class="none" data-dnone hidden><h3>Une autre destination en tête ?</h3><p>Nous organisons des voyages partout dans le monde.</p><a class="btn o" href="devis.html?dest=autre">Demander un devis</a></div><p class="note">Prix « à partir de », hors période de pointe, taxes incluses, sous réserve de disponibilité.</p></div></section>
${CTA}`,
}));

// Devis
pages.push(page('devis.html', {
  title: 'Demander un devis', active: '',
  desc: 'Devis de voyage en ligne : vol, hôtel, visa, voiture, assurance. Budget indicatif immédiat, réponse détaillée de Fattal Travel & Tourism sous 24 h.',
  body: `${PT('Devis', 'Votre devis en 2 minutes', 'Décrivez votre voyage : un budget indicatif s\'affiche, puis un conseiller vous envoie les meilleures options.')}
<section class="dv"><div class="wrap"><form data-devis novalidate>
<fieldset class="stp"><legend><b>1</b>Le voyage</legend><div class="seg" role="radiogroup" aria-label="Type de trajet">${[['ar', 'Aller-retour'], ['as', 'Aller simple'], ['multi', 'Multi-destinations']].map(([v, t], i) => `<label><input type="radio" name="trajet" value="${v}"${i ? '' : ' checked'}><span>${t}</span></label>`).join('')}</div>
<div class="g2"><label class="fld"><span>Départ</span><select name="from"><option>Libreville (LBV)</option><option>Port-Gentil (POG)</option><option>Franceville (MVB)</option></select></label><label class="fld"><span>Destination</span><select name="dest">${destOpts('paris')}</select></label></div>
<label class="fld" data-autre hidden><span>Précisez la destination</span><input name="autre" placeholder="Ville, pays"></label>
<div class="g3"><label class="fld"><span>Aller</span><input type="date" name="aller" required></label><label class="fld" data-ret><span>Retour</span><input type="date" name="retour"></label><label class="fld"><span>Classe</span><select name="cl"><option value="1">Économique</option><option value="1.7">Premium</option><option value="3.2">Affaires</option></select></label></div>
<label class="tog"><input type="checkbox" name="flex"><span>Mes dates sont flexibles (± 3 jours) : nous cherchons le moins cher</span></label></fieldset>
<fieldset class="stp"><legend><b>2</b>Les voyageurs</legend><div class="pax">${[['ad', 'Adultes', '12 ans et +', 1], ['en', 'Enfants', '2 – 11 ans', 0], ['bb', 'Bébés', 'moins de 2 ans', 0]].map(([k, t, s, v]) => `<div><span><b>${t}</b><small>${s}</small></span><div class="ct"><button type="button" data-m="${k}" aria-label="Retirer ${t.toLowerCase()}">−</button><output name="${k}o">${v}</output><input type="hidden" name="${k}" value="${v}"><button type="button" data-p="${k}" aria-label="Ajouter ${t.toLowerCase()}">+</button></div></div>`).join('')}</div></fieldset>
<fieldset class="stp"><legend><b>3</b>Les services en plus</legend><div class="xs">${[['hotel', 'Hôtel', 'Nous sélectionnons selon votre budget'], ['visa', 'Visa', 'Dossier vérifié et rendez-vous'], ['voiture', 'Voiture', 'Récupérée à l\'aéroport'], ['assurance', 'Assurance voyage', 'Attestation pour le visa']].map(([v, t, s]) => `<label><input type="checkbox" name="x" value="${v}"><span><b>${t}</b><small>${s}</small></span></label>`).join('')}</div>
<div class="g2" data-hotel hidden style="margin-top:10px"><label class="fld"><span>Catégorie d'hôtel</span><select name="etoiles"><option>3 étoiles</option><option selected>4 étoiles</option><option>5 étoiles</option></select></label><label class="fld"><span>Chambres</span><select name="ch">${[1, 2, 3, 4].map((n) => `<option>${n}</option>`).join('')}</select></label></div></fieldset>
<fieldset class="stp"><legend><b>4</b>Vos coordonnées</legend><div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld" style="margin-top:10px"><span>Précisions</span><textarea name="msg" rows="2" placeholder="Compagnie préférée, bagages, motif du voyage…"></textarea></label></fieldset></form>
<aside class="sum"><h2>Votre voyage</h2><div class="route"><b data-s="from">LBV</b><span>${ic('plane', 18)}</span><b data-s="to"></b></div><div class="ln"><span>Dates</span><b data-s="dates"></b></div><div class="ln"><span>Voyageurs</span><b data-s="pax"></b></div><div class="ln"><span>Services</span><b data-s="x"></b></div>
<div class="tot"><span>Budget vol indicatif</span><b data-s="tot"></b><small data-s="det"></small></div><button class="btn o wide" data-send>Recevoir mon devis sur WhatsApp</button><a class="btn ol wide" href="mailto:${FT.mail}">Par e-mail</a><p class="note">Estimation sur la base des tarifs « à partir de ». Le devis confirme le prix du jour.</p></aside></div></section>`,
}));

// Services
pages.push(page('services.html', {
  title: 'Nos services', active: 'services.html',
  desc: 'Billets d\'avion, visas, réservations d\'hôtel, location de voitures, assurance voyage, groupes et entreprises : les services de Fattal Travel & Tourism.',
  body: `${PT('Services', 'Tout votre voyage, un seul interlocuteur', 'De la recherche du billet à votre retour, Fattal s\'occupe de tout.', PH.hero)}
<section class="sec"><div class="wrap"><div class="svs">${SERVICES.map(([id, t, d, i]) => `<article id="${id}">${ic(i, 28)}<h2>${t}</h2><p>${d}</p><a href="${id === 'visas' ? 'visas.html' : 'devis.html' + (id === 'hotels' ? '?type=sejour' : '')}">${id === 'visas' ? 'Guide visas' : 'Demander un devis'} →</a></article>`).join('')}</div></div></section>
<section class="sec soft"><div class="wrap split"><div><span class="tag">Entreprises</span><h2>Voyages d'affaires</h2><p class="lead">Ministères, ONG, entreprises : un compte dédié, des billets émis rapidement, des modifications gérées pour vous et une facture mensuelle.</p><ul class="chk">${['Conseiller dédié joignable sur WhatsApp', 'Émission et modification de billets en urgence', 'Visas et lettres d\'invitation suivis', 'Facturation mensuelle et relevé des dépenses'].map((t) => `<li>${ic('check', 16)} ${t}</li>`).join('')}</ul><a class="btn o" href="contact.html?obj=entreprise">Ouvrir un compte entreprise</a></div><img class="big" src="${PH.hotel}" alt="" loading="lazy"></div></section>
<section class="sec"><div class="wrap"><span class="tag">Comment ça marche</span><h2>Quatre étapes, zéro souci</h2><ol class="steps">${[['Votre demande', 'En ligne, sur WhatsApp ou à l\'agence, rue Bretonnet.'], ['Nos propositions', 'Plusieurs options comparées sous 24 h.'], ['La réservation', 'Paiement sécurisé, billets et vouchers envoyés.'], ['Bon voyage', 'Assistance joignable jusqu\'à votre retour.']].map(([t, d], i) => `<li><b>${i + 1}</b><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol></div></section>
${CTA}`,
}));

// Guide visas
pages.push(page('visas.html', {
  title: 'Guide visas', active: 'visas.html',
  desc: 'Documents à fournir pour votre visa : Schengen, Émirats, Maroc et autres destinations. Liste à cocher et vérification du dossier par Fattal Travel & Tourism.',
  body: `${PT('Guide visas', 'Guide visas', 'Choisissez votre destination, cochez les pièces que vous avez déjà, et faites vérifier votre dossier avant le dépôt.', PH.passeport)}
<section class="sec"><div class="wrap vz2" data-visa><div><label class="fld big"><span>Ma destination</span><select name="d">${DEST.map((d) => `<option value="${d.id}">${d.n} (${d.pays})</option>`).join('')}</select></label>
<div class="vinfo"><div><small>Type</small><b data-v="t"></b></div><div><small>Délai indicatif</small><b data-v="delai"></b></div><div><small>Démarche</small><b data-v="rdv"></b></div></div>
<div class="gauge"><span data-v="g"></span></div><p class="gp" data-v="gp"></p><ul class="docs" data-v="docs"></ul><p class="note">Informations indicatives : les exigences changent régulièrement et dépendent de votre profil. Nos conseillers vérifient tout avant le dépôt.</p></div>
<aside class="vside"><h2>Faire vérifier mon dossier</h2><p>Envoyez-nous la liste de ce qui vous manque : nous vous disons quoi préparer et réservons votre rendez-vous.</p><button class="btn o wide" data-vsend>Envoyer sur WhatsApp</button><a class="btn line wide" href="devis.html">Vol + visa : demander un devis</a></aside></div></section>
${CTA}`,
}));

// L'agence
pages.push(page('agence.html', {
  title: 'L\'agence', active: 'agence.html',
  desc: 'Fattal Travel & Tourism, agence de voyage du centre-ville de Libreville, rue Bretonnet : notre équipe et nos engagements.',
  body: `${PT('L\'agence', FT.slogan, 'Une agence du centre-ville de Libreville, au service des voyageurs, des familles et des entreprises.')}
<section class="sec"><div class="wrap split"><img class="big" src="${PH.voyageuse}" alt="Voyageuse" loading="lazy"><div><span class="tag">Notre maison</span><h2>Le voyage, c'est notre métier</h2><p class="lead">Rue Bretonnet, à deux pas de Casino, notre équipe accueille chaque jour des voyageurs qui partent étudier, travailler, rendre visite à leur famille ou simplement découvrir le monde.</p><p class="lead">Notre promesse : un tarif juste, un dossier bien préparé et quelqu'un qui répond quand vous en avez besoin.</p>
<div class="kpi"><div><b>${String(FT.rating).replace('.', ',')}/5</b><span>note Google</span></div><div><b>24 h</b><span>pour votre devis</span></div><div><b>5</b><span>services réunis</span></div></div></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Nos engagements</span><h2>Ce que vous pouvez attendre de nous</h2><div class="svs">${[['wallet', 'Transparence', 'Le prix annoncé est le prix payé : taxes et frais détaillés dans le devis.'], ['shield', 'Sécurité', 'Billets émis par des compagnies reconnues, paiements tracés.'], ['users', 'Écoute', 'Chaque voyage est différent : nous prenons le temps de comprendre le vôtre.']].map(([i, t, d]) => `<article>${ic(i, 28)}<h2>${t}</h2><p>${d}</p></article>`).join('')}</div></div></section>
${CTA}`,
}));

// Galerie
const GAL = [[DEST[0].ph[1], 'Paris'], [DEST[1].ph[0], 'Dubaï'], [DEST[6].ph[0], 'Zanzibar'], [DEST[3].ph[0], 'Marrakech'], [DEST[2].ph[1], 'Istanbul'], [DEST[5].ph[0], 'Le Cap'], [DEST[7].ph[1], 'Île Maurice'], [DEST[4].ph[0], 'Dakar'], [PH.passeport, 'Prêt à partir'], [PH.hero, 'Au-dessus des nuages']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: '',
  desc: 'Les destinations de Fattal Travel & Tourism en images.',
  body: `${PT('Galerie', 'Galerie', 'Un avant-goût de vos prochains voyages.')}
<section class="sec"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${p}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => p))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
}));

// Contact
pages.push(page('contact.html', {
  title: 'Contact et accès', active: 'contact.html',
  desc: `${FT.name}, ${FT.addr}, ${FT.bp}. Tél. ${FT.tel}, ${FT.tel2}, ${FT.fixe}. ${FT.mail}.`,
  body: `${PT('Contact', 'Venez nous voir', `${FT.addr}, Libreville.`)}
<section class="wrap ctg"><div><div class="info">
<div>${ic('pin', 22)}<h2>Adresse</h2><p>${FT.addr}<br>${FT.bp}</p></div>
<div>${ic('phone', 22)}<h2>Téléphone</h2><p><a href="${telHref(FT.tel)}">${FT.tel}</a> (WhatsApp)<br><a href="${telHref(FT.tel2)}">${FT.tel2}</a><br>Fixe <a href="${telHref(FT.fixe)}">${FT.fixe}</a></p></div>
<div>${ic('mail', 22)}<h2>E-mail</h2><p><a href="mailto:${FT.mail}">${FT.mail}</a><br><a href="mailto:${FT.mail2}">${FT.mail2}</a></p></div>
<div>${ic('clock', 22)}<h2>Horaires</h2><p>${HOURS.join('<br>')}</p></div></div>
<div class="map"><iframe title="Plan d'accès, Fattal Travel & Tourism, rue Bretonnet" src="https://www.google.com/maps?q=0.3883427,9.4454421&z=16&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Écrivez-nous</h2><p>Une question, un voyage de groupe, un compte entreprise : nous répondons rapidement.</p>
<label class="fld"><span>Objet</span><select name="obj"><option value="billet">Billet d'avion</option><option value="visa">Visa</option><option value="sejour">Séjour / hôtel</option><option value="entreprise">Compte entreprise</option><option value="groupe">Voyage de groupe</option><option value="autre">Autre</option></select></label>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label><div class="row"><button class="btn o" type="submit">Envoyer sur WhatsApp</button><a class="btn line" href="mailto:${FT.mail}">Par e-mail</a></div></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), LOGO_SVG);
for (const f of ['fattal.css', 'fattal.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', pages.length, 'pages');
