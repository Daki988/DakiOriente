// Construit le site sur mesure d'Asian Auto Gabon dans neam-moteur/sites/asian-auto-gabon/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { AG, MARQUES, PH, RAYONS, LUBES, AVIS } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', AG.slug);
const img = (f) => '../../assets/photos/' + f;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');
const q = (s) => encodeURIComponent(s);

const ICON = {
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9z',
  box: 'M21 7.5 12 2 3 7.5v9L12 22l9-5.5zM12 4.3l6.4 3.9L12 12 5.6 8.2zM5 10l6 3.6v6L5 16zm8 9.6v-6L19 10v6z',
  truck: 'M20 8h-3V4H3a2 2 0 0 0-2 2v11h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2v-5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm13.5-9 2 2.5H17V9.5zM18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',
  drop: 'M12 2s7 7.6 7 12.5A7 7 0 0 1 5 14.5C5 9.6 12 2 12 2z',
  car: 'M18.9 6c-.2-.6-.8-1-1.4-1h-11c-.7 0-1.2.4-1.4 1L3 12v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8zM6.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 11l1.5-4.5h11L19 11z',
  search: 'M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 14 15.5l.3.3v.8l5 5 1.5-1.5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z',
};
const ic = (n, s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
// Logo réel redessiné : carré noir, silhouette de voiture et roue, « ASIAN AutoMotors »
const MARK = (s = 44) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="7" fill="#111"/><path d="M5 16c10-6 26-7 38 5-9-4-21-6-30-2-3 1.2-5.6 1.2-8-3z" fill="#fff"/><path d="M14 22c8-3 18-2 27 4" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="28" cy="34" r="8" fill="#fff"/><circle cx="28" cy="34" r="5" fill="none" stroke="#111" stroke-width="1.6"/><path d="M28 29v10M23 34h10M24.5 30.5l7 7M31.5 30.5l-7 7" stroke="#111" stroke-width="1.1"/><rect x="26.5" y="17" width="3" height="12" rx="1.5" fill="#D62828"/></svg>`;
const LOGO = `<span class="mk">${MARK()}</span><span class="t">ASIAN <em>Auto</em><small>Pièces d'origine · Gabon</small></span>`;

const NAV = [['index.html', 'Accueil'], ['catalogue.html', 'Catalogue'], ['lubrifiants.html', 'Lubrifiants'], ['entreprise.html', 'L\'entreprise'], ['contact.html', 'Contact']];
const HOURS = AG.hours.map(([d, h]) => `${d} · ${h}`);

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'AutoPartsStore', name: AG.name, alternateName: 'Asian Auto Motors', url: 'https://' + AG.dom, telephone: ['+241' + AG.tel.replace(/\D/g, '').replace(/^0/, ''), '+241' + AG.tel2.replace(/\D/g, '').replace(/^0/, '')], email: AG.mail, address: { '@type': 'PostalAddress', streetAddress: AG.addr, postOfficeBoxNumber: '9222', addressLocality: AG.city, addressCountry: 'GA' }, openingHours: ['Mo-Fr 08:00-17:30', 'Sa 08:00-13:00'] };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${AG.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${AG.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${img(PH.freins)}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rajdhani:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="asian.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<div class="top"><div class="wrap"><span>${ic('shield', 14)} Pièces d'origine pour véhicules japonais et coréens</span><span><a href="${telHref(AG.tel)}">${AG.tel}</a> · <a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener">WhatsApp ${AG.tel2}</a></span></div></div>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="Asian Auto Gabon, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="devis.html">Demander une pièce</a></nav>
<a class="btn r hcta" href="devis.html">${ic('search', 18)} Demander une pièce</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo" href="index.html">${LOGO}</a><p>Distributeur de pièces détachées d'origine et de lubrifiants pour véhicules japonais et coréens, à Glass.</p><div class="soc" data-soc></div></div>
<div><h5>Magasin</h5><p>${AG.addr}<br>${AG.bp}</p><p><a href="galerie.html">Galerie photos</a> · <a href="devis.html">Demander une pièce</a></p></div>
<div><h5>Horaires</h5><p>${HOURS.join('<br>')}</p></div>
<div><h5>Contact</h5><p><a href="${telHref(AG.tel)}">${AG.tel}</a><br><a href="${telHref(AG.tel2)}">${AG.tel2}</a><br><a href="mailto:${AG.mail}">${AG.mail}</a></p></div>
<div class="cp">© 2026 ${AG.name} (Asian Auto Motors) · ${AG.city}, Gabon · Les marques citées appartiennent à leurs propriétaires.</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.AG=${JSON.stringify({ slug: AG.slug, wa: AG.wa, mail: AG.mail })}</script><script src="asian.js"></script>
<script src="../../assets/reco.js" data-slug="${AG.slug}" data-wa="${AG.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const PT = (crumb, h1, p) => `<section class="pt"><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div></section>`;
const MARQ = `<section class="marq"><div class="wrap"><span>Pièces pour</span>${MARQUES.map((m) => `<a href="devis.html?marque=${q(m)}">${m}</a>`).join('')}</div></section>`;
const CTA = `<section class="cta"><div class="wrap"><div><h2>Vous cherchez une pièce ?</h2><p>Envoyez le numéro de châssis (sur la carte grise) : on vous donne la bonne référence, le prix et le délai.</p></div><div class="row"><a class="btn r" href="devis.html">Demander une pièce</a><a class="btn ghost" href="${telHref(AG.tel)}">${ic('phone', 16)} ${AG.tel}</a></div></div></section>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'Pièces détachées d\'origine à Libreville', active: 'index.html',
  desc: 'Asian Auto Gabon, distributeur de pièces détachées d\'origine pour véhicules japonais et coréens, lubrifiants moteurs et industriels. Glass, Libreville.',
  body: `<section class="hero" style="background-image:url(${img(PH.freins2)})"><div class="wrap"><div class="tx"><span class="kick">Ex-NPS Gabon · avenue Georges Damas Aleka, Glass</span>
<h1>La bonne pièce,<br><span>du premier coup.</span></h1><p>Pièces détachées d'origine pour Toyota, Nissan, Mitsubishi, Hyundai, Kia et toutes les marques japonaises et coréennes. Donnez-nous le numéro de châssis, on s'occupe du reste.</p>
<div class="row"><a class="btn r" href="devis.html">${ic('search', 18)} Demander une pièce</a><a class="btn ghost" href="catalogue.html">Voir le catalogue</a></div></div>
<form class="quick" action="devis.html"><b>Recherche rapide</b><label class="fld"><span>Marque</span><select name="marque">${MARQUES.map((m) => `<option>${m}</option>`).join('')}<option>Autre</option></select></label><label class="fld"><span>Pièce recherchée</span><input name="piece" placeholder="Plaquettes avant, filtre à huile…"></label><label class="fld"><span>N° de châssis (facultatif)</span><input name="vin" maxlength="17" placeholder="17 caractères"></label><button class="btn r" type="submit">Obtenir un prix</button></form></div></section>
${MARQ}
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Catalogue</span><h2>Toutes les familles de pièces</h2></div><a class="btn line" href="catalogue.html">Tout le catalogue →</a></div>
<div class="grid g3">${RAYONS.map(([id, t, ph, li]) => `<a class="ray" href="catalogue.html#${id}"><img src="${img(ph)}" alt="" loading="lazy"><div><h3>${t}</h3><p>${li.slice(0, 3).join(' · ')}…</p></div></a>`).join('')}</div></div></section>
<section class="sec dark"><div class="wrap"><span class="tag r">Pourquoi Asian Auto</span><h2>L'origine, ça se voit sur la route</h2><div class="grid g4 why">
<div>${ic('shield', 28)}<h3>Pièces d'origine</h3><p>La qualité constructeur, garantie, pour durer.</p></div><div>${ic('search', 28)}<h3>Bonne référence</h3><p>Recherche par numéro de châssis : zéro erreur de pièce.</p></div><div>${ic('box', 28)}<h3>Stock à Glass</h3><p>Les pièces d'entretien courantes disponibles tout de suite.</p></div><div>${ic('truck', 28)}<h3>Sur commande</h3><p>Le reste commandé pour vous, avec un délai annoncé.</p></div></div></div></section>
<section class="sec"><div class="wrap split"><img src="${img(PH.vidange)}" alt="Vidange moteur" loading="lazy"><div><span class="tag">Lubrifiants</span><h2>Huiles moteurs et industrielles</h2><p class="lead">Huiles moteur essence et diesel, boîtes, ponts, fluides et huiles industrielles, du litre au fût de 208 litres.</p><a class="btn line" href="lubrifiants.html">Voir les lubrifiants →</a></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Ils nous font confiance</span><h2>Avis clients</h2><div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
${CTA}`,
}));

// ---------- Catalogue ----------
pages.push(page('catalogue.html', {
  title: 'Catalogue des pièces', active: 'catalogue.html',
  desc: 'Filtration, freinage, suspension, moteur, allumage, embrayage : les pièces d\'origine pour véhicules japonais et coréens chez Asian Auto Gabon.',
  body: `${PT('Catalogue', 'Catalogue des pièces', 'Choisissez une famille, puis la pièce : nous vous donnons le prix et la disponibilité pour votre véhicule.')}
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="tabs" role="tablist" data-tabs>${RAYONS.map(([id, t], i) => `<button role="tab" data-t="${id}"${i === 0 ? ' class="on" aria-selected="true"' : ' aria-selected="false"'}>${t}</button>`).join('')}</div>
${RAYONS.map(([id, t, ph, li], i) => `<div class="pane" id="${id}" data-pane="${id}"${i ? ' hidden' : ''}><img src="${img(ph)}" alt="" loading="lazy"><div><h2>${t}</h2><p class="lead">Pièces d'origine pour ${MARQUES.slice(0, 5).join(', ')} et les autres marques japonaises et coréennes.</p><ul class="parts">${li.map((p) => `<li><span>${p}</span><a href="devis.html?piece=${q(p)}">Demander le prix →</a></li>`).join('')}</ul></div></div>`).join('')}
<p class="note">Vous ne trouvez pas votre pièce ? <a href="devis.html">Décrivez-la</a> ou envoyez-nous une photo sur WhatsApp.</p></div></section>
${MARQ}${CTA}`,
}));

// ---------- Demande de pièce ----------
const YEARS = Array.from({ length: 27 }, (_, i) => 2026 - i);
pages.push(page('devis.html', {
  title: 'Demander une pièce', active: '',
  desc: 'Demandez une pièce détachée d\'origine : marque, modèle, année, numéro de châssis. Prix et délai par WhatsApp.',
  body: `${PT('Demander une pièce', 'Demander une pièce', 'Plus vous êtes précis, plus la réponse est rapide. Le numéro de châssis garantit la bonne référence.')}
<section class="dv"><div class="wrap"><form data-devis novalidate>
<fieldset class="stp"><legend><b>1</b>Votre véhicule</legend><p class="lbl" style="margin-top:0">Marque</p><div class="chips">${MARQUES.concat('Autre').map((m, i) => `<label><input type="radio" name="marque" value="${m}"${i === 0 ? ' checked' : ''}><span>${m}</span></label>`).join('')}</div>
<div class="g3f"><label class="fld"><span>Modèle</span><input name="modele" required placeholder="Hilux, Pajero, Tucson…"></label><label class="fld"><span>Année</span><select name="annee">${YEARS.map((y) => `<option>${y}</option>`).join('')}<option>Avant 2000</option></select></label><label class="fld"><span>Motorisation</span><select name="moteur"><option>Diesel</option><option>Essence</option><option>Je ne sais pas</option></select></label></div>
<label class="fld vin"><span>N° de châssis (VIN) <em data-vin-state></em></span><input name="vin" maxlength="17" placeholder="Ex. : JTEBU29J505012345" autocomplete="off"></label>
<details class="help"><summary>Où trouver le numéro de châssis ?</summary><p>Sur la carte grise (case « numéro d'identification »), en bas du pare-brise côté conducteur, ou sur le montant de la portière. Il compte 17 caractères, sans les lettres I, O et Q.</p></details></fieldset>
<fieldset class="stp"><legend><b>2</b>Les pièces</legend><div class="plist" data-plist></div><button type="button" class="btn line sm" data-addp>+ Ajouter une pièce</button>
<p class="note">Une photo de la pièce aide beaucoup : vous pourrez l'envoyer dans la conversation WhatsApp.</p></fieldset>
<fieldset class="stp"><legend><b>3</b>Vous</legend><div class="g2"><label class="fld"><span>Nom ou garage</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel" placeholder="0X XX XX XX"></label></div>
<p class="lbl">Réception</p><div class="chips"><label><input type="radio" name="rec" value="Retrait au magasin (Glass)" checked><span>Retrait au magasin</span></label><label><input type="radio" name="rec" value="Livraison à Libreville"><span>Livraison à Libreville</span></label><label><input type="radio" name="rec" value="Expédition en province"><span>Expédition en province</span></label></div></fieldset></form>
<aside class="sum"><h2>Votre demande</h2><div class="ln"><span>Véhicule</span><b data-s="veh"></b></div><div class="ln"><span>Châssis</span><b data-s="vin"></b></div><div class="ln"><span>Pièces</span><b data-s="nb"></b></div><div class="ln"><span>Réception</span><b data-s="rec"></b></div>
<button class="btn r" data-send>Envoyer sur WhatsApp</button><a class="btn line light" data-mail href="mailto:${AG.mail}">Envoyer par e-mail</a><p class="note">Réponse avec prix et délai aux heures d'ouverture.</p></aside></div></section>`,
}));

