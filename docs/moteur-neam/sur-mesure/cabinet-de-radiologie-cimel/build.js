// Construit le site sur mesure du cabinet de radiologie CIMEL dans neam-moteur/sites/cabinet-de-radiologie-cimel/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { AG, PH, EXAMS, STEPS, AVIS, TEAM, FAQ } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', AG.slug);
const img = (f) => '../../assets/photos/' + f;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = 'tel:+241' + AG.tel.replace(/\D/g, '').replace(/^0/, '');

const ICON = {
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  cal: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14zM7 11h5v5H7z',
  bone: 'M7.5 3A2.5 2.5 0 0 0 5 5.5c0 .3.05.6.15.85A2.5 2.5 0 0 0 3 8.5 2.5 2.5 0 0 0 7.2 10.3l6.5 6.5A2.5 2.5 0 0 0 15.5 21a2.5 2.5 0 0 0 2.35-1.65c.25.1.55.15.85.15a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 0-1.8.75L10.3 8.2A2.5 2.5 0 0 0 7.5 3z',
  wave: 'M2 12h3l2-6 3 12 3-9 2 5 2-2h5v2h-4l-3 3-2-4-3 9-3-12-1.4 4H2z',
  baby: 'M12 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4zm-6 20v-2c0-3.3 2.7-6 6-6s6 2.7 6 6v2zm3.5-14.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm5 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  pulse: 'M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z',
  ribbon: 'M12 2c2.2 0 4 1.8 4 4 0 1.6-.7 3.2-1.7 4.8L19 18l-2.5 1.5-4.5-6.2-4.5 6.2L5 18l4.7-7.2C8.7 9.2 8 7.6 8 6c0-2.2 1.8-4 4-4zm0 2c-1.1 0-2 .9-2 2 0 1 .6 2.3 2 4.2 1.4-1.9 2-3.2 2-4.2 0-1.1-.9-2-2-2z',
  drop: 'M12 2s7 7.6 7 12.5A7 7 0 0 1 5 14.5C5 9.6 12 2 12 2z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm2 16H8v-2h8zm0-4H8v-2h8zm-3-5V3.5L18.5 9z',
};
const ic = (n, s = 22, c = '#fff') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
// Logo proposé (aucun logo trouvé) : anneaux d'imagerie + croix médicale
const MARK = (s = 44) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="13" fill="#0B4F6C"/><circle cx="24" cy="24" r="15" fill="none" stroke="#5CE1E6" stroke-width="2.5" opacity=".45"/><circle cx="24" cy="24" r="10" fill="none" stroke="#5CE1E6" stroke-width="2.5" opacity=".75"/><path d="M21.5 15.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z" fill="#fff"/></svg>`;
const LOGO = `<span class="mk">${MARK()}</span><span class="t">CIMEL<small>Cabinet de radiologie</small></span>`;

const NAV = [['index.html', 'Accueil'], ['examens.html', 'Examens'], ['preparation.html', 'Préparer mon examen'], ['equipe.html', 'Le cabinet'], ['contact.html', 'Contact']];
const HOURS = AG.hours.map(([d, h]) => `${d} · ${h}`);

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'MedicalClinic', medicalSpecialty: 'Radiography', name: AG.name, telephone: '+241' + AG.tel.replace(/\D/g, '').replace(/^0/, ''), email: AG.mail, address: { '@type': 'PostalAddress', streetAddress: AG.addr[0], addressLocality: 'Libreville', addressCountry: 'GA' }, geo: { '@type': 'GeoCoordinates', latitude: AG.geo[0], longitude: AG.geo[1] }, openingHours: ['Mo-Fr 07:30-18:00', 'Sa 08:00-13:00'], availableService: EXAMS.map((e) => ({ '@type': 'MedicalTest', name: e.t })) };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${AG.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${AG.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${img(PH.salle)}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="cimel.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="CIMEL, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="rendez-vous.html">Prendre rendez-vous</a></nav>
<div class="act"><a class="call" href="${telHref}">${ic('phone', 16, '#0B4F6C')} ${AG.tel}</a><a class="btn p hcta" href="rendez-vous.html">${ic('cal', 18)} Rendez-vous</a></div><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22, '#0B2A3C')}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo light" href="index.html">${LOGO}</a><p>Radiographie, échographie, doppler et mammographie à Libreville, sous la responsabilité du ${AG.doc}.</p><div class="soc" data-soc></div></div>
<div><h5>Adresse</h5><p>${AG.addr.join('<br>')}<br><small>${AG.repere}</small></p></div>
<div><h5>Horaires</h5><p>${HOURS.join('<br>')}</p></div>
<div><h5>Contact</h5><p><a href="${telHref}">${AG.tel}</a><br><a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener">WhatsApp</a><br><a href="mailto:${AG.mail}">${AG.mail}</a></p><p class="fl"><a href="examens.html">Examens</a> · <a href="galerie.html">Le cabinet en images</a></p></div>
<div class="cp">© 2026 ${AG.name} · Libreville, Gabon · En cas d'urgence vitale, appelez les secours.</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.AG=${JSON.stringify({ slug: AG.slug, wa: AG.wa, exams: Object.fromEntries(EXAMS.map((e) => [e.id, { t: e.t, prep: e.prep, dur: e.dur, cr: e.cr, ph: img(e.ph) }])) })}</script><script src="cimel.js"></script>
<script src="../../assets/reco.js" data-slug="${AG.slug}" data-wa="${AG.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

// ---------- blocs ----------
const examCard = (e) => `<a class="ex" href="examens.html#${e.id}"><div class="im"><img src="${img(e.ph)}" alt="" loading="lazy"><span class="ico">${ic(e.ico, 22)}</span></div><div class="bd"><span class="cat">${e.cat}</span><h3>${e.t}</h3><p>${esc(e.d)}</p><div class="meta"><span>${ic('clock', 14, '#5B7183')} ${e.dur}</span><span class="go">En savoir plus →</span></div></div></a>`;
const INFO = `<section class="strip"><div class="wrap">
<div>${ic('pin', 22, '#0B4F6C')}<div><b>${AG.addr[0]}</b><span>${AG.repere}</span></div></div>
<div>${ic('clock', 22, '#0B4F6C')}<div><b>${AG.hours[0][0]} · ${AG.hours[0][1]}</b><span>${AG.hours[1][0]} · ${AG.hours[1][1]}</span></div></div>
<div>${ic('phone', 22, '#0B4F6C')}<div><b><a href="${telHref}">${AG.tel}</a></b><span>Appel ou WhatsApp</span></div></div></div></section>`;
const FAQS = (n = FAQ.length) => `<div class="qs">${FAQ.slice(0, n).map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}<i aria-hidden="true"></i></summary><p>${a}</p></details>`).join('')}</div>`;
const CTA = `<section class="wrap"><div class="cta"><div><h2>Un examen à passer ?</h2><p>Prenez rendez-vous en ligne, nous vous confirmons le créneau par WhatsApp.</p></div><div class="r"><a class="btn w" href="rendez-vous.html">${ic('cal', 18, '#0B4F6C')} Prendre rendez-vous</a><a class="btn ol" href="${telHref}">${ic('phone', 16)} ${AG.tel}</a></div></div></section>`;
const PT = (crumb, h1, p) => `<section class="pt"><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div></section>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'Radiologie et échographie à Libreville', active: 'index.html',
  desc: 'Cabinet de radiologie CIMEL, avenue de Cointet à Libreville : radiographie numérique, échographie, doppler, mammographie. Rendez-vous en ligne.',
  body: `<section class="hero"><div class="wrap"><div class="tx"><span class="pill">${ic('check', 14, '#0B4F6C')} Résultats le jour même pour la plupart des examens</span>
