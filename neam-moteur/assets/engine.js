// Moteur de recherche NEAM Atelier : suggestions, résultats, fiche d'établissement.
(function () {
  const P = window.PROSPECTS || [];
  const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’&]/g, ' ').replace(/\s+/g, ' ').trim();
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SECT = { hotel: 'hotel hôtel hebergement chambre', resto: 'restaurant manger cuisine resto bar', beaute: 'beaute institut spa ongles coiffure soin', immo: 'immobilier maison appartement location villa sci', sante: 'sante medecin dentiste cabinet clinique laboratoire radiologie', voyage: 'voyage agence billet tourisme peche', auto: 'auto voiture garage pieces permis location vtc', ecole: 'ecole formation cours musique langues', luxe: 'luxe parfum bijoux mode cosmetique styliste', boutique: 'boutique cadeau fleurs jouets artisanat', services: 'services entreprise vtc consulting' };
  const hay = (p) => norm([p.n, p.main, p.s, p.c, SECT[p.k], p.handle].join(' '));

  function search(q) {
    const nq = norm(q); if (!nq) return [];
    const words = nq.split(' ').filter((w) => w.length > 1 || nq.length === 1);
    return P.map((p) => {
      const h = hay(p), name = norm(p.n), main = norm(p.main);
      let sc = 0;
      if (name === nq || main === nq) sc += 100;
      if (name.startsWith(nq) || main.startsWith(nq)) sc += 50;
      if (name.includes(nq)) sc += 30;
      for (const w of words) if (h.includes(w)) sc += 10; else sc -= 6;
      return { p, sc };
    }).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc).map((x) => x.p);
  }
  const ICON = {
    img: 'M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M15 9h.01',
    arrow: 'M5 12h14M13 6l6 6-6 6', pin: 'M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11zM12 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z', phone: 'M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A17 17 0 013 5a2 2 0 012-2', heart: 'M12 20s-8-4.6-8-10.2A4.8 4.8 0 0112 6a4.8 4.8 0 018 3.8C20 15.4 12 20 12 20z', check: 'M4 12l5 5L20 6', search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4', globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  };
  const ico = (n, s = 18, c = 'currentColor', w = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON[n]}"/></svg>`;
  const NET = { instagram: ['linear-gradient(135deg,#f58529,#dd2a7b,#8134af)', 'IG', 'Instagram', 'www.instagram.com'], tiktok: ['#000', 'TT', 'TikTok', 'www.tiktok.com'], facebook: ['#1877f2', 'f', 'Facebook', 'www.facebook.com'], linkedin: ['#0a66c2', 'in', 'LinkedIn', 'www.linkedin.com › company'] };
  const fav = (n) => `<span class="fav" style="background:${NET[n][0]}">${NET[n][1]}</span>`;
  const mini = (p) => `<span class="mini">${p.avatar}</span>`;
  const nf = (n) => (n >= 10000 ? (n / 1000).toFixed(1).replace('.', ',').replace(',0', '') + ' k' : n.toLocaleString('fr-FR'));
  const stars = (r) => '★★★★★'.slice(0, Math.round(r)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(r));
  const siteUrl = (p) => (p.custom ? `apercu.html?slug=${p.slug}` : `sites/${p.slug}/index.html`);
  const resUrl = (p, n = 'instagram') => (p.custom ? `apercu.html?slug=${p.slug}&v=reseaux` : `social.html?slug=${p.slug}&net=${n}`);
  const SLD = { 'carte.html': 'Plats, boissons et prix', 'reservation.html': 'Confirmation par WhatsApp', 'chambres.html': 'Photos, équipements et tarifs', 'restaurant.html': 'Cuisine et bar', 'soins.html': 'Prestations et tarifs', 'rendez-vous.html': 'Créneaux disponibles en ligne', 'annonces.html': 'Vente et location', 'estimer.html': 'Estimation gratuite', 'equipe.html': 'Nos praticiens', 'destinations.html': 'Séjours et circuits', 'sur-mesure.html': 'Devis sous 24 h', 'catalogue.html': 'Pièces par véhicule', 'flotte.html': 'Véhicules et tarifs', 'formules.html': 'Code, conduite, accéléré', 'inscription.html': 'En ligne en 2 minutes', 'services.html': 'Prestations et tarifs', 'formations.html': 'Programmes et tarifs', 'collection.html': 'Pièces et prix', 'boutique.html': 'Commande WhatsApp', 'devis.html': 'Réponse sous 24 h', 'a-propos.html': 'Notre histoire', 'galerie.html': 'Photos', 'contact.html': 'Adresse, horaires, plan' , 'expertises.html': 'Valeur vénale, bancaire, judiciaire', 'demande.html': 'Devis sous 48 h', 'residences.html': 'Logements et bureaux à louer', 'louer.html': 'Demande de location en ligne', 'gestion.html': 'Locataires, loyers, entretien', 'confier.html': 'Proposition sous 48 h'};
  const lead = (s) => s.split(':')[0].trim().replace(/[.\s]+$/, '');

  // ---------- Barre de recherche + suggestions ----------
  function bindSearch(box, onGo) {
    const input = box.querySelector('input'), list = box.querySelector('.sugg');
    let sel = -1, items = [];
    const go = (q) => onGo(q);
    const draw = () => {
      const q = input.value; items = q ? search(q).slice(0, 7) : [];
      sel = -1;
      list.innerHTML = items.map((p, i) => `<a href="recherche.html?q=${encodeURIComponent(p.n)}" data-i="${i}">${mini(p)}<span>${esc(p.n)} <small>· ${esc(p.s)}, ${esc(p.c)}</small></span></a>`).join('');
      box.classList.toggle('open', items.length > 0 && document.activeElement === input);
    };
    input.addEventListener('input', draw);
    input.addEventListener('focus', draw);
    input.addEventListener('blur', () => setTimeout(() => box.classList.remove('open'), 150));
    input.addEventListener('keydown', (e) => {
      const as = list.querySelectorAll('a');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + as.length) % as.length; as.forEach((a, i) => a.classList.toggle('on', i === sel)); if (items[sel]) input.value = items[sel].n; }
      if (e.key === 'Enter') { e.preventDefault(); go(input.value); }
    });
    box.querySelector('.go')?.addEventListener('click', () => go(input.value));
  }
  window.NEAM = { search, bindSearch, P };

  // ---------- Page de résultats ----------
  function resultsPage() {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    const tab = params.get('tab') || 'tous';
    const box = document.querySelector('.sbox');
    box.querySelector('input').value = q;
    document.title = q + ' — NEAM Atelier';
    bindSearch(box, (v) => { location.href = 'recherche.html?q=' + encodeURIComponent(v); });
    document.querySelectorAll('.tabs a').forEach((a) => { a.classList.toggle('on', a.dataset.t === tab); a.href = `recherche.html?q=${encodeURIComponent(q)}&tab=${a.dataset.t}`; });
    const found = search(q);
    const out = document.getElementById('out');
    if (!found.length) { out.innerHTML = `<div class="cols"><div class="main"><div class="none">Aucun résultat pour <b>${esc(q)}</b>.<br>Essayez le nom d'une entreprise, un métier (« hôtel », « dentiste ») ou une ville.</div></div></div>`; return; }
    if (tab === 'images') { out.innerHTML = `<div class="imgs">${found.slice(0, 12).flatMap((p) => p.photos.slice(0, 3).map((ph) => `<a href="${siteUrl(p)}"><span style="background-image:url('${ph}')"></span>${esc(p.n)}</a>`)).join('')}</div>`; return; }
    const top = found[0];
    const GEN = new Set((Object.values(SECT).join(' ') + ' libreville port gentil franceville oyem lambarene akanda cap esterias pointe denis gabon a de la le les des du et').split(' ').map(norm));
    const generic = norm(q).split(' ').every((w) => GEN.has(w));
    const exact = !generic && norm(q).length > 2 && (norm(top.n).includes(norm(q)) || norm(q).includes(norm(top.main)) || norm(top.main).includes(norm(q)));
    const n = 1200 + (top.slug.length * 397) % 9000;
    if (exact) out.innerHTML = `<div class="cols"><div class="main"><div class="stat">Environ ${n.toLocaleString('fr-FR')} résultats (0,${30 + (top.slug.length % 60)} secondes)</div>${business(top)}${found.length > 1 ? `<div><div style="font-size:20px;margin-bottom:12px">Autres résultats</div>${found.slice(1, 4).map(siteRes).join('<div style="height:22px"></div>')}</div>` : ''}</div>${panel(top)}</div>`;
    else out.innerHTML = `<div class="cols"><div class="main"><div class="stat">Environ ${(found.length * 1730).toLocaleString('fr-FR')} résultats (0,4${found.length % 10} secondes)</div>${pack(found.slice(0, 3), q)}${found.slice(0, 10).map(siteRes).join('')}</div></div>`;
  }

  const siteRes = (p) => `<div class="res"><div class="src">${mini(p)}<div><div>${esc(p.n)}</div><div class="url">https://www.${esc(p.domain)}</div></div></div><h3><a href="${siteUrl(p)}">${esc(p.n)} — ${esc(p.s)} à ${esc(p.c)} | ${esc(p.tagline)}</a></h3><p>${esc(p.intro)}</p></div>`;

  function pack(list, q) {
    const pins = list.map((p, i) => `<span class="pin" style="left:${18 + i * 28 + (p.slug.length % 7) * 2}%;top:${30 + ((p.slug.length * 13) % 40)}%"><i></i></span>`).join('');
    const roads = '<svg width="100%" height="100%" style="position:absolute;inset:0"><path d="M-10 120 C 120 60, 260 160, 700 80" stroke="#fff" stroke-width="10" fill="none"/><path d="M180 -10 C 220 80, 160 140, 260 200" stroke="#fff" stroke-width="7" fill="none"/><path d="M420 -10 L 470 200" stroke="#fde68a" stroke-width="6" fill="none"/><rect x="520" y="20" width="120" height="70" rx="8" fill="#cfe8d4"/></svg>';
    return `<div class="pack"><div class="map">${roads}${pins}</div>${list.map((p) => `<a class="it" href="recherche.html?q=${encodeURIComponent(p.n)}"><div style="flex:1"><div style="font-size:16px;color:var(--link)">${esc(p.n)}</div><div style="font-size:13px;color:#70757a">${p.r ? `${String(p.r).replace('.', ',')} <span class="stars">${stars(p.r)}</span> (${p.v}) · ` : 'Aucun avis · '}${esc(p.s)}</div><div style="font-size:13px;color:#70757a">${esc(p.c)} · <span class="ok">Ouvert</span> · ${esc(p.hours[0])}</div></div><span class="ph" style="background-image:url('${p.photos[0]}')"></span></a>`).join('')}<div style="padding:12px 16px;border-top:1px solid #ebebeb;font-size:14px;color:var(--blue)">Plus de lieux → « ${esc(q)} »</div></div>`;
  }

  function business(p) {
    const links = {
      hotel: [['Chambres & tarifs', 'Standard, Supérieure, Suite'], ['Réserver', 'Disponibilités en temps réel'], ['Restaurant', 'Cuisine locale et internationale'], ['Accès', p.address]],
      resto: [['La carte', 'Plats, boissons et desserts'], ['Réserver une table', 'Confirmation immédiate'], ['Galerie', 'Photos de la salle et des plats'], ['Horaires & accès', p.hours[1]]],
      sante: [['Prendre rendez-vous', 'Créneaux disponibles en ligne'], ['Nos soins', 'Toutes nos spécialités'], ['Le praticien', 'Présentation de l\'équipe'], ['Infos pratiques', p.hours[1]]],
      immo: [['Acheter', 'Villas, appartements, terrains'], ['Louer', 'Biens meublés et vides'], ['Estimer mon bien', 'Estimation gratuite'], ['Contact', p.t]],
    }[p.k] || [['Nos services', p.items.join(', ')], [p.cta, 'En ligne ou par WhatsApp'], ['À propos', lead(p.intro).slice(0, 60)], ['Contact', `${p.t} · ${p.c}`]];
    const desc = {
      instagram: `${p.ig ? nf(p.ig) + ' followers' : 'Nouveau compte'} — ${p.s} · ${p.c}. ${p.tagline}.`, facebook: `${p.n}, ${p.c}. ${p.fb ? nf(p.fb) + " J'aime" : 'Nouvelle page'} · ${p.s}. ${lead(p.intro)}.`,
      tiktok: `${p.main} sur TikTok : coulisses, nouveautés et bons plans à ${p.c}.`, linkedin: `${p.n} | ${p.s} · ${p.c}, Gabon. Actualités et offres d'emploi.`,
    };
    const net = (n) => `<div class="res"><div class="src">${fav(n)}<div><div>${NET[n][2]}</div><div class="url">https://${NET[n][3]} › ${esc(p.handle)}</div></div></div><h3><a href="${resUrl(p, n)}">${esc(p.main)} (@${esc(p.handle)}) • ${NET[n][2]}</a></h3><p>${esc(desc[n])}</p></div>`;
    return `<div class="res"><div class="src">${mini(p)}<div><div>${esc(p.n)}</div><div class="url">https://www.${esc(p.domain)}</div></div></div><h3><a href="${siteUrl(p)}">${esc(p.n)} — ${esc(p.s)} à ${esc(p.c)} | ${esc(p.tagline)}</a>${p.sig ? '<span class="badge">expérience immersive</span>' : ''}</h3><p>${esc(p.intro)}</p><div class="sitelinks">${(p.pages && !p.custom ? p.pages.slice(0, 6).map(([f, t]) => [t, f]) : links.map(([t]) => [t, ''])).map(([t, f]) => `<a href="${f ? 'sites/' + p.slug + '/' + f : siteUrl(p)}"><b>${esc(t)}</b>${esc(SLD[f] || '')}</a>`).join('')}</div></div>
      ${net('instagram')}${net('facebook')}
      <div><div style="font-size:20px;margin-bottom:12px">Profils sur les réseaux</div><div class="prof">${['instagram', 'tiktok', 'facebook', 'linkedin'].map((n) => `<a href="${resUrl(p, n)}">${fav(n)}<b>${NET[n][2]}</b>@${esc(p.handle)}</a>`).join('')}</div></div>
      ${net('tiktok')}${net('linkedin')}
`;
  }

  // Avis clients types par secteur (fiche Google après accompagnement)
  const REV = {
    resto: ['Cuisine excellente et service rapide. Les portions sont généreuses, on reviendra !', 'Cadre très agréable, idéal en famille. La réservation par WhatsApp est super pratique.', 'Très bon rapport qualité-prix, mention spéciale au dessert.'],
    hotel: ['Chambre impeccable, personnel aux petits soins. Le petit-déjeuner est top.', 'Réservation simple sur le site, confirmation immédiate. Séjour parfait.', 'Très calme, bien situé. Je recommande pour les voyages d\'affaires.'],
    beaute: ['Accueil chaleureux et résultat magnifique. Prise de rendez-vous en ligne très pratique.', 'Personnel professionnel, salon propre et relaxant.', 'Je ressors toujours ravie, les tarifs sont clairs.'],
    sante: ['Équipe à l\'écoute, rendez-vous obtenu rapidement en ligne.', 'Cabinet moderne et très propre. Explications claires.', 'Peu d\'attente, praticiens rassurants. Je recommande.'],
    immo: ['Agence sérieuse, j\'ai trouvé mon appartement en deux semaines.', 'Très bon suivi, visites organisées rapidement.', 'Estimation juste et vente réalisée dans les délais.'],
    voyage: ['Voyage parfaitement organisé, du billet à l\'hôtel.', 'Équipe réactive sur WhatsApp, devis reçu en 24 h.', 'Très bons conseils, je repasse par eux pour les prochaines vacances.'],
    auto: ['Service rapide et devis respecté. Merci !', 'Véhicule propre et en parfait état.', 'Équipe compétente et honnête, je recommande.'],
    ecole: ['Formation de qualité, formateurs disponibles.', 'Inscription simple, suivi sérieux des élèves.', 'Mon enfant progresse vraiment, merci à l\'équipe.'],
  };
  const WHO = ['Nadège M.', 'Christian O.', 'Larissa N.', 'Patrick E.', 'Gisèle B.', 'Junior M.'];

  function panel(p) {
    const S = window.NEAMSCORE, pr = S ? S.proj(p) : { r: p.r, v: p.v };
    const rating = pr.r ? `<b style="color:#202124">${String(pr.r).replace('.', ',')}</b> <span class="stars">${stars(pr.r)}</span> ${pr.v} avis Google` : 'Aucun avis pour l\'instant';
    const maps = `https://www.google.com/maps/search/${encodeURIComponent(p.n + ' ' + p.c + ' Gabon')}`;
    const ctaPage = (p.pages || []).find(([f]) => /reserv|rendez|inscri|devis|sur-mesure|contact/.test(f));
    const cta = ctaPage && !p.custom ? `sites/${p.slug}/${ctaPage[0]}` : siteUrl(p);
    const h = p.slug.length;
    const revs = (REV[p.k] || REV.auto).map((t, i) => ({ who: WHO[(h + i) % WHO.length], t, d: ['il y a 2 jours', 'il y a 1 semaine', 'il y a 3 semaines'][i] }));
    const qa = [[`Peut-on ${p.k === 'resto' ? 'réserver une table' : p.k === 'hotel' ? 'réserver une chambre' : 'prendre rendez-vous'} en ligne ?`, `Oui, directement sur ${p.domain} ou par WhatsApp au ${p.t}. Confirmation rapide.`], ['Quels sont vos horaires ?', `${p.hours[1]}.`]];
    return `<aside class="kp"><div class="phs">${p.photos.slice(0, 3).map((ph) => `<div style="background-image:url('${ph}')"></div>`).join('')}<span class="nph">${ico('img', 14, '#fff')} ${18 + (h % 20)} photos</span></div>
    <div class="in"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><h2>${esc(p.n)}</h2><span class="mini" style="width:46px;height:46px;border-radius:10px">${p.avatar}</span></div><div style="margin:6px 0;color:#70757a">${rating}</div><div style="color:#70757a">${esc(p.s)} à ${esc(p.c)}</div><div class="claim" style="margin-top:8px;font-size:12px;color:#188038;display:flex;gap:6px;align-items:center">${ico('check', 14, '#188038', 2.4)} Établissement revendiqué par le propriétaire</div></div>
    <div class="acts"><a href="${siteUrl(p)}"><i>${ico('globe')}</i>Site Web</a><a href="${maps}" target="_blank" rel="noopener"><i>${ico('pin')}</i>Itinéraire</a><a href="${cta}"><i>${ico('check')}</i>${esc(p.cta.length > 14 ? p.cta.split(' ')[0] : p.cta)}</a><a href="tel:+241${p.t.replace(/\D/g, '').replace(/^0/, '')}"><i>${ico('phone')}</i>Appeler</a></div>
    <div class="in info"><div class="row" style="color:#4d5156">${esc(lead(p.intro))}.</div><div class="row"><b>Adresse : </b>${esc(p.address)}</div><div class="row"><b>Horaires : </b><span class="ok">Ouvert</span> · ${esc(p.hours[0])} <span style="color:#70757a">(${esc(p.hours[1])})</span></div><div class="row"><b>Téléphone : </b>${esc(p.t)}</div><div class="row"><b>${esc(p.cta)} : </b><a style="color:var(--link)" href="${cta}">${esc(p.domain)}</a></div><div class="row"><b>Profils : </b><a style="color:var(--link)" href="${resUrl(p)}">Instagram · TikTok · Facebook · LinkedIn</a></div>${p.d ? `<div class="row"><b>Direction : </b>${esc(p.d)}</div>` : ''}</div>
    <div class="in qa"><div class="kh">Questions et réponses</div>${qa.map(([q, a]) => `<div class="q"><b>${esc(q)}</b><p><span class="own">Réponse du propriétaire</span> ${esc(a)}</p></div>`).join('')}</div>
    <div class="in rvw"><div class="kh">Avis</div>${revs.map((r) => `<div class="rv1"><div class="rh"><span class="ri">${r.who[0]}</span><b>${esc(r.who)}</b><span class="stars">★★★★★</span><small>${r.d}</small></div><p>${esc(r.t)}</p><div class="rep"><b>Réponse du propriétaire</b> Merci ${esc(r.who.split(' ')[0])} pour votre confiance, toute l'équipe de ${esc(p.main)} est ravie. À très bientôt !</div></div>`).join('')}</div>
    <div class="in gposts" style="padding-top:0"><div class="kh">Posts de ${esc(p.main)}</div><div class="posts">${[3, 4].map((i, k) => `<div><span style="background-image:url('${p.photos[i] || p.photos[0]}')"></span><p>${k ? 'Nouveau : ' + esc(p.items[0]) : esc(p.tagline)}</p></div>`).join('')}</div></div>
    ${p.custom ? '' : `<a class="dsc" href="score.html?slug=${p.slug}">Digital score NEAM <b>${p.sc || 0} → ${S ? S.after(p).total : 95}/100</b> · voir le plan ›</a>`}</aside>`;
  }


  if (document.body.dataset.page === 'results') resultsPage();
})();
