// Construit le site sur mesure d'Eva Spa chez Clarisse dans neam-moteur/sites/eva-spa-chez-clarisse/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { AG, PH, CATS, FORFAITS, AVIS, TEAM } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', AG.slug);
const img = (f) => '../../assets/photos/' + f;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) : ''}` : `${m} min`);
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');

const ICON = {
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  gift: 'M20 7h-2.2A3 3 0 0 0 12 4a3 3 0 0 0-5.8 3H4a1 1 0 0 0-1 1v3h18V8a1 1 0 0 0-1-1zM9 7a1 1 0 1 1 1-1v1zm5 0V6a1 1 0 1 1 1 1zM4 13v7a1 1 0 0 0 1 1h6v-8zm9 8h6a1 1 0 0 0 1-1v-7h-7z',
  cal: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14zM7 11h5v5H7z',
  leaf: 'M17 8C8 10 5.9 16.2 3.8 21.3l1.9.7.9-2.3c.5.2 1 .3 1.4.3C19 20 22 3 22 3c-1 2-8 2.3-13 3.3S2 11.5 2 13.5s1.8 3.8 1.8 3.8C7 8 17 8 17 8z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
};
const ic = (n, s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
// Logo proposé (aucun logo trouvé) : lotus stylisé + nom en serif italique
const MARK = (s = 42, c = '#B07A62') => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round"><path d="M24 10c4 5 4 13 0 20-4-7-4-15 0-20z"/><path d="M24 30c-3-6-9-10-15-10 0 7 6 12 15 10zM24 30c3-6 9-10 15-10 0 7-6 12-15 10z"/><path d="M10 34c8 3 20 3 28 0" stroke-linecap="round"/></g></svg>`;
const LOGO = `<span class="mk">${MARK()}</span><span class="t">Eva Spa<small>chez Clarisse</small></span>`;

const NAV = [['index.html', 'Accueil'], ['soins.html', 'Nos soins'], ['bon-cadeau.html', 'Bon cadeau'], ['institut.html', 'L\'institut'], ['contact.html', 'Contact']];
const HOURS = AG.hours.map(([d, h]) => `${d} · ${h}`);
const ALL = CATS.flatMap((c) => c.items.map(([t, d, m, p]) => ({ id: slug(c.id + '-' + t), cat: c.id, t, d, m, p })));

