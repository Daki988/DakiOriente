/* =========================================================
   NEAM SOFTWARES INDUSTRY — Interactions
   ========================================================= */
/* ---------- Mesure d'audience (sans donnée personnelle) ----------
   Les événements sont placés dans window.dataLayer : ils ne partent nulle part
   tant qu'aucun outil de mesure n'est installé (et accepté si nécessaire). */
window.dataLayer = window.dataLayer || [];
window.neamTrack = (event, params = {}) => {
  window.dataLayer.push({ event, page: location.pathname, ...params });
  if (typeof window.gtag === 'function') window.gtag('event', event, params);
};
document.addEventListener('click', e => {
  const a = e.target.closest('a, button');
  if (!a) return;
  if (/wa\.me\//.test(a.getAttribute('href') || '')) neamTrack('whatsapp_click', { from: location.pathname });
  if (a.dataset.cta) neamTrack('cta_click', { cta: a.dataset.cta });
  else if (a.hasAttribute('download') || /\.pdf($|\?)/.test(a.getAttribute('href') || '')) neamTrack('download_resource', { file: (a.getAttribute('href') || '').split('/').pop() });
});

(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- En-tête ---------- */
  const header = $('.header');
  const toggle = $('.nav-toggle');
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const setMenu = open => {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Fermer' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
  $$('.nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Titres ligne par ligne ---------- */
  $$('.lines').forEach(el => $$('.line > span', el).forEach((s, i) => s.style.setProperty('--i', i)));

  /* ---------- Apparitions au défilement (démarrent après le chargement) ---------- */
  const groups = new Map();
  $$('.reveal').forEach(el => {
    const i = groups.get(el.parentElement) || 0;
    groups.set(el.parentElement, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 5) * 0.08}s`);
  });
  const startReveal = () => {
    const targets = $$('.reveal, .lines');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      targets.forEach(el => io.observe(el));
    } else {
      targets.forEach(el => el.classList.add('is-in'));
    }
  };

  /* ---------- Animation de chargement : du cahier à l'IA ---------- */
  const loader = $('#loader');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!loader || reduce) {
    startReveal();
  } else {
    // Animation à la première visite seulement ; ensuite, affichage immédiat
    let quick = false;
    try { quick = sessionStorage.getItem('neam-loader') === '1'; sessionStorage.setItem('neam-loader', '1'); } catch (e) { /* stockage indisponible */ }
    if (quick) {
      loader.remove();
      document.body.classList.remove('is-loading');
      startReveal();
    } else {
      document.body.classList.add('is-loading');
      const icons = $$('.loader__icon', loader);
      const label = $('#loaderLabel');
      const bar = $('#loaderBar');
      const LABELS = ['Le cahier', 'Le tableur', 'Le site web', 'Le mobile', 'L’intelligence artificielle'];
      const STEP = 160; // 5 icônes ≈ 0,8 s
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        loader.classList.add('is-done');
        document.body.classList.remove('is-loading');
        startReveal();
        setTimeout(() => loader.remove(), 600);
      };
      const showLogo = () => {
        loader.classList.add('is-logo');
        bar.style.width = '100%';
        setTimeout(finish, 350); // logo ≈ 0,35 s
      };
      let i = 0;
      const next = () => {
        icons.forEach((ic, j) => ic.classList.toggle('is-on', j === i));
        label.textContent = LABELS[i];
        bar.style.width = `${((i + 1) / (icons.length + 1)) * 100}%`;
        i++;
        setTimeout(i < icons.length ? next : showLogo, STEP);
      };
      next();
      setTimeout(finish, 2500); // sécurité
    }
  }

  /* ---------- Accordéon des expertises ---------- */
  $$('.acc__item').forEach(item => {
    const btn = $('.acc__btn', item);
    const panel = $('.acc__panel', item);
    const sync = () => {
      const open = item.classList.contains('is-open');
      btn.setAttribute('aria-expanded', String(open));
      panel.inert = !open;
    };
    btn.addEventListener('click', () => { item.classList.toggle('is-open'); sync(); });
    sync();
  });
  // Ouvre l'expertise visée par l'ancre (ex. services.html#ia-automatisation)
  const openFromHash = () => {
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains('acc__item') && !target.classList.contains('is-open')) $('.acc__btn', target).click();
  };
  openFromHash();
  addEventListener('hashchange', openFromHash);

  /* ---------- Formulaire de contact ---------- */
  const form = $('#contactForm');
  if (!form) return;
  const status = $('#formStatus');
  const select = $('#besoin');
  const wanted = new URLSearchParams(location.search).get('besoin');
  if (wanted) {
    const opt = [...select.options].find(o => o.value && o.value.toLowerCase().startsWith(wanted.toLowerCase()));
    if (opt) select.value = opt.value;
    // Un service de la Super App (NEAM Market, Brico&Déco…) : rattaché à la Super App
    else if (/neam|brico/i.test(wanted)) {
      select.value = 'NEAM Super App';
      const msg = $('#message');
      if (msg && !msg.value) msg.value = `Bonjour, je souhaite être informé(e) du lancement de ${wanted}.`;
    }
  }
  let started = false;
  form.addEventListener('input', () => { if (!started) { started = true; neamTrack('contact_form_start'); } });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;
    $$('input, select, textarea', form).forEach(f => {
      const ok = f.checkValidity();
      f.closest('.field')?.classList.toggle('is-invalid', !ok);
      if (!ok) valid = false;
    });
    // Au moins un moyen de vous répondre : e-mail ou téléphone
    const em = $('#email', form), tel = $('#telephone', form);
    if (!em.value.trim() && !tel.value.trim()) {
      em.closest('.field').classList.add('is-invalid'); tel.closest('.field').classList.add('is-invalid'); valid = false;
    }
    if (!valid) {
      neamTrack('contact_form_error');
      status.textContent = 'Merci d’indiquer votre nom, un e-mail ou un téléphone, votre besoin et un message.';
      status.classList.add('is-error');
      return;
    }
    status.classList.remove('is-error');
    const d = new FormData(form);
    const btn = $('button[type=submit]', form);
    btn.disabled = true;
    status.textContent = 'Envoi en cours…';
    try {
      const res = await fetch('api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(d.entries()), origine: document.referrer ? new URL(document.referrer).pathname : '', besoin_url: new URLSearchParams(location.search).get('besoin') || '' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const when = data.deadline ? `, au plus tard le ${data.deadline}` : '';
      status.textContent = data.ack ? `Merci, votre demande est bien envoyée. Un accusé de réception vient de partir vers votre boîte e-mail. Nous vous répondons sous 48 h ouvrées maximum${when}.` : `Merci, votre demande est bien envoyée. Nous vous répondons sous 48 h ouvrées maximum${when}.`;
      neamTrack('contact_form_success', { besoin: d.get('besoin') });
      form.reset();
    } catch (err) {
      // Solution de secours : messagerie du visiteur
      const company = d.get('entreprise') ? ` (${d.get('entreprise')})` : '';
      const subject = encodeURIComponent(`[Site NEAM] ${d.get('besoin')} — ${d.get('nom')}${company}`);
      const body = encodeURIComponent(
        `Nom : ${d.get('nom')}\nEntreprise : ${d.get('entreprise') || '-'}\nE-mail : ${d.get('email') || '-'}\nTéléphone : ${d.get('telephone') || '-'}\nBesoin : ${d.get('besoin')}\n\n${d.get('message')}`
      );
      neamTrack('contact_form_error');
      status.classList.add('is-error');
      status.innerHTML = `L’envoi n’a pas abouti. <a class="ulink" href="mailto:contact@neamindustry.com?subject=${subject}&body=${body}">Envoyer par e-mail</a> ou écrivez-nous à contact@neamindustry.com.`;
    }
    btn.disabled = false;
  });
  $$('input, select, textarea', form).forEach(f =>
    f.addEventListener('input', () => f.closest('.field')?.classList.remove('is-invalid')));
})();

/* ---------- Inclinaison 3D au survol (téléphone Super App, interfaces) ---------- */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach(el => {
    const target = el.querySelector('.phone3d__tilt, .svc-ui__tilt');
    if (!target) return;
    const zone = el.closest('section') || el;
    zone.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      target.style.setProperty('--ty', `${(x * 24).toFixed(2)}deg`);
      target.style.setProperty('--tx', `${(-y * 18).toFixed(2)}deg`);
    });
    zone.addEventListener('pointerleave', () => {
      target.style.setProperty('--ty', '0deg');
      target.style.setProperty('--tx', '0deg');
    });
  });
})();

/* ---------- Vidéos (manifeste, cas d'exemple) ---------- */
document.querySelectorAll('video[data-film]').forEach(v => {
  const fig = v.closest('.film');
  const btn = fig && fig.querySelector('.film__play');
  // Commandes natives masquées tant que la vidéo n'a pas démarré (le gros bouton suffit)
  if (btn) { v.controls = false; btn.addEventListener('click', () => { const p = v.play(); if (p && p.catch) p.catch(() => { v.controls = true; fig.classList.add('is-playing'); }); }); }
  v.addEventListener('play', () => {
    v.controls = true;
    if (fig) fig.classList.add('is-playing');
    // Une seule vidéo à la fois
    document.querySelectorAll('video[data-film]').forEach(o => { if (o !== v && !o.paused) o.pause(); });
    if (!v.dataset.tracked) { v.dataset.tracked = '1'; neamTrack('video_play', { video: v.dataset.film }); }
  });
  v.addEventListener('ended', () => neamTrack('video_complete', { video: v.dataset.film }));
});

/* ---------- Visionneuse d'affiches ---------- */
(() => {
  const links = [...document.querySelectorAll('a[data-lightbox]')];
  if (!links.length || typeof HTMLDialogElement !== 'function') return;
  let dlg, img, cap, more, count, group = [], idx = 0, opener = null;
  const build = () => {
    dlg = document.createElement('dialog');
    dlg.className = 'lb';
    dlg.setAttribute('aria-label', 'Affiche en grand');
    dlg.innerHTML = '<div class="lb__top"><span class="label" data-count></span><button type="button" class="lb__btn" data-close aria-label="Fermer">×</button></div>'
      + '<figure class="lb__fig"><img alt=""></figure>'
      + '<div class="lb__bar"><p class="lb__cap"></p><button type="button" class="lb__btn" data-prev aria-label="Affiche précédente">←</button><a class="btn btn--yellow" data-more href="#">Lire l’article <span class="arr">→</span></a><button type="button" class="lb__btn" data-next aria-label="Affiche suivante">→</button></div>';
    document.body.appendChild(dlg);
    img = dlg.querySelector('img'); cap = dlg.querySelector('.lb__cap'); more = dlg.querySelector('[data-more]'); count = dlg.querySelector('[data-count]');
    dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
    dlg.querySelector('[data-prev]').addEventListener('click', () => show(idx - 1));
    dlg.querySelector('[data-next]').addEventListener('click', () => show(idx + 1));
    dlg.addEventListener('click', e => { if (e.target === dlg || e.target.classList.contains('lb__fig')) dlg.close(); });
    dlg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
    dlg.addEventListener('close', () => { document.documentElement.classList.remove('lb-open'); if (opener) opener.focus(); });
    let x0 = null;
    dlg.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); x0 = null; });
  };
  const show = i => {
    idx = (i + group.length) % group.length;
    const a = group[idx];
    const thumb = a.querySelector('img');
    img.src = a.getAttribute('href');
    img.alt = thumb ? thumb.alt : '';
    cap.textContent = a.dataset.caption || '';
    count.textContent = group.length > 1 ? `Affiche ${idx + 1} / ${group.length}` : '#EtÇaRapporteCombien';
    const m = a.dataset.more;
    more.hidden = !m || location.pathname.endsWith('/' + m);
    if (m) more.href = m;
    dlg.querySelectorAll('[data-prev], [data-next]').forEach(b => { b.hidden = group.length < 2; });
  };
  links.forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    if (!dlg) build();
    opener = a;
    group = links.filter(l => l.dataset.lightbox === a.dataset.lightbox && !l.closest('[hidden]'));
    // Les affiches en double (même image) n'apparaissent qu'une fois
    group = group.filter((l, i) => group.findIndex(o => o.getAttribute('href') === l.getAttribute('href')) === i || l === a);
    show(Math.max(0, group.indexOf(a)));
    document.documentElement.classList.add('lb-open');
    dlg.showModal();
    neamTrack('poster_open', { poster: a.getAttribute('href').split('/').pop() });
  }));
})();

/* ---------- Blog : filtre par thème, sommaire actif ---------- */
(() => {
  const chips = [...document.querySelectorAll('.bfilter .chip')];
  if (chips.length) {
    const cards = [...document.querySelectorAll('#blogGrid .bcard')];
    const empty = document.querySelector('.bfilter__empty');
    chips.forEach(c => c.addEventListener('click', () => {
      chips.forEach(o => { o.classList.toggle('is-on', o === c); o.setAttribute('aria-pressed', String(o === c)); });
      const f = c.dataset.filter;
      let shown = 0;
      cards.forEach(card => { const ok = !f || card.dataset.cat === f; card.hidden = !ok; if (ok) { shown++; card.classList.add('is-in'); } });
      if (empty) empty.hidden = shown > 0;
    }));
  }
  const toc = [...document.querySelectorAll('.toc a')];
  if (toc.length && 'IntersectionObserver' in window) {
    const map = new Map(toc.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        toc.forEach(a => a.classList.remove('is-on'));
        const a = map.get(e.target.id);
        if (a) a.classList.add('is-on');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    map.forEach((a, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
  }
})();
