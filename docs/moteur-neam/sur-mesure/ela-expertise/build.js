// Construit le site sur mesure d'ELA Expertise dans neam-moteur/sites/ela-expertise/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { AG, PH, SERV, CAS, FAQ, BIENS, OBJETS, DOCS, ZONES, GAL } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', AG.slug);
const img = (f) => '../../assets/photos/' + f;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');

const ICON = {
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  badge: 'M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5zm-1.5 14.5-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z',
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  bank: 'M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z',
  scale: 'M12 3c-.6 0-1 .4-1 1v1H5L2 12c0 1.7 1.3 3 3 3s3-1.3 3-3L5.6 7H11v12H7v2h10v-2h-4V7h5.4L16 12c0 1.7 1.3 3 3 3s3-1.3 3-3l-3-7h-6V4c0-.6-.4-1-1-1zM5 9.2 6.4 12H3.6zm14 0 1.4 2.8h-2.8z',
  users: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  chart: 'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z',
  shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5z',
};
const ic = (n, s = 22, c = '#fff') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
// Logo d'origine redessiné (en ligne pour profiter de la police Roboto Condensed)
const LOGO = `<svg class="lg" viewBox="0 0 270 80" role="img" aria-label="ELA Expertise, Luc Arnold ELA, expert évaluateur près la Cour d'appel"><rect width="270" height="6" fill="#B8D9BA"/><path d="M15 41 41 15.5 67 41" fill="none" stroke="#B8D9BA" stroke-width="9"/><path d="M20 39V63H4.5V80M61.5 39V59.5H97" fill="none" stroke="#0075B5" stroke-width="9"/><g fill="#0075B5" font-family="'Roboto Condensed','Arial Narrow',Arial,sans-serif"><text x="96" y="35" font-size="27" font-weight="700" textLength="169" lengthAdjust="spacingAndGlyphs">ELA EXPERTISE</text><text x="107" y="61" font-size="17" textLength="136" lengthAdjust="spacingAndGlyphs">Luc Arnold ELA</text><text x="100" y="72" font-size="7.6" textLength="150" lengthAdjust="spacingAndGlyphs">Expert Évaluateur près la Cour d'Appel</text></g></svg>`;

const NAV = [['index.html', 'Accueil'], ['expertises.html', 'Expertises'], ['cabinet.html', 'Le cabinet'], ['galerie.html', 'Références'], ['contact.html', 'Contact']];

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'ProfessionalService', name: AG.name, slogan: AG.slogan, founder: AG.expert, telephone: ['+241' + AG.tel.replace(/\D/g, '').replace(/^0/, ''), '+241' + AG.tel2.replace(/\D/g, '').replace(/^0/, '')], email: AG.mail, address: { '@type': 'PostalAddress', streetAddress: AG.addr[0] + ', Montagne Sainte', postOfficeBoxNumber: '1265', addressLocality: 'Libreville', addressCountry: 'GA' }, geo: { '@type': 'GeoCoordinates', latitude: AG.geo[0], longitude: AG.geo[1] }, openingHours: 'Mo-Fr 08:00-17:30', areaServed: 'Gabon' };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${AG.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${AG.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${img(PH.villa)}">
<link rel="icon" href="logo-mark.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Condensed:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="ela.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<div class="top"><div class="wrap"><span>${AG.addr[0]}, Montagne Sainte · Libreville</span><span><a href="${telHref(AG.tel)}">${AG.tel}</a> · <a href="${telHref(AG.tel2)}">${AG.tel2}</a> · <a href="mailto:${AG.mail}">${AG.mail}</a></span></div></div>
<header class="hd"><div class="wrap"><a class="logo" href="index.html">${LOGO}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="demande.html">Demander une expertise</a></nav><a class="btn b hcall" href="demande.html">Demander une expertise</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22, '#0B2540')}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="flg" href="index.html">${LOGO}</a><p>${esc(AG.slogan)}.</p><div class="soc" data-soc></div></div>
<div><h5>Cabinet</h5><p>${AG.addr.join('<br>')}<br>${AG.bp}</p></div>
<div><h5>Contact</h5><p><a href="${telHref(AG.tel)}">${AG.tel}</a><br><a href="${telHref(AG.tel2)}">${AG.tel2}</a><br><a href="mailto:${AG.mail}">${AG.mail}</a></p></div>
<div><h5>Horaires</h5><p>${AG.hours.join('<br>')}</p><p class="fl"><a href="expertises.html">Expertises</a> · <a href="demande.html">Demande</a> · <a href="galerie.html">Références</a></p></div>
<div class="cp">© 2026 ${AG.name} · ${esc(AG.expert)}, ${esc(AG.titre.toLowerCase())} · Libreville, Gabon</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.AG=${JSON.stringify({ slug: AG.slug, wa: AG.wa, mail: AG.mail })}</script><script src="ela.js"></script>
<script src="../../assets/reco.js" data-slug="${AG.slug}" data-wa="${AG.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