function page(file, { title, desc, active, body, hero = false }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'DaySpa', name: AG.name, telephone: '+241' + AG.tel.replace(/\D/g, '').replace(/^0/, ''), email: AG.mail, address: { '@type': 'PostalAddress', streetAddress: AG.addr, addressLocality: AG.city, addressCountry: 'GA' }, openingHours: 'Mo-Sa 09:00-19:00', sameAs: ['https://www.instagram.com/' + AG.ig + '/'], priceRange: '3 000 – 75 000 FCFA' };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${AG.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${AG.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${img(PH.pierres)}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Jost:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="eva.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body class="${hero ? 'ov' : ''}">
<header class="hd${hero ? ' clear' : ''}"><div class="wrap"><a class="logo" href="index.html" aria-label="Eva Spa chez Clarisse, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="rendez-vous.html">Réserver un soin</a></nav><a class="btn gold hcta" href="rendez-vous.html">Réserver</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo" href="index.html">${LOGO}</a><p>Soins du corps, coiffure africaine et européenne, onglerie. Votre moment, rien qu'à vous.</p><div class="soc" data-soc></div></div>
<div><h5>L'institut</h5><p>${AG.addr}<br>${AG.city} · ${AG.bp}</p></div>
<div><h5>Horaires</h5><p>${HOURS.join('<br>')}</p></div>
<div><h5>Contact</h5><p><a href="${telHref(AG.tel)}">${AG.tel}</a><br><a href="${telHref(AG.tel2)}">${AG.tel2}</a><br><a href="https://www.instagram.com/${AG.ig}/" target="_blank" rel="noopener">@${AG.ig}</a></p><p class="fl"><a href="galerie.html">Galerie</a> · <a href="bon-cadeau.html">Bon cadeau</a></p></div>
<div class="cp">© 2026 ${AG.name} · ${AG.city}, Gabon</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.AG=${JSON.stringify({ slug: AG.slug, wa: AG.wa, ig: AG.ig, soins: ALL, forfaits: FORFAITS.map(([t, d, m, p]) => ({ id: 'forfait-' + slug(t), cat: 'forfait', t: 'Forfait ' + t, d, m, p })) })}</script><script src="eva.js"></script>
<script src="../../assets/reco.js" data-slug="${AG.slug}" data-wa="${AG.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const menuList = (c) => `<ul class="menu">${c.items.map(([t, d, m, p]) => { const id = ALL.find((x) => x.t === t && x.cat === c.id).id; return `<li><div><h3>${t}</h3><p>${d} · ${dur(m)}</p></div><span class="dots"></span><b>${fcfa(p)}</b><a class="add" href="rendez-vous.html?soin=${id}" aria-label="Réserver : ${esc(t)}">Réserver</a></li>`; }).join('')}</ul>`;
const CTA = `<section class="cta" style="background-image:url(${img(PH.dos)})"><div class="wrap"><h2>Offrez-vous une pause</h2><p>Réservez en ligne, nous confirmons votre créneau sur WhatsApp.</p><div class="row"><a class="btn gold" href="rendez-vous.html">${ic('cal', 18)} Réserver un soin</a><a class="btn ghost" href="bon-cadeau.html">${ic('gift', 18)} Offrir un bon cadeau</a></div></div></section>`;
const PT = (crumb, h1, p, ph) => `<section class="pt" style="background-image:url(${img(ph)})"><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div></section>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'Spa, coiffure et onglerie à Libreville', active: 'index.html', hero: true,
  desc: 'Eva Spa chez Clarisse, montée de Louis à Libreville : massages, soins du visage, coiffure africaine et européenne, onglerie. Réservation en ligne.',
  body: `<section class="hero" style="background-image:url(${img(PH.pierres)})"><div class="wrap"><span class="kick">${ic('leaf', 16)} Institut de beauté · montée de Louis</span>
<h1>Votre moment,<br><em>rien qu'à vous.</em></h1><p>Massages, soins du visage, coiffure africaine et européenne, onglerie : tout pour prendre soin de vous, au même endroit.</p>
<div class="row"><a class="btn gold" href="rendez-vous.html">${ic('cal', 18)} Réserver un soin</a><a class="btn ghost" href="soins.html">Voir la carte des soins</a></div></div></section>
<section class="sec"><div class="wrap"><div class="center"><span class="tag">Nos univers</span><h2>Quatre façons de prendre soin de vous</h2></div>
<div class="univ">${CATS.map((c) => `<a href="soins.html#${c.id}"><img src="${img(c.ph)}" alt="" loading="lazy"><div><h3>${c.t}</h3><p>${c.d}</p><span>À partir de ${fcfa(Math.min(...c.items.map((i) => i[3])))}</span></div></a>`).join('')}</div></div></section>
<section class="split"><img src="${img(PH.serviette)}" alt="Cliente détendue après un soin" loading="lazy"><div class="tx"><span class="tag">L'esprit Eva Spa</span><h2>Une parenthèse de calme en plein Libreville</h2>
<p>Chez Clarisse, chaque soin commence par un temps d'écoute : vos envies, votre peau, vos cheveux. Puis on s'occupe de tout.</p>
<ul class="chk"><li>Produits adaptés aux peaux et cheveux africains</li><li>Cabines calmes, linge changé à chaque cliente</li><li>Une équipe qui prend le temps</li></ul><a class="btn line" href="institut.html">Découvrir l'institut</a></div></section>
<section class="sec soft"><div class="wrap"><div class="center"><span class="tag">Nos forfaits</span><h2>Les rituels préférés de nos clientes</h2></div>
<div class="forf">${FORFAITS.map(([t, d, m, p, ph]) => `<article><img src="${img(ph)}" alt="" loading="lazy"><div><h3>${t}</h3><p>${d}</p><div class="pp"><span>${dur(m)}</span><b>${fcfa(p)}</b></div><a class="btn line sm" href="rendez-vous.html?soin=forfait-${slug(t)}">Réserver</a></div></article>`).join('')}</div></div></section>
<section class="sec"><div class="wrap"><div class="center"><span class="tag">Elles en parlent</span><h2>Avis de nos clientes</h2></div>
<div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
<section class="gift"><div class="wrap"><div><span class="tag">Bon cadeau</span><h2>Offrez un moment Eva Spa</h2><p>Anniversaire, fête des mères, mariage : un bon cadeau personnalisé, prêt en quelques minutes.</p><a class="btn gold" href="bon-cadeau.html">${ic('gift', 18)} Créer un bon cadeau</a></div><div class="card-g"><span>Eva Spa</span><b>Bon cadeau</b><em>Pour Laetitia, avec tout mon amour</em><strong>50 000 FCFA</strong></div></div></section>
<section class="sec"><div class="wrap"><div class="center"><span class="tag">Instagram</span><h2>@${AG.ig}</h2></div>
<div class="insta">${[PH.tresses, PH.ongles, PH.masque, PH.dos, PH.cils, PH.tressesDos].map((p) => `<a href="../../social.html?slug=${AG.slug}&net=instagram"><img src="${img(p)}" alt="" loading="lazy"></a>`).join('')}</div></div></section>
${CTA}`,
}));

// ---------- Soins ----------
pages.push(page('soins.html', {
  title: 'Carte des soins et tarifs', active: 'soins.html',
  desc: 'Tous nos soins et tarifs : massages, hammam, soins du visage, cils, coiffure africaine et européenne, tresses, tissage, onglerie et forfaits.',
  body: `${PT('Nos soins', 'La carte des soins', 'Tous nos soins, leur durée et leur prix. Un clic sur « Réserver » et le soin est ajouté à votre rendez-vous.', PH.masque)}
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="tabs" role="tablist" data-tabs>${CATS.map((c, i) => `<button role="tab" aria-selected="${i === 0}" data-t="${c.id}"${i === 0 ? ' class="on"' : ''}>${c.t}</button>`).join('')}<button role="tab" aria-selected="false" data-t="forfaits">Forfaits</button></div>
${CATS.map((c, i) => `<div class="pane" id="${c.id}" data-pane="${c.id}"${i ? ' hidden' : ''}><div class="pimg"><img src="${img(c.ph)}" alt="" loading="lazy"><div><h2>${c.t}</h2><p>${c.d}</p></div></div>${menuList(c)}</div>`).join('')}
<div class="pane" id="forfaits" data-pane="forfaits" hidden><div class="forf">${FORFAITS.map(([t, d, m, p, ph]) => `<article><img src="${img(ph)}" alt="" loading="lazy"><div><h3>${t}</h3><p>${d}</p><div class="pp"><span>${dur(m)}</span><b>${fcfa(p)}</b></div><a class="btn line sm" href="rendez-vous.html?soin=forfait-${slug(t)}">Réserver</a></div></article>`).join('')}</div></div>
<p class="note">Prix indicatifs, à confirmer avec l'institut. Paiement en espèces ou Mobile Money.</p></div></section>
${CTA}`,
}));

// ---------- Rendez-vous ----------
pages.push(page('rendez-vous.html', {
  title: 'Réserver un soin', active: '',
  desc: 'Réservez votre soin en ligne chez Eva Spa : choisissez vos soins, le jour et l\'heure. Confirmation par WhatsApp.',
  body: `${PT('Réservation', 'Réserver un soin', 'Composez votre moment : un ou plusieurs soins, le jour et l\'heure. Nous confirmons sur WhatsApp.', PH.dos)}
<section class="rdv"><div class="wrap"><form data-steps novalidate>
<fieldset class="stp"><legend><b>1</b>Vos soins</legend><div class="tabs sm" data-rtabs>${CATS.map((c, i) => `<button type="button" data-t="${c.id}"${i === 0 ? ' class="on"' : ''}>${c.t}</button>`).join('')}<button type="button" data-t="forfait">Forfaits</button></div><div class="picks" data-picks></div></fieldset>
<fieldset class="stp"><legend><b>2</b>Le jour et l'heure</legend><div class="days" data-days></div><p class="lbl">Heure d'arrivée</p><div class="slots" data-slots></div></fieldset>
<fieldset class="stp"><legend><b>3</b>Vos coordonnées</legend><div class="g2"><label class="fld"><span>Prénom</span><input name="nom" required autocomplete="given-name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel" placeholder="0X XX XX XX"></label>
<label class="fld full"><span>Une envie, une précision ?</span><textarea name="msg" rows="2" placeholder="Couleur de vernis, longueur des tresses, peau sensible…"></textarea></label></div></fieldset></form>
<aside class="sum"><h2>Votre moment</h2><ul data-cart><li class="empty">Choisissez au moins un soin</li></ul>
<div class="ln"><span>Jour</span><b data-s="jour"></b></div><div class="ln"><span>Arrivée</span><b data-s="slot"></b></div><div class="ln"><span>Durée totale</span><b data-s="dur">—</b></div><div class="tot"><span>Total</span><b data-s="tot">0 FCFA</b></div>
<button class="btn gold" data-send>${ic('cal', 18)} Demander ce rendez-vous</button><p class="note">Paiement sur place · annulation gratuite jusqu'à la veille</p></aside></div></section>`,
}));

