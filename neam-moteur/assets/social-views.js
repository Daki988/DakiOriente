// Pages des menus des réseaux (fil, recherche, découvrir, reels, messages, notifications, créer, vidéos,
// amis, marketplace, pour toi, explorer, suivis, LIVE, réseau, emplois, messagerie, publier).
// Le compte connecté est celui de l'entreprise (géré par NEAM) ; les autres comptes sont les autres prospects.
(function () {
  const VIEWS = {};
  const PRO = window.PROSPECTS || [], SOC = window.SOCIAL || {};
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nf = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' M' : n >= 1e4 ? (n / 1e3).toFixed(1).replace('.', ',').replace(',0', '') + ' k' : n >= 1000 ? (n / 1000).toFixed(1).replace('.', ',').replace(',0', '') + ' k' : String(n));
  const pick = (arr, seed, n) => Array.from({ length: Math.min(n, arr.length) }, (_, i) => arr[(seed + i * 7) % arr.length]);
  const PEOPLE = ['Marie Nguema', 'Junior Mba', 'Lyne Ondo', 'Kévin Obame', 'Stessy Mouele', 'Paola Moussavou', 'Fabrice Ella', 'Nadia Essono', 'Chris Mboumba', 'Grâce Oyane', 'Yannick Nzé', 'Sandra Bekale', 'Hervé Mintsa', 'Prisca Nzamba', 'Aïcha Bongo', 'Rodrigue Koumba'];
  const user = (n) => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '.');
  const COLORS = ['#e1306c', '#0866ff', '#00a86b', '#f39c12', '#8e44ad', '#16a085', '#c0392b', '#2c3e50'];
  const ini = (n, s = 40) => `<span class="ini" style="width:${s}px;height:${s}px;font-size:${Math.round(s / 2.6)}px;background:${COLORS[n.length % COLORS.length]}">${esc(n.split(/[ ._]/).map((x) => x[0]).join('').slice(0, 2).toUpperCase())}</span>`;
  const av = (p, s) => `<span class="av" style="width:${s}px;height:${s}px">${p.avatar}</span>`;
  const img = (u, cls = 'vimg') => `<div class="${cls}" style="background-image:url('${u}')"></div>`;
  const AGO = ['2 min', '14 min', '1 h', '3 h', '5 h', '8 h', '1 j', '2 j', '3 j', '5 j', '1 sem.'];

  // Publications de tout l'écosystème (chaque prospect est un compte)
  function feedOf(ctx, n = 14) {
    const out = [];
    const others = PRO.filter((p) => p.slug !== ctx.P.slug);
    for (let i = 0; out.length < n && i < 200; i++) {
      const p = i % 4 === 3 ? ctx.P : others[(ctx.HS + i * 11) % others.length];
      const posts = ((SOC[p.slug] || {}).posts || []).filter((x) => x.kind !== 'card');
      if (!posts.length) continue;
      const post = posts[(i * 3 + ctx.HS) % posts.length];
      out.push({ p, post, ago: AGO[i % AGO.length], likes: post.likes + ((ctx.HS + i) % 90) });
    }
    return out;
  }
  // Conversations de clients adaptées au métier
  const ASK = { resto: ['Bonsoir, il vous reste une table pour 4 ce samedi ?', 'Vous livrez à Akanda ?', 'Le menu du jour, c\'est quoi aujourd\'hui ?'], hotel: ['Bonjour, une chambre est libre du 12 au 15 ?', 'La navette aéroport est incluse ?', 'Le petit-déjeuner est servi à quelle heure ?'], beaute: ['Bonjour, un créneau demain après-midi ?', 'Le soin visage dure combien de temps ?', 'Vous faites les tresses le dimanche ?'], immo: ['Bonjour, l\'appartement F3 est toujours disponible ?', 'On peut visiter cette semaine ?', 'Quel est le montant de la caution ?'], sante: ['Bonjour, un rendez-vous possible lundi ?', 'Vous acceptez la CNAMGS ?', 'Faut-il venir à jeun ?'], voyage: ['Bonjour, un devis pour Dubaï en décembre ?', 'Vous vous occupez du visa ?', 'Paiement en deux fois possible ?'], auto: ['Bonjour, vous avez des plaquettes pour un Hilux 2018 ?', 'Un rendez-vous pour une vidange demain ?', 'La location 4x4 c\'est combien par jour ?'], ecole: ['Bonjour, les inscriptions sont encore ouvertes ?', 'Il y a un cours d\'essai ?', 'Quels sont les horaires ?'], luxe: ['Bonjour, la pièce est disponible en boutique ?', 'Vous livrez ce week-end ?', 'Un emballage cadeau est possible ?'], boutique: ['Bonjour, livraison possible aujourd\'hui ?', 'Il vous en reste en stock ?', 'Vous acceptez Airtel Money ?'], services: ['Bonjour, un devis pour 20 salariés ?', 'Vous intervenez à Owendo ?', 'Disponible demain matin ?'] };
  const REPLY = 'Bonjour 😊 Merci pour votre message ! Oui, c\'est possible. Nous vous envoyons tous les détails ici même dans quelques instants.';
  function convos(ctx) {
    const asks = ASK[ctx.P.k] || ASK.services;
    return pick(PEOPLE, ctx.HS, 7).map((n, i) => ({ n, msg: asks[i % asks.length], ago: AGO[i], unread: i < 2 }));
  }
  function inbox(ctx, cls) {
    const C = convos(ctx);
    const list = C.map((c, i) => `<a class="cv${i === 0 ? ' on' : ''}${c.unread ? ' un' : ''}" data-c="${i}">${ini(c.n, 52)}<div><b>${esc(c.n)}</b><small>${esc(c.msg)} · ${c.ago}</small></div>${c.unread ? '<i></i>' : ''}</a>`).join('');
    const H = `<div class="${cls} inbox"><aside class="il"><div class="ih"><b>${esc(ctx.handle)}</b><span>✎</span></div><div class="isr">🔍 Rechercher</div>${list}</aside><section class="ic"></section></div>`;
    setTimeout(() => {
      const open = (i) => {
        const c = C[i]; document.querySelectorAll('.inbox .cv').forEach((e) => e.classList.toggle('on', +e.dataset.c === i));
        const box = document.querySelector('.inbox .ic');
        box.innerHTML = `<div class="ich"><span class="mob-back">‹</span>${ini(c.n, 40)}<div><b>${esc(c.n)}</b><small>Actif(ve) il y a ${c.ago}</small></div></div><div class="msgs"><div class="m in">${esc(c.msg)}</div><div class="m out">${REPLY}</div></div><form class="send"><input placeholder="Votre message…"><button>Envoyer</button></form>`;
        box.closest('.inbox').classList.add('chat');
        box.querySelector('.mob-back').onclick = () => box.closest('.inbox').classList.remove('chat');
        box.querySelector('.send').onsubmit = (e) => { e.preventDefault(); const v = e.target[0].value.trim(); if (!v) return; const m = box.querySelector('.msgs'); m.insertAdjacentHTML('beforeend', `<div class="m out">${esc(v)}</div>`); e.target[0].value = ''; setTimeout(() => { m.insertAdjacentHTML('beforeend', `<div class="m in">Merci, c'est noté 🙏</div>`); m.scrollTop = 1e6; }, 900); m.scrollTop = 1e6; };
      };
      document.querySelectorAll('.inbox .cv').forEach((e) => e.onclick = () => open(+e.dataset.c));
      if (innerWidth > 860) open(0);
    });
    return H;
  }
  function notifs(ctx, cls) {
    const own = ctx.POSTS.filter((p) => p.kind !== 'card');
    const N = pick(PEOPLE, ctx.HS + 3, 12).map((n, i) => {
      const post = own[i % own.length];
      const k = i % 4;
      const txt = k === 0 ? 'a aimé votre publication.' : k === 1 ? 'a commencé à vous suivre.' : k === 2 ? `a commenté : « ${['Trop beau 😍', 'Je passe ce week-end !', 'Vous êtes où exactement ?', 'Top 👏🏾'][i % 4]} »` : 'a partagé votre publication.';
      return `<div class="nt">${ini(n, 44)}<p><b>${esc(user(n))}</b> ${txt} <small>${AGO[i % AGO.length]}</small></p>${k === 1 ? '<button class="fb-follow" data-follow>Suivre</button>' : post ? img(post.imgs[0], 'nth') : ''}</div>`;
    }).join('');
    setTimeout(() => document.querySelectorAll('[data-follow]').forEach((b) => b.onclick = () => { b.classList.toggle('done'); b.textContent = b.classList.contains('done') ? 'Suivi(e)' : 'Suivre'; }));
    return `<div class="${cls} notifs"><h2>Notifications</h2><h4>Aujourd'hui</h4>${N}</div>`;
  }
  // Modale image (Découvrir, Explorer, Marketplace…)
  function viewer(u, title, sub) {
    const m = document.createElement('div'); m.className = 'vmodal';
    m.innerHTML = `<div class="vin"><button class="x">×</button>${img(u, 'vbig')}<div class="vtx"><b>${esc(title)}</b><p>${esc(sub || '')}</p></div></div>`;
    m.onclick = (e) => { if (e.target === m || e.target.classList.contains('x')) m.remove(); };
    document.body.appendChild(m);
  }
  const likeable = () => setTimeout(() => {
    document.querySelectorAll('[data-like]').forEach((b) => b.onclick = () => { b.classList.toggle('liked'); const c = b.closest('.fp')?.querySelector('[data-n]'); if (c) c.textContent = nf(+c.dataset.n + (b.classList.contains('liked') ? 1 : 0)); });
    document.querySelectorAll('.fp .vimg').forEach((e) => e.ondblclick = () => e.closest('.fp').querySelector('[data-like]')?.click());
    document.querySelectorAll('[data-view]').forEach((e) => e.onclick = () => viewer(e.dataset.view, e.dataset.t, e.dataset.s));
    document.querySelectorAll('[data-toast]').forEach((e) => e.onclick = () => window.SOCIALUI.toast(e.dataset.toast));
  });
  const ownLink = (ctx, p, net) => `social.html?slug=${p.slug}&net=${net}`;

  // ================= INSTAGRAM =================
  VIEWS.instagram = {
    home(ctx) {
      const F = feedOf(ctx, 12);
      const stories = PRO.filter((p) => p.slug !== ctx.P.slug).slice((ctx.HS % 40), (ctx.HS % 40) + 8);
      likeable();
      return `<div class="vw ig-home"><div class="stories"><a class="st me">${ctx.AV(62)}<small>Votre story</small></a>${stories.map((p) => `<a class="st" href="${ownLink(ctx, p, 'instagram')}"><span class="rg">${av(p, 58)}</span><small>${esc(p.handle)}</small></a>`).join('')}</div>
        ${F.map(({ p, post, ago, likes }) => `<article class="fp"><header><a href="${ownLink(ctx, p, 'instagram')}">${av(p, 34)}<b>${esc(p.handle)}</b></a><small>• ${ago}</small><span class="dots">⋯</span></header>${img(post.imgs[0])}<div class="acts"><button data-like>♡</button><button>💬</button><button>➤</button><button class="sv">🔖</button></div><div class="tx"><b data-n="${likes}">${nf(likes)}</b> J'aime</div><div class="tx"><b>${esc(p.handle)}</b> ${esc(post.cap)}</div><div class="tx mut">Voir les ${post.comments.length} commentaires</div></article>`).join('')}</div>`;
    },
    search(ctx) {
      setTimeout(() => { const i = document.querySelector('.ig-search input'), r = document.querySelector('.ig-search .res'); const draw = () => { const q = i.value.toLowerCase(); r.innerHTML = PRO.filter((p) => !q || (p.n + ' ' + p.handle + ' ' + p.s).toLowerCase().includes(q)).slice(0, 12).map((p) => `<a class="acc" href="${ownLink(ctx, p, 'instagram')}">${av(p, 44)}<div><b>${esc(p.handle)}</b><small>${esc(p.n)} • ${esc(p.s)}</small></div></a>`).join(''); }; i.oninput = draw; draw(); i.focus(); });
      return `<div class="vw ig-search"><h2>Recherche</h2><input placeholder="Rechercher"><h4>Récent</h4><div class="res"></div></div>`;
    },
    explore(ctx) {
      const F = feedOf(ctx, 24); likeable();
      return `<div class="vw ig-explore"><div class="xgrid">${F.map(({ p, post }, i) => `<a class="xt${i % 10 === 2 ? ' big' : ''}" data-view="${post.imgs[0]}" data-t="${esc(p.handle)}" data-s="${esc(post.cap)}">${img(post.imgs[0])}${post.kind === 'reel' ? '<i>▶</i>' : ''}</a>`).join('')}</div></div>`;
    },
    reels(ctx) {
      const F = feedOf(ctx, 10); likeable();
      return `<div class="vw reels">${F.map(({ p, post, likes }) => `<section class="reel fp">${img(post.imgs[0], 'vimg kb')}<div class="rinfo"><a href="${ownLink(ctx, p, 'instagram')}">${av(p, 32)}<b>${esc(p.handle)}</b></a><button class="fol">Suivre</button><p>${esc(post.cap)}</p><small>♫ Son original · ${esc(p.handle)}</small></div><div class="ract"><button data-like>♡</button><b data-n="${likes}">${nf(likes)}</b><button>💬</button><b>${post.comments.length}</b><button>➤</button><button>⋯</button></div></section>`).join('')}</div>`;
    },
    messages: (ctx) => inbox(ctx, 'vw ig-inbox'),
    notifications: (ctx) => notifs(ctx, 'vw ig-notifs'),
    create(ctx) {
      const pics = [...new Set(ctx.POSTS.filter((p) => p.kind !== 'card').map((p) => p.imgs[0]))].slice(0, 9);
      setTimeout(() => { document.querySelectorAll('.cr-pick a').forEach((a) => a.onclick = () => { document.querySelectorAll('.cr-pick a').forEach((x) => x.classList.toggle('on', x === a)); document.querySelector('.cr-prev').style.backgroundImage = `url('${a.dataset.u}')`; }); document.querySelector('.cr-go').onclick = () => { window.SOCIALUI.toast('Publication partagée sur ' + ctx.handle + ' ✓'); setTimeout(() => location.href = `social.html?slug=${ctx.P.slug}&net=instagram`, 900); }; });
      return `<div class="vw create"><h2>Créer une publication</h2><div class="cr"><div class="cr-prev" style="background-image:url('${pics[0]}')"></div><div class="cr-side"><div class="who">${ctx.AV(28)}<b>${esc(ctx.handle)}</b></div><textarea placeholder="Écrivez une légende…">${esc(ctx.P.tagline)} 📍 ${esc(ctx.P.c)}</textarea><div class="cr-pick">${pics.map((u, i) => `<a class="${i ? '' : 'on'}" data-u="${u}" style="background-image:url('${u}')"></a>`).join('')}</div><button class="cr-go">Partager</button></div></div></div>`;
    },
  };

  // ================= FACEBOOK =================
  VIEWS.facebook = {
    home(ctx) {
      const F = feedOf(ctx, 10); likeable();
      return `<div class="vw fb-home"><div class="card comp">${ctx.AV(40)}<span>Quoi de neuf, ${esc(ctx.name)} ?</span></div><div class="fstories">${F.slice(0, 5).map(({ p, post }) => `<a class="fst" href="${ownLink(ctx, p, 'facebook')}">${img(post.imgs[0])}${av(p, 36)}<b>${esc(p.n)}</b></a>`).join('')}</div>
        ${F.map(({ p, post, ago, likes }) => `<article class="card fp"><header><a href="${ownLink(ctx, p, 'facebook')}">${av(p, 40)}<div><b>${esc(p.n)}</b><small>${ago} · 🌍</small></div></a><span class="dots">⋯</span></header><p>${esc(post.cap)}</p>${img(post.imgs[0])}<div class="cnt"><span>👍❤️ <b data-n="${likes}">${nf(likes)}</b></span><span>${post.comments.length} commentaires</span></div><div class="fba"><button data-like>👍 J'aime</button><button>💬 Commenter</button><button>↗ Partager</button></div></article>`).join('')}</div>`;
    },
    video(ctx) {
      const F = feedOf(ctx, 8); likeable();
      return `<div class="vw fb-home"><h2>Vidéos</h2>${F.map(({ p, post, ago, likes }) => `<article class="card fp"><header><a href="${ownLink(ctx, p, 'facebook')}">${av(p, 40)}<div><b>${esc(p.n)}</b><small>${ago} · 🌍</small></div></a></header><p>${esc(post.cap)}</p><div class="vid">${img(post.imgs[0], 'vimg kb')}<span class="play">▶</span><span class="dur">0:${10 + (likes % 49)}</span></div><div class="fba"><button data-like>👍 J'aime</button><button>💬 Commenter</button><button>↗ Partager</button></div></article>`).join('')}</div>`;
    },
    friends(ctx) {
      setTimeout(() => document.querySelectorAll('.frd button').forEach((b) => b.onclick = () => { b.textContent = b.textContent.includes('Ajouter') ? 'Invitation envoyée' : b.textContent; b.disabled = true; }));
      return `<div class="vw fb-friends"><h2>Invitations</h2><div class="frgrid">${pick(PEOPLE, ctx.HS, 4).map((n) => `<div class="frd">${ini(n, 120)}<b>${esc(n)}</b><small>${2 + n.length % 9} ami(e)s en commun</small><button class="blue">Confirmer</button><button>Supprimer</button></div>`).join('')}</div><h2>Suggestions</h2><div class="frgrid">${pick(PEOPLE, ctx.HS + 5, 8).map((n) => `<div class="frd">${ini(n, 120)}<b>${esc(n)}</b><small>${1 + n.length % 7} ami(e)s en commun</small><button class="blue">Ajouter</button></div>`).join('')}</div></div>`;
    },
    marketplace(ctx) {
      const items = PRO.flatMap((p) => ((SOC[p.slug] || {}).posts || []).filter((x) => x.kind === 'photo').slice(0, 1).map((x) => ({ p, x }))).slice(ctx.HS % 20, (ctx.HS % 20) + 24);
      likeable();
      return `<div class="vw fb-market"><h2>Marketplace</h2><div class="chips"><a class="on">Tout</a><a>Véhicules</a><a>Immobilier</a><a>Maison</a><a>Mode</a><a>Loisirs</a></div><h4>Sélection du jour · ${esc(ctx.P.c)}</h4><div class="mgrid">${items.map(({ p, x }) => { const pr = (x.cap.match(/(\d[\d\s ]*\d)\s*FCFA/) || [])[1]; return `<a class="mi2" data-view="${x.imgs[0]}" data-t="${esc(p.n)}" data-s="${esc(x.cap)}">${img(x.imgs[0])}<b>${pr ? pr + ' FCFA' : 'Sur demande'}</b><span>${esc(x.cap.replace(/^[^A-Za-zÀ-ÿ0-9]+/, '').split(/[.—!]/)[0])}</span><small>${esc(p.c)}</small></a>`; }).join('')}</div></div>`;
    },
    notifications: (ctx) => notifs(ctx, 'vw fb-notifs card'),
    messages: (ctx) => inbox(ctx, 'vw fb-inbox'),
  };

  // ================= TIKTOK =================
  const ttFeed = (ctx, n, follow) => {
    const F = feedOf(ctx, n).filter((x, i) => !follow || i % 2 === 0); likeable();
    return `<div class="vw tt-fy">${F.map(({ p, post, likes }) => `<section class="ttv fp">${img(post.imgs[0], 'vimg kb')}<div class="tinfo"><a href="${ownLink(ctx, p, 'tiktok')}"><b>${esc(p.n)}</b></a><p>${esc(post.cap)} <span class="tags">${esc(post.tags)}</span></p><small>♫ son original - ${esc(p.handle)}</small></div><div class="tact"><a href="${ownLink(ctx, p, 'tiktok')}" class="tav">${av(p, 48)}<i>+</i></a><button data-like>❤</button><b data-n="${likes * 9}">${nf(likes * 9)}</b><button>💬</button><b>${post.comments.length * 7}</b><button>🔖</button><b>${nf(likes)}</b><button>↗</button><b>${nf(Math.round(likes / 3))}</b></div></section>`).join('')}</div>`;
  };
  VIEWS.tiktok = {
    foryou: (ctx) => ttFeed(ctx, 10),
    following: (ctx) => `<div class="tt-tabs"><a href="social.html?slug=${ctx.P.slug}&net=tiktok&v=following" class="on">Suivis</a><a href="social.html?slug=${ctx.P.slug}&net=tiktok&v=foryou">Pour toi</a></div>` + ttFeed(ctx, 12, true),
    explore(ctx) {
      const F = feedOf(ctx, 18); likeable();
      return `<div class="vw tt-explore"><div class="chips"><a class="on">Tout</a><a>Cuisine</a><a>Voyage</a><a>Beauté</a><a>Immobilier</a><a>Gabon</a><a>Bons plans</a></div><div class="egrid">${F.map(({ p, post, likes }) => `<a class="et" data-view="${post.imgs[0]}" data-t="${esc(p.n)}" data-s="${esc(post.cap)}">${img(post.imgs[0])}<span>▷ ${nf(likes * 14)}</span><p>${esc(post.cap.slice(0, 60))}</p><small>${av(p, 20)} ${esc(p.handle)}</small></a>`).join('')}</div></div>`;
    },
    messages(ctx) {
      return `<div class="vw tt-msgs"><h2>Boîte de réception</h2><div class="acts3"><a>${ini('Nouveaux abonnés', 48)}<b>Nouveaux abonnés</b><small>${pick(PEOPLE, ctx.HS, 1)[0]} a commencé à vous suivre</small></a><a>${ini('Activités', 48)}<b>Activités</b><small>${pick(PEOPLE, ctx.HS + 2, 1)[0]} a aimé votre vidéo</small></a></div>` + inbox(ctx, 'tt-inbox') + '</div>';
    },
    live(ctx) {
      const pic = ctx.POSTS.find((p) => p.kind !== 'card').imgs[0];
      setTimeout(() => { const box = document.querySelector('.lchat'); if (!box) return; const L = ['Bonsoir de Libreville 👋🏾', 'Trop beau !', 'C\'est combien ?', '🔥🔥🔥', 'Vous livrez à Owendo ?', 'Je viens samedi 😍', 'Bravo 👏🏾']; let i = 0; const t = setInterval(() => { if (!document.body.contains(box)) return clearInterval(t); const n = PEOPLE[(ctx.HS + i) % PEOPLE.length]; box.insertAdjacentHTML('beforeend', `<p><b>${esc(user(n))}</b> ${L[i % L.length]}</p>`); box.scrollTop = 1e6; const v = document.querySelector('.lviews'); if (v) v.textContent = (180 + i * 3) + ' spectateurs'; i++; }, 1400); });
      return `<div class="vw tt-live"><div class="lv">${img(pic, 'vimg kb')}<div class="lhead">${ctx.AV(36)}<b>${esc(ctx.name)}</b><span class="badge">LIVE</span><span class="lviews">180 spectateurs</span></div><div class="lchat"></div><form class="lsend" onsubmit="event.preventDefault();this.previousElementSibling.insertAdjacentHTML('beforeend','<p><b>vous</b> '+this[0].value.replace(/</g,'&lt;')+'</p>');this[0].value=''"><input placeholder="Ajouter un commentaire…"><button>❤</button></form></div></div>`;
    },
    create: (ctx) => VIEWS.instagram.create(ctx).replace('Créer une publication', 'Publier une vidéo').replace('Partager', 'Publier'),
  };

  // ================= LINKEDIN =================
  const JOBS = (ctx) => PRO.flatMap((p) => ((SOC[p.slug] || {}).jobs || []).map((t) => ({ p, t }))).sort((a, b) => (a.p.slug === ctx.P.slug ? -1 : b.p.slug === ctx.P.slug ? 1 : 0)).slice(0, 16);
  VIEWS.linkedin = {
    home(ctx) {
      const F = feedOf(ctx, 10); likeable();
      return `<div class="vw li-home"><aside class="lp card">${ctx.AV(64)}<b>${esc(ctx.name)}</b><small>${esc(ctx.P.s)} · ${esc(ctx.P.c)}</small><div class="ls"><span>Visiteurs du profil</span><b>${40 + ctx.HS % 200}</b></div><div class="ls"><span>Impressions des posts</span><b>${nf(800 + ctx.HS % 4000)}</b></div></aside><div class="lc"><div class="card comp">${ctx.AV(44)}<span>Commencer un post</span></div>${F.map(({ p, post, ago, likes }) => `<article class="card fp"><header><a href="${ownLink(ctx, p, 'linkedin')}">${av(p, 48)}<div><b>${esc(p.n)}</b><small>${nf(80 + likes)} abonnés</small><small>${ago} · 🌐</small></div></a><a class="flw" data-toast="Vous suivez ${esc(p.n)}">+ Suivre</a></header><p>${esc(post.cap)}</p>${img(post.imgs[0])}<div class="cnt"><span>👍❤️ <b data-n="${likes}">${nf(likes)}</b></span><span>${post.comments.length} commentaires</span></div><div class="fba"><button data-like>👍 J'aime</button><button>💬 Commenter</button><button>🔁 Republier</button><button>➤ Envoyer</button></div></article>`).join('')}</div></div>`;
    },
    network(ctx) {
      setTimeout(() => document.querySelectorAll('.nwc button').forEach((b) => b.onclick = () => { b.textContent = 'En attente'; b.disabled = true; }));
      const others = PRO.filter((p) => p.slug !== ctx.P.slug);
      return `<div class="vw li-net"><div class="card"><h3>Invitations (${3})</h3>${pick(PEOPLE, ctx.HS, 3).map((n) => `<div class="inv">${ini(n, 56)}<div><b>${esc(n)}</b><small>Responsable chez ${esc(others[n.length % others.length].n)}</small></div><button class="ign">Ignorer</button><button class="acc2">Accepter</button></div>`).join('')}</div><div class="card"><h3>Personnes que vous pourriez connaître à ${esc(ctx.P.c)}</h3><div class="nwg">${pick(PEOPLE, ctx.HS + 4, 8).map((n, i) => `<div class="nwc">${ini(n, 72)}<b>${esc(n)}</b><small>${['Directrice commerciale', 'Chargé de clientèle', 'Gérant', 'Responsable marketing'][i % 4]}</small><button>+ Se connecter</button></div>`).join('')}</div></div><div class="card"><h3>Pages à suivre</h3><div class="nwg">${pick(others, ctx.HS, 4).map((p) => `<a class="nwc" href="${ownLink(ctx, p, 'linkedin')}">${av(p, 72)}<b>${esc(p.n)}</b><small>${esc(p.s)}</small><button>+ Suivre</button></a>`).join('')}</div></div></div>`;
    },
    jobs(ctx) {
      const J = JOBS(ctx);
      setTimeout(() => { const show = (i) => { const j = J[i]; document.querySelectorAll('.jl a').forEach((a) => a.classList.toggle('on', +a.dataset.j === i)); document.querySelector('.jd').innerHTML = `<div class="jh">${av(j.p, 56)}<div><b>${esc(j.p.n)}</b><small>${esc(j.p.c)}, Gabon · il y a ${AGO[i % AGO.length]} · ${12 + i * 3} candidatures</small></div></div><h2>${esc(j.t)}</h2><div class="jt"><span>Sur site</span><span>Temps plein</span><span>Confirmé</span></div><button class="blue" data-toast="Candidature envoyée à ${esc(j.p.n)} ✓">Candidature simplifiée</button><h4>À propos de l'offre</h4><p>${esc(j.p.n)} recrute un(e) ${esc(j.t.toLowerCase())} à ${esc(j.p.c)}. Vous rejoindrez une équipe engagée, au service des clients, avec des perspectives d'évolution.</p><ul><li>Expérience de 2 ans minimum</li><li>Sens du service et de l'organisation</li><li>Maîtrise du français ; l'anglais est un plus</li></ul>`; likeable(); }; document.querySelectorAll('.jl a').forEach((a) => a.onclick = () => show(+a.dataset.j)); show(0); });
      return `<div class="vw li-jobs card"><div class="jl"><div class="jsr">🔍 Rechercher un emploi · ${esc(ctx.P.c)}</div>${J.map((j, i) => `<a data-j="${i}">${av(j.p, 48)}<div><b>${esc(j.t)}</b><span>${esc(j.p.n)}</span><small>${esc(j.p.c)}, Gabon (sur site)</small></div></a>`).join('')}</div><div class="jd"></div></div>`;
    },
    messaging: (ctx) => inbox(ctx, 'vw li-inbox card'),
    notifications: (ctx) => notifs(ctx, 'vw li-notifs card'),
    publish(ctx) {
      setTimeout(() => { document.querySelector('.pub-go').onclick = () => { window.SOCIALUI.toast('Post publié sur la page ' + ctx.name + ' ✓'); setTimeout(() => location.href = `social.html?slug=${ctx.P.slug}&net=linkedin`, 900); }; });
      return `<div class="vw li-pub card"><div class="who">${ctx.AV(48)}<div><b>${esc(ctx.name)}</b><small>Publier : tout le monde</small></div></div><textarea placeholder="De quoi souhaitez-vous discuter ?">${esc(ctx.P.n)} recrute et grandit à ${esc(ctx.P.c)} 🚀 Découvrez nos nouveautés et rejoignez l'aventure. #Gabon #emploi</textarea><div class="pub-pics">${[...new Set(ctx.POSTS.filter((p) => p.kind !== 'card').map((p) => p.imgs[0]))].slice(0, 4).map((u) => `<span style="background-image:url('${u}')"></span>`).join('')}</div><button class="pub-go blue">Publier</button></div>`;
    },
  };

  window.SOCIALVIEWS = VIEWS;
})();
