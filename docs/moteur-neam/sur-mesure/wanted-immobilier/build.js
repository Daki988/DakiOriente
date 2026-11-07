// Construit le site sur mesure de Wanted Immobilier dans neam-moteur/sites/wanted-immobilier/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { WI, PH, QUARTIERS, BIENS, SERVICES, DOSSIER, AVIS } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', WI.slug);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
const prix = (b) => fcfa(b.prix) + (b.tr === 'location' ? ' / mois' : '');

const ICON = {
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  search: 'M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 14 15.5l.3.3v.8l5 5 1.5-1.5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z',
  bed: 'M7 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9a4 4 0 0 0-4-4z',
  bath: 'M7 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm13 6V4.8C20 3.2 18.8 2 17.2 2c-.8 0-1.5.3-2 .8l-1.3 1.4c.1.3.1.6.1.8 0 .6-.1 1.1-.4 1.6l2.8 2.8 1.4-1.4L16.8 7c.4-.6.6-1.2.6-1.9V5a1 1 0 0 1 1.6-.8c.2.2.4.4.4.7V13H2v2c0 1.6.8 3 2 4v3h2v-2h12v2h2v-3c1.2-1 2-2.4 2-4v-2z',
  area: 'M3 3h7v2H5v5H3zm11 0h7v7h-2V5h-5zM3 14h2v5h5v2H3zm16 5v-5h2v7h-7v-2z',
  key: 'M12.6 10A6 6 0 1 0 12.6 14H17v4h4v-4h2v-4zM7 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4z',
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  cal: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  build: 'M15 11V5l-3-3-3 3v2H3v14h18V11zm-8 8H5v-2h2zm0-4H5v-2h2zm0-4H5V9h2zm6 8h-2v-2h2zm0-4h-2v-2h2zm0-4h-2V9h2zm0-4h-2V5h2zm6 12h-2v-2h2zm0-4h-2v-2h2z',
  brush: 'M7 14c-1.7 0-3 1.3-3 3 0 1.3-1.2 2-2 2 .9 1.2 2.5 2 4 2a4 4 0 0 0 4-4c0-1.7-1.3-3-3-3zm13.7-9.6-1.3-1.3a1 1 0 0 0-1.4 0L9 12l2.8 2.8 8.9-9a1 1 0 0 0 0-1.4z',
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;

// Logo réel redessiné : clé turquoise dont la lame dessine une ville, W dans l'anneau
const MARK = (s = 52, c = '#1A9C9F') => `<svg width="${s}" height="${s * 0.5}" viewBox="0 0 100 50" aria-hidden="true"><rect x="2" y="12" width="26" height="26" rx="8" fill="${c}"/><rect x="9" y="19" width="12" height="12" rx="3" fill="#fff"/><text x="15" y="28.6" text-anchor="middle" font-family="Arial" font-size="9" font-weight="700" fill="${c}">W</text><path d="M28 21h6l2-3h4v-3h4v4h3v-6h5v6h3v-9h5v9h3v-4h4v4h4v-2h4v4h4v9H28z" fill="${c}"/><path d="M28 29h70v5h-6v4h-4v-4h-4v6h-5v-6H28z" fill="${c}"/></svg>`;
const LOGO = `<span class="mk">${MARK()}</span><span class="t"><b>WANTED</b> Immobilier<small>La clé de votre logement</small></span>`;

const NAV = [['index.html', 'Accueil'], ['annonces.html', 'Nos biens'], ['proprietaires.html', 'Propriétaires'], ['bon-a-savoir.html', 'Bon à savoir'], ['agence.html', 'L\'agence'], ['contact.html', 'Contact']];
const HOURS = WI.hours.map(([d, h]) => `${d} · ${h}`);

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'RealEstateAgent', name: WI.name, slogan: 'La clé de votre logement', url: 'https://' + WI.dom, telephone: '+241' + WI.tel.replace(/\D/g, '').replace(/^0/, ''), email: WI.mail, address: { '@type': 'PostalAddress', streetAddress: WI.addr, postOfficeBoxNumber: '1503', addressLocality: WI.city, addressCountry: 'GA' }, areaServed: WI.city };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${WI.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${WI.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${PH.villa}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="wanted.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="Wanted Immobilier, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="proprietaires.html#confier">Confier mon bien</a></nav>
<a class="call" href="${telHref(WI.tel)}">${ic('phone', 16)} ${WI.tel}</a><a class="btn t hcta" href="annonces.html">Voir nos biens</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo" href="index.html">${LOGO}</a><p>Location, gestion, vente, syndic et agencement à Port-Gentil.</p><div class="soc" data-soc></div></div>
<div><h5>L'agence</h5><p>${WI.addr}<br>${WI.bp}</p><p><a href="contact.html">Plan d'accès</a></p></div>
<div><h5>Horaires</h5><p>${HOURS.join('<br>')}</p></div>
<div><h5>Contact</h5><p><a href="${telHref(WI.tel)}">${WI.tel}</a> (WhatsApp)<br><a href="mailto:${WI.mail}">${WI.mail}</a></p><p><a href="annonces.html">Nos biens</a> · <a href="galerie.html">Galerie</a></p></div>
<div class="cp">© 2026 ${WI.name} · ${WI.city}, Gabon · Annonces présentées à titre d'exemple.</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.WI=${JSON.stringify({ slug: WI.slug, wa: WI.wa, biens: BIENS })}</script><script src="wanted.js"></script>
<script src="../../assets/reco.js" data-slug="${WI.slug}" data-wa="${WI.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const PT = (crumb, h1, p) => `<section class="pt"><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div></section>`;
const card = (b) => `<article class="bc" data-ref="${b.ref}" data-tr="${b.tr}" data-type="${b.type}" data-q="${b.q}" data-prix="${b.prix}" data-ch="${b.ch}" data-m2="${b.m2}"><button class="im" data-open="${b.ref}" aria-label="Voir le bien ${esc(b.t)}"><img src="${b.ph[0]}" alt="" loading="lazy"><span class="tr ${b.tr}">${b.tr === 'location' ? 'À louer' : 'À vendre'}</span>${b.meuble ? '<span class="mb">Meublé</span>' : ''}</button>
<div class="bd"><p class="pr">${prix(b)}</p><h3>${esc(b.t)}</h3><p class="lq">${ic('pin', 14)} ${b.q} · ${b.type}</p><ul class="ft2">${b.m2 ? `<li>${ic('area', 15)} ${b.m2} m²</li>` : ''}${b.ch ? `<li>${ic('bed', 15)} ${b.ch} ch.</li>` : ''}${b.sdb ? `<li>${ic('bath', 15)} ${b.sdb} sdb</li>` : ''}</ul><button class="more" data-open="${b.ref}">Voir le bien et visiter →</button></div></article>`;
const SEARCH = (cls = '') => `<form class="srch ${cls}" action="annonces.html"><div class="tabs2" role="radiogroup" aria-label="Je veux"><label><input type="radio" name="tr" value="location" checked><span>Louer</span></label><label><input type="radio" name="tr" value="vente"><span>Acheter</span></label></div>
<label class="fld"><span>Type de bien</span><select name="type"><option value="">Tous</option>${[...new Set(BIENS.map((b) => b.type))].map((t) => `<option>${t}</option>`).join('')}</select></label>
<label class="fld"><span>Quartier</span><select name="q"><option value="">Tout Port-Gentil</option>${QUARTIERS.map((q) => `<option>${q}</option>`).join('')}</select></label>
<button class="btn t" type="submit">${ic('search', 18)} Rechercher</button></form>`;
const CTA = `<section class="cta"><div class="wrap"><div><h2>Vous êtes propriétaire ?</h2><p>Confiez-nous votre bien : location, gestion, vente ou syndic. Estimation gratuite.</p></div><div class="row"><a class="btn w" href="proprietaires.html#confier">Confier mon bien</a><a class="btn ol" href="https://wa.me/${WI.wa}" target="_blank" rel="noopener">WhatsApp ${WI.tel}</a></div></div></section>`;
const MODAL = `<div class="md" hidden data-md role="dialog" aria-modal="true" aria-labelledby="md-t"><div class="mc"><button class="x" data-close aria-label="Fermer">×</button><div class="mg"><img alt="" data-mimg><div class="th" data-mth></div></div>
<div class="mi"><p class="pr" data-mp></p><h2 id="md-t" data-mt></h2><p class="lq" data-mq></p><ul class="ft2" data-mf></ul><h3>Les atouts</h3><ul class="at" data-ma></ul>
<form class="vis" data-visit novalidate><h3>Demander une visite</h3><div class="g2"><label class="fld"><span>Jour souhaité</span><select name="jour" data-jours></select></label><label class="fld"><span>Moment</span><select name="moment"><option>Matin</option><option>Midi</option><option>Fin d'après-midi</option></select></label></div>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<button class="btn t" type="submit">Envoyer ma demande de visite</button><p class="note">Réf. <b data-mref></b> · réponse le jour même aux heures d'ouverture</p></form></div></div></div>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'Agence immobilière à Port-Gentil', active: 'index.html',
  desc: 'Wanted Immobilier, agence immobilière à Port-Gentil : location de villas, appartements et bureaux, vente, gestion locative, syndic et agencement.',
  body: `<section class="hero" style="background-image:url(${PH.villaBlanche})"><div class="wrap"><span class="kick">Agence immobilière · Port-Gentil</span><h1>La clé de <span>votre logement</span>.</h1><p>Villas, appartements, bureaux et terrains à Port-Gentil. Louer, acheter, confier son bien : nous nous occupons de tout.</p>${SEARCH()}</div></section>
<section class="stats"><div class="wrap"><div><b>${BIENS.filter((b) => b.tr === 'location').length}</b><span>biens à louer</span></div><div><b>${BIENS.filter((b) => b.tr === 'vente').length}</b><span>biens à vendre</span></div><div><b>${QUARTIERS.length}</b><span>quartiers couverts</span></div><div><b>5</b><span>métiers sous un même toit</span></div></div></section>
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">À la une</span><h2>Nos biens du moment</h2></div><a class="btn line" href="annonces.html">Tous nos biens →</a></div>
<div class="bcs">${BIENS.filter((b) => ['WI-101', 'WI-102', 'WI-104', 'WI-201'].includes(b.ref)).map(card).join('')}</div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Nos métiers</span><h2>Louer, gérer, vendre, aménager</h2><div class="svs">${SERVICES.map(([id, t, d], i) => `<a class="sv" href="${id === 'location' ? 'annonces.html' : 'proprietaires.html#' + id}"><span>${ic(['key', 'home', 'search', 'build', 'brush'][i], 26)}</span><h3>${t}</h3><p>${d}</p></a>`).join('')}</div></div></section>
<section class="sec"><div class="wrap split"><img src="${PH.cles}" alt="Clés d'une maison" loading="lazy"><div><span class="tag">Propriétaires</span><h2>Combien vous rapporterait votre bien ?</h2><p class="lead">Indiquez le loyer : notre simulateur calcule votre revenu net avec la gestion locative Wanted, loyers encaissés et locataires suivis.</p><a class="btn t" href="proprietaires.html">Faire la simulation</a></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Ils nous font confiance</span><h2>Avis de clients</h2><div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
${CTA}${MODAL}`,
}));

// ---------- Annonces ----------
pages.push(page('annonces.html', {
  title: 'Nos biens à louer et à vendre', active: 'annonces.html',
  desc: 'Villas, appartements, duplex, bureaux et terrains à louer ou à vendre à Port-Gentil : filtrez par quartier, type, budget et demandez une visite.',
  body: `${PT('Nos biens', 'Nos biens à Port-Gentil', 'Filtrez selon vos critères, ouvrez la fiche et demandez une visite en quelques secondes.')}
<section class="sec lst"><div class="wrap"><aside class="flt" data-flt><h2 class="h3">Affiner</h2><div class="tabs2"><label><input type="radio" name="tr" value="location" checked><span>Louer</span></label><label><input type="radio" name="tr" value="vente"><span>Acheter</span></label></div>
<label class="fld"><span>Type de bien</span><select name="type"><option value="">Tous</option>${[...new Set(BIENS.map((b) => b.type))].map((t) => `<option>${t}</option>`).join('')}</select></label>
<label class="fld"><span>Quartier</span><select name="q"><option value="">Tout Port-Gentil</option>${QUARTIERS.map((q) => `<option>${q}</option>`).join('')}</select></label>
<label class="fld"><span>Chambres minimum</span><select name="ch"><option value="0">Indifférent</option><option value="1">1 et +</option><option value="2">2 et +</option><option value="3">3 et +</option><option value="4">4 et +</option></select></label>
<div class="fld"><span>Budget maximum : <b data-bv></b></span><input type="range" name="max" data-max></div>
<label class="chk1"><input type="checkbox" name="meuble"> Meublé uniquement</label></aside>
<div><div class="bar"><p data-nb></p><label class="sort"><span class="sr">Trier</span><select name="tri" data-tri><option value="pa">Prix croissant</option><option value="pd">Prix décroissant</option><option value="sd">Surface décroissante</option></select></label></div>
<div class="bcs all">${BIENS.map(card).join('')}</div><div class="none" data-none hidden><h3>Aucun bien ne correspond… pour l'instant</h3><p>Laissez-nous vos critères : nous vous prévenons dès qu'un bien se libère.</p><button class="btn t" data-alert>Créer une alerte sur WhatsApp</button></div>
<p class="note">Annonces présentées à titre d'exemple : le portefeuille réel de l'agence sera mis en ligne.</p></div></div></section>
${MODAL}`,
}));

// ---------- Propriétaires ----------
pages.push(page('proprietaires.html', {
  title: 'Propriétaires : gestion, vente, syndic', active: 'proprietaires.html',
  desc: 'Confiez votre bien à Wanted Immobilier à Port-Gentil : gestion locative, vente, syndic et agencement. Simulateur de revenus et estimation gratuite.',
  body: `${PT('Propriétaires', 'Propriétaires', 'Location, gestion, vente, syndic, agencement : nous valorisons votre bien et vous libérons du quotidien.')}
<section class="sec"><div class="wrap sim"><div><span class="tag">Simulateur</span><h2>Votre revenu avec la gestion locative</h2><p class="lead">Taux indicatif de 10 % du loyer encaissé, à confirmer avec l'agence selon le bien.</p>
<div class="fld big"><span>Loyer mensuel : <b data-lv></b></span><input type="range" min="150000" max="3000000" step="50000" value="800000" data-loyer aria-label="Loyer mensuel"></div>
<div class="opts3"><label><input type="checkbox" data-opt="0.02" checked><span>Garantie des loyers impayés <small>+2 %</small></span></label><label><input type="checkbox" data-opt="0.01"><span>Entretien courant inclus <small>+1 %</small></span></label></div></div>
<div class="res"><div class="rl"><span>Loyers annuels</span><b data-r="brut"></b></div><div class="rl"><span>Honoraires de gestion</span><b data-r="hon"></b></div><div class="rl tot"><span>Votre revenu net annuel</span><b data-r="net"></b></div><p class="per" data-r="mois"></p><ul class="chk"><li>Recherche et sélection des locataires</li><li>États des lieux et quittances</li><li>Suivi des travaux et de l'entretien</li><li>Reversement mensuel des loyers</li></ul></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Nos métiers</span><h2>Ce que nous faisons pour vous</h2><div class="svs">${SERVICES.map(([id, t, d], i) => `<div class="sv" id="${id}"><span>${ic(['key', 'home', 'search', 'build', 'brush'][i], 26)}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></section>
<section class="sec" id="confier"><div class="wrap split"><div><span class="tag">Estimation gratuite</span><h2>Confier mon bien</h2><p class="lead">Décrivez votre bien : nous vous rappelons pour une visite d'estimation, sans engagement.</p><img src="${PH.s8}" alt="" loading="lazy" class="cimg"></div>
<form class="form" data-confier novalidate><div class="g2"><label class="fld"><span>Je souhaite</span><select name="besoin">${SERVICES.filter(([id]) => id !== 'location').map(([, t]) => `<option>${t}</option>`).join('')}<option>Mettre en location</option></select></label><label class="fld"><span>Type de bien</span><select name="type"><option>Villa</option><option>Appartement</option><option>Duplex</option><option>Bureaux</option><option>Immeuble</option><option>Terrain</option></select></label></div>
<div class="g2"><label class="fld"><span>Quartier</span><select name="q">${QUARTIERS.map((q) => `<option>${q}</option>`).join('')}</select></label><label class="fld"><span>Surface (m²)</span><input name="m2" type="number" min="10" inputmode="numeric"></label></div>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Précisions</span><textarea name="msg" rows="3" placeholder="Nombre de pièces, état, disponibilité…"></textarea></label><button class="btn t" type="submit">Demander mon estimation</button></form></div></section>`,
}));

// ---------- Bon à savoir ----------
pages.push(page('bon-a-savoir.html', {
  title: 'Bon à savoir : louer à Port-Gentil', active: 'bon-a-savoir.html',
  desc: 'Documents à fournir, caution, état des lieux, préavis : tout savoir pour louer un logement à Port-Gentil avec Wanted Immobilier.',
  body: `${PT('Bon à savoir', 'Bon à savoir', 'Préparez votre dossier de location et découvrez les étapes, de la visite à la remise des clés.')}
<section class="sec"><div class="wrap split top"><div><span class="tag">Votre dossier</span><h2>Ma liste de documents</h2><p class="lead">Cochez ce que vous avez déjà : votre dossier est prêt quand la jauge est pleine.</p>
<div class="gauge"><span data-g></span></div><p class="gp" data-gp></p><ul class="dossier" data-dossier>${DOSSIER.map(([t, req], i) => `<li><label><input type="checkbox" data-req="${req ? 1 : 0}"><span>${t}${req ? '' : ' <small>selon votre situation</small>'}</span></label></li>`).join('')}</ul></div>
<div><span class="tag">Les étapes</span><h2>De la visite aux clés</h2><ol class="steps">${[['La visite', 'Avec un conseiller, aux horaires qui vous arrangent.'], ['Le dossier', 'Pièces justificatives, étudiées sous 48 h.'], ['Le bail', 'Signature du contrat, de la caution et du premier loyer.'], ['L\'état des lieux', 'Fait ensemble, photos à l\'appui, avant la remise des clés.']].map(([t, d], i) => `<li><b>${i + 1}</b><div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}</ol></div></div></section>
<section class="sec soft"><div class="wrap faq"><div><span class="tag">Questions fréquentes</span><h2>Vos questions</h2><p class="lead">Une autre question ? Appelez le <a href="${telHref(WI.tel)}">${WI.tel}</a>.</p></div><div class="qs">${[['Quelle caution faut-il prévoir ?', 'En général deux à trois mois de loyer, plus le premier mois. Le montant exact est précisé dans chaque annonce.'], ['Les frais d\'agence sont-ils à ma charge ?', 'Des honoraires sont prévus à la signature du bail ; leur montant vous est communiqué avant toute démarche.'], ['Puis-je louer avant d\'arriver à Port-Gentil ?', 'Oui : visite en vidéo sur WhatsApp, dossier par e-mail, et remise des clés à votre arrivée.'], ['Quel préavis pour quitter le logement ?', 'Le préavis est fixé dans le bail, généralement d\'un à trois mois. Prévenez-nous par écrit.']].map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div></section>
${CTA}`,
}));

// ---------- L'agence ----------
pages.push(page('agence.html', {
  title: 'L\'agence', active: 'agence.html',
  desc: `Wanted Immobilier, agence immobilière du Carrefour des Douanes à Port-Gentil, dirigée par ${WI.boss}.`,
  body: `${PT('L\'agence', 'L\'agence', 'Une agence de proximité au Carrefour des Douanes, qui connaît Port-Gentil quartier par quartier.')}
<section class="sec"><div class="wrap split"><img src="${PH.main}" alt="Poignée de main" loading="lazy"><div><span class="tag">Notre engagement</span><h2>La clé de votre logement</h2><p class="lead">Familles, expatriés, entreprises, propriétaires : nous accompagnons chacun avec la même exigence, de la première visite à la remise des clés, et bien après.</p>
<ul class="chk"><li>Une équipe sur place, joignable sur WhatsApp</li><li>Des biens visités et vérifiés avant d'être proposés</li><li>Des contrats clairs et des états des lieux photographiés</li></ul><p class="boss">Direction : <b>${WI.boss}</b></p></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Notre zone</span><h2>Port-Gentil, quartier par quartier</h2><div class="qz">${QUARTIERS.map((q) => { const n = BIENS.filter((b) => b.q === q).length; return `<a href="annonces.html?q=${encodeURIComponent(q)}&tr=${BIENS.find((b) => b.q === q)?.tr || 'location'}"><b>${q}</b><span>${n ? n + ' bien' + (n > 1 ? 's' : '') : 'Sur demande'}</span></a>`; }).join('')}</div></div></section>
${CTA}`,
}));

// ---------- Galerie ----------
const GAL = [[PH.villaBlanche, 'Villa contemporaine'], [PH.villa, 'Villa avec piscine'], [PH.s8, 'Séjour'], [PH.res1, 'Résidence'], [PH.cui1, 'Cuisine équipée'], [PH.s2, 'Duplex'], [PH.bur2, 'Bureaux'], [PH.terrain, 'Terrain']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: '',
  desc: 'Les biens de Wanted Immobilier à Port-Gentil en images : villas, appartements, bureaux et terrains.',
  body: `${PT('Galerie', 'Galerie', 'Un aperçu des biens que nous louons, gérons et vendons à Port-Gentil.')}
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${p}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles des biens de l'agence.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => p))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Contact et accès', active: 'contact.html',
  desc: `Wanted Immobilier, ${WI.addr}, ${WI.bp}. Tél. et WhatsApp ${WI.tel}. ${WI.mail}.`,
  body: `${PT('Contact', 'Nous rendre visite', `${WI.addr}, ${WI.city}.`)}
<section class="wrap ctg"><div><div class="info">
<div>${ic('pin', 22)}<h2>Adresse</h2><p>${WI.addr}<br>${WI.bp}</p></div>
<div>${ic('phone', 22)}<h2>Téléphone</h2><p><a href="${telHref(WI.tel)}">${WI.tel}</a><br>Appel et WhatsApp</p></div>
<div>${ic('clock', 22)}<h2>Horaires</h2><p>${HOURS.join('<br>')}</p></div>
<div>${ic('mail', 22)}<h2>E-mail</h2><p><a href="mailto:${WI.mail}">${WI.mail}</a></p></div></div>
<div class="map"><iframe title="Plan d'accès à Wanted Immobilier, Carrefour des Douanes" src="https://www.google.com/maps?q=${WI.mapq}&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Écrivez-nous</h2><p>Recherche de logement, gestion, vente : nous répondons le jour même.</p>
<label class="fld"><span>Objet</span><select name="objet"><option>Je cherche un logement</option><option>Je cherche des bureaux</option><option>Je veux vendre</option><option>Gestion de mon bien</option><option>Syndic de copropriété</option><option>Autre</option></select></label>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label>
<div class="row"><button class="btn t" type="submit">Envoyer sur WhatsApp</button><a class="btn line" href="mailto:${WI.mail}">Par e-mail</a></div></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#fff"/><g transform="translate(2 16) scale(.6)">${MARK(100).replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</g></svg>`);
for (const f of ['wanted.css', 'wanted.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
