// Construit le site sur mesure d'Awax Music School dans neam-moteur/sites/awax-music-school/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { AW, PH, COURS, FORMULES, INSCRIPTION, PLANNING, QUIZ, AVIS } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', AW.slug);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');
const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
const C = Object.fromEntries(COURS.map((c) => [c[0], c]));

const ICON = {
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
  note: 'M12 3v10.55A4 4 0 1 0 14 17V7h4V3z',
  play: 'M8 5v14l11-7z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;

// Logo proposé (aucun logo trouvé) : onde sonore en forme de A
const MARK = (s = 44) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="14" fill="#FF6B1A"/><path d="M9 36 21 10h6l12 26" fill="none" stroke="#1B1036" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M14 27h4l2-5 3 9 3-12 2 8h6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const LOGO = `<span class="mk">${MARK()}</span><span class="t">AWAX<small>Music School</small></span>`;

const NAV = [['index.html', 'Accueil'], ['cours.html', 'Les cours'], ['trouver-mon-instrument.html', 'Quel instrument ?'], ['planning.html', 'Planning'], ['ecole.html', 'L\'école'], ['contact.html', 'Contact']];
const HOURS = AW.hours.map(([d, h]) => `${d} · ${h}`);

function page(file, { title, desc, active, body }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'MusicSchool', name: AW.name, telephone: '+241' + AW.tel.replace(/\D/g, '').replace(/^0/, ''), email: AW.mail, location: AW.sites.map(([, n, a]) => ({ '@type': 'Place', name: n, address: a })), sameAs: [`https://www.instagram.com/${AW.ig}/`, `https://www.facebook.com/${AW.fb}/`] };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${AW.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${AW.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${PH.scene}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="awax.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="Awax Music School, accueil">${LOGO}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="inscription.html">S'inscrire</a></nav>
<a class="btn o hcta" href="inscription.html">S'inscrire</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo" href="index.html">${LOGO}</a><p>École de formation musicale made in Gabon : piano, guitare, batterie, saxophone, chant, chorale et techniques du son.</p><div class="soc" data-soc></div></div>
<div><h5>Nos sites</h5><p>${AW.sites.map(([, n, a]) => `<b>${n}</b><br>${a}`).join('<br><br>')}</p></div>
<div><h5>Horaires</h5><p>${HOURS.join('<br>')}</p><p><a href="planning.html">Voir le planning</a></p></div>
<div><h5>Contact</h5><p><a href="${telHref(AW.tel)}">${AW.tel}</a> (WhatsApp)<br><a href="mailto:${AW.mail}">${AW.mail}</a><br>Instagram @${AW.ig}</p><p><a href="galerie.html">Galerie</a></p></div>
<div class="cp">© 2026 ${AW.name} · Libreville et Akanda, Gabon · Tarifs indicatifs, à confirmer à l'inscription.</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.AW=${JSON.stringify({ slug: AW.slug, wa: AW.wa, cours: Object.fromEntries(COURS.map(([id, n, ph, age]) => [id, [n, ph, age]])), formules: FORMULES, insc: INSCRIPTION, sites: Object.fromEntries(AW.sites.map(([id, n]) => [id, n])), quiz: QUIZ })}</script><script src="awax.js"></script>
<script src="../../assets/reco.js" data-slug="${AW.slug}" data-wa="${AW.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const PT = (crumb, h1, p) => `<section class="pt"><div class="wrap"><div class="cr"><a href="index.html">Accueil</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div><div class="eq" aria-hidden="true">${'<i></i>'.repeat(28)}</div></section>`;
const CTA = `<section class="cta"><div class="wrap"><div><span class="tag">Rentrée 2026-2027</span><h2>Ton premier cours t'attend.</h2><p>Inscriptions ouvertes sur nos deux sites, de 6 ans à l'âge adulte.</p></div><div class="row"><a class="btn o" href="inscription.html">S'inscrire</a><a class="btn ghost" href="trouver-mon-instrument.html">Quel instrument pour moi ?</a></div></div></section>`;

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'École de musique à Libreville et Akanda', active: 'index.html',
  desc: 'Awax Music School, école de musique à Libreville (Louis) et Akanda (Ambowè) : piano, guitare, batterie, saxophone, chant, chorale et techniques du son, de 6 ans à l\'âge adulte.',
  body: `<section class="hero"><div class="bg" style="background-image:url(${PH.scene})"></div><div class="wrap"><span class="kick">${ic('note', 16)} Rentrée 2026-2027 · inscriptions ouvertes</span><h1>Réveille la passion du <em>rythme</em> en toi.</h1>
<p>Piano, guitare, batterie, saxophone, chant, chorale et techniques du son : une école de musique made in Gabon, à Louis et à Akanda.</p>
<div class="row"><a class="btn o" href="inscription.html">S'inscrire</a><a class="btn ghost" href="trouver-mon-instrument.html">${ic('play', 16)} Quel instrument pour moi ?</a></div></div><div class="eq big" aria-hidden="true">${'<i></i>'.repeat(40)}</div></section>
<section class="stats"><div class="wrap"><div><b>12+</b><span>ans d'expérience</span></div><div><b>${COURS.length}</b><span>disciplines</span></div><div><b>2</b><span>sites : Louis et Akanda</span></div><div><b>6 ans</b><span>pour commencer</span></div></div></section>
<section class="sec"><div class="wrap"><div class="hdx"><div><span class="tag">Les cours</span><h2>Choisis ton instrument</h2></div><a class="btn line" href="cours.html">Tous les cours →</a></div>
<div class="ins">${COURS.map(([id, n, ph, age, t]) => `<a class="in" href="cours.html#${id}"><img src="${ph}" alt="" loading="lazy"><div><span>Dès ${age} ans</span><h3>${n}</h3><p>${t}</p></div></a>`).join('')}</div></div></section>
<section class="sec dk"><div class="wrap split"><div><span class="tag">Le test</span><h2>Tu hésites ? <em>4 questions</em> pour trouver ton instrument.</h2><p class="lead">Mélodie ou rythme, seul ou en groupe, calme ou explosif : réponds au quiz, on te conseille l'instrument fait pour toi.</p><a class="btn o" href="trouver-mon-instrument.html">Faire le test</a></div><img src="${PH.batt2}" alt="Batteur en cours" loading="lazy"></div></section>
<section class="sec"><div class="wrap"><span class="tag">Nos formules</span><h2>Des cours pour tous les rythmes</h2><div class="fms">${FORMULES.map(([id, t, d, p], i) => `<div class="fm${i === 0 ? ' pop' : ''}">${i === 0 ? '<span class="bdg">Le plus choisi</span>' : ''}<h3>${t}</h3><p>${d}</p><b>${fcfa(p)}<small> / mois</small></b><a class="btn ${i === 0 ? 'o' : 'line'}" href="inscription.html?formule=${id}">Choisir</a></div>`).join('')}</div><p class="note">Tarifs indicatifs, 4 séances par mois. Frais d'inscription : ${fcfa(INSCRIPTION)}.</p></div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Ils jouent chez Awax</span><h2>Élèves et parents en parlent</h2><div class="avis">${AVIS.map(([n, w, t]) => `<figure><div class="st" aria-label="5 étoiles sur 5">★★★★★</div><blockquote>« ${esc(t)} »</blockquote><figcaption><b>${n}</b><small>${w}</small></figcaption></figure>`).join('')}</div></div></section>
${CTA}`,
}));

