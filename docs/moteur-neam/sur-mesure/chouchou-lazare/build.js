// Construit le site sur mesure de Chouchou Lazare dans neam-moteur/sites/chouchou-lazare/.
// Usage : node build.js   (gen-live.js ne réécrit pas ce site : il lit seulement pages.json)
const fs = require('fs');
const path = require('path');
const { CL, PH, PIECES, LIGNES, ETAPES, DATES, OCCASIONS } = require('./data');

const OUT = path.resolve(__dirname, '../../../../neam-moteur/sites', CL.slug);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const telHref = (t) => 'tel:+241' + t.replace(/\D/g, '').replace(/^0/, '');
const LN = Object.fromEntries(LIGNES);

const ICON = {
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  pin: 'M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  mail: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2z',
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;

// Monogramme proposé (aucun logo trouvé) : C et L entrelacés, trame de raphia
const MARK = (s = 44, bg = '#141110', fg = '#D9C7A0') => `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="${bg}"/><circle cx="24" cy="24" r="19.5" fill="none" stroke="${fg}" stroke-width=".8" stroke-dasharray="2 2"/><text x="20" y="31" text-anchor="middle" font-family="'Bodoni Moda',Didot,Georgia,serif" font-size="22" fill="${fg}">C</text><text x="29" y="31" text-anchor="middle" font-family="'Bodoni Moda',Didot,Georgia,serif" font-size="22" font-style="italic" fill="#C8693A">L</text></svg>`;
const LOGO = (light) => `<span class="mk">${MARK(42, light ? '#F6F0E4' : '#141110', light ? '#141110' : '#D9C7A0')}</span><span class="t">CHOUCHOU LAZARE<small>Haute couture · raphia du Gabon</small></span>`;

// Silhouettes dessinées, habillées d'une trame de raphia
const RAF = `<defs><pattern id="raf" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#D9C7A0"/><rect width="4" height="8" fill="#C9B184"/><rect y="0" width="8" height="1" fill="#B89A66" opacity=".5"/></pattern><pattern id="fr" width="3" height="40" patternUnits="userSpaceOnUse"><rect width="3" height="40" fill="#D9C7A0"/><rect width="1" height="40" fill="#B89A66"/></pattern></defs>`;
const SIL = {
  bustier: `<path d="M42 38c6-6 30-6 36 0l4 44H38z" fill="url(#raf)"/><path d="M38 82h44l20 112H18z" fill="#2B1D12"/>`,
  jupe: `<path d="M45 34h30l4 40H41z" fill="#2B1D12"/><path d="M41 74h38l30 118H11z" fill="url(#fr)"/><path d="M41 74h38l2 10H39z" fill="url(#raf)"/>`,
  robe: `<path d="M44 30c8-5 24-5 32 0l4 46c4 40 14 80 24 118H16c10-38 20-78 24-118z" fill="url(#raf)"/><path d="M40 76h40" stroke="#2B1D12" stroke-width="3"/>`,
  cape: `<path d="M44 34h32l6 60H38z" fill="#2B1D12"/><path d="M60 26 108 192H12z" fill="url(#raf)" opacity=".95"/><path d="M48 30c4 8 20 8 24 0" fill="none" stroke="#C8693A" stroke-width="3"/>`,
  homme: `<path d="M38 30h44l6 82H32z" fill="#EDE3D0"/><path d="M50 30h20l-2 40H52z" fill="url(#raf)"/><path d="M36 112h22l-3 82H40zM62 112h22l-4 82H65z" fill="#2B1D12"/>`,
};
const drawn = (k) => `<svg class="sil" viewBox="0 0 120 200" aria-hidden="true">${RAF}<circle cx="60" cy="14" r="9" fill="#2B1D12"/><path d="M57 22h6v8h-6z" fill="#2B1D12"/>${SIL[k]}</svg>`;
const visual = (v, alt) => (SIL[v] ? drawn(v) : `<img src="${v}" alt="${esc(alt)}" loading="lazy">`);

const NAV = [['index.html', 'La maison'], ['collections.html', 'Collections'], ['raphia.html', 'Le raphia'], ['sur-mesure.html', 'Sur mesure'], ['histoire.html', 'Histoire'], ['contact.html', 'Contact']];

function page(file, { title, desc, active, body, dark }) {
  const nav = NAV.map(([f, t]) => `<a href="${f}"${f === active ? ' class="on" aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'ClothingStore', name: CL.name, description: 'Haute couture en raphia du Gabon, créations sur mesure', telephone: '+241' + CL.tel.replace(/\D/g, '').replace(/^0/, ''), address: { '@type': 'PostalAddress', addressLocality: CL.city, addressCountry: 'GA' }, sameAs: [`https://www.instagram.com/${CL.ig}/`], founder: { '@type': 'Person', name: CL.name, jobTitle: 'Styliste-modéliste' } };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} — ${CL.name}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} — ${CL.name}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${PH.green}">
<link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,600;1,6..96,400&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="lazare.css"><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body${dark ? ' class="dk"' : ''}>
<header class="hd"><div class="wrap"><a class="logo" href="index.html" aria-label="Chouchou Lazare, accueil">${LOGO(false)}</a><nav aria-label="Menu principal">${nav}<a class="mnav-cta" href="sur-mesure.html">Commander une création</a></nav>
<a class="btn k hcta" href="sur-mesure.html">Sur mesure</a><button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${ic('menu', 22)}</button></div></header>
<main>${body}</main>
<footer class="ft"><div class="wrap">
<div><a class="logo" href="index.html">${LOGO(true)}</a><p>Styliste-modéliste à Libreville. Le raphia du Gabon, matière ancestrale, porté sur les podiums du monde.</p><div class="soc" data-soc></div></div>
<div><h5>Atelier</h5><p>${CL.city}, Gabon<br>Sur rendez-vous</p></div>
<div><h5>La maison</h5><p><a href="collections.html">Collections</a><br><a href="raphia.html">Le raphia</a><br><a href="histoire.html">Histoire et distinctions</a><br><a href="galerie.html">Galerie</a></p></div>
<div><h5>Contact</h5><p><a href="${telHref(CL.tel)}">${CL.tel}</a> (WhatsApp)<br><a href="mailto:${CL.mail}">${CL.mail}</a><br>Instagram @${CL.ig}</p></div>
<div class="cp">© 2026 ${CL.name} · Libreville, Gabon · Créations originales, reproduction interdite.</div></div></footer>
<a class="neam-back" href="javascript:history.length>1?history.back():location.href='../../index.html'">← <b>NEAM Atelier</b> · retour</a>
<script src="../../assets/brands.js"></script>
<script>window.CL=${JSON.stringify({ slug: CL.slug, wa: CL.wa, p: Object.fromEntries(PIECES.map(([id, n, l, m]) => [id, [n, LN[l], m]])) })}</script><script src="lazare.js"></script>
<script src="../../assets/reco.js" data-slug="${CL.slug}" data-wa="${CL.wa}"></script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, file), html);
  return [file, title];
}