// ---------- Lubrifiants ----------
pages.push(page('lubrifiants.html', {
  title: 'Lubrifiants moteurs et industriels', active: 'lubrifiants.html',
  desc: 'Huiles moteur essence et diesel, huiles de boîte et de pont, fluides de boîte automatique, huiles industrielles : du litre au fût.',
  body: `${PT('Lubrifiants', 'Lubrifiants moteurs et industriels', 'Pour les particuliers, les garages et les entreprises : du bidon de 1 litre au fût de 208 litres.')}
<section class="sec" style="padding-top:50px"><div class="wrap"><div class="grid g3 lub">${LUBES.map(([t, u, c]) => `<div>${ic('drop', 26)}<h3>${t}</h3><p>${u}</p><span>${c}</span><a href="devis.html?piece=${q(t)}">Demander un tarif →</a></div>`).join('')}</div>
<div class="pro"><div><h3>Garages, flottes, chantiers</h3><p>Tarifs dégressifs au volume, livraison des fûts et facturation mensuelle pour les entreprises.</p></div><a class="btn r" href="contact.html">Ouvrir un compte pro</a></div></div></section>
${CTA}`,
}));

// ---------- L'entreprise ----------
pages.push(page('entreprise.html', {
  title: 'L\'entreprise', active: 'entreprise.html',
  desc: 'Asian Auto Gabon (ex-NPS Gabon), distributeur exclusif de pièces détachées d\'origine pour véhicules japonais et coréens à Libreville.',
  body: `${PT('L\'entreprise', 'L\'entreprise', 'Des pièces d\'origine pour les véhicules qui roulent le plus au Gabon.')}
<section class="sec"><div class="wrap split"><img src="${img(PH.outils)}" alt="" loading="lazy"><div><span class="tag">Notre histoire</span><h2>De NPS Gabon à Asian Auto</h2><p class="lead">Connue d'abord sous le nom de NPS Gabon, l'entreprise est devenue Asian Auto Motors en 2021. Une même mission : fournir des pièces détachées d'origine pour les véhicules japonais et coréens, si nombreux sur les routes du Gabon.</p>
<ul class="chk"><li>${ic('check', 18)} Vente de pièces détachées automobiles</li><li>${ic('check', 18)} Vente de lubrifiants moteurs et industriels</li><li>${ic('check', 18)} Vente de véhicules, sur commande</li></ul></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Pour les professionnels</span><h2>Garages, flottes et administrations</h2><div class="grid g3 why light">
<div>${ic('box', 28)}<h3>Compte pro</h3><p>Tarifs négociés et facturation mensuelle.</p></div><div>${ic('truck', 28)}<h3>Livraison</h3><p>Livraison sur Libreville et expédition en province.</p></div><div>${ic('car', 28)}<h3>Entretien de flotte</h3><p>Kits d'entretien préparés selon vos véhicules.</p></div></div></div></section>
${CTA}`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Contact et accès', active: 'contact.html',
  desc: `Asian Auto Gabon, ${AG.addr}, ${AG.city}. ${AG.bp}. Tél. ${AG.tel} · ${AG.tel2}. ${AG.mail}.`,
  body: `${PT('Contact', 'Venir au magasin', `${AG.addr}, ${AG.city}.`)}
<section class="wrap ctg"><div><div class="info">
<div>${ic('pin', 22)}<h2>Adresse</h2><p>${AG.addr}<br>${AG.bp}</p></div>
<div>${ic('phone', 22)}<h2>Téléphone</h2><p><a href="${telHref(AG.tel)}">${AG.tel}</a><br><a href="${telHref(AG.tel2)}">${AG.tel2}</a> (WhatsApp)</p></div>
<div>${ic('clock', 22)}<h2>Horaires</h2><p>${HOURS.join('<br>')}</p></div>
<div>${ic('mail', 22)}<h2>E-mail</h2><p><a href="mailto:${AG.mail}">${AG.mail}</a></p></div></div>
<div class="map"><iframe title="Plan d'accès à Asian Auto Gabon, Glass" src="https://www.google.com/maps?q=${AG.mapq}&z=16&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Une question ?</h2><p>Compte pro, commande spéciale, véhicule : écrivez-nous. Pour une pièce, utilisez <a href="devis.html">la demande de pièce</a>.</p>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label>
<div class="row"><button class="btn r" type="submit">Envoyer sur WhatsApp</button><a class="btn line" href="mailto:${AG.mail}">Par e-mail</a></div></form></section>`,
}));

// ---------- Galerie ----------
const GAL = [[PH.freins2, 'Freinage'], [PH.amortisseur, 'Suspension'], [PH.bougies2, 'Allumage'], [PH.moteur, 'Distribution'], [PH.vidange, 'Lubrifiants'], [PH.mains, 'Entretien'], [PH.outils, 'Le magasin'], [PH.pneus, 'Atelier partenaire']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: '',
  desc: 'Asian Auto Gabon en images : pièces d\'origine, lubrifiants et magasin.',
  body: `${PT('Galerie', 'Galerie', 'Nos familles de pièces et notre magasin en images.')}
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${img(p)}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles du magasin.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => img(p)))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), MARK(48).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"').replace(' aria-hidden="true"', ''));
for (const f of ['asian.css', 'asian.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
