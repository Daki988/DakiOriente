// Escapade Travel Agency : interactions du site (menu, filtres, réservation, formulaires vers WhatsApp)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const AG = window.AG || {};
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  const fdate = (v) => (v ? new Date(v + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '');
  const wa = (text) => window.open(`https://wa.me/${AG.wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  const qs = new URLSearchParams(location.search);

  function toast(t) {
    let el = $('.esc-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'esc-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#0E2A47;color:#fff;padding:14px 20px;border-radius:14px;font:600 15px Inter,Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s';
      document.body.appendChild(el);
    }
    el.textContent = t; el.style.opacity = 1;
    clearTimeout(el._t); el._t = setTimeout(() => (el.style.opacity = 0), 3800);
  }
  // Champs obligatoires : signale ceux qui manquent
  function check(form) {
    let ok = true;
    $$('[required]', form).forEach((i) => { const bad = !i.value.trim(); i.closest('.fld')?.classList.toggle('bad', bad); if (bad && ok) { i.focus(); ok = false; } });
    if (!ok) toast('Merci de compléter les champs en rouge.');
    return ok;
  }
  $$('input[type=date]').forEach((i) => (i.min = new Date().toISOString().slice(0, 10)));

  // ---- En-tête : transparent sur la photo d'accueil, menu mobile ----
  const hd = $('.hd');
  const onScroll = () => hd.classList.toggle('solid', scrollY > 40);
  if (hd.classList.contains('clear')) { onScroll(); addEventListener('scroll', onScroll, { passive: true }); }
  const burger = $('.burger');
  burger.addEventListener('click', () => { const o = hd.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });

  // ---- Icônes officielles des réseaux ----
  const icon = (n, s = 18) => (window.brandSvg ? window.brandSvg(n, s) : '');
  $$('[data-soc]').forEach((el) => {
    el.innerHTML = ['facebook', 'instagram', 'tiktok', 'linkedin'].map((n) => `<a href="../../social.html?slug=${AG.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`;
  });
  $$('[data-wa-ic]').forEach((b) => b.insertAdjacentHTML('afterbegin', icon('whatsapp', 18)));

  // ---- Apparition au défilement ----
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .band .tx, .cta, .strip, .srv>a, .grid>.card, .rt>div, .avis>figure, .vals>div, .team>div, .info>div').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // ---- Destinations : filtres et tri ----
  const list = $('[data-list]');
  if (list) {
    const cards = $$('.card', list);
    const apply = (f) => {
      let n = 0;
      cards.forEach((c) => { const [k, v] = f.split(':'); const show = f === 'all' || (k === 'zone' ? c.dataset.zone === v : c.dataset.tags.split(' ').includes(v)); c.classList.toggle('out', !show); n += show; });
      $('.empty').hidden = n > 0;
      $$('[data-filter] button').forEach((b) => b.classList.toggle('on', b.dataset.f === f));
    };
    $$('[data-filter] button').forEach((b) => b.addEventListener('click', () => apply(b.dataset.f)));
    $('[data-sort]').addEventListener('change', (e) => {
      const v = e.target.value;
      const s = [...cards].sort((a, b) => (v ? (v === 'asc' ? 1 : -1) * (a.dataset.price - b.dataset.price) : cards.indexOf(a) - cards.indexOf(b)));
      s.forEach((c) => list.appendChild(c));
    });
    if (qs.get('f')) apply(qs.get('f'));
  }

  // ---- Visionneuse photos ----
  const lb = $('.lb');
  if (lb) {
    const photos = JSON.parse(lb.dataset.photos); let i = 0;
    const show = () => { $('img', lb).src = photos[i]; $('.ct', lb).textContent = `${i + 1} / ${photos.length}`; };
    const open = (k) => { i = k; show(); lb.hidden = false; document.body.style.overflow = 'hidden'; $('.x', lb).focus(); };
    const close = () => { lb.hidden = true; document.body.style.overflow = ''; };
    $$('[data-gal] [data-i]').forEach((b) => b.addEventListener('click', () => open(+b.dataset.i)));
    $('.x', lb).onclick = close;
    $('.pv', lb).onclick = () => { i = (i + photos.length - 1) % photos.length; show(); };
    $('.nx', lb).onclick = () => { i = (i + 1) % photos.length; show(); };
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') $('.nx', lb).click(); if (e.key === 'ArrowLeft') $('.pv', lb).click(); });
  }

  // ---- Fiche destination : programme et réservation ----
  const prog = $('[data-prog]'), more = $('[data-more]');
  if (prog && more) {
    prog.classList.add('short');
    more.addEventListener('click', () => { const s = prog.classList.toggle('short'); more.textContent = s ? more.textContent.replace('Masquer', 'Voir').replace('▴', '▾') : 'Masquer le programme ▴'; if (s) more.textContent = more.dataset.t; });
    more.dataset.t = more.textContent;
  }
  const book = $('[data-book]');
  if (book) {
    document.body.classList.add('has-sticky');
    let n = 2; const price = +book.dataset.price;
    const calc = () => { $('[data-n]', book).textContent = n; $('[data-tot]', book).textContent = fcfa(n * (price + ($('[data-ins]', book).checked ? 35000 : 0))); };
    $('[data-m]', book).onclick = () => { n = Math.max(1, n - 1); calc(); };
    $('[data-p]', book).onclick = () => { n = Math.min(12, n + 1); calc(); };
    $('[data-ins]', book).onchange = calc;
    $('[data-go]', book).onclick = () => {
      const d = $('[data-date]', book);
      if (!d.value) { d.closest('.fld').classList.add('bad'); d.focus(); toast('Choisissez votre date de départ.'); return; }
      d.closest('.fld').classList.remove('bad');
      wa(`Bonjour Escapade, je souhaite réserver le séjour « ${book.dataset.name} ».\nDépart : ${fdate(d.value)}\nVoyageurs : ${n} adulte(s)\nAssurance voyage : ${$('[data-ins]', book).checked ? 'oui' : 'non'}\nTotal estimé : ${$('[data-tot]', book).textContent}`);
      toast('Votre demande s\'ouvre dans WhatsApp.');
    };
    $('[data-jump]')?.addEventListener('click', (e) => { e.preventDefault(); book.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }

  // ---- Billetterie ----
  const fl = $('[data-flight]');
  if (fl) {
    let trip = 'AR';
    $$('[data-trip]', fl).forEach((b) => b.addEventListener('click', () => {
      trip = b.dataset.trip; $$('[data-trip]', fl).forEach((x) => x.classList.toggle('on', x === b));
      $('[data-ret]', fl).hidden = trip === 'AS';
      if (trip === 'MD') toast('Indiquez la première étape, nous préparons l\'itinéraire complet avec vous.');
    }));
    $('[data-swap]', fl).onclick = () => { const a = fl.from, b = fl.to; [a.value, b.value] = [b.value, a.value]; };
    $$('[data-route]').forEach((b) => b.addEventListener('click', () => { fl.to.value = b.dataset.route; fl.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => fl.d1.focus({ preventScroll: true }), 500); }));
    fl.addEventListener('submit', (e) => {
      e.preventDefault(); if (!check(fl)) return;
      const t = { AR: 'Aller-retour', AS: 'Aller simple', MD: 'Multi-destinations' }[trip];
      wa(`Bonjour Escapade, je souhaite un tarif pour un billet d'avion.\n${t} : ${fl.from.value} → ${fl.to.value}\nDépart : ${fdate(fl.d1.value)}${trip !== 'AS' && fl.d2.value ? `\nRetour : ${fdate(fl.d2.value)}` : ''}\nPassagers : ${fl.pax.value}`);
      toast('Votre demande s\'ouvre dans WhatsApp.');
    });
  }

  // ---- Voyage sur mesure ----
  const cf = $('[data-custom]');
  if (cf) {
    const cnt = { adultes: Math.min(9, Math.max(1, +qs.get('pax') || 2)), enfants: 0 };
    if (qs.get('dest')) cf.dest.value = qs.get('dest');
    if (qs.get('date')) cf.date.value = qs.get('date');
    const S = (k, v) => ($(`[data-s="${k}"]`).textContent = v);
    const sync = () => {
      $$('[data-c]').forEach((b) => (b.textContent = cnt[b.dataset.c]));
      S('envie', cf.envie.value); S('dest', cf.dest.value || 'À définir'); S('date', cf.date.value ? fdate(cf.date.value) + ' · ' + cf.duree.value : cf.duree.value);
      S('pax', `${cnt.adultes} adulte${cnt.adultes > 1 ? 's' : ''}${cnt.enfants ? ` · ${cnt.enfants} enfant${cnt.enfants > 1 ? 's' : ''}` : ''}`);
      const b = fcfa(+cf.budget.value); $('[data-bud]').textContent = b; S('budget', b + ' / pers.');
    };
    $$('[data-inc]').forEach((b) => (b.onclick = () => { const k = b.dataset.inc; cnt[k] = Math.min(9, cnt[k] + 1); sync(); }));
    $$('[data-dec]').forEach((b) => (b.onclick = () => { const k = b.dataset.dec; cnt[k] = Math.max(k === 'adultes' ? 1 : 0, cnt[k] - 1); sync(); }));
    cf.addEventListener('input', sync); cf.addEventListener('change', sync); sync();
    $('[data-send]').onclick = () => {
      if (!check(cf)) return;
      wa(`Bonjour Escapade, je souhaite un devis pour un voyage sur mesure.\nEnvie : ${cf.envie.value}\nDestination : ${cf.dest.value || 'à définir avec vous'}\nDépart : ${cf.date.value ? fdate(cf.date.value) : 'dates flexibles'} · ${cf.duree.value}\nVoyageurs : ${$('[data-s="pax"]').textContent}\nHébergement : ${cf.heb.value}\nBudget : ${fcfa(+cf.budget.value)} par personne${cf.msg.value ? `\nPrécision : ${cf.msg.value}` : ''}\n\n${cf.prenom.value} · ${cf.tel.value}`);
      toast('Merci ' + cf.prenom.value + ' ! Votre demande s\'ouvre dans WhatsApp.');
    };
  }

  // ---- Contact ----
  const ct = $('[data-contact]');
  if (ct) ct.addEventListener('submit', (e) => {
    e.preventDefault(); if (!check(ct)) return;
    wa(`Bonjour Escapade, ma demande concerne : ${ct.objet.value.toLowerCase()}.\n${ct.msg.value}\n\n${ct.prenom.value} · ${ct.tel.value}`);
    toast('Merci ' + ct.prenom.value + ' ! Votre message s\'ouvre dans WhatsApp.');
  });
  $$('.fld input, .fld textarea').forEach((i) => i.addEventListener('input', () => i.closest('.fld').classList.remove('bad')));
})();