const PT = (crumb, h1, p) => `<section class="pt"><div class="wrap"><div class="cr"><a href="index.html">La maison</a> / ${crumb}</div><h1>${h1}</h1><p>${p}</p></div></section>`;
const card = ([id, n, l, m, v, d]) => `<article class="pc" data-l="${l}" id="${id}"><div class="vis${SIL[v] ? ' dr' : ''}">${visual(v, n)}<span class="ln">${LN[l]}</span></div><div class="bd"><h3>${n}</h3><p class="mt">${m}</p><p>${d}</p><a href="sur-mesure.html?piece=${id}">Demander cette pièce →</a></div></article>`;
const CTA = `<section class="cta"><div class="wrap"><div><span class="tag">Sur mesure</span><h2>Une création <em>pour vous</em></h2><p>Mariage traditionnel, gala, défilé : chaque pièce est imaginée, tissée et ajustée à l'atelier, à vos mesures.</p></div><div class="row"><a class="btn r" href="sur-mesure.html">Commander une création</a><a class="btn line light" href="https://wa.me/${CL.wa}" target="_blank" rel="noopener">WhatsApp ${CL.tel}</a></div></div></section>`;
const WEAVE = '<div class="weave" aria-hidden="true"></div>';

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
const pages = [];

// ---------- Accueil ----------
pages.push(page('index.html', {
  title: 'Haute couture en raphia du Gabon', active: 'index.html',
  desc: 'Chouchou Lazare, styliste gabonais : le raphia du Gabon transformé en haute couture. Collections, créations sur mesure, atelier à Libreville.',
  body: `<section class="hero"><div class="wrap"><div class="tx"><span class="tag">Styliste-modéliste · Libreville</span><h1>Le raphia,<br><em>un tissu qui parle</em><br>aux ancêtres.</h1>
<p>Chouchou Lazare transforme le raphia du Gabon, matière ancestrale réservée aux chefs et aux grandes cérémonies, en bustiers sculptés, jupes aériennes et silhouettes majestueuses.</p>
<div class="row"><a class="btn r" href="collections.html">Voir les collections</a><a class="btn line" href="sur-mesure.html">Commander une création</a></div></div>
<div class="vis"><span class="arch"></span><img src="${PH.hero}" alt="Mannequin en tenue de la maison"><span class="cap">Paris · Libreville</span></div></div>${WEAVE}</section>
<section class="press"><div class="wrap"><span>Vu dans</span><b>Africanews</b><b>FashionNetwork</b><b>Brut Afrique</b><b>Afrik.com</b></div></section>
<section class="sec"><div class="wrap split"><div class="raf-img"><img src="${PH.raphia}" alt="Objets en raphia tressé" loading="lazy"></div><div><span class="tag">La matière</span><h2>Le raphia du Gabon,<br><em>tissé très fin</em></h2><p class="lead">« Le raphia du Gabon, il est particulier. Il est tissé très fin, c'est un textile qui mérite d'être montré. »</p><p class="src">Chouchou Lazare, Africanews, mars 2026</p><a class="btn line" href="raphia.html">Du palmier à la robe →</a></div></div></section>
<section class="sec sand"><div class="wrap"><div class="hdx"><div><span class="tag">Collections</span><h2>Raphia, wax, <em>cérémonie</em></h2></div><a class="btn line" href="collections.html">Toutes les pièces</a></div>
<div class="pcs">${PIECES.slice(0, 4).map(card).join('')}</div></div></section>
<section class="sec dkb"><div class="wrap quote"><p>« N'importe qui peut porter du raphia. Ce n'est pas réservé aux Gabonais ou aux Africains. <em>C'est ouvert à tout le monde.</em> »</p><span>Chouchou Lazare</span></div></section>
<section class="sec"><div class="wrap"><span class="tag">Un parcours</span><h2>De l'atelier familial <em>aux podiums de Paris</em></h2><ol class="tl">${DATES.map(([d, t]) => `<li><b>${d}</b><p>${t}</p></li>`).join('')}</ol><a class="btn line" href="histoire.html">Toute l'histoire →</a></div></section>
${CTA}`,
}));

