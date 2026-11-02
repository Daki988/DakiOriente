// Construit le site sur mesure de Delicatess dans neam-moteur/sites/delicatess/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { AG, PH, FAM, PROD, RAYONS, AVIS } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', AG.slug);
const img = (f) => '../../assets/photos/' + f;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
const telHref = 'tel:+241' + AG.tel.replace(/\D/g, '').replace(/^0/, '');

const ICON = {
  bag: 'M18 6h-2a4 4 0 0 0-8 0H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-6-2a2 2 0 0 1 2 2h-4a2 2 0 0 1 2-2zm6 16H6V8h2v2h2V8h4v2h2V8h2z',
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  truck: 'M20 8h-3V4H3a2 2 0 0 0-2 2v11h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2v-5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm13.5-9 2 2.5H17V9.5zM18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',
  gift: 'M20 7h-2.2A3 3 0 0 0 12 4a3 3 0 0 0-5.8 3H4a1 1 0 0 0-1 1v3h18V8a1 1 0 0 0-1-1zM9 7a1 1 0 1 1 1-1v1zm5 0V6a1 1 0 1 1 1 1zM4 13v7a1 1 0 0 0 1 1h6v-8zm9 8h6a1 1 0 0 0 1-1v-7h-7z',
  spark: 'M12 2l2.4 6.9L21 9.5l-5.2 4.3L17.5 21 12 17.1 6.5 21l1.7-7.2L3 9.5l6.6-.6z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
};
const ic = (n, s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
// Logo proposé (aucun logo trouvé) : monogramme D dans un flacon, nom en serif
const MARK = (s = 40) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><rect x="16" y="4" width="16" height="7" rx="2" fill="#C5A46D"/><rect x="6" y="12" width="36" height="33" rx="9" fill="none" stroke="#C5A46D" stroke-width="2.4"/><text x="24" y="37" text-anchor="middle" font-family="'Bodoni Moda',Didot,Georgia,serif" font-size="22" font-style="italic" fill="#C5A46D">D</text></svg>`;
const LOGO = `<span class="mk">${MARK()}</span><span class="t">Delicatess<small>Parfumerie &amp; cosmétiques de luxe</small></span>`;

const NAV = [['index.html', 'Accueil'], ['boutique.html', 'Boutique'], ['conseil.html', 'Trouver mon parfum'], ['maison.html', 'La maison'], ['contact.html', 'Contact']];
const HOURS = AG.hours.map(([d, h]) => `${d} · ${h}`);

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'Store', name: AG.name, description: 'Parfumerie et cosmétiques de luxe', telephone: '+241' + AG.tel.replace(/\D/g, '').replace(/^0/, ''), email: AG.mail, address: { '@type': 'PostalAddress', streetAddress: AG.addr, addressLocality: AG.city, addressCountry: 'GA' }, openingHours: ['Mo-Sa 10:00-20:00', 'Su 11:00-17:00'], sameAs: ['https://www.instagram.com/' + AG.ig + '/'] };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${AG.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${AG.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${img(PH.oud)}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,500;0,600;1,500&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="delicatess.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<div class="bar"><span>${ic('truck', 15)} Livraison à Akanda et Libreville le jour même · emballage cadeau offert</span></div>
<header class="hd"><div class="wrap"><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button><a class="logo" href="index.html" aria-label="Delicatess, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}</nav>
<button class="cartbtn" data-open-cart aria-label="Ouvrir le panier">${ic('bag', 22)}<span data-count>0</span></button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo" href="index.html">${LOGO}</a><p>Parfums d'exception, oud et cosmétiques de luxe, choisis pour vous à Akanda.</p><div class="soc" data-soc></div></div>
<div><h5>La boutique</h5><p>${AG.addr}<br>${AG.city} · ${AG.bp}</p></div>
<div><h5>Horaires</h5><p>${HOURS.join('<br>')}</p></div>
<div><h5>Contact</h5><p><a href="${telHref}">${AG.tel}</a><br><a href="mailto:${AG.mail}">${AG.mail}</a><br><a href="https://www.instagram.com/${AG.ig}/" target="_blank" rel="noopener">@${AG.ig}</a></p><p class="fl"><a href="galerie.html">Galerie</a> · <a href="conseil.html">Trouver mon parfum</a></p></div>
<div class="cp">© 2026 ${AG.name} · ${AG.city}, Gabon</div></div></footer>
<aside class="drawer" data-drawer aria-label="Panier" hidden><div class="dhd"><h2>Votre panier</h2><button data-close-cart aria-label="Fermer le panier">×</button></div><ul data-items></ul>
<div class="dft"><label class="fld"><span>Réception</span><select data-mode><option value="0">Retrait en boutique à Akanda</option><option value="${AG.livraison}">Livraison Akanda / Libreville (+ ${fcfa(AG.livraison)})</option></select></label>
<label class="chk"><input type="checkbox" data-wrap checked> Emballage cadeau (offert)</label><div class="tot"><span>Total</span><b data-total>0 FCFA</b></div>
<button class="btn gold" data-order>Commander sur WhatsApp</button><p class="note">Paiement à la livraison, en boutique ou par Mobile Money</p></div></aside><div class="veil" data-veil hidden></div>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.AG=${JSON.stringify({ slug: AG.slug, wa: AG.wa, ig: AG.ig, prod: Object.fromEntries(PROD.map(([id, t, d, p, ph, r, pour, fam]) => [id, { t, d, p, ph: img(ph), r, pour, fam }])) })}</script><script src="delicatess.js"></script>
<script src="../../assets/reco.js" data-slug="${AG.slug}" data-wa="${AG.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const card = ([id, t, d, p, ph, r, pour, fam]) => `<article class="pc" data-r="${r}" data-pour="${pour}" data-fam="${fam || ''}" data-price="${p}"><div class="im"><img src="${img(ph)}" alt="" loading="lazy">${fam ? `<span class="fam">${FAM[fam]}</span>` : ''}</div><div class="bd"><small>${RAYONS[r]}${pour !== 'mixte' ? ' · ' + pour : ''}</small><h3>${t}</h3><p>${d}</p><div class="pp"><b>${fcfa(p)}</b><button class="add" data-add="${id}" aria-label="Ajouter ${esc(t)} au panier">${ic('bag', 16)} Ajouter</button></div></div></article>`;
const PT = (crumb, h1, p, ph) => `<section class="pt"><div class="wrap"><div><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div>${ph ? `<img src="${img(ph)}" alt="">` : ''}</div></section>`;
const SERV = `<section class="serv"><div class="wrap"><div>${ic('spark', 22)}<b>Conseil personnalisé</b><span>On vous fait sentir avant d'acheter</span></div><div>${ic('gift', 22)}<b>Emballage offert</b><span>Prêt à offrir, sans supplément</span></div><div>${ic('truck', 22)}<b>Livraison le jour même</b><span>Akanda et Libreville</span></div><div>${ic('bag', 22)}<b>Commande WhatsApp</b><span>Simple et rapide</span></div></div></section>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'Parfumerie et cosmétiques de luxe à Akanda', active: 'index.html',
  desc: 'Delicatess, parfumerie et cosmétiques de luxe à Akanda : parfums, oud, soins et maquillage. Conseil personnalisé, livraison le jour même.',
  body: `<section class="hero"><div class="wrap"><div class="tx"><span class="kick">Akanda · galerie Bouye Denise</span><h1>L'art du parfum,<br><em>à votre image.</em></h1>
<p>Parfums d'exception, ouds précieux et cosmétiques de luxe, choisis un à un. Laissez-nous vous guider vers la fragrance qui vous ressemble.</p>
<div class="row"><a class="btn gold" href="boutique.html">Découvrir la boutique</a><a class="btn line" href="conseil.html">Trouver mon parfum</a></div></div>
<div class="ph"><img src="${img(PH.oud)}" alt="Flacon d'huile d'oud doré"><img class="sm" src="${img(PH.femme)}" alt="Cliente avec un flacon de parfum"></div></div></section>
${SERV}
<section class="sec"><div class="wrap"><div class="center"><span class="tag">Nos univers</span><h2>Choisissez votre rayon</h2></div>
<div class="rays">${Object.entries(RAYONS).map(([k, t]) => { const p = PROD.find((x) => x[5] === k); return `<a href="boutique.html?r=${k}"><img src="${img(p[4])}" alt="" loading="lazy"><span>${t}</span></a>`; }).join('')}</div></div></section>
<section class="sec dark"><div class="wrap"><div class="hdx"><div><span class="tag">Sélection</span><h2>Les incontournables</h2></div><a class="btn line light" href="boutique.html">Toute la boutique →</a></div>
<div class="grid">${PROD.filter((p) => ['rose-oud', 'bois-santal', 'oud-royal', 'fleur-blanche'].includes(p[0])).map(card).join('')}</div></div></section>
<section class="quizcta"><div class="wrap"><img src="${img(PH.femme)}" alt="" loading="lazy"><div><span class="tag">Le conseil Delicatess</span><h2>Trois questions pour trouver votre parfum</h2><p>Pour vous ou pour offrir : répondez à trois questions, nous vous proposons les fragrances faites pour vous.</p><a class="btn gold" href="conseil.html">Commencer</a></div></div></section>
<section class="sec"><div class="wrap"><div class="center"><span class="tag">Ils nous ont choisis</span><h2>Avis clients</h2></div>
<div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
<section class="sec soft"><div class="wrap"><div class="center"><span class="tag">Instagram</span><h2>@${AG.ig}</h2></div>
<div class="insta">${[PH.oud, PH.femme, PH.rouge, PH.soins, PH.coffret, PH.vitrine].map((p) => `<a href="../../social.html?slug=${AG.slug}&net=instagram"><img src="${img(p)}" alt="" loading="lazy"></a>`).join('')}</div></div></section>`,
}));