// ---------- Bon cadeau ----------
pages.push(page('bon-cadeau.html', {
  title: 'Offrir un bon cadeau', active: 'bon-cadeau.html',
  desc: 'Offrez un bon cadeau Eva Spa : montant ou soin au choix, message personnalisé. Valable 6 mois.',
  body: `${PT('Bon cadeau', 'Offrir un bon cadeau', 'Un montant ou un soin, un petit mot : nous préparons le bon et vous le remettons à l\'institut ou par WhatsApp.', PH.serviette)}
<section class="sec" style="padding-top:50px"><div class="wrap giftg"><form class="gform" data-gift novalidate>
<p class="lbl" style="margin-top:0">Montant ou soin</p><div class="amts">${[20000, 35000, 50000, 75000].map((a, i) => `<label><input type="radio" name="val" value="${fcfa(a)}"${i === 2 ? ' checked' : ''}><span>${fcfa(a)}</span></label>`).join('')}${FORFAITS.map(([t, , , p]) => `<label><input type="radio" name="val" value="Forfait ${t} (${fcfa(p)})"><span>Forfait ${t}</span></label>`).join('')}</div>
<div class="g2" style="margin-top:18px"><label class="fld"><span>Pour</span><input name="pour" required placeholder="Prénom de la personne"></label><label class="fld"><span>De la part de</span><input name="de" required placeholder="Votre prénom"></label>
<label class="fld full"><span>Votre message</span><textarea name="mot" rows="3" maxlength="120" placeholder="Joyeux anniversaire, profite bien !"></textarea></label><label class="fld"><span>Votre téléphone</span><input name="tel" type="tel" required></label>
<label class="fld"><span>Remise</span><select name="remise"><option>Par WhatsApp (bon numérique)</option><option>À l'institut (bon imprimé)</option></select></label></div>
<button class="btn gold" type="submit" style="margin-top:18px">${ic('gift', 18)} Commander ce bon</button><p class="note">Valable 6 mois · paiement à l'institut ou par Mobile Money</p></form>
<div class="prev"><div class="card-g big" data-card><span>Eva Spa · chez Clarisse</span><b>Bon cadeau</b><em data-c="mot">Joyeux anniversaire, profite bien !</em><strong data-c="val">50 000 FCFA</strong><small>Pour <i data-c="pour">…</i> · de la part de <i data-c="de">…</i></small></div></div></div></section>`,
}));