// ---------- Collections ----------
pages.push(page('collections.html', {
  title: 'Collections', active: 'collections.html',
  desc: 'Les créations de Chouchou Lazare : pièces en raphia, wax et tenues de cérémonie, réalisées sur mesure à Libreville.',
  body: `${PT('Collections', 'Collections', 'Chaque pièce est réalisée à la main, sur mesure. Choisissez une ligne, puis demandez la pièce qui vous plaît.')}
<section class="sec"><div class="wrap"><div class="flt" data-flt><button class="on" data-f="">Toutes</button>${LIGNES.map(([id, n]) => `<button data-f="${id}">${n}</button>`).join('')}</div>
<div class="pcs all">${PIECES.map(card).join('')}</div><p class="note">Les pièces en raphia sont représentées par des dessins : photos de l'atelier à ajouter. Prix sur devis, selon la pièce et les mesures.</p></div></section>
${CTA}`,
}));

// ---------- Le raphia ----------
pages.push(page('raphia.html', {
  title: 'Le raphia du Gabon', active: 'raphia.html',
  desc: 'Du palmier à la robe : la récolte, le séchage, le tissage et la création. Le raphia, matière ancestrale et spirituelle du Gabon, au cœur de la maison Chouchou Lazare.',
  body: `${PT('Le raphia', 'Le raphia du Gabon', 'Matière ancestrale et spirituelle, longtemps réservée aux chefs, aux nobles et aux grandes cérémonies.')}
<section class="sec"><div class="wrap steps"><div class="snav" role="tablist" data-steps>${ETAPES.map(([t], i) => `<button role="tab" data-s="${i}"${i ? '' : ' class="on" aria-selected="true"'}><b>0${i + 1}</b>${t}</button>`).join('')}</div>
<div class="spanel">${ETAPES.map(([t, d], i) => `<div data-p="${i}"${i ? ' hidden' : ''}><div class="sw s${i}" aria-hidden="true"></div><h2>${t}</h2><p class="lead">${d}</p></div>`).join('')}</div></div></section>
<section class="sec dkb"><div class="wrap split"><div><span class="tag">Un code</span><h2>La longueur, les motifs, <em>tout avait un sens</em></h2><p class="lead">« Le raphia, au départ, c'était un code. La longueur, les motifs, parfois réalisés avec de l'écorce d'arbre, tout avait un sens. C'est un tissu qui parle aux ancêtres. »</p><p class="src">Chouchou Lazare, Africanews, mars 2026</p></div><div class="raf-img"><img src="${PH.fibres}" alt="Vanneries en fibres naturelles" loading="lazy"></div></div></section>
<section class="sec"><div class="wrap"><span class="tag">Les usages</span><h2>Du village <em>aux podiums</em></h2><div class="uses"><div><h3>Cérémonies</h3><p>Mariages traditionnels, rites et grandes fêtes : le raphia habille les moments importants.</p></div><div><h3>Parures des chefs</h3><p>Longtemps réservé aux chefs de village et aux nobles, il marquait le rang.</p></div><div><h3>Haute couture</h3><p>Aujourd'hui, il devient bustier, cape ou jupe, à Libreville comme à Paris.</p></div></div></div></section>
${CTA}`,
}));