<h1>Votre imagerie médicale, <span>précise et rassurante.</span></h1>
<p>Radiographie numérique, échographie, doppler et mammographie, réalisés et interprétés par le ${AG.doc}, ${AG.spec.toLowerCase()}.</p>
<div class="row"><a class="btn p" href="rendez-vous.html">${ic('cal', 18)} Prendre rendez-vous</a><a class="btn o" href="preparation.html">Préparer mon examen</a></div>
<ul class="ok"><li>${ic('check', 16, '#0FA3B1')} Sur ordonnance, avec ou sans rendez-vous</li><li>${ic('check', 16, '#0FA3B1')} Compte rendu transmis à votre médecin</li></ul></div>
<div class="ph"><img src="${img(PH.salle)}" alt="Salle d'échographie du cabinet"><div class="card"><span class="dot"></span><div><b>Prochain créneau</b><span data-next>Aujourd'hui · 15 h 30</span></div></div></div></div></section>
${INFO}
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Nos examens</span><h2>L'imagerie dont vous avez besoin, près de chez vous</h2></div><a class="btn o" href="examens.html">Tous les examens →</a></div>
<div class="grid g3">${EXAMS.map(examCard).join('')}</div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Comment ça se passe ?</span><h2>Votre examen en 4 étapes</h2>
<ol class="steps">${STEPS.map(([t, d], i) => `<li><b>${i + 1}</b><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol></div></section>
<section class="sec"><div class="wrap dr"><div class="ph"><img src="${img(PH.echographe)}" alt="Échographe du cabinet" loading="lazy"></div>
<div><span class="tag">Le radiologue</span><h2>${AG.doc}</h2><p class="lead">${AG.spec}. Il réalise et interprète vos examens, et reste disponible pour échanger avec votre médecin traitant.</p>
<ul class="chk"><li>Examens réalisés et interprétés par un médecin spécialiste</li><li>Matériel numérique : moins de rayons, images plus nettes</li><li>Comptes rendus clairs, remis au patient et au prescripteur</li></ul><a class="btn o" href="equipe.html">Découvrir le cabinet →</a></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Avis patients</span><h2>Ils nous ont fait confiance</h2>
<div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
<section class="sec"><div class="wrap faq"><div><span class="tag">Questions fréquentes</span><h2>Avant votre venue</h2><p class="lead">D'autres questions ? Appelez le <a href="${telHref}">${AG.tel}</a>.</p></div>${FAQS(4)}</div></section>
${CTA}`,
}));

