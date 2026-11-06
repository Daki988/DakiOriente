// Construit le site sur mesure de 2S Confort Driving dans neam-moteur/sites/2s-confort-driving/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { AG, PH, FORMULES, STEPS, QUIZ, AVIS, TEAM, FAQ } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', AG.slug);
const img = (f) => '../../assets/photos/' + f;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');

const ICON = {
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  wheel: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 0 1 7.75 6H4.25A8 8 0 0 1 12 4zm-8 8.5 5 1.5 1 5.9A8 8 0 0 1 4 12.5zm10 7.4 1-5.9 5-1.5a8 8 0 0 1-6 7.4zM12 11a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
  card: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM8 7a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm5 10H3v-1c0-1.7 3.3-2.5 5-2.5s5 .8 5 2.5zm6-3h-4v-2h4zm0-4h-4V8h4z',
  road: 'M11 2h2v4h-2zm0 7h2v4h-2zm0 7h2v6h-2zM4 22 8 2h2L6 22zm14 0L14 2h2l4 20z',
};
const ic = (n, s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;

// Panneaux de signalisation dessinés en vectoriel (pour le mini-test du code)
const SIGN = {
  stop: '<polygon points="30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30" fill="#D4201F" stroke="#fff" stroke-width="4"/><text x="50" y="60" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="26" fill="#fff">STOP</text>',
  cedez: '<polygon points="50,94 4,10 96,10" fill="#fff" stroke="#D4201F" stroke-width="10" stroke-linejoin="round"/>',
  'sens-interdit': '<circle cx="50" cy="50" r="46" fill="#D4201F"/><rect x="18" y="42" width="64" height="16" rx="2" fill="#fff"/>',
  v50: '<circle cx="50" cy="50" r="44" fill="#fff" stroke="#D4201F" stroke-width="10"/><text x="50" y="63" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="36" fill="#111">50</text>',
  stationnement: '<circle cx="50" cy="50" r="44" fill="#1F4FA0" stroke="#D4201F" stroke-width="10"/><line x1="22" y1="22" x2="78" y2="78" stroke="#D4201F" stroke-width="10"/>',
  danger: '<polygon points="50,8 96,90 4,90" fill="#fff" stroke="#D4201F" stroke-width="9" stroke-linejoin="round"/><rect x="46" y="38" width="8" height="30" rx="3" fill="#111"/><circle cx="50" cy="77" r="5" fill="#111"/>',
  priorite: '<rect x="18" y="18" width="64" height="64" transform="rotate(45 50 50)" fill="#fff" stroke="#111" stroke-width="2"/><rect x="30" y="30" width="40" height="40" transform="rotate(45 50 50)" fill="#F7C600"/>',
  depassement: '<circle cx="50" cy="50" r="44" fill="#fff" stroke="#D4201F" stroke-width="10"/><rect x="24" y="40" width="22" height="26" rx="5" fill="#D4201F"/><rect x="54" y="40" width="22" height="26" rx="5" fill="#111"/>',
};
const sign = (k, s = 110) => `<svg class="sign" width="${s}" height="${s}" viewBox="0 0 100 100" role="img" aria-label="Panneau">${SIGN[k]}</svg>`;

// Logo proposé (aucun logo trouvé) : « 2S » sur un panneau carré jaune, comme un panneau de route
const MARK = (s = 46) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><rect x="2" y="2" width="44" height="44" rx="10" fill="#FFC20E"/><rect x="6" y="6" width="36" height="36" rx="7" fill="none" stroke="#0D1B3E" stroke-width="2.5"/><text x="24" y="32" text-anchor="middle" font-family="'Barlow Condensed',Arial Narrow,sans-serif" font-weight="800" font-size="21" fill="#0D1B3E">2S</text></svg>`;
const LOGO = `<span class="mk">${MARK()}</span><span class="t">Confort Driving<small>Auto-école · Nzeng-Ayong</small></span>`;

const NAV = [['index.html', 'Accueil'], ['formules.html', 'Formules'], ['code.html', 'Tester mon code'], ['ecole.html', 'L\'auto-école'], ['contact.html', 'Contact']];
const HOURS = AG.hours.map(([d, h]) => `${d} · ${h}`);

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'DrivingSchool', name: AG.name, telephone: ['+241' + AG.tel.replace(/\D/g, '').replace(/^0/, ''), '+241' + AG.tel2.replace(/\D/g, '').replace(/^0/, '')], email: AG.mail, address: { '@type': 'PostalAddress', streetAddress: AG.addr, postOfficeBoxNumber: '845', addressLocality: AG.city, addressCountry: 'GA' }, openingHours: ['Mo-Fr 07:30-18:30', 'Sa 08:00-16:00'], makesOffer: FORMULES.map(([, t, , p]) => ({ '@type': 'Offer', name: t, price: p, priceCurrency: 'XAF' })) };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${AG.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${AG.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${img(PH.conduite)}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="driving.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="2S Confort Driving, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="inscription.html">Je m'inscris</a></nav>
<a class="call" href="${telHref(AG.tel)}">${ic('phone', 16)} ${AG.tel}</a><a class="btn y hcta" href="inscription.html">Je m'inscris</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo" href="index.html">${LOGO}</a><p>Permis voiture et moto à Libreville : code, aire de conduite et circulation, avec des moniteurs patients.</p><div class="soc" data-soc></div></div>
<div><h5>L'auto-école</h5><p>${AG.addr}<br>${AG.city} · ${AG.bp}</p></div>
<div><h5>Horaires</h5><p>${HOURS.join('<br>')}</p></div>
<div><h5>Contact</h5><p><a href="${telHref(AG.tel)}">${AG.tel}</a><br><a href="${telHref(AG.tel2)}">${AG.tel2}</a><br><a href="mailto:${AG.mail}">${AG.mail}</a></p><p class="fl"><a href="galerie.html">Galerie</a> · <a href="code.html">Tester mon code</a></p></div>
<div class="cp">© 2026 ${AG.name} · ${AG.city}, Gabon</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.AG=${JSON.stringify({ slug: AG.slug, wa: AG.wa, formules: Object.fromEntries(FORMULES.map(([id, t, , p]) => [id, { t, p }])), quiz: QUIZ.map(([s, q, r, a, e]) => ({ s: sign(s, 150), q, r, a, e })) })}</script><script src="driving.js"></script>
<script src="../../assets/reco.js" data-slug="${AG.slug}" data-wa="${AG.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const card = ([id, t, sub, p, li, hot]) => `<article class="fo${hot ? ' hot' : ''}">${hot ? '<span class="badge">Le plus choisi</span>' : ''}<h3>${t}</h3><p class="sub">${sub}</p><div class="pr">${fcfa(p)}</div><ul>${li.map((x) => `<li>${ic('check', 16)} ${esc(x)}</li>`).join('')}</ul><a class="btn ${hot ? 'y' : 'line'}" href="inscription.html?formule=${id}">Choisir cette formule</a></article>`;
const PT = (crumb, h1, p) => `<section class="pt"><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div><div class="stripes" aria-hidden="true"></div></section>`;
const CTA = `<section class="cta"><div class="wrap"><div><h2>Prêt à prendre le volant ?</h2><p>Inscrivez-vous en ligne en 2 minutes, nous vous rappelons pour fixer vos premières leçons.</p></div><div class="row"><a class="btn y" href="inscription.html">Je m'inscris</a><a class="btn ghost" href="${telHref(AG.tel)}">${ic('phone', 16)} ${AG.tel}</a></div></div></section>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'Auto-école à Nzeng-Ayong, Libreville', active: 'index.html',
  desc: '2S Confort Driving, auto-école à Nzeng-Ayong : permis B voiture, permis A moto, code de la route et perfectionnement. Inscription en ligne.',
  body: `<section class="hero" style="background-image:url(${img(PH.conduite)})"><div class="wrap"><span class="kick">${ic('wheel', 16)} Auto-école · permis voiture et moto</span>
<h1>Votre permis,<br><span>en toute confiance.</span></h1><p>Code, aire de conduite et circulation dans Libreville, avec des moniteurs patients. On avance à votre rythme, jusqu'à la réussite.</p>
<div class="row"><a class="btn y" href="inscription.html">Je m'inscris</a><a class="btn ghost" href="code.html">Tester mon code gratuitement</a></div>
<ul class="ok"><li>${ic('check', 16)} Paiement en plusieurs fois</li><li>${ic('check', 16)} Aire de conduite privée</li><li>${ic('check', 16)} Voiture et moto</li></ul></div></section>
<section class="kpis"><div class="wrap"><div><b>B</b><span>Permis voiture</span></div><div><b>A</b><span>Permis moto</span></div><div><b>6 sem.</b><span>en formule accélérée</span></div><div><b>2 à 3×</b><span>paiement échelonné</span></div></div></section>
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Nos formules</span><h2>Choisissez votre formule</h2></div><a class="btn line" href="formules.html">Toutes les formules →</a></div>
<div class="grid g3">${FORMULES.filter((f) => ['code', 'permis-b', 'permis-a'].includes(f[0])).map(card).join('')}</div></div></section>
<section class="sec dark"><div class="wrap"><span class="tag y">Comment ça marche</span><h2>De l'inscription à l'examen</h2>
<ol class="steps">${STEPS.map(([t, d], i) => `<li><b>${i + 1}</b><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol></div></section>
<section class="sec"><div class="wrap quizcta"><div class="signs">${['stop', 'v50', 'cedez', 'priorite'].map((k) => sign(k, 96)).join('')}</div><div><span class="tag">Gratuit · 2 minutes</span><h2>Êtes-vous prêt pour le code ?</h2><p class="lead">8 panneaux, 8 questions : testez vos connaissances et découvrez votre score.</p><a class="btn y" href="code.html">Commencer le test</a></div></div></section>
<section class="split"><img src="${img(PH.conducteur)}" alt="Élève au volant" loading="lazy"><div class="tx"><span class="tag">Notre méthode</span><h2>On commence sur l'aire de conduite</h2><p>Avant d'affronter la circulation, vous apprenez les bases sur notre aire privée : démarrer, passer les vitesses, manœuvrer, se garer. Sans stress, sans klaxon.</p>
<ul class="chk"><li>${ic('check', 18)} Voitures à double commande</li><li>${ic('check', 18)} Moniteurs patients et pédagogues</li><li>${ic('check', 18)} Suivi de progression après chaque leçon</li></ul><a class="btn line" href="ecole.html">Découvrir l'auto-école</a></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Ils ont leur permis</span><h2>Avis de nos élèves</h2>
<div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
<section class="sec"><div class="wrap faq"><div><span class="tag">Questions fréquentes</span><h2>Bon à savoir</h2><p class="lead">D'autres questions ? Appelez le <a href="${telHref(AG.tel)}">${AG.tel}</a>.</p></div><div class="qs">${FAQ.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}<i aria-hidden="true"></i></summary><p>${a}</p></details>`).join('')}</div></div></section>
${CTA}`,
}));

// ---------- Formules ----------
pages.push(page('formules.html', {
  title: 'Formules et tarifs', active: 'formules.html',
  desc: 'Code de la route, permis B, permis B accéléré, permis A moto, perfectionnement et heures de conduite : formules et tarifs.',
  body: `${PT('Formules', 'Formules et tarifs', 'Des formules claires, tout compris, avec paiement possible en 2 ou 3 fois.')}
<section class="sec" style="padding-top:56px"><div class="wrap"><div class="grid g3">${FORMULES.map(card).join('')}</div>
<p class="note">Tarifs indicatifs, à confirmer avec l'auto-école. Frais d'examen selon la réglementation en vigueur.</p></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Inclus dans toutes nos formules</span><h2>Ce que vous avez en plus</h2><div class="grid g3 plus">
<div>${ic('road', 26)}<h3>L'aire de conduite</h3><p>Les premières leçons à l'abri de la circulation.</p></div><div>${ic('card', 26)}<h3>Le dossier</h3><p>Nous vous aidons à préparer et déposer votre dossier.</p></div><div>${ic('clock', 26)}<h3>Des horaires souples</h3><p>Leçons du lundi au samedi, tôt le matin ou en fin de journée.</p></div></div></div></section>
${CTA}`,
}));

// ---------- Test du code ----------
pages.push(page('code.html', {
  title: 'Tester mon code', active: 'code.html',
  desc: 'Mini-test gratuit du code de la route : 8 panneaux, 8 questions, votre score et les explications.',
  body: `${PT('Tester mon code', 'Tester mon code de la route', '8 panneaux, 8 questions. Répondez, et découvrez les explications.')}
<section class="sec" style="padding-top:50px"><div class="wrap quiz" data-quiz><div class="bar"><i data-prog></i></div><div class="qbox" data-q></div>
<div class="res" data-res hidden><div class="score" data-score></div><h2 data-res-t></h2><p class="lead" data-res-p></p><div class="row" style="justify-content:center"><button class="btn line" data-restart>Recommencer</button><a class="btn y" href="inscription.html?formule=code">M'inscrire au code</a></div></div></div></section>`,
}));