// ---------- Sur mesure ----------
pages.push(page('sur-mesure.html', {
  title: 'Commander une création sur mesure', active: 'sur-mesure.html',
  desc: 'Commandez une création Chouchou Lazare : occasion, pièce, matière, date et mesures. Rendez-vous d\'essayage à l\'atelier de Libreville.',
  body: `${PT('Sur mesure', 'Commander une création', 'Décrivez votre projet : nous vous rappelons pour un premier rendez-vous à l\'atelier, puis les essayages.')}
<section class="bk"><div class="wrap"><form data-sm novalidate>
<fieldset class="stp"><legend><b>1</b>Votre projet</legend><p class="lbl">Occasion</p><div class="chips">${OCCASIONS.map((o, i) => `<label><input type="radio" name="occ" value="${o}"${i ? '' : ' checked'}><span>${o}</span></label>`).join('')}</div>
<div class="g2"><label class="fld"><span>Pièce souhaitée</span><select name="piece"><option value="">Création libre</option>${PIECES.map(([id, n, l]) => `<option value="${id}">${n} (${LN[l]})</option>`).join('')}</select></label><label class="fld"><span>Matière</span><select name="mat"><option>Raphia</option><option>Wax</option><option>Raphia et wax</option><option>Je ne sais pas encore</option></select></label></div>
<div class="g2"><label class="fld"><span>Date de l'événement</span><input type="date" name="date"></label><label class="fld"><span>Pour</span><select name="pour"><option>Femme</option><option>Homme</option><option>Couple</option><option>Groupe (cortège, troupe)</option></select></label></div><p class="msg" data-delai hidden></p></fieldset>
<fieldset class="stp"><legend><b>2</b>Vos mesures <small>(facultatif)</small></legend><p class="hint">Mesurez sur un sous-vêtement léger, mètre ruban à plat, sans serrer. Nous reprendrons tout à l'atelier.</p>
<div class="mes">${[['poitrine', 'Tour de poitrine'], ['taille', 'Tour de taille'], ['hanches', 'Tour de hanches'], ['hauteur', 'Taille (hauteur)']].map(([k, t]) => `<label class="fld"><span>${t}</span><div class="u"><input name="${k}" inputmode="numeric" type="number" min="40" max="220" placeholder="—"><i>cm</i></div></label>`).join('')}</div><p class="msg ok" data-size hidden></p></fieldset>
<fieldset class="stp"><legend><b>3</b>Vous</legend><div class="g2"><label class="fld"><span>Prénom et nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone / WhatsApp</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Votre idée en quelques mots</span><textarea name="idee" rows="3" placeholder="Couleurs, inspiration, budget, nombre de tenues…"></textarea></label></fieldset></form>
<aside class="sum"><h2>Votre projet</h2><div class="ln"><span>Occasion</span><b data-s="occ"></b></div><div class="ln"><span>Pièce</span><b data-s="piece"></b></div><div class="ln"><span>Matière</span><b data-s="mat"></b></div><div class="ln"><span>Événement</span><b data-s="date"></b></div><div class="ln"><span>Mesures</span><b data-s="mes"></b></div>
<button class="btn r" data-send>Envoyer ma demande</button><p class="note">Premier rendez-vous à l'atelier offert. Prix sur devis.</p></aside></div></section>`,
}));