// ---------- L'institut ----------
pages.push(page('institut.html', {
  title: 'L\'institut et l\'équipe', active: 'institut.html',
  desc: 'Eva Spa chez Clarisse, institut de beauté à Libreville : l\'équipe, l\'esprit de la maison et nos engagements.',
  body: `${PT('L\'institut', 'L\'institut', 'Une maison de beauté tenue par Clarisse, à la montée de Louis.', PH.salon)}
<section class="split"><img src="${img(PH.glow)}" alt="" loading="lazy"><div class="tx"><span class="tag">Notre histoire</span><h2>Prendre soin, avec douceur</h2><p>Eva Spa est né d'une envie simple : offrir aux femmes de Libreville un lieu où se poser, le temps d'un massage, d'une coiffure ou d'une manucure.</p><p>Ici, les soins sont pensés pour les peaux et les cheveux africains, avec des produits choisis et une équipe formée.</p></div></section>
<section class="sec soft"><div class="wrap"><div class="center"><span class="tag">L'équipe</span><h2>Celles qui prennent soin de vous</h2></div>
<div class="team g4">${TEAM.map(([n, r]) => `<div><span class="av">${n[0]}</span><h3>${n}</h3><p>${r}</p></div>`).join('')}</div></div></section>
<section class="sec"><div class="wrap"><div class="center"><span class="tag">Nos engagements</span><h2>Hygiène et confort</h2></div><div class="eng">
<div>${ic('leaf', 26, '#7C8B74')}<h3>Produits choisis</h3><p>Karité, huiles végétales, soins adaptés aux peaux noires.</p></div><div>${ic('clock', 26, '#7C8B74')}<h3>À l'heure</h3><p>Votre créneau est réservé pour vous, sans attente.</p></div><div>${ic('gift', 26, '#7C8B74')}<h3>Petites attentions</h3><p>Thé, douceurs et musique douce pendant votre soin.</p></div></div></div></section>
${CTA}`,
}));

