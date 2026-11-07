// Construit le site sur mesure de Fishing Gabon Club dans neam-moteur/sites/fishing-gabon-club/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { FG, PH, FORMULES, ESPECES, AVIS } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', FG.slug);
const img = (f) => '../../assets/photos/' + f;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');
const fcfa = (n) => n ? n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA' : 'Sur devis';
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const ICON = {
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9z',
  boat: 'M20 21c-1.4 0-2.8-.5-4-1.3a7 7 0 0 1-8 0C6.8 20.5 5.4 21 4 21H2v2h2c1.4 0 2.7-.3 4-1a8.9 8.9 0 0 0 8 0c1.3.7 2.6 1 4 1h2v-2zM3.9 19H4c1.6 0 3-.9 4-2 1 1.1 2.4 2 4 2s3-.9 4-2c1 1.1 2.4 2 4 2h.1l1.9-6.7a1 1 0 0 0-.6-1.2L20 10.6V6a2 2 0 0 0-2-2h-3V1H9v3H6a2 2 0 0 0-2 2v4.6l-1.3.4a1 1 0 0 0-.6 1.2zM6 6h12v4l-6-2-6 2z',
  fish: 'M12 20c-2.5 0-4.8-1.1-6.7-3L2 20V4l3.3 3C7.2 5.1 9.5 4 12 4c4.4 0 8.5 3.6 10 8-1.5 4.4-5.6 8-10 8zm4-9a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  cal: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14zM7 12h5v5H7z',
  users: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-1 .1 1.2.8 2 1.9 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z',
  drink: 'M5 2h14l-2 20H7zm2.2 2 .4 4h8.8l.4-4z',
  tail: 'M2 12c4-5 9-6 13-4l7-5-2 9 2 9-7-5c-4 2-9 1-13-4z',
  wa: 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z',
};
const ic = (n, s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
// Logo réel redessiné : carte du Gabon, hameçon en forme de G, thon. Couleurs du site.
const MARK = (s = 46, ink = '#0B2A3C', acc = '#F29E38') => `<svg width="${s}" height="${s}" viewBox="0 0 100 100" aria-hidden="true"><path d="M20 24h20v-9h19l2 8h9l4 7h8l2 10-4 8 4 8-2 10h-8l-4 6-10-2-6 8-6 12-8-6-10-12-8-12-10-10 4-6-6-4 4-6z" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/><path d="M50 42c9-9 25-10 34-2l8-8-1 13 3 12-9-6c-10 8-26 7-35-1 4-3 4-5 0-8z" fill="${ink}"/><path d="M66 36l4-10 3 11zM66 58l3 9 3-10z" fill="${ink}"/><circle cx="80" cy="46" r="1.8" fill="#fff"/><path d="M24 40v20a10 10 0 0 0 20 0v-6" fill="none" stroke="${acc}" stroke-width="4" stroke-linecap="round"/><path d="M44 54l-5 3" stroke="${acc}" stroke-width="4" stroke-linecap="round"/><path d="M20 40h8" stroke="${acc}" stroke-width="4" stroke-linecap="round"/></svg>`;
const LOGO_FT = `<span class="mk">${MARK(46, '#ffffff')}</span><span class="t">FISHING <b>GABON</b><small>Club · pêche sportive</small></span>`;
const LOGO = `<span class="mk">${MARK()}</span><span class="t">FISHING <b>GABON</b><small>Club · pêche sportive</small></span>`;

const NAV = [['index.html', 'Accueil'], ['sorties.html', 'Sorties'], ['especes.html', 'Espèces et saisons'], ['club.html', 'Le club'], ['galerie.html', 'Galerie'], ['contact.html', 'Contact']];

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'TouristTrip', name: FG.name, description: 'Sorties de pêche sportive et balades baleines au départ de Libreville', provider: { '@type': 'LocalBusiness', name: FG.name, telephone: '+241' + FG.tel.replace(/\D/g, '').replace(/^0/, ''), email: FG.mail, address: { '@type': 'PostalAddress', streetAddress: FG.addr, postOfficeBoxNumber: '1044', addressLocality: FG.city, addressCountry: 'GA' }, geo: { '@type': 'GeoCoordinates', latitude: FG.geo[0], longitude: FG.geo[1] }, sameAs: [`https://www.facebook.com/${FG.fb}`, `https://www.instagram.com/${FG.ig}/`] } };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${FG.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${FG.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${img(PH.large)}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="fishing.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="Fishing Gabon Club, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="reserver.html">Réserver une sortie</a></nav>
<a class="btn o hcta" href="reserver.html">Réserver</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo" href="index.html">${LOGO_FT}</a><p>Sorties de pêche sportive, trips sur mesure et balades baleines au départ de Libreville, avec un guide expérimenté.</p><div class="soc" data-soc></div></div>
<div><h5>Départ</h5><p>${FG.addr}<br>${FG.bp}</p><p><a href="contact.html">Plan d'accès</a></p></div>
<div><h5>Sorties</h5><p>${FORMULES.map(([id, n]) => `<a href="sorties.html#${id}">${n}</a>`).join('<br>')}</p></div>
<div><h5>Contact</h5><p><a href="${telHref(FG.tel)}">${FG.tel}</a> (WhatsApp)<br><a href="mailto:${FG.mail}">${FG.mail}</a><br>Réservation 48 h à l'avance</p></div>
<div class="cp">© 2026 ${FG.name} · ${FG.city}, Gabon · Pêche responsable : nous relâchons les tarpons.</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.FG=${JSON.stringify({ slug: FG.slug, wa: FG.wa, mail: FG.mail, mois: MOIS, sp: Object.fromEntries(ESPECES.map(([id, n, , , s]) => [id, [n, s]])) })}</script><script src="fishing.js"></script>
<script src="../../assets/reco.js" data-slug="${FG.slug}" data-wa="${FG.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const PT = (crumb, h1, p, ph) => `<section class="pt"${ph ? ` style="background-image:url(${img(ph)})"` : ''}><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div></section>`;
const WAVE = '<svg class="wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30c120 20 240 20 360 0s240-20 360 0 240 20 360 0 240-20 360 0v30H0z"/></svg>';
const CTA = `<section class="cta"><div class="wrap"><div><h2>Prêt à lancer ?</h2><p>Réservez au moins 48 h à l'avance. Matériel de pêche et boissons inclus.</p></div><div class="row"><a class="btn o" href="reserver.html">Réserver une sortie</a><a class="btn ghost" href="https://wa.me/${FG.wa}" target="_blank" rel="noopener">${ic('wa', 18)} ${FG.tel}</a></div></div></section>`;
const card = ([id, n, d, l, p, mx, ph, , t]) => `<article class="fm" id="${id}"><img src="${img(ph)}" alt="" loading="lazy"><div><span class="du">${ic('clock', 14)} ${d}</span><h3>${n}</h3><p class="lieu">${ic('pin', 14)} ${l}</p><p>${t}</p><div class="pr"><b>${fcfa(p)}</b>${p ? `<small>la pirogue · jusqu'à ${mx} pers.</small>` : '<small>selon la destination</small>'}</div><a class="btn line sm" href="reserver.html?formule=${id}">Réserver →</a></div></article>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'Pêche sportive au départ de Libreville', active: 'index.html',
  desc: 'Fishing Gabon Club : sorties de pêche sportive en pirogue (tarpons, carpes rouges, barracudas, capitaines), trips sur mesure et balades baleines au départ de Libreville.',
  body: `<section class="hero" style="background-image:url(${img(PH.large)})"><div class="wrap"><span class="kick">Départ du club Barracuda · Libreville</span>
<h1>Le Gabon,<br><em>graal</em> de la pêche sportive.</h1><p>Tarpons géants, carpes rouges, barracudas et capitaines : embarquez avec un guide expérimenté, seul, entre amis ou en famille. Débutants bienvenus.</p>
<div class="row"><a class="btn o" href="reserver.html">Réserver une sortie</a><a class="btn ghost" href="sorties.html">Voir les sorties</a></div></div>${WAVE}</section>
<section class="facts"><div class="wrap"><div>${ic('boat', 26)}<b>9,50 m</b><span>pirogue, 2 × 115 cv</span></div><div>${ic('fish', 26)}<b>Matériel</b><span>de pêche inclus</span></div><div>${ic('drink', 26)}<b>Boissons</b><span>fraîches à bord</span></div><div>${ic('cal', 26)}<b>48 h</b><span>pour réserver</span></div></div></section>
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Nos sorties</span><h2>Choisissez votre aventure</h2></div><a class="btn line" href="sorties.html">Toutes les sorties →</a></div>
<div class="fms">${FORMULES.slice(0, 3).map(card).join('')}</div></div></section>
<section class="sec now"><div class="wrap split"><div><span class="tag light">Ce mois-ci</span><h2>Ce qui mord en <span data-now-m>ce moment</span></h2><p class="lead">Selon la saison, le guide adapte le spot et la technique. Voici les espèces à viser ce mois-ci.</p><ul class="nowl" data-now></ul><a class="btn o" href="especes.html">Le calendrier complet →</a></div><img src="${img(PH.port)}" alt="Pirogues au port" loading="lazy"></div></section>
<section class="sec"><div class="wrap split"><img src="${img(PH.baleine)}" alt="Baleine à bosse au large du Gabon" loading="lazy"><div><span class="tag">De juillet à septembre</span><h2>La saison des baleines</h2><p class="lead">Chaque année, les baleines à bosse viennent mettre bas au large du Gabon. Nous proposons des balades d'observation, moteur coupé et à bonne distance, ainsi que des sorties à la découverte des espèces qui bordent les rivières de l'Estuaire.</p><a class="btn line" href="reserver.html?formule=baleines">Réserver une balade →</a></div></div></section>
<section class="sec sand"><div class="wrap"><span class="tag">Ils ont embarqué</span><h2>Avis de pêcheurs</h2><div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
${CTA}`,
}));