// ---------- blocs ----------
const REP = (cls = '') => `<div class="rep ${cls}" aria-label="Exemple de rapport"><small>Extrait de rapport</small><h4>Villa R+1 · Libreville</h4>
<div class="ln"><span>Terrain</span><b>850 m² · titre foncier</b></div><div class="ln"><span>Surface bâtie</span><b>320 m²</b></div><div class="ln"><span>Méthodes</span><b>Comparaison · coût</b></div>
<div class="v"><span>Valeur vénale retenue</span><b>285 000 000 FCFA</b></div><div class="sg"><span>✓ Rapport signé</span><span class="fict">Exemple fictif</span></div></div>`;
const STEPS = [['Demande et devis', '48 h', 'Vous décrivez le bien et l\'objectif ; nous envoyons un devis et la liste des documents.'], ['Visite et relevés', '', 'Inspection sur place, métrés, photos, contrôle des titres et de l\'urbanisme.'], ['Analyse', '', 'Comparaison avec les ventes récentes, capitalisation du revenu, coût de remplacement.'], ['Rapport signé', '10 jours', 'Rapport détaillé, signé, remis en version papier et PDF, avec un rendez-vous de restitution.']];
const CTA = `<section class="wrap"><div class="cta"><div><h2>Besoin d'une évaluation fiable ?</h2><p>Devis gratuit sous 48 h · intervention à Libreville et dans tout le Gabon.</p></div><div class="r"><a class="btn w" href="demande.html">Demander une expertise</a><a class="btn ol" href="${telHref(AG.tel)}">${ic('phone', 16)} ${AG.tel}</a></div></div></section>`;
const PT = (crumb, h1, p, tag = '') => `<section class="pt"><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div>${tag ? `<span class="tag">${tag}</span>` : ''}<h1>${h1}</h1><p>${p}</p></div></section>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'Expertise immobilière à Libreville', active: 'index.html',
  desc: 'Cabinet d\'expertise immobilière et foncière à Libreville. Luc Arnold ELA, expert évaluateur près la Cour d\'appel. Devis gratuit sous 48 h.',
  body: `<section class="hero"><div class="tx"><span class="tag">Cabinet d'expertise immobilière · Libreville</span>