// ---------- Examens ----------
pages.push(page('examens.html', {
  title: 'Nos examens', active: 'examens.html',
  desc: 'Radiographie numérique, échographie, échographie obstétricale, écho-doppler, mammographie et examens avec produit de contraste : déroulement, préparation, durée.',
  body: `${PT('Examens', 'Nos examens', 'Pour chaque examen : ce qui est exploré, comment vous préparer, combien de temps il dure et quand vous aurez les résultats.')}
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="tabs" role="tablist" data-tabs>${['Tous', 'Radiologie', 'Échographie'].map((t, i) => `<button role="tab" aria-selected="${i === 0}" data-cat="${i ? t : ''}"${i === 0 ? ' class="on"' : ''}>${t}</button>`).join('')}</div>
<div class="exl g3">${EXAMS.map((e) => `<article id="${e.id}" data-cat="${e.cat}"><div class="im"><img src="${img(e.ph)}" alt="" loading="lazy"></div><div class="bd"><span class="cat">${e.cat}</span><h2>${e.t}</h2><p>${esc(e.d)}</p>
<div class="cols"><div><h3>Ce que l'on explore</h3><ul>${e.list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div><div><h3>Préparation</h3><ul class="prep">${e.prep.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
<div class="foot"><span>${ic('clock', 15, '#5B7183')} ${e.dur}</span><span>${ic('doc', 15, '#5B7183')} ${e.cr}</span><a class="btn p sm" href="rendez-vous.html?examen=${e.id}">Prendre rendez-vous</a></div></div></article>`).join('')}</div>
<p class="note">Scanner et IRM : nous vous orientons vers un centre partenaire.</p></div></section>
${CTA}`,
}));

// ---------- Préparation ----------
pages.push(page('preparation.html', {
  title: 'Préparer mon examen', active: 'preparation.html',
  desc: 'À jeun, vessie pleine, sans déodorant : comment vous préparer à votre radiographie, échographie, mammographie ou examen avec contraste.',
  body: `${PT('Préparer mon examen', 'Préparer mon examen', 'Choisissez votre examen : nous vous disons quoi faire avant de venir et quoi apporter.')}
<section class="sec" style="padding-top:44px"><div class="wrap prepg"><div><label class="fld big"><span>Mon examen</span><select data-prep>${EXAMS.map((e) => `<option value="${e.id}">${e.t}</option>`).join('')}</select></label>
<div class="pcard" data-pcard aria-live="polite"></div></div>
<aside class="bring"><h2 class="h3">À apporter le jour J</h2><ul class="chk"><li>Votre ordonnance</li><li>Une pièce d'identité</li><li>Votre carte d'assurance ou CNAMGS</li><li>Vos examens précédents (clichés, comptes rendus)</li></ul>
<div class="warn"><b>Grossesse possible ?</b> Signalez-le toujours avant une radiographie : l'examen sera adapté.</div><a class="btn p" href="rendez-vous.html">${ic('cal', 18)} Prendre rendez-vous</a></aside></div></section>
<section class="sec soft"><div class="wrap faq"><div><span class="tag">Questions fréquentes</span><h2>Bon à savoir</h2></div>${FAQS()}</div></section>`,
}));

