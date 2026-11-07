// Construit le site sur mesure du cabinet dentaire Dr Abbas dans neam-moteur/sites/cabinet-dentaire-dr-abbas/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { AG, PH, EXAMS, STEPS, AVIS, TEAM, FAQ, CONSEILS } = require('./data');
const { AFF } = require('./data');

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
  pulse: 'M3 13h4l2-5 4 10 3-7 1.5 2H21v2h-4.5L15 13l-3 7-4-10-1 3H3z',
  ribbon: 'M12 2c2.2 0 4 1.8 4 4 0 1.6-.7 3.2-1.7 4.8L19 18l-2.5 1.5-4.5-6.2-4.5 6.2L5 18l4.7-7.2C8.7 9.2 8 7.6 8 6c0-2.2 1.8-4 4-4zm0 2c-1.1 0-2 .9-2 2 0 1 .6 2.3 2 4.2 1.4-1.9 2-3.2 2-4.2 0-1.1-.9-2-2-2z',
  drop: 'M12 2s7 7.6 7 12.5A7 7 0 0 1 5 14.5C5 9.6 12 2 12 2z',
  steth: 'M19 8a3 3 0 0 0-1 5.83V15a4 4 0 0 1-8 0v-.1A6 6 0 0 0 15 9V3h-3v2h1v4a4 4 0 0 1-8 0V5h1V3H3v6a6 6 0 0 0 5 5.9v.1a6 6 0 0 0 12 0v-1.17A3 3 0 0 0 19 8zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  heart: 'M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z',
  shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5z',
  tooth: 'M7 2C4.2 2 3 4.3 3 6.8c0 2.3.9 3.7 1.4 6 .6 2.7.9 9.2 3.1 9.2 1.9 0 1.9-5.5 4.5-5.5s2.6 5.5 4.5 5.5c2.2 0 2.5-6.5 3.1-9.2.5-2.3 1.4-3.7 1.4-6C21 4.3 19.8 2 17 2c-2.1 0-3.1 1.2-5 1.2S9.1 2 7 2z',
  bolt: 'M10 2h4v6l3 2v4h-2v8h-6v-8H7v-4l3-2z',
  crown: 'M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z',
  spark: 'M12 2l2.4 6.9L21 9.5l-5.2 4.3L17.5 21 12 17.1 6.5 21l1.7-7.2L3 9.5l6.6-.6z',
  smile: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8.5 8a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 18a5.5 5.5 0 0 1-5-3.2h10A5.5 5.5 0 0 1 12 18z',
  cross: 'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm2 16H8v-2h8zm0-4H8v-2h8zm-3-5V3.5L18.5 9z',
};
const ic = (n, s = 22, c = '#fff') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
// Logo proposé (aucun logo trouvé) : dent et horloge (avec ou sans rendez-vous)
const MARK = (s = 44) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="14" fill="#12406B"/><path d="M17 9c-4.4 0-7 3.3-7 7.3 0 3.2 1.3 5.4 2 8.6.9 4 1.4 13.6 4.6 13.6 2.9 0 2.7-8.6 7.4-8.6s4.5 8.6 7.4 8.6c3.2 0 3.7-9.6 4.6-13.6.7-3.2 2-5.4 2-8.6 0-4-2.6-7.3-7-7.3-3 0-4.6 1.8-7 1.8S20 9 17 9z" fill="#fff"/><circle cx="24" cy="19" r="6.5" fill="none" stroke="#F2A900" stroke-width="2.2"/><path d="M24 15.5V19l2.6 1.8" stroke="#F2A900" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
const LOGO = `<span class="mk">${MARK()}</span><span class="t">Dr <em>Abbas</em><small>Cabinet dentaire · Rénovation</small></span>`;