// ---------- Boutique ----------
pages.push(page('boutique.html', {
  title: 'Boutique en ligne', active: 'boutique.html',
  desc: 'Parfums femme et homme, ouds et musc, soins, maquillage et coffrets. Ajoutez au panier et commandez sur WhatsApp.',
  body: `${PT('Boutique', 'La boutique', 'Ajoutez vos produits au panier, puis commandez en un message sur WhatsApp. Retrait à Akanda ou livraison le jour même.', null)}
<section class="sec" style="padding-top:40px"><div class="wrap"><div class="filters"><div class="tabs" role="tablist" data-tabs><button class="on" data-r="">Tout</button>${Object.entries(RAYONS).map(([k, t]) => `<button data-r="${k}">${t}</button>`).join('')}</div>
<div class="sel"><label><span class="sr">Pour</span><select data-pour><option value="">Pour tous</option><option value="femme">Femme</option><option value="homme">Homme</option><option value="mixte">Mixte</option></select></label><label><span class="sr">Trier</span><select data-sort><option value="">Nos coups de cœur</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option></select></label></div></div>
<div class="grid" data-list>${PROD.map(card).join('')}</div><p class="empty" hidden>Aucun produit pour ce choix.</p>
<p class="note">Vous cherchez une marque ou une référence précise ? <a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener">Demandez-nous sur WhatsApp</a>, nous vérifions la disponibilité.</p></div></section>
${SERV}`,
}));

