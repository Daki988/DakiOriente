// Construit le site sur mesure de Boko's Café dans neam-moteur/sites/boko-s-cafe/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { BK, PH, CATS, MENU, EVENTS, AVIS } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', BK.slug);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';

const ICON = {
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  fork: 'M11 9H9V2H7v7H5V2H3v7c0 2.1 1.7 3.8 3.8 4V22h2.4v-9c2.1-.2 3.8-1.9 3.8-4V2h-2zm5-3v8h2.5v8H21V2c-2.8 0-5 2.2-5 4z',
  bag: 'M18 6h-2a4 4 0 0 0-8 0H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-6-2a2 2 0 0 1 2 2h-4a2 2 0 0 1 2-2zm0 10a4 4 0 0 1-4-4h2a2 2 0 0 0 4 0h2a4 4 0 0 1-4 4z',
  music: 'M12 3v10.6A4 4 0 1 0 14 17V7h4V3z',
  cal: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14z',
  heart: 'M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z',
  leaf: 'M17 8C8 10 5.9 16.2 3.8 21.3l1.9.7 1-2.3c.5.2 1 .3 1.3.3C19 20 22 3 22 3c-1 2-8 2.3-13 3.3S2 11.5 2 13.5s1.8 3.8 1.8 3.8C7 8 17 8 17 8z',
  fire: 'M13.5.7s.7 2.7.7 4.9c0 2.1-1.4 3.8-3.5 3.8S7 7.7 7 5.6l.1-.4C5 7.6 3.8 10.7 3.8 14a8.2 8.2 0 0 0 16.4 0C20.2 8.6 17.6 3.8 13.5.7zM11.7 19c-1.5 0-2.7-1.2-2.7-2.6 0-1.4.9-2.3 2.4-2.6 1.5-.3 3-1 3.9-2.2.3 1.1.5 2.2.5 3.4 0 2.2-1.8 4-4.1 4z',
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
const TAG = { sig: ['Signature', 'heart'], ep: ['Épicé', 'fire'], vg: ['Végétarien', 'leaf'] };

// Logo : médaillon terracotta, B crème et motif wax
const MARK = (s = 50) => `<svg width="${s}" height="${s}" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="25" fill="#C2491D"/><circle cx="26" cy="26" r="20.5" fill="none" stroke="#E8A317" stroke-width="1.6" stroke-dasharray="3 3"/><path d="M19 14h8.5c4 0 6.5 2 6.5 5.2 0 2.1-1.1 3.6-2.9 4.3 2.4.6 3.9 2.4 3.9 4.9 0 3.6-2.8 5.6-7.2 5.6H19zm4.4 3.6v4.6h3.4c1.8 0 2.8-.8 2.8-2.3s-1-2.3-2.8-2.3zm0 8v4.8h4c1.9 0 3-.9 3-2.4s-1.1-2.4-3-2.4z" fill="#FBF4EA"/><circle cx="37" cy="14" r="2.2" fill="#E8A317"/></svg>`;
const LOGO_SVG = MARK(64).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(' aria-hidden="true"', '');
const LOGO = `${MARK()}<span class="t">Boko's Café<small>Saveurs africaines · Okala</small></span>`;

const NAV = [['index.html', 'Accueil'], ['carte.html', 'La carte'], ['evenements.html', 'Afro Brunch & soirées'], ['histoire.html', 'Notre histoire'], ['galerie.html', 'Galerie'], ['contact.html', 'Contact']];
const HOURS = BK.hours.map(([d, h]) => `${d} · ${h}`);

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'Restaurant', name: BK.name, servesCuisine: ['Africaine', 'Gabonaise'], priceRange: 'Moins de 15 000 FCFA', telephone: '+241' + BK.tel.replace(/\D/g, '').replace(/^0/, ''), address: { '@type': 'PostalAddress', streetAddress: BK.addr, addressLocality: BK.city, addressCountry: 'GA' }, acceptsReservations: true, hasMenu: 'carte.html' };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${BK.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${BK.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${PH.hero}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,500&family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="boko.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="Boko's Café, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="reservation.html">Réserver une table</a></nav>
<a class="cart-b" href="carte.html#commande" aria-label="Ma commande à emporter">${ic('bag', 20)}<span data-cartn hidden></span></a><a class="btn r hcta" href="reservation.html">Réserver</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wax" aria-hidden="true"></div><div class="wrap">
<div><a class="logo" href="index.html">${LOGO}</a><p>Les saveurs de l'Afrique dans un cadre chaleureux et cosy, à Okala. Afro Brunch le dimanche, soirées Afro Fusion.</p><div class="soc" data-soc></div></div>
<div><h5>Venir</h5><p>${BK.addr}<br>Entre l'Auberge et Canal 7<br>Libreville</p><p><a href="contact.html">Plan d'accès</a></p></div>
<div><h5>Horaires</h5><p>${HOURS.join('<br>')}</p></div>
<div><h5>Réserver</h5><p><a href="${telHref(BK.resa)}">${BK.resa}</a> (réservations)<br><a href="${telHref(BK.tel)}">${BK.tel}</a> (WhatsApp)<br>Instagram @${BK.insta}</p><p><a href="reservation.html">Réserver une table</a> · <a href="carte.html#commande">Commander</a></p></div>
<div class="cp">© 2026 ${BK.name} · Okala, Libreville · Carte et prix donnés à titre indicatif.</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.BK=${JSON.stringify({ slug: BK.slug, name: BK.name, wa: BK.wa, soc: BK.soc, menu: MENU.map(({ id, n, p }) => ({ id, n, p })) })}</script><script src="boko.js"></script>
<script src="../../assets/reco.js" data-slug="${BK.slug}" data-wa="${BK.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const PT = (crumb, h1, p, ph) => `<section class="pt"${ph ? ` style="--ph:url(${ph})"` : ''}><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div></section>`;
const tags = (t) => t.map((k) => `<span class="tg t-${k}">${ic(TAG[k][1], 12)} ${TAG[k][0]}</span>`).join('');
const dish = (m) => `<article class="di" data-c="${m.c}" data-tags="${m.tags.join(' ')}">${m.ph ? `<img src="${m.ph}" alt="${esc(m.n)}" loading="lazy">` : `<div class="noimg">${ic('fork', 26)}</div>`}<div class="db"><div class="dt"><h3>${esc(m.n)}</h3><b>${fcfa(m.p)}</b></div><p>${esc(m.d)}</p><div class="df"><div>${tags(m.tags)}</div><button class="add" data-add="${m.id}" aria-label="Ajouter ${esc(m.n)} à ma commande">+ Ajouter</button></div></div></article>`;
const CTA = `<section class="cta"><div class="wrap"><div><h2>Une table vous attend à Okala</h2><p>Réservez en ligne ou par téléphone au ${BK.resa}. Les groupes et l'Afro Brunch se réservent à l'avance.</p></div><div class="row"><a class="btn r" href="reservation.html">Réserver une table</a><a class="btn ol" href="carte.html#commande">Commander à emporter</a></div></div></section>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];
const SIG = MENU.filter((m) => m.tags.includes('sig') && m.ph);

// Accueil
pages.push(page('index.html', {
  title: 'Restaurant africain à Okala, Libreville', active: 'index.html',
  desc: 'Boko\'s Café, restaurant de saveurs africaines à Okala : poulet nyembwe, bœuf odika, poisson braisé, Afro Brunch du dimanche, soirées Afro Fusion. Réservation en ligne.',
  body: `<section class="hero"><div class="wrap hg"><div><span class="kick">${ic('pin', 15)} Okala · Libreville</span><h1>Les saveurs de l'Afrique, <em>servies avec le sourire.</em></h1><p>Cuisine gabonaise et africaine, cocktails maison et ambiance cosy aux couleurs du continent. Moins de 15 000 FCFA par personne.</p>
<div class="row"><a class="btn r" href="reservation.html">Réserver une table</a><a class="btn line" href="carte.html">Voir la carte</a></div><ul class="open"><li><span data-open></span></li><li>${ic('phone', 15)} <a href="${telHref(BK.resa)}">${BK.resa}</a></li></ul></div>
<div class="hv"><img src="${PH.hero}" alt="Assortiment de plats africains" class="h1i"><img src="${SIG[0].ph}" alt="" class="h2i"><div class="stamp"><b>Afro<br>Brunch</b><span>chaque dimanche</span></div></div></div></section>
<div class="wax" aria-hidden="true"></div>
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Nos signatures</span><h2>Ce qu'on vient manger chez Boko's</h2></div><a class="btn line" href="carte.html">Toute la carte</a></div><div class="sig">${SIG.slice(0, 4).map((m) => `<a href="carte.html?c=${m.c}#${m.id}" class="sg"><img src="${m.ph}" alt="" loading="lazy"><div><h3>${esc(m.n)}</h3><p>${esc(m.d)}</p><b>${fcfa(m.p)}</b></div></a>`).join('')}</div></div></section>
<section class="sec dark"><div class="wrap split"><div><span class="tag">Chaque dimanche</span><h2>L'Afro Brunch</h2><p class="lead">Beignets, plantain, grillades, fruits frais, bissap et gingembre à volonté : le rendez-vous gourmand du dimanche, de 11 h à 15 h.</p><div class="row"><a class="btn r" href="reservation.html?s=brunch">Réserver mon brunch</a><a class="btn ol" href="evenements.html">Brunch & soirées</a></div></div><div class="mosa"><img src="${PH.brunch}" alt="" loading="lazy"><img src="${PH.plantain}" alt="" loading="lazy"><img src="${PH.bissap}" alt="" loading="lazy"></div></div></section>
<section class="sec"><div class="wrap split"><img class="big" src="${PH.salle}" alt="La salle du restaurant" loading="lazy"><div><span class="tag">Le lieu</span><h2>Un cadre cosy aux couleurs de l'Afrique</h2><p class="lead">Dans la ruelle de Canal 7 à Okala, face au lavage : une salle chaleureuse, du wax, de la bonne musique et une équipe aux petits soins.</p>
<div class="feat">${[['fork', 'Sur place', 'Déjeuner et dîner'], ['bag', 'À emporter', 'Commande sur WhatsApp'], ['music', 'Afro Fusion', 'Soirées live'], ['heart', 'Privatisation', 'Jusqu\'à 60 invités']].map(([i, t, d]) => `<div>${ic(i, 22)}<b>${t}</b><span>${d}</span></div>`).join('')}</div></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Ils en parlent</span><h2>Avis de nos clients</h2><div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div><p class="note">Suivez-nous sur Instagram : <b>@${BK.insta}</b></p></div></section>
${CTA}`,
}));

// La carte + commande à emporter
pages.push(page('carte.html', {
  title: 'La carte', active: 'carte.html',
  desc: 'La carte de Boko\'s Café : poulet nyembwe, bœuf odika, poisson braisé, brochettes, plantain, bissap et gingembre maison. Commande à emporter sur WhatsApp.',
  body: `${PT('La carte', 'La carte', 'Cuisine maison, produits du marché, épices du continent. Ajoutez vos plats pour commander à emporter.', PH.hero)}
<section class="sec menu-s"><div class="wrap mlay"><div><div class="mtabs" role="tablist" data-cats data-tabs><button role="tab" aria-selected="true" data-c="tout">Tout</button>${CATS.map(([k, t]) => `<button role="tab" aria-selected="false" data-c="${k}">${t}</button>`).join('')}</div>
<div class="mf" data-mf>${Object.entries(TAG).map(([k, [t, i]]) => `<label><input type="checkbox" value="${k}"><span>${ic(i, 13)} ${t}</span></label>`).join('')}</div>
${CATS.map(([k, t]) => `<div class="mcat" data-cat="${k}"><h2>${t}</h2><div class="dis">${MENU.filter((m) => m.c === k).map((m) => dish(m).replace('<article class="di"', `<article class="di" id="${m.id}"`)).join('')}</div></div>`).join('')}<p class="none" data-mnone hidden>Aucun plat ne correspond à ces filtres.</p><p class="note">Carte indicative, selon le marché. Prévenez-nous de toute allergie.</p></div>
<aside class="cart" id="commande" data-cart><h2>${ic('bag', 22)} Ma commande</h2><div data-lines><p class="empty">Ajoutez des plats avec le bouton « + Ajouter ».</p></div><div class="ctot"><span>Total</span><b data-ctot>0 FCFA</b></div>
<div class="seg" role="radiogroup" aria-label="Mode de retrait"><label><input type="radio" name="mode" value="à emporter" checked><span>À emporter</span></label><label><input type="radio" name="mode" value="sur place"><span>Sur place</span></label></div>
<label class="fld"><span>Heure de retrait</span><select name="h" data-ch></select></label><label class="fld"><span>Nom</span><input name="nom" autocomplete="name" data-cn></label>
<button class="btn r wide" data-csend>Commander sur WhatsApp</button><button class="lnk" data-cclear>Vider la commande</button></aside></div></section>
<div class="mbar" data-mbar hidden><span data-mbn></span><a class="btn r" href="#commande">Voir ma commande</a></div>
${CTA}`,
}));

// Réservation
pages.push(page('reservation.html', {
  title: 'Réserver une table', active: '',
  desc: 'Réservez votre table chez Boko\'s Café à Okala : déjeuner, dîner ou Afro Brunch du dimanche. Choix de l\'heure, du nombre de couverts et de l\'occasion.',
  body: `${PT('Réserver', 'Réserver une table', 'Choisissez le service et l\'heure : la réservation est confirmée par WhatsApp. Pour plus de 12 personnes, voyez la privatisation.', PH.salle)}
<section class="rs"><div class="wrap"><form data-res novalidate>
<fieldset class="stp"><legend><b>1</b>Quand ?</legend><div class="g2"><label class="fld"><span>Date</span><input type="date" name="date" required></label><label class="fld"><span>Couverts</span><select name="pax">${Array.from({ length: 12 }, (_, i) => `<option${i === 1 ? ' selected' : ''}>${i + 1}</option>`).join('')}</select></label></div>
<div class="seg svc" role="radiogroup" aria-label="Service">${[['midi', 'Déjeuner'], ['soir', 'Dîner'], ['brunch', 'Afro Brunch']].map(([v, t], i) => `<label><input type="radio" name="s" value="${v}"${i ? '' : ' checked'}><span>${t}</span></label>`).join('')}</div><p class="msg" data-smsg hidden></p>
<div class="slots" role="radiogroup" aria-label="Heure" data-slots></div></fieldset>
<fieldset class="stp"><legend><b>2</b>Vos préférences</legend><div class="g2"><label class="fld"><span>Occasion</span><select name="occ"><option>Simple repas</option><option>Anniversaire</option><option>Repas d'affaires</option><option>En amoureux</option><option>Entre amis</option></select></label><label class="fld"><span>Emplacement</span><select name="pl"><option>Peu importe</option><option>En salle</option><option>Près du bar</option><option>Coin calme</option></select></label></div>
<label class="fld" style="margin-top:10px"><span>Une demande ?</span><textarea name="msg" rows="2" placeholder="Allergie, chaise bébé, gâteau d'anniversaire…"></textarea></label></fieldset>
<fieldset class="stp"><legend><b>3</b>Vos coordonnées</legend><div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div></fieldset></form>
<aside class="sum"><div class="ticket"><span class="tag">Votre réservation</span><h2 data-r="svc"></h2><div class="ln"><span>Date</span><b data-r="date"></b></div><div class="ln"><span>Heure</span><b data-r="h"></b></div><div class="ln"><span>Couverts</span><b data-r="pax"></b></div><div class="ln" data-r-bw hidden><span>Afro Brunch</span><b data-r="bp"></b></div></div>
<button class="btn r wide" data-send>Confirmer sur WhatsApp</button><a class="btn line wide" href="${telHref(BK.resa)}">${ic('phone', 16)} ${BK.resa}</a><p class="note">Table gardée 15 minutes après l'heure prévue.</p></aside></div></section>`,
}));