const NAV = [['index.html', 'Accueil'], ['examens.html', 'Nos soins'], ['sans-rendez-vous.html', 'Sans rendez-vous'], ['preparation.html', 'Avant et après'], ['equipe.html', 'Le cabinet'], ['contact.html', 'Contact']];
const HOURS = AG.hours.map(([d, h]) => `${d} · ${h}`);

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'Dentist', name: AG.name, telephone: '+241' + AG.tel.replace(/\D/g, '').replace(/^0/, ''), email: AG.mail, address: { '@type': 'PostalAddress', streetAddress: AG.addr[0], addressLocality: 'Libreville', addressCountry: 'GA' }, openingHours: ['Mo-Fr 08:00-17:00', 'Sa 08:00-12:00'], availableService: EXAMS.map((e) => ({ '@type': 'MedicalTest', name: e.t })) };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${AG.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${AG.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${img(PH.cabinet)}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="abbas.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="Cabinet dentaire Dr Abbas, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="rendez-vous.html">Prendre rendez-vous</a></nav>
<div class="act"><a class="call" href="${telHref}">${ic('phone', 16, '#12406B')} ${AG.tel}</a><a class="btn p hcta" href="rendez-vous.html">${ic('cal', 18)} Rendez-vous</a></div><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22, '#0D2326')}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo light" href="index.html">${LOGO}</a><p>Soins dentaires avec ou sans rendez-vous, au cœur de Libreville, avec le ${AG.doc}.</p><div class="soc" data-soc></div></div>
<div><h5>Adresse</h5><p>${AG.addr.join('<br>')}<br><small>${AG.repere}</small></p></div>
<div><h5>Horaires</h5><p>${HOURS.join('<br>')}</p></div>
<div><h5>Contact</h5><p><a href="${telHref}">${AG.tel}</a><br><a href="tel:+241${AG.fixe.replace(/\D/g, '').replace(/^0/, '')}">${AG.fixe}</a><br><a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener">WhatsApp</a><br><a href="mailto:${AG.mail}">${AG.mail}</a></p><p class="fl"><a href="examens.html">Examens</a> · <a href="galerie.html">Le cabinet en images</a></p></div>
<div class="cp">© 2026 ${AG.name} · Libreville, Gabon · En cas d'urgence vitale, appelez les secours.</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.AG=${JSON.stringify({ slug: AG.slug, wa: AG.wa, exams: Object.fromEntries(EXAMS.map((e) => [e.id, { t: e.t, prep: e.prep, dur: e.dur, cr: e.cr, ph: img(e.ph) }])) })}</script><script src="abbas.js"></script>
<script src="../../assets/reco.js" data-slug="${AG.slug}" data-wa="${AG.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

// ---------- blocs ----------
const examCard = (e) => `<a class="ex" href="examens.html#${e.id}"><div class="im"><img src="${img(e.ph)}" alt="" loading="lazy"><span class="ico">${ic(e.ico, 22)}</span></div><div class="bd"><span class="cat">${e.cat}</span><h3>${e.t}</h3><p>${esc(e.d)}</p><div class="meta"><span>${ic('clock', 14, '#5B6B7C')} ${e.dur}</span><span class="go">En savoir plus →</span></div></div></a>`;
const INFO = `<section class="strip"><div class="wrap">
<div>${ic('pin', 22, '#12406B')}<div><b>${AG.addr[0]}</b><span>${AG.repere}</span></div></div>
<div>${ic('clock', 22, '#12406B')}<div><b>${AG.hours[0][0]} · ${AG.hours[0][1]}</b><span>${AG.hours[1][0]} · ${AG.hours[1][1]}</span></div></div>
<div>${ic('phone', 22, '#12406B')}<div><b><a href="${telHref}">${AG.tel}</a></b><span>Appel ou WhatsApp</span></div></div></div></section>`;
const FAQS = (n = FAQ.length) => `<div class="qs">${FAQ.slice(0, n).map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}<i aria-hidden="true"></i></summary><p>${a}</p></details>`).join('')}</div>`;
const CTA = `<section class="wrap"><div class="cta"><div><h2>Envie d'un sourire en pleine forme ?</h2><p>Prenez rendez-vous en ligne, nous vous confirmons le créneau par WhatsApp.</p></div><div class="r"><a class="btn w" href="rendez-vous.html">${ic('cal', 18, '#12406B')} Prendre rendez-vous</a><a class="btn ol" href="${telHref}">${ic('phone', 16)} ${AG.tel}</a></div></div></section>`;
const PT = (crumb, h1, p) => `<section class="pt"><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div></section>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'Dentiste avec ou sans rendez-vous à Libreville', active: 'index.html',
  desc: 'Cabinet dentaire Dr Abbas, immeuble Centr\'Affaires derrière Rénovation, Libreville : soins avec ou sans rendez-vous, détartrage, implants, blanchiment, enfants.',
  body: `<section class="hero"><div class="wrap"><div class="tx"><span class="pill">${ic('check', 14, '#12406B')} Avec ou sans rendez-vous</span>
