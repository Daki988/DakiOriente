// Cabinet dentaire ACAE Sourire : interactions (menu, soins, urgence, préparation, rendez-vous, contact)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const AG = window.AG || {};
  const EX = AG.exams || {};
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${AG.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  const DAYN = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const fday = (d) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  function toast(t) {
    let el = $('.ci-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'ci-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#0D2326;color:#fff;padding:14px 20px;border-radius:12px;font:600 15px Inter,Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s';
      document.body.appendChild(el);
    }
    el.textContent = t; el.style.opacity = 1; clearTimeout(el._t); el._t = setTimeout(() => (el.style.opacity = 0), 3800);
  }
  function check(form) {
    let ok = true;
    $$('[required]', form).forEach((i) => { const bad = !i.value.trim(); i.closest('.fld')?.classList.toggle('bad', bad); if (bad && ok) { i.focus(); ok = false; } });
    if (!ok) toast('Merci de compléter les champs en rouge.');
    return ok;
  }
  $$('.fld input, .fld textarea').forEach((i) => i.addEventListener('input', () => i.closest('.fld').classList.remove('bad')));

  // En-tête et menu mobile
  const hd = $('.hd'), burger = $('.burger');
  addEventListener('scroll', () => hd.classList.toggle('solid', scrollY > 20), { passive: true });
  burger.addEventListener('click', () => { const o = hd.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });

  // Réseaux (icônes officielles)
  const icon = (n, s = 18) => (window.brandSvg ? window.brandSvg(n, s) : '');
  $$('[data-soc]').forEach((el) => (el.innerHTML = ['facebook', 'linkedin'].map((n) => `<a href="../../social.html?slug=${AG.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));

  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .grid>*, .steps li, .avis figure, .exl article, .team>div, .info>div, .cta').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // FAQ : une réponse ouverte à la fois
  $$('.qs details').forEach((d) => d.addEventListener('toggle', () => { if (d.open) $$('.qs details').forEach((o) => o !== d && (o.open = false)); }));

  // Créneaux : jours d'ouverture et horaires
  const SLOTS = { week: ['8:00', '8:45', '9:30', '10:15', '11:00', '11:45', '14:00', '14:45', '15:30', '16:15', '17:00'], sat: ['9:00', '9:45', '10:30', '11:15', '12:00'] };
  const openDays = (n) => { const out = []; const d = new Date(); d.setHours(12, 0, 0, 0); while (out.length < n) { if (d.getDay() !== 0) out.push(new Date(d)); d.setDate(d.getDate() + 1); } return out; };
  const taken = (d, s) => (d.getDate() * 7 + s.length * 3 + parseInt(s, 10)) % 4 === 0; // créneaux déjà pris (démonstration)
  const past = (d, s) => { const n = new Date(); if (d.toDateString() !== n.toDateString()) return false; const [h, m] = s.split(':').map(Number); return h * 60 + m < n.getHours() * 60 + n.getMinutes() + 30; };
  const free = (d) => (d.getDay() === 6 ? SLOTS.sat : SLOTS.week).filter((s) => !taken(d, s) && !past(d, s));
  const nx = $('[data-next]');
  if (nx) { const d = openDays(6).find((x) => free(x).length); nx.textContent = `${d.toDateString() === new Date().toDateString() ? 'Aujourd\'hui' : fday(d)} · ${free(d)[0].replace(':', ' h ')}`; }

  // Examens : filtre par catégorie
  $$('[data-tabs] button').forEach((b) => b.addEventListener('click', () => {
    $$('[data-tabs] button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
    $$('.exl article').forEach((a) => (a.hidden = !!b.dataset.cat && a.dataset.cat !== b.dataset.cat));
  }));

  // Préparer mon examen
  const ps = $('[data-prep]');
  if (ps) {
    const render = () => {
      const e = EX[ps.value];
      $('[data-pcard]').innerHTML = `<div class="im" style="background-image:url(${e.ph})"></div><div class="bd"><h2>${e.t}</h2><div class="tm"><span>Durée : <b>${e.dur}</b></span><span>${e.cr}</span></div><ol>${e.prep.map((x) => `<li>${x}</li>`).join('')}</ol><p style="margin-top:16px"><a class="btn p" href="rendez-vous.html?examen=${ps.value}">Prendre rendez-vous pour cet examen</a></p></div>`;
    };
    if (EX[qs.get('examen')]) ps.value = qs.get('examen');
    ps.addEventListener('change', render); render();
  }

  // Rendez-vous
  const f = $('[data-steps]');
  if (f) {
    const days = openDays(6);
    $('[data-days]').innerHTML = days.map((d, i) => `<label><input type="radio" name="jour" value="${i}"${i === 0 ? ' checked' : ''}><span>${DAYN[d.getDay()]}<b>${d.getDate()}</b>${d.toLocaleDateString('fr-FR', { month: 'short' })}</span></label>`).join('');
    const slots = () => {
      const d = days[+f.jour.value];
      const all = d.getDay() === 6 ? SLOTS.sat : SLOTS.week;
      const ok = free(d);
      $('[data-slots]').innerHTML = all.map((s) => `<label><input type="radio" name="slot" value="${s}"${ok.includes(s) ? '' : ' disabled'}><span>${s.replace(':', ' h ')}</span></label>`).join('');
      const first = $('[name=slot]:not(:disabled)', f); if (first) first.checked = true;
    };
    if (EX[qs.get('examen')]) $(`[name=examen][value="${qs.get('examen')}"]`, f).checked = true;
    const S = (k, v) => ($(`[data-s="${k}"]`).innerHTML = v);
    const sync = () => {
      const e = EX[f.examen.value], d = days[+f.jour.value], s = $('[name=slot]:checked', f);
      S('examen', e.t); S('jour', fday(d)); S('slot', s ? s.value.replace(':', ' h ') : 'Complet, choisissez un autre jour'); S('dur', e.dur);
      S('prep', e.prep.map((x) => `<li>${x}</li>`).join('') + (f.enceinte.checked ? '<li><b>Urgence :</b> nous vous rappelons au plus vite</li>' : ''));
    };
    f.addEventListener('change', (ev) => { if (ev.target.name === 'jour') slots(); sync(); });
    slots(); sync();
    $('[data-send]').addEventListener('click', () => {
      if (!check(f)) return;
      const s = $('[name=slot]:checked', f);
      if (!s) { toast('Ce jour est complet : choisissez un autre jour.'); return; }
      const e = EX[f.examen.value];
      wa(`Bonjour, je souhaite un rendez-vous au cabinet dentaire ACAE Sourire.\nSoin : ${e.t}${f.precision.value ? ' (' + f.precision.value + ')' : ''}\nJour : ${fday(days[+f.jour.value])} à ${s.value.replace(':', ' h ')}\n${f.ordo.value}\nPrise en charge : ${f.assur.value}${f.enceinte.checked ? '\nURGENCE : douleur forte ou dent cassée' : ''}${f.msg.value ? '\nInfos : ' + f.msg.value : ''}\n\n${f.nom.value} · ${f.tel.value}`);
      toast('Votre demande s\'ouvre dans WhatsApp. Nous confirmons le créneau rapidement.');
    });
  }

  // Galerie
  const lb = $('.lb');
  if (lb) {
    const photos = JSON.parse(lb.dataset.photos); let i = 0;
    const show = () => { $('img', lb).src = photos[i]; $('img', lb).alt = $$('[data-gal] span')[i]?.textContent || ''; $('.ct', lb).textContent = `${i + 1} / ${photos.length}`; };
    const close = () => { lb.hidden = true; document.body.style.overflow = ''; };
    $$('[data-gal] [data-i]').forEach((b) => b.addEventListener('click', () => { i = +b.dataset.i; show(); lb.hidden = false; document.body.style.overflow = 'hidden'; $('.x', lb).focus(); }));
    $('.x', lb).onclick = close;
    $('.pv', lb).onclick = () => { i = (i + photos.length - 1) % photos.length; show(); };
    $('.nx', lb).onclick = () => { i = (i + 1) % photos.length; show(); };
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') $('.nx', lb).click(); if (e.key === 'ArrowLeft') $('.pv', lb).click(); });
  }

  // Contact
  // ---- Urgence dentaire ----
  const ug = $('[data-urg]');
  if (ug) {
    const show = () => { const v = $('input[name="urg"]:checked', ug).value; $$('[data-u]').forEach((c) => (c.hidden = c.dataset.u !== v)); };
    ug.addEventListener('change', show);
    const q = new URLSearchParams(location.search).get('cas'); const r = q && $(`input[value="${q}"]`, ug); if (r) r.checked = true;
    show();
    $$('[data-uwa]').forEach((b) => b.addEventListener('click', () => { const c = b.closest('[data-u]'); wa(`Bonjour ACAE Sourire, j'ai une urgence dentaire : ${$('h2', c).textContent.toLowerCase()}. Pouvez-vous me recevoir ?`); }));
  }

  const ct = $('[data-contact]');
  if (ct) ct.addEventListener('submit', (e) => {
    e.preventDefault(); if (!check(ct)) return;
    wa(`Bonjour, ${ct.objet.value.toLowerCase()}.\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`);
    toast('Votre message s\'ouvre dans WhatsApp.');
  });
})();