// Afro Brunch & soirées
pages.push(page('evenements.html', {
  title: 'Afro Brunch, soirées et privatisation', active: 'evenements.html',
  desc: 'Afro Brunch du dimanche, soirées Afro Fusion et privatisation du Boko\'s Café pour vos anniversaires et événements d\'entreprise.',
  body: `${PT('Afro Brunch & soirées', 'Afro Brunch, soirées et fêtes', 'Le dimanche, on brunche. Une fois par mois, on danse. Et toute l\'année, le Boko\'s accueille vos fêtes.', PH.chant)}
<section class="sec"><div class="wrap evs">${EVENTS.map(([id, t, w, d, p, ph]) => `<article class="ev" id="${id}"><img src="${ph}" alt="" loading="lazy"><div><span class="tag">${w}</span><h2>${t}</h2><p class="lead">${d}</p><div class="evf"><b>${p}</b><a class="btn r" href="${id === 'privatisation' ? '#devis' : id === 'brunch' ? 'reservation.html?s=brunch' : 'reservation.html?s=soir'}">${id === 'privatisation' ? 'Demander un devis' : 'Réserver'}</a></div></div></article>`).join('')}</div></section>
<section class="sec dark"><div class="wrap"><span class="tag">Agenda</span><h2>Les prochains rendez-vous</h2><ul class="agenda" data-agenda></ul><p class="note">Programme des soirées annoncé sur Instagram @${BK.insta}.</p></div></section>
<section class="sec" id="devis"><div class="wrap split"><div><span class="tag">Privatisation</span><h2>Votre fête au Boko's</h2><p class="lead">Anniversaire, baptême, pot de départ, séminaire : nous composons un menu africain à votre goût et décorons la salle à vos couleurs.</p><ul class="chk">${['Menu personnalisé dès 10 000 FCFA par personne', 'Décoration wax et fleurs', 'Musique ou DJ sur demande', 'Gâteau et cocktails signature'].map((t) => `<li>${ic('heart', 15)} ${t}</li>`).join('')}</ul></div>
<form class="form" data-priv novalidate><h3 class="h3">Demander un devis</h3><div class="g2"><label class="fld"><span>Type d'événement</span><select name="type"><option>Anniversaire</option><option>Baptême</option><option>Événement d'entreprise</option><option>Pot de départ</option><option>Autre</option></select></label><label class="fld"><span>Date</span><input type="date" name="date" required></label></div>
<div class="g2"><label class="fld"><span>Invités</span><input type="number" name="inv" min="10" max="60" value="25" required></label><label class="fld"><span>Budget par personne</span><select name="bud"><option>10 000 – 15 000 FCFA</option><option>15 000 – 20 000 FCFA</option><option>Plus de 20 000 FCFA</option></select></label></div>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div><p class="est" data-est></p><button class="btn r" type="submit">Envoyer ma demande</button></form></div></section>
${CTA}`,
}));