<h1>La juste valeur de votre bien, <span>établie par un expert indépendant.</span></h1>
<p>Expertise immobilière et foncière, évaluation d'entreprise et des immobilisations, conseil et gestion de patrimoine. Des rapports argumentés, reconnus par les banques, les notaires et les tribunaux.</p>
<div class="row"><a class="btn b" href="demande.html">Demander une expertise</a><a class="btn o" href="expertises.html">Nos expertises</a></div>
<div class="badge"><span class="s">${ic('badge', 26, '#3F8A55')}</span><div><b>${AG.expert}, ${AG.titre.toLowerCase()}</b><span>Indépendance, confidentialité et rigueur de méthode.</span></div></div></div>
<div class="ph" style="background-image:url(${img(PH.villa)})">${REP()}</div></section>
<section class="cli"><div class="wrap"><span>Ils nous confient leurs évaluations :</span>${['Banques', 'Notaires', 'Tribunaux', 'Entreprises', 'Particuliers'].map((x) => `<b><i></i>${x}</b>`).join('')}</div></section>
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Nos expertises</span><h2>Sept domaines d'intervention</h2><p class="lead">De la villa familiale au patrimoine d'une entreprise : une évaluation indépendante, documentée et opposable.</p></div><a class="btn o" href="expertises.html">Toutes les expertises →</a></div>
<div class="srv">${SERV.map((s, i) => i === 0 ? `<a class="big" href="expertises.html#${s.id}"><div class="t"><div class="n">01</div><h3>${s.t}</h3><p>${esc(s.d)}</p><span class="more">Découvrir →</span></div><div class="im" style="background-image:url(${img(s.ph)})"></div></a>` : `<a href="expertises.html#${s.id}"><div class="n">0${i + 1}</div><h3>${s.t.replace(' et assistance à maîtrise d\'ouvrage', ' et AMO')}</h3><p>${esc(s.short)}</p><span class="more">Découvrir →</span></a>`).join('')}</div></div></section>
<section class="sec" style="padding-top:0"><div class="wrap"><span class="tag">Dans quels cas ?</span><h2>Une expertise, à quel moment ?</h2>
<div class="cas">${CAS.map(([i, t, d]) => `<div><span class="ic">${ic(i, 22, '#0075B5')}</span><div><h3>${t}</h3><p>${d}</p></div></div>`).join('')}</div></div></section>
<section class="met"><div class="ph" style="background-image:url(${img(PH.geo)})"></div><div class="tx"><span class="tag">Notre méthode</span><h2>De la demande au rapport signé</h2>
${STEPS.map(([t, e, p], i) => `<div class="st"><b>${i + 1}</b><div><h3>${t}${e ? ` <em>${e}</em>` : ''}</h3><p>${p}</p></div></div>`).join('')}</div></section>
<section class="sec"><div class="wrap rapp"><div><span class="tag">Le rapport d'expertise</span><h2>Un document clair, reconnu et opposable</h2><p class="lead">Chaque conclusion est justifiée : vous savez d'où vient la valeur, et vos interlocuteurs aussi.</p>
<ul class="chk"><li>Description du bien, photos et plan de situation</li><li>Situation juridique : titre foncier, servitudes, urbanisme</li><li>Analyse du marché local et références de ventes</li><li>Valeur vénale, valeur locative et valeur à assurer</li><li>Signature de l'${AG.titre.toLowerCase()}</li></ul>
<div class="nums"><div><b>48 h</b><span>pour le devis</span></div><div><b>3</b><span>méthodes croisées</span></div><div><b>10 j</b><span>pour le rapport</span></div></div></div>
<div class="doc"><div class="hdr">${LOGO}<span>Rapport n° 2026-041<br>Libreville</span></div><h3>Rapport d'expertise immobilière</h3><div class="row2"><div style="background-image:url(${img(PH.villa2)})"></div><div style="background-image:url(${img(PH.plans)})"></div></div>
<div class="ln"><span>Nature du bien</span><b>Villa R+1, 5 pièces</b></div><div class="ln"><span>Situation</span><b>Libreville</b></div><div class="ln"><span>Objet</span><b>Garantie bancaire</b></div>
<div class="tot"><span>Valeur vénale</span><b>285 000 000 FCFA</b></div><p class="fict">Exemple fictif, pour illustration</p></div></div></section>
<section class="sec" style="padding-top:0"><div class="wrap faq"><div><span class="tag">Questions fréquentes</span><h2>Avant de nous contacter</h2><p class="lead">Une autre question ? Appelez le <a href="${telHref(AG.tel)}">${AG.tel}</a>.</p></div>
<div class="qs">${FAQ.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}<i aria-hidden="true"></i></summary><p>${a}</p></details>`).join('')}</div></div></section>
${CTA}`,
}));