// ---------- Rendez-vous ----------
pages.push(page('rendez-vous.html', {
  title: 'Prendre rendez-vous', active: '',
  desc: 'Prenez rendez-vous en ligne au cabinet de radiologie CIMEL : choisissez votre examen, votre jour et votre créneau. Confirmation par WhatsApp.',
  body: `${PT('Rendez-vous', 'Prendre rendez-vous', 'Trois étapes. Nous vous confirmons le créneau par WhatsApp et vous rappelons la préparation.')}
<section class="rdv"><div class="wrap"><form data-steps novalidate>
<fieldset class="stp"><legend><b>1</b>Quel examen ?</legend><div class="opt">${EXAMS.map((e, k) => `<label><input type="radio" name="examen" value="${e.id}"${k === 0 ? ' checked' : ''}><span>${ic(e.ico, 20, '#0B4F6C')}${e.t}<small>${e.dur}</small></span></label>`).join('')}</div>
<label class="fld" style="margin-top:12px"><span>Précision (zone, type d'échographie…)</span><input name="precision" placeholder="Ex. : genou droit, échographie pelvienne"></label></fieldset>
<fieldset class="stp"><legend><b>2</b>Quand ?</legend><div class="days" data-days></div><p class="lbl">Créneau</p><div class="slots" data-slots></div></fieldset>
<fieldset class="stp"><legend><b>3</b>Vos informations</legend><div class="g2"><label class="fld"><span>Nom et prénom du patient</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel" placeholder="0X XX XX XX"></label>
<label class="fld"><span>Ordonnance</span><select name="ordo"><option>J'ai une ordonnance</option><option>Je n'ai pas d'ordonnance</option></select></label><label class="fld"><span>Prise en charge</span><select name="assur"><option>CNAMGS</option><option>Assurance privée</option><option>Sans assurance</option></select></label>
<label class="fld full"><span>Informations utiles</span><textarea name="msg" rows="2" placeholder="Allergie, examen précédent, médecin prescripteur…"></textarea></label></div>
<label class="chkl"><input type="checkbox" name="enceinte"> <span>Je suis enceinte ou pourrais l'être</span></label></fieldset></form>
<aside class="sum"><div class="hd2"><h2>Votre rendez-vous</h2><span>Récapitulatif</span></div><div class="bd">
<div class="ln"><span>Examen</span><b data-s="examen"></b></div><div class="ln"><span>Jour</span><b data-s="jour"></b></div><div class="ln"><span>Créneau</span><b data-s="slot"></b></div><div class="ln"><span>Durée</span><b data-s="dur"></b></div>
<div class="prepbox"><b>${ic('check', 15, '#0FA3B1')} À prévoir</b><ul data-s="prep"></ul></div>
<button class="btn p" data-send>${ic('cal', 18)} Demander ce rendez-vous</button><p class="note">Confirmation par WhatsApp aux heures d'ouverture</p></div></aside></div></section>`,
}));

