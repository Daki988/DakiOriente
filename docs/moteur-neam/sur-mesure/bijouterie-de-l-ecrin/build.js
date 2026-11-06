// Construit le site sur mesure de la Bijouterie de l'Écrin dans neam-moteur/sites/bijouterie-de-l-ecrin/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
// Mise en page reprise de Delicatess (classes CSS communes), couleurs et contenus propres.
const fs = require('fs');
const path = require('path');
const { AG, PH, PROD, RAYONS, ATELIER, AVIS } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', AG.slug);
const img = (f) => '../../assets/photos/' + f;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');

const ICON = {
  bag: 'M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z',
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  gem: 'M6 3h12l4 6-10 12L2 9zm1.2 2L4.6 9h4.2l1.6-4zm5.6 0 1.6 4h4.2l-2.6-4zM12 5.6 10.6 9h2.8zM5 11l5.4 6.5L8.6 11zm9 0-1.8 6.5L17.6 11z',
  hammer: 'M2 19.6 13.4 8.2l2.4 2.4L4.4 22zM14.8 6.8l1.4-1.4 4.2 4.2-1.4 1.4-1.4-1.4-1.4 1.4-2.8-2.8 1.4-1.4z',
  ring: 'M12 7a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM9 2h6l-1.5 3.5h-3z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
};
const ic = (n, s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
// Logo proposé (aucun logo trouvé) : écrin ouvert avec une bague, en or sur bordeaux
const MARK = (s = 40) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="8" fill="#3A0F1C"/><path d="M9 26h30v12a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3z" fill="#C9A227"/><path d="M11 24 14 12h20l3 12z" fill="none" stroke="#C9A227" stroke-width="2"/><circle cx="24" cy="25" r="5.5" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M22 18.5h4l-2 2.2z" fill="#fff"/></svg>`;
const LOGO = `<span class="mk">${MARK()}</span><span class="t">L'Écrin<small>Bijouterie · Glass, Libreville</small></span>`;

const NAV = [['index.html', 'Accueil'], ['collection.html', 'Collection'], ['atelier.html', 'L\'atelier'], ['taille.html', 'Ma taille de bague'], ['maison.html', 'La maison'], ['contact.html', 'Contact']];
const HOURS = AG.hours.map(([d, h]) => `${d} · ${h}`);
const DAYS = ['Dès que possible', 'Cette semaine en semaine', 'Samedi prochain', 'À convenir par téléphone'];

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'JewelryStore', name: AG.name, founder: AG.dir, telephone: ['+241' + AG.tel.replace(/\D/g, '').replace(/^0/, ''), '+241' + AG.tel2.replace(/\D/g, '').replace(/^0/, '')], email: AG.mail, address: { '@type': 'PostalAddress', streetAddress: AG.addr, postOfficeBoxNumber: '1425', addressLocality: AG.city, addressCountry: 'GA' }, openingHours: 'Mo-Sa 09:00-19:00' };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${AG.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${AG.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${img(PH.portrait)}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Raleway:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="ecrin.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<div class="bar"><span>${ic('gem', 15)} Or 18 carats · gravure des alliances offerte · réparations en 48 h</span></div>
<header class="hd"><div class="wrap"><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button><a class="logo" href="index.html" aria-label="Bijouterie de l'Écrin, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}</nav>
<button class="cartbtn" data-open-cart aria-label="Ouvrir ma sélection">${ic('bag', 20)}<span data-count>0</span></button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo" href="index.html">${LOGO}</a><p>Bijoux en or, alliances et créations sur mesure. Une maison familiale à Glass, tenue par ${AG.dir}.</p><div class="soc" data-soc></div></div>
<div><h5>La boutique</h5><p>${AG.addr}<br>${AG.city} · ${AG.bp}</p></div>
<div><h5>Horaires</h5><p>${HOURS.join('<br>')}</p></div>
<div><h5>Contact</h5><p><a href="${telHref(AG.tel)}">${AG.tel}</a><br><a href="${telHref(AG.tel2)}">${AG.tel2}</a><br><a href="mailto:${AG.mail}">${AG.mail}</a></p><p class="fl"><a href="galerie.html">Galerie</a> · <a href="taille.html">Guide des tailles</a></p></div>
<div class="cp">© 2026 ${AG.name} · ${AG.city}, Gabon</div></div></footer>
<aside class="drawer" data-drawer aria-label="Ma sélection" hidden><div class="dhd"><h2>Ma sélection</h2><button data-close-cart aria-label="Fermer">×</button></div><ul data-items></ul>
<div class="dft"><label class="fld"><span>Quand passer en boutique ?</span><select data-day>${DAYS.map((d) => `<option>${d}</option>`).join('')}</select></label>
<label class="fld" style="margin-top:10px"><span>Taille de bague (si connue)</span><input data-size placeholder="Ex. 54"></label><div class="tot"><span>Total</span><b data-total>0 FCFA</b></div>
<button class="btn gold" data-order>Réserver l'essai sur WhatsApp</button><p class="note">Essai en boutique sans engagement · prix final selon le poids d'or</p></div></aside><div class="veil" data-veil hidden></div>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.AG=${JSON.stringify({ slug: AG.slug, wa: AG.wa, prod: Object.fromEntries(PROD.map(([id, t, d, p, ph, r]) => [id, { t, d, p, ph: img(ph), r }])) })}</script><script src="ecrin.js"></script>
<script src="../../assets/reco.js" data-slug="${AG.slug}" data-wa="${AG.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const card = ([id, t, d, p, ph, r]) => `<article class="pc" data-r="${r}" data-price="${p}"><div class="im"><img src="${img(ph)}" alt="${esc(t)}" loading="lazy"></div><div class="bd"><small>${RAYONS[r]}</small><h3>${t}</h3><p>${d}</p><div class="pp"><b>dès ${fcfa(p)}</b><button class="add" data-add="${id}" aria-label="Ajouter ${esc(t)} à ma sélection">${ic('bag', 14)} Sélection</button></div></div></article>`;
const PT = (crumb, h1, p, ph) => `<section class="pt"><div class="wrap"><div><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div>${ph ? `<img src="${img(ph)}" alt="">` : ''}</div></section>`;
const SERV = `<section class="serv"><div class="wrap"><div>${ic('gem', 22)}<b>Or 18 carats</b><span>Poinçonné et garanti</span></div><div>${ic('hammer', 22)}<b>Atelier sur place</b><span>Réparation et mise à taille</span></div><div>${ic('ring', 22)}<b>Gravure offerte</b><span>Sur toutes les alliances</span></div><div>${ic('bag', 22)}<b>Essai en boutique</b><span>Réservé sur WhatsApp</span></div></div></section>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'Bijouterie à Glass, Libreville', active: 'index.html',
  desc: 'Bijouterie de l\'Écrin à Glass, Libreville : bijoux en or 18 carats, alliances, parures, créations sur mesure, réparations et gravure.',
  body: `<section class="hero"><div class="wrap"><div class="tx"><span class="kick">Glass · face à Western Union</span><h1>L'or qui vous ressemble,<br><em>façonné avec soin.</em></h1>
<p>Bagues, alliances, créoles et parures en or 18 carats, créations sur mesure et réparations dans notre atelier. Une maison familiale où l'on prend le temps de vous conseiller.</p>
<div class="row"><a class="btn gold" href="collection.html">Voir la collection</a><a class="btn line" href="atelier.html">L'atelier sur mesure</a></div></div>
<div class="ph"><img src="${img(PH.portrait)}" alt="Femme portant des bijoux en or"><img class="sm" src="${img(PH.alliances)}" alt="Alliances en or"></div></div></section>
${SERV}
<section class="sec"><div class="wrap"><div class="center"><span class="tag">La collection</span><h2>Choisissez votre bijou</h2></div>
<div class="rays">${Object.entries(RAYONS).map(([k, t]) => { const p = PROD.find((x) => x[5] === k); return `<a href="collection.html?r=${k}"><img src="${img(p[4])}" alt="" loading="lazy"><span>${t}</span></a>`; }).join('')}</div></div></section>
<section class="sec dark"><div class="wrap"><div class="hdx"><div><span class="tag">Coups de cœur</span><h2>Nos pièces phares</h2></div><a class="btn line light" href="collection.html">Toute la collection →</a></div>
<div class="grid">${PROD.filter((p) => ['alliances-jaune', 'creoles', 'jonc', 'collier-perles'].includes(p[0])).map(card).join('')}</div></div></section>
<section class="quizcta"><div class="wrap"><img src="${img(PH.bijoutier)}" alt="Bijoutier au travail" loading="lazy"><div><span class="tag">L'atelier</span><h2>Votre bijou, créé ou réparé sur place</h2><p>Création sur mesure, mise à taille, réparation, gravure, nettoyage : nos mains d'artisan s'occupent de vos bijoux, et de ceux qui ont une histoire.</p><a class="btn gold" href="atelier.html">Faire une demande</a></div></div></section>
<section class="sec"><div class="wrap"><div class="center"><span class="tag">Ils nous ont fait confiance</span><h2>Avis clients</h2></div>
<div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
<section class="sec soft"><div class="wrap"><div class="center"><span class="tag">Facebook</span><h2>Chez Gueye</h2></div>
<div class="insta">${[PH.portrait, PH.creoles, PH.bracelets, PH.alliances3, PH.collierP, PH.perlesP].map((p) => `<a href="../../social.html?slug=${AG.slug}&net=facebook"><img src="${img(p)}" alt="" loading="lazy"></a>`).join('')}</div></div></section>`,
}));

// ---------- Collection ----------
pages.push(page('collection.html', {
  title: 'La collection', active: 'collection.html',
  desc: 'Bagues, alliances, boucles d\'oreilles, colliers et bracelets en or 18 carats. Ajoutez vos coups de cœur et réservez un essai en boutique.',
  body: `${PT('Collection', 'La collection', 'Ajoutez vos coups de cœur à votre sélection, puis réservez un essai en boutique sur WhatsApp. Le prix final dépend du poids d\'or et des pierres.', null)}
<section class="sec" style="padding-top:40px"><div class="wrap"><div class="filters"><div class="tabs" role="tablist" data-tabs><button class="on" data-r="">Tout</button>${Object.entries(RAYONS).map(([k, t]) => `<button data-r="${k}">${t}</button>`).join('')}</div>
<div class="sel"><label><span class="sr">Trier</span><select data-sort><option value="">Nos coups de cœur</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option></select></label></div></div>
<div class="grid" data-list>${PROD.map(card).join('')}</div><p class="empty" hidden>Aucune pièce dans ce rayon.</p>
<p class="note">Prix indicatifs « à partir de », à confirmer en boutique. <a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener">Une question sur une pièce ? Écrivez-nous.</a></p></div></section>
${SERV}`,
}));

// ---------- Atelier ----------
pages.push(page('atelier.html', {
  title: 'L\'atelier', active: 'atelier.html',
  desc: 'Création de bijoux sur mesure, mise à taille, réparation, gravure et nettoyage à l\'atelier de la Bijouterie de l\'Écrin.',
  body: `${PT('L\'atelier', 'L\'atelier', 'Créer, réparer, ajuster, graver : nos artisans travaillent vos bijoux sur place.', PH.etabli)}
<section class="sec" style="padding-top:50px"><div class="wrap"><div class="atl">${ATELIER.map(([id, t, d, ph]) => `<a href="#demande" data-svc="${esc(t)}"><img src="${img(ph)}" alt="" loading="lazy"><div><h3>${t}</h3><p>${d}</p></div></a>`).join('')}</div></div></section>
<section class="sec soft" id="demande"><div class="wrap split"><img src="${img(PH.soudure)}" alt="Travail de l'or à l'atelier" loading="lazy"><form class="form" data-atelier novalidate><span class="tag">Demande à l'atelier</span><h2 class="h3" style="margin:10px 0">Décrivez votre projet</h2>
<p class="lbl" style="margin-top:0">Service</p><div class="opts2">${ATELIER.map(([id, t], k) => `<label><input type="radio" name="service" value="${t}"${k === 0 ? ' checked' : ''}><span>${t}</span></label>`).join('')}</div>
<label class="fld" style="margin-top:14px"><span>Le bijou</span><input name="bijou" required placeholder="Bague de fiançailles, chaîne en or…"></label>
<label class="fld"><span>Détails</span><textarea name="msg" rows="3" placeholder="Taille, gravure souhaitée, budget, photo à envoyer…"></textarea></label>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<div class="row"><button class="btn gold" type="submit">Envoyer ma demande</button></div><p class="note">Devis gratuit · vous pouvez joindre une photo dans la conversation WhatsApp</p></form></div></section>`,
}));

// ---------- Guide des tailles ----------
const SIZES = [[48, 15.3], [50, 15.9], [52, 16.6], [54, 17.2], [56, 17.8], [58, 18.5], [60, 19.1], [62, 19.7], [64, 20.4], [66, 21]];
pages.push(page('taille.html', {
  title: 'Trouver ma taille de bague', active: 'taille.html',
  desc: 'Guide des tailles de bague : mesurez votre tour de doigt ou le diamètre d\'une bague, et obtenez votre taille.',
  body: `${PT('Ma taille de bague', 'Trouver ma taille de bague', 'Avec un fil et une règle, ou une bague qui vous va : votre taille en 30 secondes.', null)}
<section class="sec" style="padding-top:50px"><div class="wrap sizer"><div class="box" data-sizer>
<div class="seg"><label><input type="radio" name="mesure" value="tour" checked><span>Tour de doigt</span></label><label><input type="radio" name="mesure" value="diam"><span>Diamètre d'une bague</span></label></div>
<label class="fld"><span>Mesure en millimètres</span><input data-tour type="number" inputmode="decimal" min="10" max="80" step="0.5" value="54"></label>
<ol class="steps-s"><li>Entourez la base du doigt avec un fil, sans serrer.</li><li>Marquez le point où le fil se rejoint.</li><li>Mesurez le fil à plat avec une règle, en millimètres.</li></ol></div>
<div class="res"><div class="ringv" data-ring><i></i></div><span>Votre taille</span><b data-taille>54</b><p class="note">En cas de doute, choisissez la taille au-dessus.</p><a class="btn gold" data-ask-size target="_blank" rel="noopener" href="#">Me faire conseiller</a></div></div>
<div class="wrap tscroll"><table class="ttab"><caption class="sr">Correspondance des tailles</caption><thead><tr><th>Taille</th>${SIZES.map(([t]) => `<th>${t}</th>`).join('')}</tr></thead><tbody><tr><th>Diamètre (mm)</th>${SIZES.map(([, d]) => `<td>${String(d).replace('.', ',')}</td>`).join('')}</tr></tbody></table></div></section>`,
}));

// ---------- La maison ----------
pages.push(page('maison.html', {
  title: 'La maison', active: 'maison.html',
  desc: `La Bijouterie de l'Écrin, maison familiale à Glass tenue par ${AG.dir} : savoir-faire, engagements et conseils.`,
  body: `${PT('La maison', 'La maison', 'Une bijouterie familiale au cœur de Glass.', PH.alliances3)}
<section class="sec"><div class="wrap split"><img src="${img(PH.collierP)}" alt="" loading="lazy"><div><span class="tag">Notre histoire</span><h2>Un savoir-faire de famille</h2><p>Chez Gueye, l'or se travaille de génération en génération. ${AG.dir} et les siens accueillent leurs clients à Glass, face à Western Union, pour leurs bijoux de tous les jours comme pour les plus grands moments.</p><p>Ici, on vous conseille avec honnêteté, on vous explique le prix, et on prend soin des bijoux qui ont une histoire.</p>
<ul class="chk"><li>Or 18 carats poinçonné</li><li>Prix transparents, au poids d'or</li><li>Atelier de réparation sur place</li><li>Gravure des alliances offerte</li></ul></div></div></section>
${SERV}`,
}));