// ---------- Sorties ----------
pages.push(page('sorties.html', {
  title: 'Nos sorties de pêche', active: 'sorties.html',
  desc: 'Demi-journée en estuaire, journée au large, surfcasting, balade baleines, trips sur mesure à Loango et Setté Cama : les sorties du Fishing Gabon Club.',
  body: `${PT('Sorties', 'Nos sorties', 'Plusieurs formules selon la durée, le lieu et les espèces recherchées. Tarifs indicatifs par pirogue.', PH.pirogue)}
<section class="sec" style="padding-top:50px"><div class="wrap"><div class="fms all">${FORMULES.map(card).join('')}</div>
<div class="incl"><h3>Toujours inclus</h3><ul class="chk"><li>${ic('check', 18)} Guide expérimenté et ses conseils</li><li>${ic('check', 18)} Cannes, moulinets, leurres et appâts</li><li>${ic('check', 18)} Boissons fraîches à bord</li><li>${ic('check', 18)} Gilets de sauvetage pour tous</li></ul><p class="note">Réservation 48 h à l'avance minimum. Départ du club Barracuda, Terrasses de l'Estuaire. Sortie reportée sans frais si la météo l'impose.</p></div></div></section>
${CTA}`,
}));

// ---------- Espèces et saisons ----------
const lvl = ['Rare', 'Possible', 'Meilleure période'];
pages.push(page('especes.html', {
  title: 'Espèces et saisons', active: 'especes.html',
  desc: 'Tarpon, carpe rouge, capitaine, barracuda, carangue, thonine, baleines : quand et comment les pêcher ou les observer au Gabon.',
  body: `${PT('Espèces et saisons', 'Espèces et saisons', 'Choisissez un mois : nous vous montrons ce qui mord et ce que l\'on peut observer.', PH.lagune)}
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="months" role="tablist" aria-label="Mois" data-months>${MOIS.map((m, i) => `<button role="tab" data-m="${i}">${m.slice(0, 3)}<span>${m.slice(3)}</span></button>`).join('')}</div>
<div class="sps" data-sps>${ESPECES.map(([id, n, w, t, s, ph]) => `<article class="sp" data-sp="${id}" data-s="${s.join('')}"><img src="${img(ph)}" alt="" loading="lazy"><div><span class="lv" data-lv></span><h3>${n}</h3><p><b>Poids :</b> ${w}</p><p><b>Technique :</b> ${t}</p><a href="reserver.html?espece=${id}">Organiser une sortie →</a></div></article>`).join('')}</div>
<h2 class="h3 cal-t">Le calendrier de l'année</h2><div class="cal-w"><table class="cal"><thead><tr><th scope="col">Espèce</th>${MOIS.map((m) => `<th scope="col">${m.slice(0, 1)}</th>`).join('')}</tr></thead><tbody>${ESPECES.map(([, n, , , s]) => `<tr><th scope="row">${n}</th>${s.map((v, i) => `<td class="c${v}" title="${MOIS[i]} : ${lvl[v]}"><span class="sr">${lvl[v]}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div>
<p class="note"><span class="lg c2"></span> Meilleure période <span class="lg c1"></span> Possible <span class="lg c0"></span> Rare. Saisons données à titre indicatif : elles varient selon les années, la météo et les marées. Nous relâchons les tarpons.</p></div></section>
${CTA}`,
}));

// ---------- Réserver ----------
const tomorrow2 = 'Réservation au moins 48 h à l\'avance';
pages.push(page('reserver.html', {
  title: 'Réserver une sortie', active: '',
  desc: 'Réservez votre sortie de pêche ou votre balade baleines avec Fishing Gabon Club : formule, date, nombre de pêcheurs, espèce visée. Confirmation sur WhatsApp.',
  body: `${PT('Réserver', 'Réserver une sortie', `${tomorrow2}. Le guide vous confirme la disponibilité et l'heure de départ sur WhatsApp.`)}
<section class="bk"><div class="wrap"><form data-resa novalidate>
<fieldset class="stp"><legend><b>1</b>Votre sortie</legend><div class="opts">${FORMULES.map(([id, n, d, , p, mx, , sp], i) => `<label><input type="radio" name="formule" value="${id}" data-name="${esc(n)}" data-price="${p}" data-max="${mx}" data-sp="${sp.join(',')}"${i === 0 ? ' checked' : ''}><span><b>${n}</b><small>${d} · ${fcfa(p)}</small></span></label>`).join('')}</div></fieldset>
<fieldset class="stp"><legend><b>2</b>Date et équipage</legend><div class="g3f"><label class="fld"><span>Date</span><input type="date" name="date" required></label><label class="fld"><span>Départ</span><select name="creneau"><option>Tôt le matin (6 h)</option><option>Matinée (8 h)</option><option>Après-midi (14 h)</option></select></label>
<div class="fld cnt"><span>Personnes</span><div><button type="button" data-minus aria-label="Une personne de moins">−</button><output data-n>2</output><button type="button" data-plus aria-label="Une personne de plus">+</button></div><input type="hidden" name="nb" value="2"></div></div>
<p class="msg" data-date-msg hidden></p>
<p class="lbl">Niveau</p><div class="chips"><label><input type="radio" name="niveau" value="Débutant" checked><span>Débutant</span></label><label><input type="radio" name="niveau" value="Confirmé"><span>Confirmé</span></label><label><input type="radio" name="niveau" value="Expert"><span>Expert</span></label></div>
<label class="fld" style="margin-top:14px"><span>Espèce visée</span><select name="espece" data-esp></select></label><p class="msg" data-season hidden></p></fieldset>
<fieldset class="stp"><legend><b>3</b>Vous</legend><div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="given-name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel" placeholder="0X XX XX XX"></label></div>
<label class="fld" style="margin-top:10px"><span>Message (facultatif)</span><textarea name="msg" rows="3" placeholder="Enfants à bord, pêche du soir, transfert…"></textarea></label></fieldset></form>
<aside class="sum"><h2>Votre sortie</h2><div class="ln"><span>Formule</span><b data-s="f"></b></div><div class="ln"><span>Date</span><b data-s="d"></b></div><div class="ln"><span>Personnes</span><b data-s="n"></b></div><div class="ln"><span>Espèce</span><b data-s="e"></b></div>
<div class="tot"><span>Tarif indicatif</span><b data-s="p"></b><small data-s="pp"></small></div>
<button class="btn o" data-send>Réserver sur WhatsApp</button><p class="note">Matériel et boissons inclus. Paiement sur place après confirmation.</p></aside></div></section>`,
}));

// ---------- Le club ----------
pages.push(page('club.html', {
  title: 'Le club et le guide', active: 'club.html',
  desc: 'Le Fishing Gabon Club : un guide de pêche expert du littoral gabonais, une pirogue de 9,50 m, une case à la Pointe Denis, la sécurité avant tout.',
  body: `${PT('Le club', 'Le club', 'Pour les passionnés de pêche, débutants ou confirmés, à la recherche des plus belles pièces des rivières, estuaires et océans du Gabon.', PH.bord3)}
<section class="sec"><div class="wrap split"><img src="${img(PH.bord2)}" alt="Canne et moulinet sur la plage" loading="lazy"><div><span class="tag">Le guide</span><h2>${FG.guide}</h2><p class="lead">Spécialiste du guidage en milieu tropical, il connaît les marées, les courants et le comportement des poissons des plus beaux spots du littoral : estuaire du Komo, lagune de Setté Cama, parc national de Loango.</p>
<ul class="chk"><li>${ic('check', 18)} Surfcasting depuis les plages sauvages</li><li>${ic('check', 18)} Pêche aux leurres en mangrove</li><li>${ic('check', 18)} Jig, popper et poissons nageurs au large</li></ul></div></div></section>
<section class="sec deep"><div class="wrap"><span class="tag light">À bord</span><h2>La pirogue du club</h2><div class="grid g4 why">
<div>${ic('boat', 28)}<h3>9,50 mètres</h3><p>Stable et spacieuse, pour pêcher à quatre confortablement.</p></div><div>${ic('tail', 28)}<h3>2 × 115 cv</h3><p>Pour rejoindre vite les spots du large et de l'Estuaire.</p></div><div>${ic('shield', 28)}<h3>Sécurité</h3><p>Gilets pour tous, trousse de secours, radio et météo vérifiée avant chaque départ.</p></div><div>${ic('drink', 28)}<h3>Tout compris</h3><p>Matériel de pêche et boissons inclus.</p></div></div></div></section>
<section class="sec"><div class="wrap split rev"><div><span class="tag">Pointe Denis</span><h2>La case du club</h2><p class="lead">Face à Libreville, à la Pointe Denis, la case du Fishing Gabon Club accueille les pêcheurs pour prolonger l'aventure : pêche du bord, repos entre deux marées et coucher de soleil sur l'Estuaire.</p><a class="btn line" href="contact.html">Nous demander les dates →</a></div><img src="${img(PH.bord)}" alt="Canne de surfcasting sur une plage" loading="lazy"></div></section>
<section class="sec sand"><div class="wrap"><span class="tag">Notre engagement</span><h2>Une pêche responsable</h2><div class="grid g3 why light"><div>${ic('fish', 28)}<h3>No kill</h3><p>Les tarpons sont relâchés après la photo.</p></div><div>${ic('tail', 28)}<h3>Baleines</h3><p>Observation à distance, moteur coupé, sans poursuite.</p></div><div>${ic('users', 28)}<h3>Partage</h3><p>Le plaisir de la pêche, c'est le partage d'aventures.</p></div></div></div></section>
${CTA}`,
}));

// ---------- Galerie ----------
const GAL = [[PH.large, 'Au large'], [PH.pirogue, 'Retour de pêche'], [PH.baleine, 'Baleine à bosse'], [PH.bord, 'Surfcasting'], [PH.lagune, 'Lagunes et mangroves'], [PH.bord2, 'Prêt à lancer'], [PH.baleine2, 'Baleines en chasse'], [PH.bord3, 'Plage sauvage'], [PH.pecheur, 'Pêcheurs de l\'Estuaire'], [PH.port, 'Le port']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: 'galerie.html',
  desc: 'Fishing Gabon Club en images : pêche au large, estuaire, plages sauvages et baleines.',
  body: `${PT('Galerie', 'Galerie', 'Nos sorties en images. Retrouvez les prises du jour sur Facebook et Instagram.')}
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${img(p)}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles du club.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => img(p)))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Contact et accès', active: 'contact.html',
  desc: `Fishing Gabon Club, ${FG.addr}, ${FG.city}. ${FG.bp}. Tél. et WhatsApp ${FG.tel}. ${FG.mail}.`,
  body: `${PT('Contact', 'Nous trouver', `Départ du ${FG.addr}, ${FG.city}.`)}
<section class="wrap ctg"><div><div class="info">
<div>${ic('pin', 22)}<h2>Point de départ</h2><p>${FG.addr}<br>${FG.bp}</p></div>
<div>${ic('phone', 22)}<h2>Téléphone</h2><p><a href="${telHref(FG.tel)}">${FG.tel}</a><br>Appel et WhatsApp</p></div>
<div>${ic('cal', 22)}<h2>Réservation</h2><p>Tous les jours<br>48 h à l'avance</p></div>
<div>${ic('mail', 22)}<h2>E-mail</h2><p><a href="mailto:${FG.mail}">${FG.mail}</a></p></div></div>
<div class="map"><iframe title="Plan d'accès au club Barracuda" src="https://www.google.com/maps?q=${FG.geo.join(',')}&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Une question ?</h2><p>Trip sur mesure, groupe, séminaire, cadeau : écrivez-nous. Pour une date précise, utilisez <a href="reserver.html">la réservation</a>.</p>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="given-name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label>
<div class="row"><button class="btn o" type="submit">Envoyer sur WhatsApp</button><a class="btn line" href="mailto:${FG.mail}">Par e-mail</a></div></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" fill="#F6EFE4"/><g transform="translate(4 4) scale(.92)">${MARK(100).replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</g></svg>`);
for (const f of ['fishing.css', 'fishing.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