// ---------- Inscription ----------
pages.push(page('inscription.html', {
  title: 'Inscription en ligne', active: '',
  desc: 'Inscrivez-vous en ligne à 2S Confort Driving : formule, vos informations, vos disponibilités. Nous vous rappelons sous 24 h.',
  body: `${PT('Inscription', 'Inscription en ligne', 'Trois étapes, et nous vous rappelons pour finaliser votre dossier.')}
<section class="ins"><div class="wrap"><form data-steps novalidate>
<fieldset class="stp"><legend><b>1</b>Votre formule</legend><div class="opt">${FORMULES.map(([id, t, , p], k) => `<label><input type="radio" name="formule" value="${id}"${k === 1 ? ' checked' : ''}><span><b>${t}</b><small>${fcfa(p)}</small></span></label>`).join('')}</div></fieldset>
<fieldset class="stp"><legend><b>2</b>Vous</legend><div class="g2"><label class="fld"><span>Nom et prénom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel" placeholder="0X XX XX XX"></label>
<label class="fld"><span>Date de naissance</span><input name="naiss" type="date"></label><label class="fld"><span>Quartier</span><input name="quartier" placeholder="Nzeng-Ayong, PK 8…"></label></div>
<p class="lbl">Avez-vous déjà…</p><div class="chips"><label><input type="checkbox" name="deja" value="déjà conduit"><span>Déjà conduit</span></label><label><input type="checkbox" name="deja" value="déjà passé le code"><span>Déjà passé le code</span></label><label><input type="checkbox" name="deja" value="un permis étranger"><span>Un permis étranger</span></label></div></fieldset>
<fieldset class="stp"><legend><b>3</b>Vos disponibilités</legend><div class="chips">${['Tôt le matin', 'En journée', 'Fin de journée', 'Le samedi'].map((x) => `<label><input type="checkbox" name="dispo" value="${x}"><span>${x}</span></label>`).join('')}</div>
<p class="lbl">Paiement</p><div class="chips">${['En 1 fois', 'En 2 fois', 'En 3 fois'].map((x, i) => `<label><input type="radio" name="paie" value="${x}"${i === 0 ? ' checked' : ''}><span>${x}</span></label>`).join('')}</div></fieldset></form>
<aside class="sum"><h2>Votre inscription</h2><div class="ln"><span>Formule</span><b data-s="formule"></b></div><div class="ln"><span>Prix</span><b data-s="prix"></b></div><div class="ln"><span>Paiement</span><b data-s="paie"></b></div><div class="ln"><span>Par échéance</span><b data-s="ech"></b></div>
<div class="docs"><b>Documents à apporter</b><ul><li>Pièce d'identité</li><li>4 photos d'identité</li><li>Certificat médical</li></ul></div>
<button class="btn y" data-send>Envoyer mon inscription</button><p class="note">Nous vous rappelons sous 24 h pour fixer vos premières leçons.</p></aside></div></section>`,
}));