// ---------- Histoire ----------
pages.push(page('histoire.html', {
  title: 'Histoire et distinctions', active: 'histoire.html',
  desc: 'Chouchou Lazare, styliste-modéliste gabonais autodidacte : de l\'atelier de sa mère aux podiums de Paris, distinctions et engagements.',
  body: `${PT('Histoire', 'Histoire et distinctions', 'Autodidacte et visionnaire, il fait rayonner l\'artisanat gabonais sur les podiums internationaux.')}
<section class="sec"><div class="wrap split"><div class="raf-img"><img src="${PH.portant}" alt="Portant de vêtements à l'atelier" loading="lazy"></div><div><span class="tag">Le créateur</span><h2>Jamais d'école de mode, <em>toujours la passion</em></h2><p class="lead">Créatif depuis l'enfance, il aide sa mère à la couture dès neuf ans et apprend en créant des robes pour elle et pour sa grand-mère. Au lycée, il organise son premier défilé. Il n'a jamais fréquenté d'école de mode : il apprend seul à maîtriser le raphia.</p>
<p class="lead">Président de l'Association des stylistes et créateurs gabonais, il ouvre la voie à une nouvelle génération de designers. Il a été décoré de l'Ordre du Mérite gabonais.</p></div></div></section>
<section class="sec sand"><div class="wrap"><span class="tag">Les grandes dates</span><h2>Un parcours <em>sur les podiums</em></h2><ol class="tl big">${DATES.map(([d, t]) => `<li><b>${d}</b><p>${t}</p></li>`).join('')}</ol></div></section>
<section class="sec dkb"><div class="wrap quote"><p>« Je n'ai pas d'âge, <em>comme Karl.</em> »</p><span>Chouchou Lazare, Africanews, mars 2026</span></div></section>
${CTA}`,
}));

