// Pages réseaux fidèles et interactives : Instagram, Facebook, TikTok, LinkedIn.
(function () {
  const q = new URLSearchParams(location.search);
  const NET = q.get('net') || 'instagram';
  const P = (window.PROSPECTS || []).find((x) => x.slug === q.get('slug')) || window.PROSPECTS[0];
  const SD = (window.SOCIAL || {})[P.slug] || { posts: [], highlights: [], jobs: [] };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NETCFG = (P.nets || {})[NET] || {};
  const ROOT = '';
  const pal = P.pal;
  const nf = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' M' : n >= 1e4 ? (n / 1e3).toFixed(1).replace('.', ',').replace(',0', '') + ' k' : n >= 1000 ? (n / 1000).toFixed(1).replace('.', ',').replace(',0', '') + ' k' : String(n));
  const handle = NETCFG.user || P.handle;
  const name = NETCFG.name || P.n;
  const site = 'sites/' + P.slug + '/index.html';
  const AV = (s) => `<span class="av" style="width:${s}px;height:${s}px">${P.avatar}</span>`;
  const COLORS = ['#e1306c', '#0866ff', '#00a86b', '#f39c12', '#8e44ad', '#16a085', '#c0392b', '#2c3e50'];
  const ini = (n, s = 32) => `<span class="ini" style="width:${s}px;height:${s}px;background:${COLORS[n.length % COLORS.length]}">${esc(n.split(/[ ._]/).map((x) => x[0]).join('').slice(0, 2).toUpperCase())}</span>`;
  const toast = (m) => { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); } t.textContent = m; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2000); };
  // Publications : celles du back-office d'abord, puis le contenu préparé par NEAM
  const extra = (NETCFG.posts || []).map((u) => ({ kind: 'photo', imgs: [u], cap: NETCFG.post || P.tagline, tags: '', likes: 12, comments: [], date: 'à l\'instant' }));
  const POSTS = extra.concat(SD.posts);
  const isCut = (u) => /\.webp$/.test(u);
  const bgImg = (u) => `background-image:url('${u}');${isCut(u) ? `background-color:${pal.soft};background-size:contain;background-repeat:no-repeat` : ''}`;
  const media = (p, i = 0) => p.kind === 'card' ? `<div class="cardpost" style="position:absolute;inset:0;background:linear-gradient(135deg,${pal.accent},${pal.accent2});font-family:'${P.font[0]}',serif;font-size:clamp(16px,2.2vw,30px)">${esc(p.cap.replace(/[^\p{L}\p{N}\s'’,.!?:-]/gu, '').slice(0, 90))}</div>` : `<div class="img ${p.kind === 'reel' ? 'kb' : ''}" style="${bgImg(p.imgs[i])}"></div>`;
  const I = {
    heart: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-8-4.8-8-11a4.6 4.6 0 018-3 4.6 4.6 0 018 3c0 6.2-8 11-8 11z"/></svg>',
    com: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.5 8.5 0 01-12.6 7.4L3 20l1.3-4.6A8.5 8.5 0 1121 11.5z"/></svg>',
    send: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3L9.2 10.1M22 3l-7 18-3.8-8.9L2 8.3z"/></svg>',
    save: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V4a1 1 0 011-1h12a1 1 0 011 1z"/></svg>',
    grid: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',
    reel: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 8h18M8 3l3 5M14 3l3 5M10 12v6l5-3z"/></svg>',
    tag: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 4h16v13l-4 4H4z"/><circle cx="12" cy="10" r="3"/></svg>',
    multi: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 3h11a2 2 0 012 2v11h-2V5H8z"/><rect x="3" y="8" width="13" height="13" rx="2"/></svg>',
    play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
    home: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8v10h-6v-6H9v6H3z"/></svg>',
    search: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    compass: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M16 8l-2 6-6 2 2-6z"/></svg>',
    msg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3C7 3 3 6.6 3 11.2c0 2.5 1.2 4.7 3 6.2V21l3.2-1.8c.9.3 1.8.4 2.8.4 5 0 9-3.6 9-8.2S17 3 12 3z"/></svg>',
    bell: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 16V11a6 6 0 00-12 0v5l-2 2h16zM10 20a2 2 0 004 0"/></svg>',
    plus: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/></svg>',
    pin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    phone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A17 17 0 013 5a2 2 0 012-2"/></svg>',
    link: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg>',
    clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>',
    star: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>',
    like: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 11v9H4v-9zM7 11l4-8c1.5 0 2.5 1 2.5 2.5V9h5.5a2 2 0 012 2.3l-1.2 7A2 2 0 0117.8 20H7"/></svg>',
    share: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 5l7 7-7 7v-4c-6 0-9 2-11 5 1-6 4-10 11-11z"/></svg>',
    repost: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h13l-3-3M20 15H7l3 3"/></svg>',
    music: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l11-2v13a3 3 0 11-2-2.8V7l-7 1.3V18a3 3 0 11-2-2.8z"/></svg>',
    verified: '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#20d5ec"/><path d="M7 12l3 3 7-7" stroke="#fff" stroke-width="2.4" fill="none"/></svg>',
    lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
  };
  // Barre NEAM pour passer d'un réseau à l'autre
  const HS = [...P.slug].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const PROJ = (a, b) => a + (HS % (b - a));
  const NAMES = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', linkedin: 'LinkedIn' };
  const bar = `<div class="nbar"><span class="ttl"><b>●</b> <i class="lg">NEAM <em>Atelier</em></i> <span class="long">· ${esc(P.n)} — profil préparé par NEAM, non publié</span></span><div class="sw">${Object.entries(NAMES).map(([k, v]) => `<a href="social.html?slug=${P.slug}&net=${k}" class="${k === NET ? 'on' : ''}">${v}</a>`).join('')}<a href="score.html?slug=${P.slug}" class="ds">Digital score</a><a href="${site}">Site web ↗</a><a href="recherche.html?q=${encodeURIComponent(P.n)}">← Résultats</a></div></div>`;
  const app = $('#app');
  document.title = `${name} (@${handle}) • ${NAMES[NET]}`;
  const mask = document.createElement('div'); mask.className = 'mask'; document.body.appendChild(mask);
  const closeMask = () => { mask.classList.remove('on'); mask.innerHTML = ''; document.body.style.overflow = ''; };
  mask.addEventListener('click', (e) => { if (e.target === mask) closeMask(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMask(); closeStory(); closeTT(); } });

  // ---------- Stories (Instagram / Facebook) ----------
  const story = document.createElement('div'); story.className = 'story'; document.body.appendChild(story);
  let stT;
  function openStory(start = 0) {
    const imgs = POSTS.filter((p) => p.kind !== 'card').slice(0, 6);
    let i = start;
    story.classList.add('on');
    const show = () => {
      const p = imgs[i]; clearTimeout(stT);
      story.innerHTML = `<button class="x" style="position:fixed;top:14px;right:18px;color:#fff;font-size:30px">×</button><div class="fr"><div class="bars">${imgs.map((_, k) => `<i><b style="width:${k < i ? 100 : 0}%"></b></i>`).join('')}</div><div class="who">${AV(32)}${esc(handle)} <span style="opacity:.7;font-weight:400">${esc(p.date.replace('il y a ', ''))}</span></div><div class="img kb" style="${bgImg(p.imgs[0])}"></div><div class="txt">${esc(p.cap.split(/[.!]/)[0])}</div><div class="rep">Envoyer un message</div><div class="tap l"></div><div class="tap r"></div></div>`;
      const b = $$('.bars b', story)[i]; requestAnimationFrame(() => { b.style.transition = 'width 4s linear'; b.style.width = '100%'; });
      stT = setTimeout(next, 4000);
      $('.x', story).onclick = closeStory; $('.tap.l', story).onclick = () => { i = Math.max(0, i - 1); show(); }; $('.tap.r', story).onclick = next;
    };
    const next = () => { i++; if (i >= imgs.length) closeStory(); else show(); };
    show();
  }
  function closeStory() { clearTimeout(stT); story.classList.remove('on'); story.innerHTML = ''; }

  // ================= INSTAGRAM =================
  const MV = {};
  function instagram() {
    const followers = P.ig || PROJ(900, 2600); MV.followers = followers;
    let following = false;
    const bio = NETCFG.bio || `${P.tagline}\n📍 ${P.address}\n📞 ${P.t}`;
    app.innerHTML = bar + `<div class="ig"><nav class="side"><div class="logo">Instagram</div>${[['home', 'Accueil'], ['search', 'Recherche'], ['compass', 'Découvrir'], ['reel', 'Reels'], ['msg', 'Messages'], ['bell', 'Notifications'], ['plus', 'Créer']].map(([i, t]) => `<a>${I[i].replace(/width="1\d"/, 'width="24"').replace(/height="1\d"/, 'height="24"')}${t}</a>`).join('')}<a class="on">${AV(24)}Profil</a></nav>
    <main class="main"><header class="head"><div class="ring" id="ring"><span class="av">${P.avatar}</span></div><div><div class="u"><h2>${esc(handle)}</h2><button class="b blue" id="fol">Suivre</button><button class="b" id="dm">Envoyer un message</button><button class="b">⋯</button></div>
    <div class="stats"><span><b>${POSTS.length}</b> publications</span><span><b id="fc">${nf(followers)}</b> followers</span><span><b>${P.ig ? 180 : 12}</b> suivi(e)s</span></div>
    <div class="bio"><b>${esc(name)}</b><br><span class="cat">${esc(NETCFG.cat || P.s)}</span><br>${esc(bio).replace(/\n/g, '<br>')}<br><a href="${site}">🔗 ${esc(NETCFG.link || P.domain)}</a></div></div></header>
    <div class="hl">${SD.highlights.map((h, i) => `<div data-st="${i}"><span><i style="${bgImg((POSTS.filter((p) => p.kind !== 'card')[i] || POSTS[0]).imgs[0])}"></i></span>${esc(h)}</div>`).join('')}</div>
    <div class="tabs"><a class="on" data-t="all">${I.grid} PUBLICATIONS</a><a data-t="reels">${I.reel} REELS</a><a data-t="tag">${I.tag} IDENTIFIÉ(E)</a></div><div id="gw"></div></main></div>`;
    const drawGrid = (t) => {
      $$('.ig .tabs a').forEach((a) => a.classList.toggle('on', a.dataset.t === t));
      if (t === 'tag') { $('#gw').innerHTML = `<div class="empty"><div style="font-size:40px">📷</div><h3>Photos de vous</h3>Quand des personnes vous identifient sur des photos, elles apparaissent ici.</div>`; return; }
      const list = POSTS.map((p, i) => ({ p, i })).filter(({ p }) => t !== 'reels' || p.kind === 'reel' || p.kind === 'photo');
      $('#gw').innerHTML = `<div class="grid ${t === 'reels' ? 'reels' : ''}">${list.map(({ p, i }) => `<div class="tile" data-i="${i}">${media(p)}${p.kind === 'carousel' ? `<span class="ico">${I.multi}</span>` : p.kind === 'reel' ? `<span class="ico">${I.reel.replace(/14/g, '20')}</span>` : ''}${t === 'reels' ? `<span class="views">${I.play} ${nf(p.views || p.likes * 9)}</span>` : ''}<div class="ov"><span>${I.heart.replace('fill="none"', 'fill="#fff"')} ${nf(p.likes)}</span><span>${I.com.replace('fill="none"', 'fill="#fff"')} ${p.comments.length}</span></div></div>`).join('')}</div>`;
      $$('.ig .tile').forEach((el) => el.onclick = () => openPost(+el.dataset.i));
    };
    $$('.ig .tabs a').forEach((a) => a.onclick = () => drawGrid(a.dataset.t)); drawGrid('all');
    $('#fol').onclick = (e) => { following = !following; e.target.textContent = following ? 'Suivi(e) ✓' : 'Suivre'; e.target.classList.toggle('blue', !following); $('#fc').textContent = nf(followers + (following ? 1 : 0)); };
    $('#dm').onclick = () => toast('Messagerie : démonstration NEAM');
    $('#ring').onclick = () => openStory(0);
    $$('.hl div').forEach((d) => d.onclick = () => openStory(+d.dataset.st % 6));
  }
  function openPost(i) {
    const p = POSTS[i]; let slide = 0, liked = false, saved = false, likes = p.likes;
    const draw = () => {
      mask.innerHTML = `<button class="x">×</button>${i > 0 ? '<button class="nav-arrow l">‹</button>' : ''}${i < POSTS.length - 1 ? '<button class="nav-arrow r">›</button>' : ''}
      <div class="igm"><div class="med">${media(p, slide)}${p.imgs.length > 1 ? `${slide > 0 ? '<button class="car" style="left:12px" data-s="-1">‹</button>' : ''}${slide < p.imgs.length - 1 ? '<button class="car" style="right:12px" data-s="1">›</button>' : ''}<div class="dots">${p.imgs.map((_, k) => `<i class="${k === slide ? 'on' : ''}"></i>`).join('')}</div>` : ''}${p.kind === 'reel' ? '<div style="position:absolute;bottom:14px;right:14px;color:#fff;background:rgba(0,0,0,.5);border-radius:50%;padding:8px">🔊</div>' : ''}</div>
      <div class="side2"><div class="hd">${AV(32)}${esc(handle)} · <span style="color:#0095f6">Suivre</span><span style="margin-left:auto">⋯</span></div>
      <div class="cm"><div class="r">${AV(32)}<div><b>${esc(handle)}</b> ${esc(p.cap)}<br><span style="color:#00376b">${esc(p.tags)}</span><small>${esc(p.date)}</small></div></div>${p.comments.map((c) => `<div class="r">${ini(c.n)}<div><b>${esc(c.u)}</b> ${esc(c.t)}<small>${c.l} J'aime · Répondre</small></div></div>`).join('')}</div>
      <div class="act"><div class="ic"><button id="lk" class="${liked ? 'heart-on' : ''}">${I.heart}</button><button id="cmb">${I.com}</button><button id="shb">${I.send}</button><button class="sv" id="svb">${saved ? I.save.replace('fill="none"', 'fill="currentColor"') : I.save}</button></div><b id="lc">${likes.toLocaleString('fr-FR')} J'aime</b><small>${esc(p.date)}</small></div>
      <form id="cf"><span>🙂</span><input placeholder="Ajouter un commentaire…" id="ci"><button>Publier</button></form></div></div>`;
      mask.classList.add('on'); document.body.style.overflow = 'hidden';
      $('.x', mask).onclick = closeMask;
      $('.nav-arrow.l', mask) && ($('.nav-arrow.l', mask).onclick = () => openPost(i - 1));
      $('.nav-arrow.r', mask) && ($('.nav-arrow.r', mask).onclick = () => openPost(i + 1));
      $$('.car', mask).forEach((b) => b.onclick = () => { slide += +b.dataset.s; draw(); });
      $('#lk').onclick = () => { liked = !liked; likes += liked ? 1 : -1; $('#lk').classList.toggle('heart-on', liked); $('#lk').classList.add('pop'); $('#lc').textContent = likes.toLocaleString('fr-FR') + ' J\'aime'; };
      $('.med', mask).ondblclick = () => { if (!liked) $('#lk').click(); };
      $('#cmb').onclick = () => $('#ci').focus();
      $('#shb').onclick = () => toast('Lien de la publication copié');
      $('#svb').onclick = () => { saved = !saved; draw(); toast(saved ? 'Enregistré dans vos collections' : 'Retiré des collections'); };
      $('#cf').onsubmit = (e) => { e.preventDefault(); const v = $('#ci').value.trim(); if (!v) return; p.comments.push({ u: 'vous', n: 'Vous', t: v, l: 0 }); draw(); $('.cm', mask).scrollTop = 1e5; };
    };
    draw();
  }

  // ================= FACEBOOK =================
  function facebook() {
    let tab = 'pub', following = false;
    const likesN = P.fb || PROJ(700, 2200); MV.likes = likesN;
    const cover = NETCFG.cover || (POSTS.find((p) => p.kind !== 'card' && !isCut(p.imgs[0])) || POSTS[0]).imgs[0];
    const photos = [...new Set(POSTS.filter((p) => p.kind !== 'card').flatMap((p) => p.imgs))];
    app.innerHTML = bar + `<div class="fb"><div class="top"><div class="f">f</div><div class="srch">Rechercher sur Facebook</div><div class="mid">${[I.home, I.reel, I.compass, I.msg].map((x, k) => `<span class="${k ? '' : 'on'}">${x}</span>`).join('')}</div><div class="rgt"><span>${I.msg}</span><span>${I.bell}</span><span style="background:none">${AV(40)}</span></div></div>
    <div class="hdr"><div class="wrap"><div class="cover" style="background-image:url('${cover}')"></div>
    <div class="id"><span class="av" style="border-radius:50%">${P.avatar}</span><div style="padding-bottom:16px"><h1>${esc(name)}</h1><div class="meta"><span id="fbl">${likesN ? nf(likesN) + ' J\'aime' : 'Nouvelle page'}</span> · ${nf(Math.round(likesN * 1.1))} followers</div></div>
    <div class="bt"><button class="btn blue" id="fbf">${I.like} J'aime</button><button class="btn" id="fbm">${I.msg} Envoyer un message</button><a class="btn" href="${site}">${I.link} ${esc(NETCFG.btn || P.cta)}</a></div></div>
    <div class="tb">${[['pub', 'Publications'], ['about', 'À propos'], ['rev', 'Avis'], ['pho', 'Photos'], ['vid', 'Vidéos']].map(([k, v]) => `<a data-t="${k}">${v}</a>`).join('')}</div></div></div>
    <div class="cols" id="fbc"></div></div>`;
    const intro = `<div class="card"><h3>Intro</h3><p style="text-align:center;font-size:15px;padding:0 0 12px;border-bottom:1px solid #e4e6eb;margin-bottom:8px">${esc(NETCFG.bio || P.tagline)}</p><div class="li">${I.info}<span><b>Page</b> · ${esc(NETCFG.cat || P.s)}</span></div><div class="li">${I.pin}<span>${esc(P.address)}</span></div><div class="li">${I.phone}<span>${esc(P.t)}</span></div><div class="li">${I.link}<a href="${site}" style="color:#0866ff">${esc(P.domain)}</a></div><div class="li">${I.clock}<span><b style="color:#31a24c">Ouvert maintenant</b> · ${esc(P.hours[1])}</span></div>${P.r ? `<div class="li">${I.star}<span>Note : ${String(P.r).replace('.', ',')}/5 (${P.v} avis)</span></div>` : ''}</div>`;
    const photosCard = `<div class="card"><h3 style="display:flex;justify-content:space-between">Photos <a style="color:#0866ff;font-size:15px;font-weight:400;cursor:pointer" data-go="pho">Toutes les photos</a></h3><div class="pg">${photos.slice(0, 9).map((u) => `<div class="ph" data-lb="${u}" style="${bgImg(u)}"></div>`).join('')}</div></div>`;
    const postHTML = (p, i) => `<div class="card post" data-i="${i}"><div class="ph1">${AV(40)}<div><b>${esc(name)}</b><small>${esc(p.date.replace('il y a ', ''))} · 🌍</small></div><span style="margin-left:auto;color:#65676b">⋯</span></div><div class="tx">${esc(p.cap)}<br><span style="color:#0866ff">${esc(p.tags)}</span></div>${p.kind === 'card' ? `<div style="position:relative;aspect-ratio:1.4">${media(p)}</div>` : `<div class="media ${p.imgs.length > 1 ? 'm3' : ''}">${p.imgs.map((u) => `<div class="ph" data-lb="${u}" style="${bgImg(u)}"></div>`).join('')}</div>`}
      <div class="cnt"><span class="rx"><i style="background:#0866ff">👍</i><i style="background:#f33e58">❤</i> <span class="lc">${p.likes}</span></span><span>${p.comments.length} commentaires · ${Math.round(p.likes / 9)} partages</span></div>
      <div class="ab"><button class="lkb">${I.like} J'aime</button><button class="cmb">${I.com.replace(/24/g, '20')} Commenter</button><button class="shb">${I.share} Partager</button></div>
      <div class="cms">${p.comments.map((c) => `<div class="cmt">${ini(c.n)}<div><div class="bub"><b>${esc(c.n)}</b>${esc(c.t)}</div><small>J'aime · Répondre · ${c.l} </small></div></div>`).join('')}<form>${AV(32)}<input placeholder="Écrivez un commentaire…"></form></div></div>`;
    const draw = () => {
      $$('.fb .tb a').forEach((a) => a.classList.toggle('on', a.dataset.t === tab));
      const C = $('#fbc');
      if (tab === 'pub') C.innerHTML = `<div>${intro}${photosCard}</div><div><div class="card" style="display:flex;gap:10px;align-items:center">${AV(40)}<div style="flex:1;background:#f0f2f5;border-radius:999px;padding:10px 14px;color:#65676b">Écrire quelque chose à ${esc(P.main)}…</div></div>${POSTS.map(postHTML).join('')}</div>`;
      if (tab === 'about') C.innerHTML = `<div class="card" style="grid-column:span 2"><h3>À propos</h3><div class="li">${I.info}<span>${esc(P.intro)}</span></div><div class="li">${I.pin}<span>${esc(P.address)}</span></div><div class="li">${I.phone}<span>${esc(P.t)}</span></div><div class="li">${I.msg}<span>${esc(P.e)}</span></div><div class="li">${I.link}<a href="${site}" style="color:#0866ff">${esc(P.domain)}</a></div><div class="li">${I.clock}<span>${esc(P.hours[1])}</span></div><div class="li">${I.info}<span>Catégorie : ${esc(P.s)}</span></div>${P.d ? `<div class="li">${I.info}<span>Direction : ${esc(P.d)}</span></div>` : ''}</div>`;
      if (tab === 'rev') C.innerHTML = `<div class="card" style="grid-column:span 2"><h3>Avis</h3><p style="font-size:17px">${P.r ? `<b>${Math.min(99, Math.round(P.r * 19))} %</b> recommandent ${esc(P.main)} (${P.v} avis)` : 'Soyez le premier à donner votre avis'}</p><p style="margin:14px 0">Recommandez-vous ${esc(P.main)} ?</p><button class="btn" data-rec>Oui</button> <button class="btn" data-rec>Non</button>${POSTS.slice(0, 5).flatMap((p) => p.comments.slice(0, 1)).map((c) => `<div class="rev">${ini(c.n, 40)}<div><b>${esc(c.n)}</b> recommande <b>${esc(P.main)}</b>.<br>${esc(c.t)}</div></div>`).join('')}</div>`;
      if (tab === 'pho' || tab === 'vid') C.innerHTML = `<div class="card" style="grid-column:span 2"><h3>${tab === 'pho' ? 'Photos' : 'Vidéos'}</h3><div class="pg" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">${(tab === 'pho' ? photos : POSTS.filter((p) => p.kind === 'reel').map((p) => p.imgs[0])).map((u) => `<div class="ph" data-lb="${u}" style="${bgImg(u)};${tab === 'vid' ? 'aspect-ratio:9/16;position:relative' : ''}">${tab === 'vid' ? `<span style="position:absolute;left:8px;bottom:8px;color:#fff">${I.play}</span>` : ''}</div>`).join('')}</div></div>`;
      bind();
    };
    const bind = () => {
      $$('[data-go]').forEach((a) => a.onclick = () => { tab = a.dataset.go; draw(); });
      $$('[data-lb]').forEach((d) => d.onclick = () => { mask.innerHTML = `<button class="x">×</button><img src="${d.dataset.lb}" style="max-width:92vw;max-height:88vh;border-radius:6px;${isCut(d.dataset.lb) ? 'background:' + pal.soft : ''}">`; mask.classList.add('on'); $('.x', mask).onclick = closeMask; });
      $$('[data-rec]').forEach((b) => b.onclick = () => toast('Merci pour votre recommandation !'));
      $$('.fb .post').forEach((el) => {
        const p = POSTS[+el.dataset.i]; let on = false;
        $('.lkb', el).onclick = (e) => { on = !on; e.currentTarget.classList.toggle('on', on); $('.lc', el).textContent = p.likes + (on ? 1 : 0); };
        $('.cmb', el).onclick = () => { $('.cms', el).classList.toggle('on'); $('.cms input', el).focus(); };
        $('.shb', el).onclick = () => toast('Publication partagée sur votre fil');
        $('.cms form', el).onsubmit = (e) => { e.preventDefault(); const inp = $('input', e.target); if (!inp.value.trim()) return; e.target.insertAdjacentHTML('beforebegin', `<div class="cmt">${ini('Vous')}<div><div class="bub"><b>Vous</b>${esc(inp.value)}</div><small>J'aime · Répondre · À l'instant</small></div></div>`); inp.value = ''; };
      });
    };
    $$('.fb .tb a').forEach((a) => a.onclick = () => { tab = a.dataset.t; draw(); });
    $('#fbf').onclick = (e) => { following = !following; e.currentTarget.classList.toggle('blue', !following); e.currentTarget.innerHTML = following ? `${I.like} Vous aimez` : `${I.like} J'aime`; $('#fbl').textContent = likesN || following ? nf(likesN + (following ? 1 : 0)) + ' J\'aime' : 'Nouvelle page'; };
    $('#fbm').onclick = () => toast('Messenger : démonstration NEAM');
    draw();
  }

  // ================= TIKTOK =================
  let ttIndex = -1;
  function tiktok() {
    let following = false;
    const fol = P.so.includes('tiktok') ? 1240 : PROJ(1100, 4800), _mv = (MV.tfol = P.so.includes('tiktok') ? 1240 : PROJ(1100, 4800)), lk = P.so.includes('tiktok') ? 18600 : POSTS.reduce((a, p) => a + p.likes, 0);
    const vids = POSTS.filter((p) => p.kind !== 'card');
    app.innerHTML = bar + `<div class="tt"><nav class="side"><div class="logo"><i>♪</i>TikTok</div><div class="sr">Rechercher</div>${[['home', 'Pour toi'], ['compass', 'Explorer'], ['plus', 'Suivis'], ['msg', 'Messages'], ['reel', 'LIVE']].map(([i, t]) => `<a>${I[i].replace(/1\d"/g, '24"')}${t}</a>`).join('')}<a class="on">${AV(28)}Profil</a></nav>
    <main class="main"><div class="head">${AV(212)}<div><h1>${esc(handle)} ${P.sig ? I.verified : ''}</h1><h2>${esc(P.main)}</h2><div class="btns"><button class="btn red" id="ttf">Suivre</button><button class="btn" id="ttm">Message</button><button class="btn">↗</button></div>
    <div class="stats"><span><b>24</b>Suivis</span><span><b id="tfc">${nf(fol)}</b>Followers</span><span><b>${nf(lk)}</b>J'aime</span></div>
    <div class="bio">${esc(NETCFG.bio || P.tagline)} · ${esc(P.c)}<br>📞 ${esc(P.t)}<a href="${site}">${I.link} ${esc(NETCFG.link || P.domain)}</a></div></div></div>
    <div class="tabs"><a class="on" data-t="v">${I.grid.replace(/12/g, '18')} <span class="tx">Vidéos</span></a><a data-t="r">${I.repost} <span class="tx">Republications</span></a><a data-t="f">${I.save.replace(/24/g, '18')} <span class="tx">Favoris</span></a><a data-t="l">${I.lock} <span class="tx">Aimés</span></a></div><div id="tg"></div></main></div>
    <div class="ttp" id="ttp"></div>`;
    const draw = (t) => {
      $$('.tt .tabs a').forEach((a) => a.classList.toggle('on', a.dataset.t === t));
      if (t === 'l') { $('#tg').innerHTML = `<div style="text-align:center;padding:80px 0;color:#8a8b91"><div style="font-size:40px">🔒</div><h3 style="color:#161823;margin:10px 0">Les vidéos aimées par cet utilisateur sont privées</h3></div>`; return; }
      const list = t === 'v' ? vids : t === 'r' ? vids.slice(4, 8) : vids.slice(1, 5);
      $('#tg').innerHTML = `<div class="grid">${list.map((p, k) => `<div class="tile" data-i="${vids.indexOf(p)}"><div class="img" style="${bgImg(p.imgs[0])}"></div>${t === 'v' && k < 2 ? '<span class="pin">Épinglé</span>' : ''}<div class="cap">${esc(p.cap.slice(0, 70))}</div><span class="v">${I.play} ${nf(p.views || p.likes * 11)}</span></div>`).join('')}</div>`;
      $$('.tt .tile').forEach((el) => el.onclick = () => openTT(+el.dataset.i, vids));
    };
    $$('.tt .tabs a').forEach((a) => a.onclick = () => draw(a.dataset.t)); draw('v');
    $('#ttf').onclick = (e) => { following = !following; e.target.textContent = following ? 'Abonné(e)' : 'Suivre'; e.target.classList.toggle('red', !following); $('#tfc').textContent = nf(fol + (following ? 1 : 0)); };
    $('#ttm').onclick = () => toast('Messages : démonstration NEAM');
  }
  function openTT(i, vids) {
    ttIndex = i; const p = vids[i]; let liked = false, saved = false;
    const V = $('#ttp'); V.classList.add('on'); document.body.style.overflow = 'hidden';
    const isVideo = /plage/.test(p.imgs[0]);
    V.innerHTML = `<div class="stage"><div class="bg" style="background-image:url('${p.imgs[0]}')"></div><button class="x">×</button>
      <div class="vid">${isVideo ? `<video src="assets/sig/plage-mobile.mp4" autoplay muted loop playsinline></video>` : `<div class="img kb" style="${bgImg(p.imgs[0])}"></div>`}
      <div class="meta"><b>${esc(handle)}</b> · ${esc(p.date.replace('il y a ', ''))}<br>${esc(p.cap)} <b>${esc(p.tags)}</b><div class="music">${I.music} son original — ${esc(P.main)}</div></div>
      <div class="acts">${AV(46)}<button id="tl"><span class="ci">${I.heart}</span><span id="tlc">${nf(p.likes * 6)}</span></button><button id="tc"><span class="ci">${I.com}</span>${p.comments.length}</button><button id="ts"><span class="ci">${I.save}</span>${Math.round(p.likes / 3)}</button><button id="tsh"><span class="ci">${I.share}</span>${Math.round(p.likes / 7)}</button></div></div>
      <div class="ud">${i > 0 ? '<button data-d="-1">↑</button>' : ''}${i < vids.length - 1 ? '<button data-d="1">↓</button>' : ''}</div></div>
      <div class="panel"><div class="ph2">${AV(40)}<div><b>${esc(handle)}</b><br><small style="color:#8a8b91">${esc(P.main)} · ${esc(p.date.replace('il y a ', ''))}</small></div><button style="margin-left:auto;background:#fe2c55;color:#fff;border-radius:6px;padding:6px 16px;font-weight:700">Suivre</button></div><div style="padding:12px 20px;font-size:15px">${esc(p.cap)} <b>${esc(p.tags)}</b></div><div style="padding:0 20px 10px;font-weight:700;border-bottom:1px solid #f1f1f2">Commentaires (${p.comments.length})</div>
      <div class="cms" id="tcm">${p.comments.map((c) => `<div style="display:flex;gap:10px">${ini(c.n, 40)}<div><b style="font-size:14px">${esc(c.u)}</b><br>${esc(c.t)}<br><small style="color:#8a8b91">${esc(p.date.replace('il y a ', ''))} · Répondre</small></div><span style="margin-left:auto;color:#8a8b91;font-size:13px">♡ ${c.l}</span></div>`).join('')}</div><form id="tfm"><input placeholder="Ajouter un commentaire…"><button>Publier</button></form></div>`;
    $('.x', V).onclick = closeTT;
    $$('.ud button', V).forEach((b) => b.onclick = () => openTT(i + +b.dataset.d, vids));
    $('#tl').onclick = () => { liked = !liked; $('#tl .ci').style.color = liked ? '#fe2c55' : ''; $('#tl .ci svg').setAttribute('fill', liked ? '#fe2c55' : 'none'); $('#tl').classList.add('pop'); $('#tlc').textContent = nf(p.likes * 6 + (liked ? 1 : 0)); };
    $('#ts').onclick = () => { saved = !saved; $('#ts .ci svg').setAttribute('fill', saved ? '#facc15' : 'none'); toast(saved ? 'Ajouté aux favoris' : 'Retiré des favoris'); };
    $('#tsh').onclick = () => toast('Lien copié');
    $('#tc').onclick = () => $('#tfm input') && $('#tfm input').focus();
    $('#tfm').onsubmit = (e) => { e.preventDefault(); const inp = $('input', e.target); if (!inp.value.trim()) return; $('#tcm').insertAdjacentHTML('beforeend', `<div style="display:flex;gap:10px">${ini('Vous', 40)}<div><b style="font-size:14px">vous</b><br>${esc(inp.value)}<br><small style="color:#8a8b91">À l'instant</small></div></div>`); inp.value = ''; };
    V.onwheel = (e) => { if (Math.abs(e.deltaY) < 30 || V._lock) return; V._lock = 1; setTimeout(() => V._lock = 0, 600); const n = i + (e.deltaY > 0 ? 1 : -1); if (n >= 0 && n < vids.length) openTT(n, vids); };
  }
  function closeTT() { const V = $('#ttp'); if (V) { V.classList.remove('on'); V.innerHTML = ''; document.body.style.overflow = ''; } }

  // ================= LINKEDIN =================
  function linkedin() {
    let tab = 'home', following = false;
    const fol = P.so.includes('linkedin') ? 312 : PROJ(140, 520); MV.lfol = fol;
    const cover = NETCFG.cover || (POSTS.find((p) => p.kind !== 'card' && !isCut(p.imgs[0])) || POSTS[0]).imgs[0];
    const similar = (window.PROSPECTS || []).filter((x) => x.k === P.k && x.slug !== P.slug).slice(0, 4);
    const posts = POSTS.filter((p, i) => i % 2 === 0).map((p) => ({ ...p, cap: p.cap.replace(/[😋😍🔥🙏✨👏❤️🎉🏡🔑💼📲🍽️☀️🏊🏾🥐🥭✅📅🩺👩🏾‍⚕️🧼✈️🎄🌍📋🐘🌊🚗📦🔧🌧️📚🎓🏫👨‍👩‍👧💪🏾🛍️🚚🎁🪡💐🤝📩💆🏾‍♀️💕👨🏾‍🍳🎶]/gu, '').trim() }));
    const jobsPosts = { cap: `Nous recrutons ! ${P.n} renforce son équipe à ${P.c} : ${SD.jobs.join(' et ')}. Candidatures par message ou à ${P.e}.`, imgs: [POSTS[0].imgs[0]], likes: 40, comments: [], date: 'il y a 3 jours', tags: '#recrutement #emploi #Gabon' };
    app.innerHTML = bar + `<div class="li"><div class="top"><div class="in">in</div><div class="srch">🔍 Recherche</div><div class="nv">${[['home', 'Accueil'], ['compass', 'Réseau'], ['save', 'Emplois'], ['msg', 'Messagerie'], ['bell', 'Notifications']].map(([i, t]) => `<span>${I[i].replace(/24/g, '22')}${t}</span>`).join('')}</div></div>
    <div class="wrap"><div><div class="card"><div class="cover" style="background-image:url('${cover}')"></div><div class="hd"><div class="logo">${P.avatar}</div><h1>${esc(name)}</h1><div class="tg">${esc(NETCFG.tag || P.tagline)}</div><div class="mt">${esc(NETCFG.sector || P.s)} · ${esc(P.c)}, Gabon · <span id="lfc">${fol}</span> abonnés · ${esc(NETCFG.size || '11-50 employés')}</div>
    <div class="bts"><button class="bt blue" id="lf">+ Suivre</button><a class="bt" href="${site}">Voir le site web ↗</a><button class="bt gray">Plus</button></div></div>
    <div class="tabs">${[['home', 'Accueil'], ['about', 'À propos'], ['posts', 'Posts'], ['jobs', 'Emplois'], ['people', 'Personnes']].map(([k, v]) => `<a data-t="${k}">${v}</a>`).join('')}</div></div><div id="lc"></div></div>
    <aside class="rail"><div class="card"><h3>Pages similaires</h3>${similar.map((s) => `<a class="sim" href="social.html?slug=${s.slug}&net=linkedin"><span class="av" style="border-radius:4px">${s.avatar}</span><div><b>${esc(s.n)}</b><small>${esc(s.s)} · ${esc(s.c)}</small></div></a>`).join('')}</div><div class="card"><h3>Site web</h3><a href="${site}" style="color:#0a66c2;font-weight:600">${esc(P.domain)}</a></div></aside></div></div>`;
    const postHTML = (p, i) => `<div class="card post" data-i="${i}"><div class="ph1"><span class="av">${P.avatar}</span><div><b>${esc(name)}</b><small>${fol} abonnés</small><small>${esc(p.date.replace('il y a ', ''))} · 🌐</small></div></div><div class="tx">${esc(p.cap)}<br><span style="color:#0a66c2;font-weight:600">${esc(p.tags)}</span></div>${p.kind === 'card' ? `<div style="position:relative;aspect-ratio:1.6">${media(p)}</div>` : `<div class="media"><div class="ph" style="${bgImg(p.imgs[0])}"></div></div>`}<div class="cnt"><span>👍❤️ <span class="lc2">${Math.round(p.likes / 3)}</span></span><span>${p.comments.length} commentaires · ${Math.round(p.likes / 30)} republications</span></div><div class="ab"><button class="r1">${I.like} J'aime</button><button class="r2">${I.com.replace(/24/g, '20')} Commenter</button><button class="r3">${I.repost} Republier</button><button class="r4">${I.send.replace(/24/g, '20')} Envoyer</button></div><div class="cms">${p.comments.slice(0, 2).map((c) => `<div class="cmt">${ini(c.n, 40)}<div class="bub"><b>${esc(c.n)}</b><br>${esc(c.t)}</div></div>`).join('')}<form><input placeholder="Ajouter un commentaire…"></form></div></div>`;
    const all = [jobsPosts, ...posts];
    const draw = () => {
      $$('.li .tabs a').forEach((a) => a.classList.toggle('on', a.dataset.t === tab));
      const C = $('#lc');
      const about = `<div class="card"><div class="sec"><h2>Présentation</h2><p>${esc(NETCFG.about || P.intro)}</p><dl><dt>Site web</dt><dd><a href="${site}" style="color:#0a66c2">${esc(P.domain)}</a></dd><dt>Secteur</dt><dd>${esc(P.s)}</dd><dt>Taille de l'entreprise</dt><dd>${esc(NETCFG.size || '11-50 employés')}</dd><dt>Siège social</dt><dd>${esc(P.c)}, Gabon</dd><dt>Téléphone</dt><dd>${esc(P.t)}</dd>${P.d ? `<dt>Direction</dt><dd>${esc(P.d)}</dd>` : ''}<dt>Spécialisations</dt><dd>${esc(P.items.join(', '))}</dd></dl></div></div>`;
      const jobs = `<div class="card"><div class="sec"><h2>Offres d'emploi récentes</h2><p>${esc(P.n)} recrute à ${esc(P.c)}.</p></div>${SD.jobs.map((j) => `<div class="job"><span class="av" style="border-radius:4px">${P.avatar}</span><div style="flex:1"><b>${esc(j)}</b><small>${esc(P.n)} · ${esc(P.c)}, Gabon (Sur site)</small><small>Il y a 1 semaine · CDI</small></div><button class="bt blue" data-apply="${esc(j)}">Postuler</button></div>`).join('')}</div>`;
      const people = `<div class="card"><div class="sec"><h2>Personnes</h2><p>${(P.d ? 1 : 0) + 6} employés sur LinkedIn</p></div><div class="people">${[P.d ? [P.d, 'Direction'] : null, ['Marie Nguema', 'Responsable clientèle'], ['Kévin Obame', 'Chargé de projets'], ['Lyne Ondo', 'Assistante de direction'], ['Fabrice Ella', 'Commercial'], ['Nadia Essono', 'Comptable'], ['Loïc Ndong', 'Technicien']].filter(Boolean).map(([n, r]) => `<div class="person">${ini(n, 72)}<b>${esc(n)}</b><br><small style="color:rgba(0,0,0,.6)">${esc(r)} chez ${esc(P.main)}</small><br><button class="bt" style="margin-top:10px;padding:4px 14px;font-size:14px" data-con>Se connecter</button></div>`).join('')}</div></div>`;
      if (tab === 'home') C.innerHTML = about.replace('Présentation', 'Présentation') + all.slice(0, 3).map(postHTML).join('');
      if (tab === 'about') C.innerHTML = about;
      if (tab === 'posts') C.innerHTML = all.map(postHTML).join('');
      if (tab === 'jobs') C.innerHTML = jobs;
      if (tab === 'people') C.innerHTML = people;
      $$('.li .post').forEach((el) => { const p = all[+el.dataset.i]; let on = false;
        $('.r1', el).onclick = (e) => { on = !on; e.currentTarget.classList.toggle('on', on); $('.lc2', el).textContent = Math.round(p.likes / 3) + (on ? 1 : 0); };
        $('.r2', el).onclick = () => { $('.cms', el).classList.toggle('on'); $('.cms input', el).focus(); };
        $('.r3', el).onclick = () => toast('Republié sur votre profil'); $('.r4', el).onclick = () => toast('Envoyé en message privé');
        $('.cms form', el).onsubmit = (e) => { e.preventDefault(); const inp = $('input', e.target); if (!inp.value.trim()) return; e.target.insertAdjacentHTML('beforebegin', `<div class="cmt">${ini('Vous', 40)}<div class="bub"><b>Vous</b><br>${esc(inp.value)}</div></div>`); inp.value = ''; }; });
      $$('[data-apply]').forEach((b) => b.onclick = () => { mask.innerHTML = `<div class="modal-card"><h3>Postuler : ${esc(b.dataset.apply)}</h3><p>${esc(P.n)} · ${esc(P.c)}</p><input placeholder="Nom complet"><input placeholder="E-mail ou téléphone"><textarea rows="3" placeholder="Votre message"></textarea><button class="go" id="ap">Envoyer la candidature</button></div>`; mask.classList.add('on'); $('#ap').onclick = () => { closeMask(); toast('Candidature envoyée (démonstration)'); }; });
      $$('[data-con]').forEach((b) => b.onclick = () => { b.textContent = 'En attente'; b.disabled = true; });
    };
    $$('.li .tabs a').forEach((a) => a.onclick = () => { tab = a.dataset.t; draw(); });
    $('#lf').onclick = (e) => { following = !following; e.target.textContent = following ? '✓ Abonné' : '+ Suivre'; e.target.classList.toggle('blue', !following); $('#lfc').textContent = fol + (following ? 1 : 0); };
    draw();
  }


  // ---------- En-têtes mobiles (modèles : Instagram, TikTok, Facebook, LinkedIn sur téléphone) ----------
  function mobileHead(net, X) {
    const FRIENDS = ['Rocky Kanick', 'Warimi Ondo', 'Fébry Otha', 'Dieudonné Mba', 'Prisca Nzé', 'Hervé Mintsa'];
    const fr = (n) => FRIENDS[(HS + n * 2) % FRIENDS.length];
    const EMO = { resto: '🍽️', hotel: '🏨', beaute: '💅🏾', immo: '🏡', sante: '🩺', voyage: '✈️', auto: '🚗', ecole: '🎓', luxe: '✨', boutique: '🛍️', services: '💼' }[P.k] || '✨';
    const third = { resto: 'Réserver', hotel: 'Réserver', luxe: 'Boutique', boutique: 'Boutique' }[P.k] || 'Contacter';
    const siteTxt = esc(NETCFG.link || P.domain);
    if (net === 'ig') return `<div class="mhead mh-ig"><div class="r1"><div class="ring">${AV(86)}</div><div class="nm"><b>${esc(name)}</b><div class="st"><span><b>${POSTS.length}</b>publications</span><span><b data-mirror="#fc">${nf(MV.followers)}</b>followers</span><span><b>${P.ig ? 180 : 12}</b>suivi(e)s</span></div></div></div>
      <div class="bio">${EMO} ${esc(NETCFG.bio || P.tagline)}<br>🏷️ ${esc(NETCFG.cat || P.s)}<br>📍 ${esc(P.address)}<br>📞 ${esc(P.t)}</div><a class="lnk" href="${site}">${I.link} ${siteTxt}</a>
      <div class="bts"><button class="b blue" data-px="#fol" data-on="blue" data-lbl="Suivre" data-lbl2="Suivi(e) ✓">Suivre</button><button class="b" data-toast="Messagerie : démonstration NEAM">Envoyer un…</button><a class="b" href="${site}">${third}</a><button class="b sq" data-toast="Profils suggérés">⌄</button></div></div>`;
    if (net === 'tt') return `<div class="mhead mh-tt">${AV(110)}<h1>${esc(name)}${P.sig ? ' ' + I.verified : ''}</h1><div class="hd">@${esc(handle)}</div>
      <div class="st"><span><b>24</b>Suivis</span><i></i><span><b data-mirror="#tfc">${nf(MV.tfol)}</b>Followers</span><i></i><span><b>${$('.tt .stats span:nth-child(3) b')?.textContent || ''}</b>J'aime</span></div>
      <div class="bts"><button class="red" data-px="#ttf" data-on="red" data-lbl="Suivre" data-lbl2="Abonné(e)">Suivre</button><button data-toast="Messages : démonstration NEAM">Message</button><button class="sq" data-toast="Comptes suggérés">▾</button></div>
      <div class="bio">${esc(NETCFG.bio || P.tagline)}</div><a class="lnk" href="${site}">${I.link} ${siteTxt}</a>
      <div class="pls">${(SD.highlights || []).slice(0, 3).map((h, i) => `<a data-toast="Playlist « ${esc(h)} »">${X.store.replace('M4 10h16v10H4zM3 6h18l-1 4H4zM9 20v-5h6v5', 'M4 6h12v12H4zM8 3h12v12')} ${esc(h)} ${['⭐', '🔥', '📍'][i]}</a>`).join('')}</div></div>`;
    if (net === 'fb') { const cover = ($('.fb .cover')?.style.backgroundImage || '').replace(/"/g, "'"); return `<div class="mhead mh-fb"><div class="cv" style="background-image:${cover}"><a class="ic" href="recherche.html?q=${encodeURIComponent(P.n)}">${X.back}</a><span class="ics"><a class="ic">${X.share}</a><a class="ic">${I.search}</a><a class="ic">${X.dots}</a></span></div>
      <div class="avw">${AV(150)}</div><h1>${esc(name)} ${P.fb || P.sig ? I.verified : ''}</h1><div class="fl"><b>${nf(Math.round(MV.likes * 1.1))}</b> followers · ${12 + (HS % 60)} suivi(e)s</div>
      <div class="bio">${EMO} ${esc(NETCFG.bio || P.tagline)}<br>📩 ${esc(P.e || 'contact@' + P.domain)}</div><div class="cat">${X.bag} ${esc(NETCFG.cat || P.s)}</div>
      <div class="sp"><span class="avs">${[0, 1, 2].map((n) => ini(fr(n), 30)).join('')}</span><span>Suivi(e) par <b>${fr(0)}</b>, <b>${fr(1)}</b> et <b>${fr(2)}</b></span></div>
      <div class="bts"><button class="blue" data-px="#fbf" data-on="blue" data-lbl="${esc(I.like)} Suivre" data-lbl2="✓ Suivi(e)">${I.like} Suivre</button><button data-toast="Messenger : démonstration NEAM">${I.msg} Message</button></div>
      <div class="chips"><a class="on" data-tab="pub">Tous</a><a data-tab="pho">Photos</a><a data-tab="vid">Reels</a><a data-tab="rev">Avis</a><a data-tab="about">À propos</a></div>
      <div class="infos"><h3>Liens</h3><a href="${site}">${I.link}<span>${siteTxt}</span></a><h3>Coordonnées</h3><div>${I.phone}<span>${esc(P.t)}</span></div><div>${I.pin}<span>${esc(P.address)}</span></div></div></div>`; }
    if (net === 'li') return `<div class="mhead mh-li"><div class="cv" style="background-image:${($('.li .cover')?.style.backgroundImage || '').replace(/"/g, "'")}"></div><div class="lg">${P.avatar}</div><h1>${esc(name)} <span class="sh">${X.shield}</span></h1>
      <div class="mt">${esc(NETCFG.sector || P.s)} • ${esc(P.c)} • <span data-mirror="#lfc">${MV.lfol}</span> abonnés • ${esc(NETCFG.size || '11-50 employés')}</div>
      <div class="sp">${ini(fr(3), 40)}<b>${fr(3).split(' ')[0]} et ${8 + (HS % 70)} autres relations suivent cette page</b></div>
      <div class="bts"><button class="blue" data-px="#lf" data-on="blue" data-lbl="+ Suivre" data-lbl2="✓ Abonné">+ Suivre</button><button class="out" data-toast="Messagerie LinkedIn : démonstration NEAM">${X.send} Message</button><button class="circ" data-toast="Plus d'options">${X.dots}</button></div></div>`;
    return '';
  }

  ({ instagram, facebook, tiktok, linkedin }[NET] || instagram)();
  // Habillage « application mobile » (visible seulement sur petit écran)
  (() => {
    const root = app.querySelector(':scope>.ig,:scope>.fb,:scope>.tt,:scope>.li'); if (!root) return;
    const back = `<a class="bk" href="recherche.html?q=${encodeURIComponent(P.n)}">‹</a>`;
    const it = (i, t = '') => `<a>${I[i]}${t ? `<small>${t}</small>` : ''}</a>`;
    const me = `<a class="on"><span class="av" style="width:26px;height:26px">${P.avatar}</span></a>`;
    const ic = (d) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
    const X = { back: ic('M15 5l-7 7 7 7'), arrow: ic('M20 12H4M10 6l-6 6 6 6'), dots: ic('M5 12h.01M12 12h.01M19 12h.01'), share: ic('M14 4l7 7-7 7M21 11H10a6 6 0 00-6 6v1'), users: ic('M9 11a4 4 0 100-8 4 4 0 000 8zM2 21a7 7 0 0114 0M17 11a3 3 0 100-6M22 21a6 6 0 00-5-6'), store: ic('M4 10h16v10H4zM3 6h18l-1 4H4zM9 20v-5h6v5'), bag: ic('M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2'), menu: ic('M4 7h16M4 12h16M4 17h16'), send: ic('M22 2L11 13M22 2l-7 20-4-9-9-4z'), shield: ic('M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z') };
    const C = {
      ig: [`${back}<b>${esc(handle)}</b>${P.sig || P.ig ? I.verified : ''}<span class="sp"></span>${X.dots}`, it('home') + it('search') + it('plus') + it('reel') + me],
      fb: ['', `<a class="on">${I.home}</a><a>${I.reel}</a><a>${X.users}</a><a>${X.store}</a><a>${I.bell}</a><a><span class="av" style="width:28px;height:28px">${P.avatar}</span></a>`],
      tt: [`${back}<span class="sp"></span>${I.bell}${X.share}`, it('home', 'Accueil') + it('compass', 'Amis') + `<a class="pl"><i>+</i></a>` + it('msg', 'Boîte') + `<a class="on"><span class="av" style="width:24px;height:24px">${P.avatar}</span><small>Profil</small></a>`],
      li: [`<a class="bk" href="recherche.html?q=${encodeURIComponent(P.n)}">${X.arrow}</a><span class="ms">${I.search} ${esc(name)}</span>`, `<a class="on">${I.home}<small>Accueil</small></a><a>${X.bag}<small>Emplois</small></a><a>${X.users}<small>Réseau</small></a><a class="nt">${I.bell}<small>Notifications</small><em>&gt;20</em></a><a>${X.menu}<small>Plus</small></a>`],
    }[root.className.split(' ')[0]];
    root.insertAdjacentHTML('afterbegin', (C[0] ? `<div class="mtop">${C[0]}</div>` : '') + mobileHead(root.className.split(' ')[0], X));
    // Les boutons mobiles déclenchent les mêmes actions que la version ordinateur et recopient leur état
    $$('.mhead [data-px]').forEach((bt) => bt.onclick = () => { const el = $(bt.dataset.px); if (!el) return; el.click(); if (bt.dataset.lbl) bt.innerHTML = el.classList.contains(bt.dataset.on) ? bt.dataset.lbl : bt.dataset.lbl2; bt.classList.toggle('done', !el.classList.contains(bt.dataset.on)); $$('.mhead [data-mirror]').forEach((m) => { const src = $(m.dataset.mirror); if (src) m.textContent = src.textContent.replace(/\s*(J'aime|followers)$/i, ''); }); });
    $$('.mhead [data-toast]').forEach((bt) => bt.onclick = () => toast(bt.dataset.toast));
    $$('.mhead [data-tab]').forEach((bt) => bt.onclick = () => { $$('.mhead [data-tab]').forEach((x) => x.classList.toggle('on', x === bt)); const t = $(`.fb .tb a[data-t="${bt.dataset.tab}"]`); if (t) t.click(); });
    root.insertAdjacentHTML('beforeend', `<nav class="mnav">${C[1]}</nav>`);
  })();
  window.SOCIALUI = { openPost, openStory, NET };
})();