// ---------- L'auto-école ----------
pages.push(page('ecole.html', {
  title: 'L\'auto-école', active: 'ecole.html',
  desc: `2S Confort Driving, auto-école à Nzeng-Ayong dirigée par ${AG.dir} : notre méthode, nos moniteurs, notre aire de conduite.`,
  body: `${PT('L\'auto-école', 'L\'auto-école', 'Une auto-école de quartier à Nzeng-Ayong, pour apprendre à conduire sereinement.')}
<section class="split"><img src="${img(PH.conduite)}" alt="" loading="lazy"><div class="tx"><span class="tag">Notre méthode</span><h2>Le confort avant tout</h2><p>Chez 2S Confort Driving, chaque élève progresse à son rythme. On commence sur l'aire de conduite, puis on part en circulation quand vous êtes prêt.</p><p>Code et conduite, voiture et moto : tout se passe au même endroit, avec la même équipe.</p></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">L'équipe</span><h2>Vos moniteurs</h2><div class="grid g4 team">${TEAM.map(([n, r], i) => `<div${i === 0 ? ' class="dir"' : ''}><span class="av">${n.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span><h3>${n}</h3><p>${r}</p></div>`).join('')}</div></div></section>
<section class="sec"><div class="wrap"><span class="tag">Nos véhicules</span><h2>Équipés pour apprendre</h2><div class="grid g3 plus">
<div>${ic('wheel', 26)}<h3>Voitures à double commande</h3><p>Le moniteur peut freiner à tout moment : vous apprenez en sécurité.</p></div><div>${ic('road', 26)}<h3>Motos école</h3><p>Équipement prêté : casque, gants et gilet.</p></div><div>${ic('check', 26)}<h3>Entretien régulier</h3><p>Véhicules vérifiés avant chaque journée de leçons.</p></div></div></div></section>
${CTA}`,
}));

// ---------- Galerie ----------
const GAL = [[PH.conduite, 'Leçon de conduite'], [PH.conducteur, 'Au volant'], [PH.motos, 'Permis moto'], [PH.casque, 'Équipement moto'], [PH.citadine, 'Voiture école']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: '',
  desc: '2S Confort Driving en images : leçons de conduite, motos et véhicules école.',
  body: `${PT('Galerie', 'Galerie', 'Nos leçons, nos véhicules, nos élèves.')}
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${img(p)}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles de l'auto-école.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => img(p)))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Contact et accès', active: 'contact.html',
  desc: `2S Confort Driving, ${AG.addr}, ${AG.city}. ${AG.bp}. Tél. ${AG.tel} · ${AG.tel2}.`,
  body: `${PT('Contact', 'Nous trouver', `${AG.addr}, ${AG.city}.`)}
<section class="wrap ctg"><div><div class="info">
<div>${ic('pin', 22)}<h2>Adresse</h2><p>${AG.addr}<br>${AG.city} · ${AG.bp}</p></div>
<div>${ic('phone', 22)}<h2>Téléphone</h2><p><a href="${telHref(AG.tel)}">${AG.tel}</a><br><a href="${telHref(AG.tel2)}">${AG.tel2}</a></p></div>
<div>${ic('clock', 22)}<h2>Horaires</h2><p>${HOURS.join('<br>')}</p></div>
<div>${ic('mail', 22)}<h2>E-mail</h2><p><a href="mailto:${AG.mail}">${AG.mail}</a></p></div></div>
<div class="map"><iframe title="Plan d'accès à 2S Confort Driving, Nzeng-Ayong" src="https://www.google.com/maps?q=${AG.mapq}&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><span class="pin">À côté de Prix Import</span></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Une question ?</h2><p>Pour vous inscrire, passez par <a href="inscription.html">l'inscription en ligne</a>.</p>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label>
<div class="row"><button class="btn y" type="submit">Envoyer sur WhatsApp</button><a class="btn line" href="mailto:${AG.mail}">Par e-mail</a></div></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), MARK(48).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"').replace(' aria-hidden="true"', ''));
for (const f of ['driving.css', 'driving.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