// Notre histoire
pages.push(page('histoire.html', {
  title: 'Notre histoire', active: 'histoire.html',
  desc: 'Boko\'s Café, le restaurant des amateurs de saveurs africaines à Okala, Libreville : notre cuisine, notre lieu, notre équipe.',
  body: `${PT('Notre histoire', 'Une maison pour les saveurs africaines', 'Né à Okala pour tous les amateurs de cuisine africaine, le Boko\'s Café cultive la générosité, le partage et la bonne humeur.', PH.wax)}
<section class="sec"><div class="wrap split"><img class="big" src="${PH.chef}" alt="En cuisine" loading="lazy"><div><span class="tag">Notre cuisine</span><h2>Comme à la maison, en mieux</h2><p class="lead">Nyembwe, odika, feuilles de manioc, poisson braisé : nous cuisinons les grands classiques du Gabon et d'Afrique avec des produits frais du marché, sans raccourcis.</p><p class="lead">Nos jus sont pressés chaque matin, nos sauces mijotent longtemps, et chaque assiette part en salle avec le sourire.</p></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Nos valeurs</span><h2>Ce qui nous anime</h2><div class="vals">${[['leaf', 'Le frais', 'Produits du marché, jus maison, rien de surgelé dans nos sauces.'], ['heart', 'Le partage', 'Plats à partager, grandes tablées, brunch en famille.'], ['music', 'La fête', 'Musique, couleurs, soirées Afro Fusion : on vient aussi pour l\'ambiance.']].map(([i, t, d]) => `<div>${ic(i, 28)}<h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></section>
<section class="sec"><div class="wrap split"><div><span class="tag">Le lieu</span><h2>Okala, ruelle de Canal 7</h2><p class="lead">Entre l'Auberge et Canal 7, face au lavage : suivez la ruelle, les couleurs et l'odeur de la braise, vous y êtes.</p><a class="btn r" href="contact.html">Plan d'accès</a></div><img class="big" src="${PH.bar}" alt="Le bar" loading="lazy"></div></section>
${CTA}`,
}));

// Galerie
const GAL = [[PH.hero, 'Nos plats à partager'], [PH.salle, 'La salle'], [MENU.find((m) => m.id === 'capitaine').ph, 'Capitaine braisé'], [PH.chant, 'Soirée Afro Fusion'], [PH.brunch, 'Afro Brunch'], [MENU.find((m) => m.id === 'nyembwe').ph, 'Poulet nyembwe'], [PH.cocktails, 'Cocktails maison'], [MENU.find((m) => m.id === 'brochettes-mix').ph, 'Brochettes'], [PH.bar, 'Le bar'], [PH.bissap, 'Bissap maison'], [PH.chant2, 'Musique live']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: 'galerie.html',
  desc: 'Boko\'s Café en images : plats, salle, Afro Brunch et soirées Afro Fusion.',
  body: `${PT('Galerie', 'Galerie', 'Plats, ambiance et soirées du Boko\'s.')}
<section class="sec"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${p}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles du restaurant.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => p))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
}));

