// Socle des sites d'hôtel : menu, recherche de dates, galerie des chambres, moteur de réservation, contact.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const H = window.H || {};
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${H.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fd = (v) => new Date(v + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  function toast(t) {
    let el = $('.ht-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'ht-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#111;color:#fff;padding:14px 22px;border-radius:8px;font:600 15px Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s';
      document.body.appendChild(el);
    }
    el.textContent = t; el.style.opacity = 1; clearTimeout(el._t); el._t = setTimeout(() => (el.style.opacity = 0), 3600);
  }
  function check(form) {
    let ok = true;
    $$('[required]', form).forEach((i) => { const bad = !i.value.trim(); i.closest('.fld')?.classList.toggle('bad', bad); if (bad && ok) { i.focus(); ok = false; } });
    if (!ok) toast('Merci de compléter les champs en rouge.');
    return ok;
  }
  document.addEventListener('input', (e) => e.target.closest?.('.fld')?.classList.remove('bad'));

  // En-tête et menu mobile
  const hd = $('.hd'), burger = $('.burger');
  addEventListener('scroll', () => hd.classList.toggle('solid', scrollY > 20), { passive: true });
  if (burger) burger.addEventListener('click', () => { const o = hd.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });

  // Réseaux
  const icon = (n, s = 18) => (window.brandSvg ? window.brandSvg(n, s) : '');
  $$('[data-soc]').forEach((el) => (el.innerHTML = (H.soc || ['facebook']).map((n) => `<a href="../../social.html?slug=${H.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${H.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));

  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .rms3>*, .amen>*, .avis figure, .rm, .lst>*').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // Dates par défaut (demain, 2 nuits) et cohérence arrivée / départ
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const plus = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };
  const initDates = (f) => {
    f.in.min = plus(0); f.in.value = qs.get('in') || plus(1);
    const fixOut = () => { const d = new Date(f.in.value + 'T12:00'); d.setDate(d.getDate() + 1); f.out.min = iso(d); if (!f.out.value || f.out.value <= f.in.value) f.out.value = iso(new Date(d.getTime() + 864e5)); };
    f.out.value = qs.get('out') || ''; fixOut();
    f.in.addEventListener('change', fixOut);
    if (qs.get('ad') && f.ad) f.ad.value = qs.get('ad'); if (qs.get('en') && f.en) f.en.value = qs.get('en');
  };
  $$('[data-book]').forEach(initDates);

  // Photos des chambres
  $$('[data-rg]').forEach((g) => $$('.dots button', g).forEach((b) => b.addEventListener('click', () => { $('img', g).src = b.dataset.src; $$('.dots button', g).forEach((x) => x.classList.toggle('on', x === b)); })));

  // ---- Moteur de réservation ----
  const f = $('[data-res]');
  if (f) {
    initDates(f);
    if (qs.get('site') && f.site) f.site.value = qs.get('site');
    if (qs.get('room')) { const r = $(`input[name="room"][value="${qs.get('room')}"]`, f); if (r) r.checked = true; }
    const RM = Object.fromEntries(H.rooms.map((r) => [r.id, r]));
    const X = Object.fromEntries(H.extras.map((x) => [x.id, x]));
    const set = (k, t, html) => { const el = $(`[data-s="${k}"]`); if (html) el.innerHTML = t; else el.textContent = t; };
    const calc = () => {
      const a = new Date(f.in.value + 'T12:00'), b = new Date(f.out.value + 'T12:00');
      const nights = Math.max(0, Math.round((b - a) / 864e5)), room = RM[$('input[name="room"]:checked', f).value], nb = +f.nb.value;
      const ad = +f.ad.value, en = +f.en.value, pax = ad + en;
      const dm = $('[data-dmsg]');
      if (!nights) { dm.hidden = false; dm.textContent = 'La date de départ doit être après la date d\'arrivée.'; } else dm.hidden = true;
      // Nuits du vendredi et du samedi au tarif week-end
      let base = 0, wk = 0;
      for (let i = 0; i < nights; i++) { const d = new Date(a.getTime() + i * 864e5).getDay(); if (d === 5 || d === 6) { base += room.wkd; wk++; } else base += room.price; }
      base *= nb;
      const cap = $('[data-cap]'), need = Math.ceil(pax / room.cap);
      if (need > nb) { cap.hidden = false; cap.className = 'msg'; cap.textContent = `${pax} voyageurs : prévoyez ${need} ${room.n.toLowerCase().startsWith('appartement') ? 'logements' : 'chambres'} de ce type (${room.cap} pers. max chacune).`; } else cap.hidden = true;
      // Remise long séjour
      const tier = (H.stay || []).filter((t) => nights >= t.n).sort((x, y) => y.n - x.n)[0];
      const disc = tier ? Math.round(base * tier.pct / 100) : 0;
      // Options
      const lines = [`<div><span>${nights} nuit${nights > 1 ? 's' : ''} × ${nb} ${room.n}${wk ? ` (dont ${wk} week-end)` : ''}</span><b>${fcfa(base)}</b></div>`];
      if (disc) lines.push(`<div class="dc"><span>Remise ${tier.label} (−${tier.pct} %)</span><b>−${fcfa(disc)}</b></div>`);
      let ext = 0;
      $$('input[name="x"]:checked', f).forEach((c) => {
        const x = X[c.value]; let q = 1;
        if (x.per === 'pers-nuit') q = ad * nights; else if (x.per === 'nuit') q = nights * nb; else if (x.per === 'pers') q = pax;
        ext += x.p * q; lines.push(`<div><span>${x.n}${q > 1 ? ` × ${q}` : ''}</span><b>${fcfa(x.p * q)}</b></div>`);
      });
      const tot = base - disc + ext;
      set('dates', nights ? `${fd(f.in.value)} → ${fd(f.out.value)}` : 'à préciser'); set('room', `${nb} × ${room.n}`); set('pax', `${ad} adulte${ad > 1 ? 's' : ''}${en ? `, ${en} enfant${en > 1 ? 's' : ''}` : ''}`);
      set('lines', lines.join(''), true); set('tot', fcfa(tot)); set('per', nights ? `soit ${fcfa(tot / nights)} par nuit en moyenne` : '');
      (H.stay || []).length && !tier && nights && set('per', `${$('[data-s="per"]').textContent} · remise dès ${H.stay[0].n} nuits`);
      return { nights, room, nb, ad, en, tot, disc, tier };
    };
    f.addEventListener('change', calc); f.addEventListener('input', calc); calc();
    $('[data-send]').addEventListener('click', () => {
      const c = calc();
      if (!c.nights) { toast('Choisissez des dates valides.'); return; }
      if (!check(f)) return;
      const opts = $$('input[name="x"]:checked', f).map((x) => H.extras.find((e) => e.id === x.value).n);
      wa(`Bonjour ${H.name}, je souhaite réserver.\n\n${f.site ? 'Établissement : ' + f.site.value + '\n' : ''}Arrivée : ${fd(f.in.value)}\nDépart : ${fd(f.out.value)} (${c.nights} nuit${c.nights > 1 ? 's' : ''})\n${c.nb} × ${c.room.n}\nVoyageurs : ${c.ad} adulte(s)${c.en ? ', ' + c.en + ' enfant(s)' : ''}${opts.length ? '\nOptions : ' + opts.join(', ') : ''}${c.disc ? '\nRemise ' + c.tier.label + ' appliquée' : ''}\nTotal estimé : ${fcfa(c.tot)}${f.msg.value.trim() ? '\n\n' + f.msg.value.trim() : ''}\n\n${f.nom.value} · ${f.tel.value}`);
      toast('Votre demande de réservation s\'ouvre dans WhatsApp.');
    });
  }

  // ---- Formulaires propres à l'hôtel (séminaire, groupe, long séjour) ----
  $$('[data-wa-form]').forEach((fm) => fm.addEventListener('submit', (e) => {
    e.preventDefault(); if (!check(fm)) return;
    const lines = $$('[name]', fm).filter((i) => i.value && i.type !== 'submit' && (i.type !== 'radio' || i.checked) && (i.type !== 'checkbox' || i.checked)).map((i) => `${i.closest('.fld')?.querySelector('span')?.textContent || i.name} : ${i.value}`);
    wa(`Bonjour ${H.name}, ${fm.dataset.waForm}\n\n${lines.join('\n')}`);
    toast('Votre demande s\'ouvre dans WhatsApp.');
  }));

  // ---- Simulateur long séjour (si présent) ----
  const ls = $('[data-ls]');
  if (ls) {
    const upd = () => {
      const n = +ls.querySelector('[name="n"]').value, r = H.rooms.find((x) => x.id === ls.querySelector('[name="r"]').value);
      const tier = (H.stay || []).filter((t) => n >= t.n).sort((x, y) => y.n - x.n)[0];
      const base = r.price * n, d = tier ? base * tier.pct / 100 : 0;
      $('[data-ls-n]').textContent = `${n} nuits`;
      $('[data-ls-r]').innerHTML = `<b>${fcfa(base - d)}</b><span>${tier ? `remise ${tier.label} −${tier.pct} % · économie ${fcfa(d)}` : 'sans remise'} · ${fcfa((base - d) / n)} la nuit</span>`;
      $('[data-ls-go]').href = `reservation.html?room=${r.id}&in=${(() => { const x = new Date(); x.setDate(x.getDate() + 1); return iso(x); })()}&out=${(() => { const x = new Date(); x.setDate(x.getDate() + 1 + n); return iso(x); })()}`;
    };
    ls.addEventListener('input', upd); ls.addEventListener('change', upd); upd();
  }

  // ---- Galerie ----
  const lb = $('.lb');
  if (lb) {
    const photos = JSON.parse(lb.dataset.photos); let i = 0;
    const showP = () => { $('img', lb).src = photos[i]; $('img', lb).alt = $$('[data-gal] span')[i]?.textContent || ''; $('.ct', lb).textContent = `${i + 1} / ${photos.length}`; };
    const close = () => { lb.hidden = true; document.body.style.overflow = ''; };
    $$('[data-gal] [data-i]').forEach((b) => b.addEventListener('click', () => { i = +b.dataset.i; showP(); lb.hidden = false; document.body.style.overflow = 'hidden'; $('.x', lb).focus(); }));
    $('.x', lb).onclick = close;
    $('.pv', lb).onclick = () => { i = (i + photos.length - 1) % photos.length; showP(); };
    $('.nx', lb).onclick = () => { i = (i + 1) % photos.length; showP(); };
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') $('.nx', lb).click(); if (e.key === 'ArrowLeft') $('.pv', lb).click(); });
  }

  // ---- Contact ----
  const ct = $('[data-contact]');
  if (ct) ct.addEventListener('submit', (e) => {
    e.preventDefault(); if (!check(ct)) return;
    wa(`Bonjour ${H.name},\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`);
    toast('Votre message s\'ouvre dans WhatsApp.');
  });
})();