// ---------- Conseil (quiz) ----------
pages.push(page('conseil.html', {
  title: 'Trouver mon parfum', active: 'conseil.html',
  desc: 'Trois questions pour trouver le parfum qui vous ressemble : pour qui, à quel moment, quelle ambiance.',
  body: `${PT('Trouver mon parfum', 'Trouver mon parfum', 'Trois questions, et nous vous proposons les fragrances faites pour vous.', PH.vitrine)}
<section class="sec" style="padding-top:50px"><div class="wrap quiz" data-quiz>
<div class="q" data-q="pour"><span class="n">1 / 3</span><h2>C'est pour qui ?</h2><div class="opts"><button data-v="femme">Pour une femme</button><button data-v="homme">Pour un homme</button><button data-v="mixte">Peu importe</button></div></div>
<div class="q" data-q="moment" hidden><span class="n">2 / 3</span><h2>Pour quel moment ?</h2><div class="opts"><button data-v="jour">Tous les jours</button><button data-v="soir">Le soir, les sorties</button><button data-v="occasion">Les grandes occasions</button></div></div>
<div class="q" data-q="fam" hidden><span class="n">3 / 3</span><h2>Quelle ambiance vous attire ?</h2><div class="opts">${Object.entries(FAM).map(([k, t]) => `<button data-v="${k}">${t}</button>`).join('')}</div></div>
<div class="res" data-res hidden><span class="tag">Notre sélection pour vous</span><h2 data-res-t>Vos parfums</h2><div class="grid" data-res-list></div><div class="row" style="justify-content:center;margin-top:24px"><button class="btn line" data-restart>Recommencer</button><a class="btn gold" data-ask href="#">Demander conseil sur WhatsApp</a></div></div>
</div></section>`,
}));