<h1>Un sourire en bonne santé, <span>des soins sans douleur.</span></h1>
<p>Prenez soin de votre santé bucco-dentaire au centre-ville : passez quand vous le pouvez, ou réservez votre créneau en ligne.</p>
<div class="row"><a class="btn p" href="rendez-vous.html">${ic('cal', 18)} Prendre rendez-vous</a><a class="btn o" href="preparation.html">Avant et après un soin</a></div>
<ul class="ok"><li>${ic('check', 16, '#F2A900')} <a href="sans-rendez-vous.html">Voir l'affluence en direct</a></li><li>${ic('check', 16, '#F2A900')} Devis clair avant tout soin important</li></ul></div>
<div class="ph"><img src="${img(PH.consult)}" alt="Soin dentaire au cabinet"><div class="card"><span class="dot"></span><div><b>Prochain créneau</b><span data-next>Aujourd'hui · 15 h 30</span></div></div></div></div></section>
${INFO}
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Nos soins</span><h2>Toute la dentisterie, au même endroit</h2></div><a class="btn o" href="examens.html">Tout voir →</a></div>
<div class="grid g3">${EXAMS.slice(0, 6).map(examCard).join('')}</div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Comment ça se passe ?</span><h2>Votre parcours en 4 étapes</h2>
<ol class="steps">${STEPS.map(([t, d], i) => `<li><b>${i + 1}</b><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol></div></section>
<section class="sec"><div class="wrap dr"><div class="ph"><img src="${img(PH.cabinet)}" alt="Salle de soins du cabinet" loading="lazy"></div>
<div><span class="tag">Votre médecin</span><h2>${AG.doc}</h2><p class="lead">${AG.spec}. Il vous reçoit, vous explique chaque soin avant de commencer et vous accompagne dans la durée, de l'enfance à l'âge adulte.</p>
<ul class="chk"><li>Soins sous anesthésie locale, sans douleur</li><li>Devis détaillé avant chaque traitement</li><li>Matériel stérilisé à chaque patient</li></ul><a class="btn o" href="equipe.html">Découvrir le cabinet →</a></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Prévention</span><h2>4 gestes pour garder de belles dents</h2><div class="grid g4 tips">${CONSEILS.map(([t, d], i) => `<div><b>0${i + 1}</b><h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></section>
<section class="assur"><div class="wrap"><div><span class="tag">Prise en charge</span><h2>Patients assurés bienvenus</h2><p>Présentez votre carte d'assuré à l'accueil.</p></div><ul>${AG.assur.map((a) => `<li>${a}</li>`).join('')}</ul></div></section>
<section class="sec"><div class="wrap"><span class="tag">Avis patients</span><h2>Ils nous ont fait confiance</h2>
<div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
<section class="sec soft"><div class="wrap faq"><div><span class="tag">Questions fréquentes</span><h2>Avant votre venue</h2><p class="lead">D'autres questions ? Appelez le <a href="${telHref}">${AG.tel}</a>.</p></div>${FAQS(4)}</div></section>
${CTA}`,
}));

// ---------- Examens ----------
pages.push(page('examens.html', {
  title: 'Nos soins dentaires', active: 'examens.html',
  desc: 'Détartrage, soins des caries, implants, couronnes, blanchiment, dentisterie pour enfants, extractions : déroulement, durée, avant et après.',
  body: `${PT('Nos soins', 'Nos soins dentaires', 'Pour chaque soin : ce qui est fait, combien de temps il dure, et ce qu\'il faut savoir avant et après.')}
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="tabs" role="tablist" data-tabs>${['Tous', 'Soins', 'Esthétique', 'Chirurgie', 'Enfants'].map((t, i) => `<button role="tab" aria-selected="${i === 0}" data-cat="${i ? t : ''}"${i === 0 ? ' class="on"' : ''}>${t}</button>`).join('')}</div>
<div class="exl g3">${EXAMS.map((e) => `<article id="${e.id}" data-cat="${e.cat}"><div class="im"><img src="${img(e.ph)}" alt="" loading="lazy"></div><div class="bd"><span class="cat">${e.cat}</span><h2>${e.t}</h2><p>${esc(e.d)}</p>
<div class="cols"><div><h3>Ce que l'on explore</h3><ul>${e.list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div><div><h3>Préparation</h3><ul class="prep">${e.prep.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
<div class="foot"><span>${ic('clock', 15, '#5B6B7C')} ${e.dur}</span><span>${ic('doc', 15, '#5B6B7C')} ${e.cr}</span><a class="btn p sm" href="rendez-vous.html?examen=${e.id}">Prendre rendez-vous</a></div></div></article>`).join('')}</div>
<p class="note">Liste des actes à confirmer avec le cabinet.</p></div></section>
${CTA}`,
}));

// ---------- Sans rendez-vous ----------
pages.push(page('sans-rendez-vous.html', {
  title: 'Venir sans rendez-vous', active: 'sans-rendez-vous.html',
  desc: 'Le cabinet dentaire Dr Abbas vous reçoit aussi sans rendez-vous : ouvert ou fermé maintenant, affluence heure par heure, meilleur moment pour passer.',
  body: `${PT('Sans rendez-vous', 'Venir sans rendez-vous', 'Nous recevons aussi sans rendez-vous. Choisissez votre jour : nous vous montrons les heures les plus calmes.')}
<section class="sec" style="padding-top:44px"><div class="wrap srv" data-aff='${JSON.stringify(AFF)}'>
<div class="now"><span class="st" data-st></span><h2 data-sth></h2><p data-stp></p><div class="row"><a class="btn p" href="https://www.google.com/maps/dir//${AG.mapq}" target="_blank" rel="noopener">${ic('pin', 16)} Itinéraire</a><a class="btn o" href="rendez-vous.html">${ic('cal', 18, '#12406B')} Ou réserver un créneau</a></div></div>
<div class="aff"><div class="dsel" role="tablist" aria-label="Jour" data-days2>${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((d, k) => `<button role="tab" data-d="${k + 1}">${d}</button>`).join('')}</div>
<div class="bars" data-bars aria-live="polite"></div><p class="best" data-best></p><p class="note">Affluence indicative, d'après la fréquentation habituelle du cabinet. Les urgences passent en priorité.</p></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Bon à savoir</span><h2>Sans rendez-vous, mode d'emploi</h2><div class="grid g3 tips">
<div><b>01</b><h3>Venez tôt ou à midi</h3><p>Entre 11 h et 14 h, l'attente est généralement la plus courte.</p></div><div><b>02</b><h3>Apportez vos documents</h3><p>Pièce d'identité, carte d'assuré et anciennes radios si vous en avez.</p></div><div><b>03</b><h3>Soins longs : réservez</h3><p>Implant, prothèse ou blanchiment : un rendez-vous garantit le temps nécessaire.</p></div></div></div></section>
${CTA}`,
}));

// ---------- Préparation ----------
pages.push(page('preparation.html', {
  title: 'Avant et après un soin', active: 'preparation.html',
  desc: 'Avant et après un détartrage, un soin, un implant, un blanchiment ou une extraction : les bons gestes.',
  body: `${PT('Avant et après', 'Avant et après un soin', 'Choisissez votre soin : nous vous disons quoi faire avant de venir, et comment bien récupérer après.')}
<section class="sec" style="padding-top:44px"><div class="wrap prepg"><div><label class="fld big"><span>Mon soin</span><select data-prep>${EXAMS.map((e) => `<option value="${e.id}">${e.t}</option>`).join('')}</select></label>
<div class="pcard" data-pcard aria-live="polite"></div></div>
<aside class="bring"><h2 class="h3">À apporter le jour J</h2><ul class="chk"><li>La liste de vos traitements</li><li>Une pièce d'identité</li><li>Votre carte d'assuré ou de mutuelle</li><li>Vos examens précédents (clichés, comptes rendus)</li></ul>
<div class="warn"><b>Rage de dents, dent cassée, joue gonflée ?</b> Appelez-nous le jour même au ${AG.tel}.</div><a class="btn p" href="rendez-vous.html">${ic('cal', 18)} Prendre rendez-vous</a></aside></div></section>
<section class="sec soft"><div class="wrap faq"><div><span class="tag">Questions fréquentes</span><h2>Bon à savoir</h2></div>${FAQS()}</div></section>`,
}));

// ---------- Rendez-vous ----------
pages.push(page('rendez-vous.html', {
  title: 'Prendre rendez-vous', active: '',
  desc: 'Prenez rendez-vous en ligne au cabinet dentaire Dr Abbas : bilan, soins, implants, blanchiment, enfants. Confirmation par WhatsApp.',
  body: `${PT('Rendez-vous', 'Prendre rendez-vous', 'Trois étapes. Nous vous confirmons le créneau par WhatsApp et vous rappelons la préparation.')}
<section class="rdv"><div class="wrap"><form data-steps novalidate>
<fieldset class="stp"><legend><b>1</b>Quel soin ?</legend><div class="opt">${EXAMS.map((e, k) => `<label><input type="radio" name="examen" value="${e.id}"${k === 0 ? ' checked' : ''}><span>${ic(e.ico, 20, '#12406B')}${e.t}<small>${e.dur}</small></span></label>`).join('')}</div>
<label class="fld" style="margin-top:12px"><span>Vos symptômes, en quelques mots</span><input name="precision" placeholder="Ex. : douleur en haut à droite depuis 2 jours"></label></fieldset>
<fieldset class="stp"><legend><b>2</b>Quand ?</legend><div class="days" data-days></div><p class="lbl">Créneau</p><div class="slots" data-slots></div></fieldset>
<fieldset class="stp"><legend><b>3</b>Vos informations</legend><div class="g2"><label class="fld"><span>Nom et prénom du patient</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel" placeholder="0X XX XX XX"></label>
<label class="fld"><span>Première visite ?</span><select name="ordo"><option>Première consultation</option><option>Patient déjà suivi</option></select></label><label class="fld"><span>Prise en charge</span><select name="assur">${AG.assur.map((a) => `<option>${a}</option>`).join('')}<option>Autre assurance</option><option>Sans assurance</option></select></label>
<label class="fld full"><span>Informations utiles</span><textarea name="msg" rows="2" placeholder="Allergie, examen précédent, médecin prescripteur…"></textarea></label></div>
<label class="chkl"><input type="checkbox" name="enceinte"> <span>Je préfère passer sans rendez-vous si possible</span></label></fieldset></form>
<aside class="sum"><div class="hd2"><h2>Votre rendez-vous</h2><span>Récapitulatif</span></div><div class="bd">
<div class="ln"><span>Examen</span><b data-s="examen"></b></div><div class="ln"><span>Jour</span><b data-s="jour"></b></div><div class="ln"><span>Créneau</span><b data-s="slot"></b></div><div class="ln"><span>Durée</span><b data-s="dur"></b></div>
<div class="prepbox"><b>${ic('check', 15, '#F2A900')} À prévoir</b><ul data-s="prep"></ul></div>
<button class="btn p" data-send>${ic('cal', 18)} Demander ce rendez-vous</button><p class="note">Confirmation par WhatsApp aux heures d'ouverture</p></div></aside></div></section>`,
}));