// ---------- Galerie ----------
const GAL = [[PH.portrait, 'Or et élégance'], [PH.alliances, 'Alliances'], [PH.bijoutier, 'À l\'atelier'], [PH.creoles, 'Créoles en or'], [PH.bracelets, 'Joncs et bracelets'], [PH.perlesP, 'Perles'], [PH.solitaire, 'Bague solitaire'], [PH.collierP, 'Colliers']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: '',
  desc: 'La Bijouterie de l\'Écrin en images : bijoux en or, alliances, atelier.',
  body: `${PT('Galerie', 'Galerie', 'Nos bijoux et notre atelier en images.', null)}
<section class="sec" style="padding-top:40px"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${img(p)}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles de la boutique.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => img(p)))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Contact et accès', active: 'contact.html',
  desc: `Bijouterie de l'Écrin, ${AG.addr}, ${AG.city}. ${AG.bp}. Tél. ${AG.tel} · ${AG.tel2}.`,
  body: `${PT('Contact', 'Venir à la boutique', `${AG.addr}, ${AG.city}.`, null)}
<section class="wrap ctg"><div><div class="info">
<div>${ic('pin', 22, '#C9A227')}<h2>Adresse</h2><p>${AG.addr}<br>${AG.city} · ${AG.bp}</p></div>
<div>${ic('phone', 22, '#C9A227')}<h2>Téléphone · WhatsApp</h2><p><a href="${telHref(AG.tel)}">${AG.tel}</a><br><a href="${telHref(AG.tel2)}">${AG.tel2}</a></p></div>
<div>${ic('clock', 22, '#C9A227')}<h2>Horaires</h2><p>${HOURS.join('<br>')}</p></div>
<div>${ic('mail', 22, '#C9A227')}<h2>E-mail</h2><p><a href="mailto:${AG.mail}">${AG.mail}</a></p></div></div>
<div class="map"><iframe title="Plan d'accès à la Bijouterie de l'Écrin, Glass" src="https://www.google.com/maps?q=${AG.mapq}&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><span class="pin">Face à Western Union, Glass</span></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Une question ?</h2><p>Disponibilité d'une pièce, prix de l'or, rendez-vous : écrivez-nous.</p>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label>
<div class="row"><button class="btn gold" type="submit">Envoyer sur WhatsApp</button><a class="btn line" href="mailto:${AG.mail}">Par e-mail</a></div></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), MARK(48).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"').replace(' aria-hidden="true"', ''));
for (const f of ['ecrin.css', 'ecrin.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