// ---------- Le cabinet ----------
pages.push(page('equipe.html', {
  title: 'Le cabinet et l\'équipe', active: 'equipe.html',
  desc: `Le cabinet de radiologie CIMEL et son équipe, sous la responsabilité du ${AG.doc}, ${AG.spec.toLowerCase()}.`,
  body: `${PT('Le cabinet', 'Le cabinet et l\'équipe', 'Un cabinet de proximité au cœur de Libreville, avec un médecin radiologue présent sur place.')}
<section class="sec" style="padding-top:56px"><div class="wrap dr"><div class="ph"><img src="${img(PH.accueil)}" alt="Accueil du cabinet" loading="lazy"></div>
<div><span class="tag">Notre engagement</span><h2>Un examen bien fait, bien expliqué</h2><p class="lead">Chaque patient est reçu sans précipitation. Nous expliquons l'examen avant de commencer, et les résultats à la fin.</p>
<ul class="chk"><li>Radiologue présent sur place, du lundi au samedi</li><li>Appareils numériques entretenus et contrôlés</li><li>Hygiène et confidentialité respectées à chaque étape</li><li>Lien direct avec votre médecin prescripteur</li></ul></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">L'équipe</span><h2>Ceux qui vous accueillent</h2>
<div class="team g3">${TEAM.map(([n, r], i) => `<div class="${i === 0 ? 'lead-doc' : ''}"><span class="av">${n.replace('Dr ', '').split(' ').map((w) => w[0]).slice(0, 2).join('')}</span><div><h3>${n}</h3><p>${esc(r)}</p></div></div>`).join('')}</div></div></section>
<section class="sec"><div class="wrap"><span class="tag">Équipement</span><h2>Notre plateau technique</h2><div class="grid g3 eq">
<div><h3>Radiologie numérique</h3><p>Images disponibles immédiatement, dose de rayons réduite.</p></div><div><h3>Échographe avec doppler</h3><p>Sondes adaptées à chaque examen, y compris obstétrical.</p></div><div><h3>Mammographe</h3><p>Dépistage et diagnostic, couplé à l'échographie.</p></div></div>
<p class="note">Liste du matériel à confirmer avec le cabinet.</p></div></section>
${CTA}`,
}));

// ---------- Galerie ----------
const GAL = [[PH.salle, 'Salle d\'échographie'], [PH.radiologue, 'Examen en cours'], [PH.accueil, 'Accueil'], [PH.echographe, 'Échographe'], [PH.mammo, 'Mammographie'], [PH.grossesse, 'Suivi de grossesse'], [PH.radio, 'Radiographie numérique'], [PH.mains, 'Comptes rendus']];
pages.push(page('galerie.html', {
  title: 'Le cabinet en images', active: '',
  desc: 'Le cabinet de radiologie CIMEL en images : accueil, salles d\'examen et équipements.',
  body: `${PT('Galerie', 'Le cabinet en images', 'Accueil, salles d\'examen et équipements.')}
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${img(p)}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles du cabinet.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => img(p)))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Contact et accès', active: 'contact.html',
  desc: `Cabinet de radiologie CIMEL, ${AG.addr.join(', ')}. ${AG.repere}. Tél. ${AG.tel}.`,
  body: `${PT('Contact', 'Contact et accès', `${AG.addr[0]}, ${AG.repere.toLowerCase()}.`)}
<section class="wrap ctg"><div><div class="info">
<div><span class="ic">${ic('pin', 18)}</span><h2>Adresse</h2><p>${AG.addr.join('<br>')}</p></div>
<div><span class="ic">${ic('phone', 18)}</span><h2>Téléphone</h2><p><a href="${telHref}">${AG.tel}</a><br><a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener">WhatsApp</a></p></div>
<div><span class="ic">${ic('mail', 18)}</span><h2>E-mail</h2><p><a href="mailto:${AG.mail}">${AG.mail}</a></p></div>
<div><span class="ic">${ic('clock', 18)}</span><h2>Horaires</h2><p>${HOURS.join('<br>')}</p></div></div>
<div class="map"><iframe title="Plan d'accès au cabinet CIMEL" src="https://www.google.com/maps?q=${AG.geo.join(',')}&z=17&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><a class="go" href="https://www.google.com/maps/dir//${AG.geo.join(',')}" target="_blank" rel="noopener">${ic('pin', 16)} Itinéraire</a></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Une question ?</h2><p>Pour un rendez-vous, utilisez plutôt la <a href="rendez-vous.html">prise de rendez-vous en ligne</a>.</p>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Objet</span><select name="objet"><option>Question sur un examen</option><option>Résultats et compte rendu</option><option>Tarifs et prise en charge</option><option>Médecin prescripteur</option><option>Autre</option></select></label>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label>
<div class="row"><button class="btn p" type="submit">Envoyer sur WhatsApp</button><a class="btn o" href="mailto:${AG.mail}">Par e-mail</a></div></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), MARK(48).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"').replace(' aria-hidden="true"', ''));
for (const f of ['cimel.css', 'cimel.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