// ---------- Le cabinet ----------
pages.push(page('equipe.html', {
  title: 'Le cabinet et l\'équipe', active: 'equipe.html',
  desc: `Le cabinet dentaire Dr Abbas et son équipe, au centre-ville de Libreville.`,
  body: `${PT('Le cabinet', 'Le cabinet et l\'équipe', 'Des soins professionnels et personnalisés, avec ou sans rendez-vous, derrière Rénovation.')}
<section class="sec" style="padding-top:56px"><div class="wrap dr"><div class="ph"><img src="${img(PH.cabinet2)}" alt="Accueil du cabinet" loading="lazy"></div>
<div><span class="tag">Notre engagement</span><h2>Prendre le temps de comprendre</h2><p class="lead">Chaque patient est reçu sans précipitation. Le docteur explique l'examen avant de commencer, et les résultats à la fin, écran à l'appui.</p>
<ul class="chk"><li>Accueil avec ou sans rendez-vous</li><li>Fauteuils et matériel modernes</li><li>Hygiène et confidentialité respectées à chaque étape</li><li>Plan de traitement et devis expliqués</li></ul></div></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">L'équipe</span><h2>Ceux qui vous accueillent</h2>
<div class="team g3">${TEAM.map(([n, r], i) => `<div class="${i === 0 ? 'lead-doc' : ''}"><span class="av">${n.replace('Dr ', '').split(' ').map((w) => w[0]).slice(0, 2).join('')}</span><div><h3>${n}</h3><p>${esc(r)}</p></div></div>`).join('')}</div></div></section>
<section class="sec"><div class="wrap"><span class="tag">Équipement</span><h2>Notre équipement</h2><div class="grid g3 eq">
<div><h3>Radio numérique</h3><p>Moins de rayons, image affichée tout de suite à l'écran.</p></div><div><h3>Stérilisation</h3><p>Instruments stérilisés et emballés pour chaque patient.</p></div><div><h3>Détartreur à ultrasons</h3><p>Un nettoyage efficace et doux pour les gencives.</p></div></div>
<p class="note">Liste du matériel à confirmer avec le cabinet.</p></div></section>
${CTA}`,
}));