// ---------- Cours ----------
pages.push(page('cours.html', {
  title: 'Les cours', active: 'cours.html',
  desc: 'Cours de piano, guitare, batterie, saxophone, chant et coaching vocal, chorale et techniques du son chez Awax Music School : âges, contenu, formules.',
  body: `${PT('Les cours', 'Les cours', 'Sept disciplines, enseignées par des musiciens, de l\'éveil au niveau professionnel avec certificat.')}
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="tabs" role="tablist" data-tabs>${COURS.map(([id, n], i) => `<button role="tab" data-t="${id}"${i ? '' : ' class="on" aria-selected="true"'}>${n}</button>`).join('')}</div>
${COURS.map(([id, n, ph, age, t, li], i) => `<div class="pane" id="${id}" data-pane="${id}"${i ? ' hidden' : ''}><img src="${ph}" alt="${esc(n)}" loading="lazy"><div><span class="tag">Dès ${age} ans</span><h2>${n}</h2><p class="lead">${t}</p><h3>Au programme</h3><ul class="chk">${li.map((x) => `<li>${ic('check', 18)} ${x}</li>`).join('')}</ul>
<div class="crs">${PLANNING.filter((p) => p[3] === id).slice(0, 4).map(([d, h, du, , s, nv]) => `<span>${['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d]} ${h.replace(':', ' h ')} · ${AW.sites.find((x) => x[0] === s)[1].replace('Site de ', '').replace('Site d\'', '')} · ${nv}</span>`).join('')}</div>
<div class="row"><a class="btn o" href="inscription.html?cours=${id}">S'inscrire en ${n.split(' ')[0].toLowerCase()}</a><a class="btn line" href="planning.html?cours=${id}">Tous les créneaux</a></div></div></div>`).join('')}</div></section>
<section class="sec soft"><div class="wrap"><span class="tag">Formation professionnelle</span><h2>Aller plus loin</h2><div class="grid g3 why"><div><h3>Ateliers intensifs</h3><p>Stages de chant, de chorale et de technique du son pendant les vacances.</p></div><div><h3>Certificat</h3><p>Les formations professionnelles se terminent par la remise d'un certificat.</p></div><div><h3>Scène</h3><p>Concerts d'élèves et prestations : jouer devant un public fait partie de l'apprentissage.</p></div></div></div></section>
${CTA}`,
}));

// ---------- Quiz ----------
pages.push(page('trouver-mon-instrument.html', {
  title: 'Quel instrument pour moi ?', active: 'trouver-mon-instrument.html',
  desc: 'Quatre questions pour découvrir l\'instrument fait pour toi : piano, guitare, batterie, saxophone, chant, chorale ou techniques du son.',
  body: `${PT('Quel instrument ?', 'Quel instrument pour moi ?', 'Quatre questions, une réponse. Ensuite, un cours d\'essai pour confirmer.')}
<section class="sec qz"><div class="wrap"><div class="quiz" data-quiz><div class="prog"><span data-prog></span></div><div data-q></div><div class="res" data-res hidden></div></div></div></section>
${CTA}`,
}));

// ---------- Planning ----------
pages.push(page('planning.html', {
  title: 'Planning des cours', active: 'planning.html',
  desc: 'Le planning hebdomadaire des cours d\'Awax Music School, sur les sites de Louis et d\'Akanda : filtrez par instrument, site et niveau.',
  body: `${PT('Planning', 'Planning de la semaine', 'Filtrez par instrument et par site, puis réservez votre créneau.')}
<section class="sec" style="padding-top:40px"><div class="wrap"><div class="pf" data-pf><label class="fld"><span>Instrument</span><select name="cours"><option value="">Tous</option>${COURS.map(([id, n]) => `<option value="${id}">${n}</option>`).join('')}</select></label>
<div class="seg" role="radiogroup" aria-label="Site"><label><input type="radio" name="site" value="" checked><span>Les deux sites</span></label>${AW.sites.map(([id, n]) => `<label><input type="radio" name="site" value="${id}"><span>${n.replace('Site d\'', '').replace('Site de ', '')}</span></label>`).join('')}</div></div>
<div class="week">${['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((j, k) => `<div class="day"><h3>${j}</h3>${PLANNING.filter((p) => p[0] === k + 1).map(([d, h, du, c, s, nv]) => `<a class="sl c-${c}" data-c="${c}" data-s="${s}" href="inscription.html?cours=${c}&site=${s}"><b>${h.replace(':', ' h ')}</b><span>${C[c][1]}</span><small>${du} min · ${nv}<br>${AW.sites.find((x) => x[0] === s)[1]}</small></a>`).join('')}<p class="empty" hidden>Pas de cours</p></div>`).join('')}</div>
<p class="note">Planning indicatif de la rentrée 2026-2027. D'autres créneaux sont possibles en cours individuel.</p></div></section>`,
}));

// ---------- Inscription ----------
pages.push(page('inscription.html', {
  title: 'Inscription', active: '',
  desc: 'Inscrivez-vous à Awax Music School : instrument, niveau, formule, site et jours préférés. Tarif estimé et confirmation sur WhatsApp.',
  body: `${PT('Inscription', 'Inscription', 'Remplissez le formulaire : nous vous recontactons pour fixer le cours d\'essai.')}
<section class="bk"><div class="wrap"><form data-insc novalidate>
<fieldset class="stp"><legend><b>1</b>L'élève</legend><div class="g2"><label class="fld"><span>Prénom de l'élève</span><input name="eleve" required autocomplete="given-name"></label><label class="fld"><span>Âge</span><input name="age" type="number" min="4" max="99" value="10" inputmode="numeric"></label></div><p class="msg" data-agemsg hidden></p></fieldset>
<fieldset class="stp"><legend><b>2</b>Le cours</legend><div class="opts">${COURS.map(([id, n, , age], i) => `<label><input type="radio" name="cours" value="${id}"${i ? '' : ' checked'}><span><b>${n}</b><small>dès ${age} ans</small></span></label>`).join('')}</div>
<p class="lbl">Niveau</p><div class="chips">${['Débutant', 'Intermédiaire', 'Avancé'].map((n, i) => `<label><input type="radio" name="niveau" value="${n}"${i ? '' : ' checked'}><span>${n}</span></label>`).join('')}</div>
<p class="lbl">Formule</p><div class="chips">${FORMULES.map(([id, t], i) => `<label><input type="radio" name="formule" value="${id}"${i ? '' : ' checked'}><span>${t}</span></label>`).join('')}</div>
<p class="lbl">Site</p><div class="chips">${AW.sites.map(([id, n], i) => `<label><input type="radio" name="site" value="${id}"${i ? '' : ' checked'}><span>${n}</span></label>`).join('')}</div>
<p class="lbl">Jours préférés</p><div class="chips">${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((d) => `<label><input type="checkbox" name="jours" value="${d}"><span>${d}</span></label>`).join('')}</div></fieldset>
<fieldset class="stp"><legend><b>3</b>Le contact</legend><div class="g2"><label class="fld"><span>Nom du parent ou de l'élève</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div></fieldset></form>
<aside class="sum"><h2>Récapitulatif</h2><div class="ln"><span>Élève</span><b data-s="eleve"></b></div><div class="ln"><span>Cours</span><b data-s="cours"></b></div><div class="ln"><span>Formule</span><b data-s="formule"></b></div><div class="ln"><span>Site</span><b data-s="site"></b></div>
<div class="tot"><span>Par mois</span><b data-s="mois"></b><small data-s="first"></small></div><button class="btn o" data-send>Envoyer mon inscription</button><p class="note">Le premier cours sert de cours d'essai. Tarifs indicatifs.</p></aside></div></section>`,
}));

// ---------- L'école ----------
pages.push(page('ecole.html', {
  title: 'L\'école', active: 'ecole.html',
  desc: 'Awax Music School, école de formation musicale made in Gabon : plus de 12 ans d\'expérience, deux sites, des formations professionnelles et des concerts.',
  body: `${PT('L\'école', 'L\'école', 'Une école de formation musicale made in Gabon, fruit de la passion de deux musiciens.')}
<section class="sec"><div class="wrap split"><img src="${PH.micro}" alt="Chanteur au micro" loading="lazy"><div><span class="tag">Notre histoire</span><h2>Plus de 12 ans à faire vibrer les talents</h2><p class="lead">Née à Libreville de la passion de deux musiciens, Awax Music School forme des enfants, des adultes et des professionnels. Après le site de Louis, l'école s'est installée à Akanda pour être plus proche de ses élèves.</p>
<ul class="chk"><li>${ic('check', 18)} Des professeurs musiciens en activité</li><li>${ic('check', 18)} Des formations professionnelles avec certificat</li><li>${ic('check', 18)} Des concerts d'élèves chaque année</li></ul></div></div></section>
<section class="sec dk"><div class="wrap split rev"><div><span class="tag">Engagements</span><h2>La musique, une question de cœur</h2><p class="lead">L'école participe à la vie de la cité : en novembre, Awax Music School se joint à la campagne « Novembre bleu » de sensibilisation au cancer de la prostate.</p><a class="btn o" href="https://www.instagram.com/${AW.ig}/" target="_blank" rel="noopener">Suivre @${AW.ig}</a></div><img src="${PH.batt3}" alt="Batteur en concert" loading="lazy"></div></section>
${CTA}`,
}));

// ---------- Galerie ----------
const GAL = [[PH.scene, 'Concert'], [PH.batt1, 'Batterie'], [PH.chant, 'Chant'], [PH.sax, 'Saxophone'], [PH.duo, 'Duo'], [PH.guitare, 'Salle de guitare'], [PH.son, 'Techniques du son'], [PH.piano, 'Piano']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: '',
  desc: 'Awax Music School en images : concerts, cours et salles.',
  body: `${PT('Galerie', 'Galerie', 'Concerts, cours et coulisses. Retrouvez nos vidéos sur Instagram @awaxmschool.')}
<section class="sec" style="padding-top:44px"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${p}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles de l'école.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => p))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Contact et accès', active: 'contact.html',
  desc: `Awax Music School : site de Louis (à côté de la station Engen) et site d'Akanda (Ambowè). Tél. et WhatsApp ${AW.tel}.`,
  body: `${PT('Contact', 'Nos deux sites', 'Louis et Akanda : choisissez le site le plus proche de chez vous.')}
<section class="sec" style="padding-top:44px"><div class="wrap sites">${AW.sites.map(([id, n, a, q]) => `<div class="site"><div class="map"><iframe title="Plan d'accès, ${esc(n)}" src="https://www.google.com/maps?q=${q}&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div><div><h2 class="h3">${n}</h2><p>${ic('pin', 16)} ${a}</p><p>${ic('clock', 16)} ${HOURS[0]} · ${HOURS[1]}</p><a class="btn line" href="https://www.google.com/maps/dir//${q}" target="_blank" rel="noopener">Itinéraire</a></div></div>`).join('')}</div></section>
<section class="wrap ctg"><div class="info"><div>${ic('phone', 22)}<h2>Téléphone</h2><p><a href="${telHref(AW.tel)}">${AW.tel}</a><br>Appel et WhatsApp</p></div><div>${ic('mail', 22)}<h2>E-mail</h2><p><a href="mailto:${AW.mail}">${AW.mail}</a></p></div><div>${ic('note', 22)}<h2>Réseaux</h2><p>Instagram @${AW.ig}<br>Facebook « AWAX MUSIC School »</p></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Une question ?</h2><div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="4" required placeholder="Cours d'essai, prestation, chorale pour un événement…"></textarea></label><button class="btn o" type="submit">Envoyer sur WhatsApp</button></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), MARK(64).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"').replace(' aria-hidden="true"', ''));
for (const f of ['awax.css', 'awax.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