// ---------- Galerie ----------
const GAL = [[PH.green, 'Robe Akanda'], [PH.model, 'Ensemble Nyanga'], [PH.raphia, 'Raphia tressé'], [PH.wax, 'Défilé'], [PH.look3, 'Robe Lopé'], [PH.fibres, 'Fibres naturelles'], [PH.portrait, 'Portrait'], [PH.portant, 'L\'atelier']];
pages.push(page('galerie.html', {
  title: 'Galerie', active: '',
  desc: 'Les créations et l\'univers de Chouchou Lazare en images.',
  body: `${PT('Galerie', 'Galerie', 'L\'univers de la maison. Retrouvez les derniers défilés sur Instagram @chouchoulazare.')}
<section class="sec"><div class="wrap"><div class="gal" data-gal>${GAL.map(([p, t], k) => `<button data-i="${k}" aria-label="Agrandir : ${esc(t)}"><img src="${p}" alt="${esc(t)}" loading="lazy"><span>${esc(t)}</span></button>`).join('')}</div><p class="note">Photos d'illustration, à remplacer par celles des défilés et de l'atelier.</p></div></section>
<div class="lb" hidden data-photos='${JSON.stringify(GAL.map(([p]) => p))}'><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Précédente">‹</button><img alt=""><button class="nx" aria-label="Suivante">›</button><span class="ct"></span></div>
${CTA}`,
}));

// ---------- Contact ----------
pages.push(page('contact.html', {
  title: 'Contact et atelier', active: 'contact.html',
  desc: `Contacter Chouchou Lazare : atelier à ${CL.city}, sur rendez-vous. Tél. et WhatsApp ${CL.tel}. Presse, défilés, collaborations.`,
  body: `${PT('Contact', 'Contact', 'Atelier à Libreville, sur rendez-vous. Pour une création, utilisez la demande sur mesure.')}
<section class="wrap ctg"><div class="info">
<div>${ic('pin', 22)}<h2>Atelier</h2><p>${CL.city}, Gabon<br>Sur rendez-vous</p></div>
<div>${ic('phone', 22)}<h2>Téléphone</h2><p><a href="${telHref(CL.tel)}">${CL.tel}</a><br>Appel et WhatsApp</p></div>
<div>${ic('mail', 22)}<h2>E-mail</h2><p><a href="mailto:${CL.mail}">${CL.mail}</a></p></div>
<div>${ic('clock', 22)}<h2>Réseaux</h2><p>Instagram @${CL.ig}<br>Facebook « ${CL.fb} »</p></div>
<div class="map"><iframe title="Plan de Libreville" src="https://www.google.com/maps?q=Libreville,+Gabon&z=12&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><p>L'adresse exacte de l'atelier vous est communiquée à la prise de rendez-vous.</p></div></div>
<form class="form" data-contact novalidate><h2 class="h3">Écrire à la maison</h2><p>Presse, défilé, collaboration, association : nous vous répondons rapidement.</p>
<label class="fld"><span>Objet</span><select name="objet"><option>Presse et interview</option><option>Défilé ou événement</option><option>Collaboration</option><option>Association des stylistes</option><option>Autre</option></select></label>
<div class="g2"><label class="fld"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="fld"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel"></label></div>
<label class="fld"><span>Message</span><textarea name="msg" rows="5" required></textarea></label>
<div class="row"><button class="btn r" type="submit">Envoyer sur WhatsApp</button><a class="btn line" href="mailto:${CL.mail}">Par e-mail</a></div></form></section>`,
}));

fs.writeFileSync(path.join(OUT, 'logo.svg'), MARK(64).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"').replace(' aria-hidden="true"', ''));
for (const f of ['lazare.css', 'lazare.js']) fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages));
console.log('ok', fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).length, 'pages');