// ---------- Galerie ----------
const GAL = [[PH.consult, 'Consultation'], [PH.detartrage, 'Détartrage'], [PH.enfant, 'Soins des enfants'], [PH.cabinet, 'Salle de soins'], [PH.soin, 'Soin dentaire'], [PH.scan, 'Bilan 3D'], [PH.implant, 'Implant'], [PH.sourire, 'Sourire retrouvé']];
pages.push(page('galerie.html', {
  title: 'Le cabinet en images', active: '',
  desc: 'Le cabinet dentaire Dr Abbas en images : fauteuils, soins et sourires.',
  body: `${PT('Galerie', 'Le cabinet en images', 'Accueil, salles d\'examen et équipements.')}
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${img(p)}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles du cabinet.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => img(p)))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Contact et accès', active: 'contact.html',
  desc: `Cabinet dentaire Dr Abbas, immeuble Centr'Affaires, derrière Rénovation, Libreville. Tél. ${AG.tel} · ${AG.fixe}. ${AG.mail}.`,
  body: `${PT('Contact', 'Contact et accès', `${AG.addr[0]}, ${AG.repere.toLowerCase()}.`)}
<section class="wrap ctg"><div><div class="info">
<div><span class="ic">${ic('pin', 18)}</span><h2>Adresse</h2><p>${AG.addr.join('<br>')}</p></div>
<div><span class="ic">${ic('phone', 18)}</span><h2>Téléphone</h2><p><a href="${telHref}">${AG.tel}</a></p></div>
<div><span class="ic">${ic('mail', 18)}</span><h2>E-mail</h2><p><a href="mailto:${AG.mail}">${AG.mail}</a></p></div>
<div><span class="ic">${ic('clock', 18)}</span><h2>Horaires</h2><p>${HOURS.join('<br>')}</p></div></div>
<div class="map"><iframe title="Plan d'accès au cabinet dentaire Dr Abbas" src="https://www.google.com/maps?q=${AG.mapq}&z=16&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><a class="go" href="https://www.google.com/maps/dir//${AG.mapq}" target="_blank" rel="noopener">${ic('pin', 16)} Itinéraire</a></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Une question ?</h2><p>Pour un rendez-vous, utilisez plutôt la <a href="rendez-vous.html">prise de rendez-vous en ligne</a>.</p>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Objet</span><select name="objet"><option>Question sur un examen</option><option>Résultats et compte rendu</option><option>Tarifs et prise en charge</option><option>Médecin correspondant</option><option>Autre</option></select></label>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label>
<div class="row"><button class="btn p" type="submit">Envoyer sur WhatsApp</button><a class="btn o" href="mailto:${AG.mail}">Par e-mail</a></div></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), MARK(48).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"').replace(' aria-hidden="true"', ''));
for (const f of ['abbas.css', 'abbas.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