// ---------- Galerie ----------
const GAL = [[PH.pierres, 'Massage aux pierres chaudes'], [PH.tresses, 'Tresses sans nœuds'], [PH.ongles, 'Pose gel'], [PH.masque, 'Soin du visage'], [PH.tressage, 'Nattes collées'], [PH.cils, 'Regard sublimé'], [PH.dos, 'Massage relaxant'], [PH.onglesNoirs, 'Semi-permanent'], [PH.maquillage, 'Maquillage soirée'], [PH.tressesDos, 'Tresses et motifs'], [PH.creme, 'Soin anti-taches'], [PH.salon, 'L\'espace coiffure']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: '',
  desc: 'Galerie Eva Spa : massages, soins du visage, tresses, nattes et ongles réalisés à l\'institut.',
  body: `${PT('Galerie', 'Galerie', 'Un aperçu de nos soins, coiffures et ongles.', PH.tressage)}
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${img(p)}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par les réalisations de l'institut.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => img(p)))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Contact et accès', active: 'contact.html',
  desc: `Eva Spa chez Clarisse, ${AG.addr}, ${AG.city}. Tél. ${AG.tel} · ${AG.tel2}. ${HOURS.join(', ')}.`,
  body: `${PT('Contact', 'Nous trouver', `${AG.addr}, ${AG.city}.`, PH.salon)}
<section class="wrap ctg"><div><div class="info">
<div>${ic('pin', 22, '#B07A62')}<h2>Adresse</h2><p>${AG.addr}<br>${AG.city} · ${AG.bp}</p></div>
<div>${ic('phone', 22, '#B07A62')}<h2>Téléphone</h2><p><a href="${telHref(AG.tel)}">${AG.tel}</a><br><a href="${telHref(AG.tel2)}">${AG.tel2}</a></p></div>
<div>${ic('clock', 22, '#B07A62')}<h2>Horaires</h2><p>${HOURS.join('<br>')}</p></div>
<div>${ic('mail', 22, '#B07A62')}<h2>E-mail · Instagram</h2><p><a href="mailto:${AG.mail}">${AG.mail}</a><br><a href="https://www.instagram.com/${AG.ig}/" target="_blank" rel="noopener">@${AG.ig}</a></p></div></div>
<div class="map"><iframe title="Plan d'accès à Eva Spa, montée de Louis" src="${AG.map}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><span class="pin">Face à la pharmacie l'Orchidée</span></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Une question ?</h2><p>Pour réserver, passez par la <a href="rendez-vous.html">réservation en ligne</a>.</p>
<div class="g2"><label class="fld"><span>Prénom</span><input name="nom" required autocomplete="given-name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label>
<div class="row"><button class="btn gold" type="submit">Envoyer sur WhatsApp</button><a class="btn line" href="mailto:${AG.mail}">Par e-mail</a></div></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="24" fill="#F7EFE9"/>${MARK(48).replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</svg>`);
for (const f of ['eva.css', 'eva.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