// ---------- La maison ----------
pages.push(page('maison.html', {
  title: 'La maison', active: 'maison.html',
  desc: 'Delicatess, parfumerie et cosmétiques de luxe à Akanda : notre histoire, notre sélection et nos services.',
  body: `${PT('La maison', 'La maison Delicatess', 'Une boutique de parfums et de cosmétiques de luxe, au cœur d\'Akanda.', PH.noir)}
<section class="sec"><div class="wrap split"><img src="${img(PH.femme)}" alt="" loading="lazy"><div><span class="tag">Notre histoire</span><h2>Le luxe, sans quitter Akanda</h2><p>Delicatess est née d'une passion : faire découvrir les plus belles fragrances et les cosmétiques d'exception, sans avoir à les commander à l'étranger.</p><p>Chaque produit est choisi pour sa qualité et son authenticité. Et parce qu'un parfum se choisit sur la peau, nous prenons toujours le temps de vous le faire essayer.</p>
<ul class="chk"><li>Produits authentiques, conservés à l'abri de la chaleur</li><li>Essais sur touche et sur peau</li><li>Emballage cadeau offert</li><li>Livraison le jour même à Akanda et Libreville</li></ul></div></div></section>
${SERV}`,
}));

// ---------- Galerie ----------
const GAL = [[PH.oud, 'Huile d\'oud'], [PH.femme, 'Essai en boutique'], [PH.rouge, 'Eau de parfum'], [PH.vitrine, 'La vitrine'], [PH.soins, 'Soins visage'], [PH.makeup, 'Maquillage'], [PH.coffret, 'Coffret cadeau'], [PH.noir, 'Parfums homme']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: '',
  desc: 'La boutique Delicatess en images : parfums, ouds, soins et coffrets.',
  body: `${PT('Galerie', 'Galerie', 'La boutique et nos produits en images.', null)}
<section class="sec" style="padding-top:40px"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${img(p)}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles de la boutique.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => img(p)))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Contact et accès', active: 'contact.html',
  desc: `Delicatess, ${AG.addr}, ${AG.city}. ${AG.bp}. Tél. ${AG.tel}. ${HOURS.join(', ')}.`,
  body: `${PT('Contact', 'Venir à la boutique', `${AG.addr}, ${AG.city}.`, null)}
<section class="wrap ctg"><div><div class="info">
<div>${ic('pin', 22, '#C5A46D')}<h2>Adresse</h2><p>${AG.addr}<br>${AG.city} · ${AG.bp}</p></div>
<div>${ic('phone', 22, '#C5A46D')}<h2>Téléphone · WhatsApp</h2><p><a href="${telHref}">${AG.tel}</a></p></div>
<div>${ic('clock', 22, '#C5A46D')}<h2>Horaires</h2><p>${HOURS.join('<br>')}</p></div>
<div>${ic('mail', 22, '#C5A46D')}<h2>E-mail · Instagram</h2><p><a href="mailto:${AG.mail}">${AG.mail}</a><br><a href="https://www.instagram.com/${AG.ig}/" target="_blank" rel="noopener">@${AG.ig}</a></p></div></div>
<div class="map"><iframe title="Plan d'accès à Delicatess, Akanda" src="${AG.map}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><span class="pin">Galerie de la résidence Bouye Denise</span></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Une question ?</h2><p>Disponibilité d'un parfum, conseil, commande spéciale : écrivez-nous.</p>
<div class="g2"><label class="fld"><span>Prénom</span><input name="nom" required autocomplete="given-name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required placeholder="Bonjour, avez-vous…"></textarea></label>
<div class="row"><button class="btn gold" type="submit">Envoyer sur WhatsApp</button><a class="btn line" href="mailto:${AG.mail}">Par e-mail</a></div></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#111"/>${MARK(48).replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</svg>`);
for (const f of ['delicatess.css', 'delicatess.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