// Contact
pages.push(page('contact.html', {
  title: 'Contact et accès', active: 'contact.html',
  desc: `${BK.name}, ${BK.addr}, Libreville. Réservations ${BK.resa}, WhatsApp ${BK.tel}.`,
  body: `${PT('Contact', 'Nous trouver', 'Okala, ruelle de Canal 7, face au lavage, entre l\'Auberge et Canal 7.')}
<section class="wrap ctg"><div><div class="info">
<div>${ic('pin', 22)}<h2>Adresse</h2><p>${BK.addr}<br>Okala, Libreville</p></div>
<div>${ic('phone', 22)}<h2>Réservations</h2><p><a href="${telHref(BK.resa)}">${BK.resa}</a><br><a href="${telHref(BK.tel)}">${BK.tel}</a> (WhatsApp)</p></div>
<div>${ic('clock', 22)}<h2>Horaires</h2><p>${HOURS.join('<br>')}</p></div>
<div>${ic('heart', 22)}<h2>Instagram</h2><p>@${BK.insta}</p></div></div>
<div class="map"><iframe title="Plan d'accès, Boko's Café à Okala" src="https://www.google.com/maps?q=${BK.mapq}&z=14&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Écrivez-nous</h2><p>Question, groupe, partenariat : nous répondons rapidement.</p>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label><div class="row"><button class="btn r" type="submit">Envoyer sur WhatsApp</button><a class="btn line" href="reservation.html">Réserver une table</a></div></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), LOGO_SVG);
for (const f of ['boko.css', 'boko.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', pages.length, 'pages');