// ---------- Expertises ----------
pages.push(page('expertises.html', {
  title: 'Nos expertises', active: 'expertises.html',
  desc: 'Expertise immobilière et foncière, des immobilisations, évaluation d\'entreprise, évaluation des risques, conseil et AMO, gestion de patrimoine, risk management.',
  body: `${PT('Expertises', 'Nos expertises', 'Sept prestations, une même exigence : une valeur indépendante, justifiée et défendable devant vos interlocuteurs.', 'Nos domaines')}
<section class="sec" style="padding-top:60px"><div class="wrap"><nav class="jump" aria-label="Aller à une expertise">${SERV.map((s, i) => `<a href="#${s.id}">0${i + 1} · ${s.t.replace(' et assistance à maîtrise d\'ouvrage', ' et AMO')}</a>`).join('')}</nav>
<div class="exp g3">${SERV.map((s, i) => `<article id="${s.id}"><div class="im" style="background-image:url(${img(s.ph)})"></div><div class="bd"><span class="tag">0${i + 1}</span><h2>${s.t}</h2><p>${esc(s.d)}</p><ul>${s.li.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><div class="ft2"><span>${s.delai}</span><a href="demande.html?type=${s.id}">Demander →</a></div></div></article>`).join('')}</div></div></section>
<section class="sec" style="padding-top:0"><div class="wrap"><span class="tag">Dans quels cas ?</span><h2>Votre situation</h2><div class="cas">${CAS.map(([i, t, d]) => `<div><span class="ic">${ic(i, 22, '#0075B5')}</span><div><h3>${t}</h3><p>${d}</p></div></div>`).join('')}</div></div></section>
${CTA}`,
}));

// ---------- Demande ----------
pages.push(page('demande.html', {
  title: 'Demander une expertise', active: '',
  desc: 'Demandez votre expertise en ligne : type de bien, lieu, objet et documents disponibles. Devis gratuit sous 48 h.',
  body: `${PT('Demande d\'expertise', 'Demander une expertise', 'Trois étapes, deux minutes. Devis gratuit sous 48 h, en toute confidentialité.')}
<section class="dm"><div class="wrap"><form data-req novalidate>
<fieldset class="stp"><legend><b>1</b>Que souhaitez-vous faire évaluer ?</legend><div class="opt">${BIENS.map(([v, t, s], k) => `<label><input type="radio" name="bien" value="${t}"${k === 0 ? ' checked' : ''} data-k="${v}"><span>${t}<small>${s}</small></span></label>`).join('')}</div></fieldset>
<fieldset class="stp"><legend><b>2</b>Le bien et l'objectif</legend><div class="g2"><label class="fld"><span>Ville, quartier</span><input name="lieu" required placeholder="Libreville, Batterie IV"></label><label class="fld"><span>Surface approximative</span><input name="surface" placeholder="320 m² bâtis · 850 m² de terrain"></label></div>
<p class="lbl">Objet de l'expertise</p><div class="chips">${OBJETS.map((o, k) => `<label><input type="radio" name="objet" value="${o}"${k === 0 ? ' checked' : ''}><span>${o}</span></label>`).join('')}</div>
<p class="lbl">Documents disponibles</p><div class="chips">${DOCS.map((o) => `<label><input type="checkbox" name="docs" value="${o}"><span>${o}</span></label>`).join('')}</div></fieldset>
<fieldset class="stp"><legend><b>3</b>Vos coordonnées</legend><div class="g2"><label class="fld"><span>Nom ou société</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel" placeholder="0X XX XX XX"></label>
<label class="fld"><span>Échéance souhaitée</span><select name="delai"><option>Dès que possible</option><option selected>Sous 3 semaines</option><option>Sous 2 mois</option><option>Pas d'urgence</option></select></label><label class="fld"><span>E-mail</span><input name="mail" type="email" autocomplete="email"></label>
<label class="fld full"><span>Précisions</span><textarea name="msg" rows="3" placeholder="Nombre de bâtiments, bien loué, date de l'audience…"></textarea></label></div></fieldset></form>
<aside class="sum"><div class="hd2"><h2>Votre demande</h2><span>Mise à jour en direct</span></div><div class="bd">
<div class="ln"><span>Bien</span><b data-s="bien">Villa ou maison</b></div><div class="ln"><span>Lieu</span><b data-s="lieu">À préciser</b></div><div class="ln"><span>Objet</span><b data-s="objet">Garantie bancaire</b></div><div class="ln"><span>Documents</span><b data-s="docs">Aucun pour l'instant</b></div><div class="ln"><span>Échéance</span><b data-s="delai">Sous 3 semaines</b></div>
<button class="btn b" data-send="mail">Envoyer ma demande par e-mail</button><button class="btn wa" data-send="wa" data-wa-ic>Envoyer sur WhatsApp</button><p class="note">Réponse et devis gratuit sous 48 h · confidentialité garantie</p></div></aside></div></section>`,
}));

// ---------- Cabinet ----------
pages.push(page('cabinet.html', {
  title: 'Le cabinet', active: 'cabinet.html',
  desc: 'ELA Expertise, dirigé par Luc Arnold ELA, expert évaluateur près la Cour d\'appel : méthodes d\'évaluation, déontologie et zones d\'intervention.',
  body: `<section class="sec"><div class="wrap cab"><div class="ph" style="background-image:url(${img(PH.expert)})"><span><b>${AG.expert}</b>${AG.titre}</span></div>
<div><span class="tag">Le cabinet</span><h1 class="h2">${esc(AG.slogan)}</h1>
<p>ELA Expertise accompagne particuliers, entreprises, établissements financiers et juridictions dans l'évaluation de leurs biens immobiliers et de leurs actifs.</p>
<p>Le cabinet est dirigé par ${AG.expert}, ${AG.titre.toLowerCase()}. Chaque mission est conduite en toute indépendance, dans le respect du secret professionnel.</p>
<div class="mth"><div><h3>Comparaison</h3><p>Ventes récentes de biens similaires dans le même secteur.</p></div><div><h3>Revenu</h3><p>Capitalisation des loyers pour les biens de rapport.</p></div><div><h3>Coût</h3><p>Coût de remplacement, vétusté déduite, plus valeur du terrain.</p></div></div>
<h2 class="h3">Zones d'intervention</h2><div class="zones">${ZONES.map((z) => `<span>${z}</span>`).join('')}</div></div></div></section>
<section class="sec" style="padding-top:0"><div class="wrap"><span class="tag">Déontologie</span><h2>Nos engagements</h2><div class="cas">
<div><span class="ic">${ic('scale', 22, '#0075B5')}</span><div><h3>Indépendance</h3><p>Aucun intérêt dans la vente ou l'achat du bien évalué.</p></div></div>
<div><span class="ic">${ic('shield', 22, '#0075B5')}</span><div><h3>Confidentialité</h3><p>Vos documents et nos conclusions restent strictement confidentiels.</p></div></div>
<div><span class="ic">${ic('chart', 22, '#0075B5')}</span><div><h3>Transparence</h3><p>Méthodes, références et calculs exposés dans chaque rapport.</p></div></div></div></div></section>
${CTA}`,
}));

// ---------- Références (galerie) ----------
pages.push(page('galerie.html', {
  title: 'Références', active: 'galerie.html',
  desc: 'Villas, immeubles, terrains, bureaux et immobilier d\'entreprise : les biens que nous évaluons à Libreville et au Gabon.',
  body: `${PT('Références', 'Les biens que nous évaluons', 'Du terrain nu à l\'immeuble de rapport, chaque type de bien a sa méthode.', 'Références')}
<section class="sec" style="padding-top:56px"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${img(p)}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div>
<p class="note" style="text-align:left">Photos d'illustration. Les rapports réalisés pour nos clients restent confidentiels.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => img(p)))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Contact', active: 'contact.html',
  desc: `ELA Expertise, ${AG.addr.join(', ')}. ${AG.bp}. Tél. ${AG.tel} · ${AG.tel2}. ${AG.mail}.`,
  body: `${PT('Contact', 'Contact', 'Le cabinet vous reçoit sur rendez-vous à Montagne Sainte.')}
<section class="wrap ctg"><div><div class="info">
<div><span class="ic">${ic('pin', 18)}</span><h2>Adresse</h2><p>${AG.addr.join('<br>')}</p></div>
<div><span class="ic">${ic('phone', 18)}</span><h2>Téléphone</h2><p><a href="${telHref(AG.tel)}">${AG.tel}</a><br><a href="${telHref(AG.tel2)}">${AG.tel2}</a></p></div>
<div><span class="ic">${ic('mail', 18)}</span><h2>E-mail · courrier</h2><p><a href="mailto:${AG.mail}">${AG.mail}</a><br>${AG.bp}</p></div>
<div><span class="ic">${ic('clock', 18)}</span><h2>Horaires</h2><p>${AG.hours.join('<br>')}</p></div></div>
<div class="map"><iframe title="Plan d'accès au cabinet ELA Expertise" src="https://www.google.com/maps?q=${AG.geo.join(',')}&z=16&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><a class="go" href="https://www.google.com/maps/dir//${AG.geo.join(',')}" target="_blank" rel="noopener">${ic('pin', 16)} Itinéraire</a></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Écrire au cabinet</h2><p>Réponse sous 24 h ouvrées.</p>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Objet</span><select name="objet"><option>Demande de devis</option><option>Suivi d'un dossier en cours</option><option>Expertise judiciaire</option><option>Partenariat (banque, notaire, entreprise)</option><option>Autre demande</option></select></label>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label>
<div class="row"><button class="btn b" type="submit">Envoyer</button><a class="btn wa" href="https://wa.me/${AG.wa}" target="_blank" rel="noopener" data-wa-ic>WhatsApp</a></div></form></section>`,
}));

// Logos : complet (en-tête) et symbole (icône, fiche Google)
fs.writeFileSync(path.join(OUT, 'logo.svg'), LOGO.replace('<svg class="lg"', '<svg xmlns="http://www.w3.org/2000/svg"'));
fs.writeFileSync(path.join(OUT, 'logo-mark.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff"/><path d="M22 47 50 19 78 47" fill="none" stroke="#B8D9BA" stroke-width="11"/><path d="M28 44V70H12V88M72 44V66H92" fill="none" stroke="#0075B5" stroke-width="11"/></svg>');
for (const f of ['ela.css', 'ela.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
