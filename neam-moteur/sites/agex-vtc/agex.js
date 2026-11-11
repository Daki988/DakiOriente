// Agex VTC : menu, estimation rapide et complète, commande WhatsApp, abonnements, candidature chauffeur, galerie, contact.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const AG = window.AG || {};
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${AG.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  const r500 = (n) => Math.round(n / 500) * 500;
  const Z = Object.fromEntries(AG.zones.map((z) => [z[0], z]));
  const C = Object.fromEntries(AG.classes.map((c) => [c.id, c]));
  const dist = (a, b) => Math.max(2, Math.hypot(Z[a][2] - Z[b][2], Z[a][3] - Z[b][3]) * 1.3 + 1);
  const fare = (a, b, c) => Math.max(3000, r500(c.base + c.km * dist(a, b)));

  function toast(t) {
    let el = $('.ag-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'ag-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#0B0D12;color:#fff;padding:14px 22px;border-radius:999px;font:600 15px Inter,Arial;box-shadow:0 14px 40px rgba(0,0,0,.35);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border:2px solid #F2B705';
      document.body.appendChild(el);
    }
    el.textContent = t; el.style.opacity = 1; clearTimeout(el._t); el._t = setTimeout(() => (el.style.opacity = 0), 3400);
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
  burger.addEventListener('click', () => { const o = hd.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });

  // Réseaux
  const icon = (n, s = 18) => (window.brandSvg ? window.brandSvg(n, s) : '');
  $$('[data-soc]').forEach((el) => (el.innerHTML = AG.soc.map((n) => `<a href="../../social.html?slug=${AG.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));

  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .svg3>*, .cls>*, .avis figure, .sv, .steps li').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // ---- Estimation rapide (accueil) ----
  const qe = $('[data-qe]');
  if (qe) {
    const upd = () => {
      const same = qe.from.value === qe.to.value;
      $('[data-qr]').innerHTML = same ? '<div style="grid-column:1/-1"><small>Choisissez deux zones différentes</small></div>' : AG.classes.map((c) => `<div><small>${c.n}</small><b>${fcfa(fare(qe.from.value, qe.to.value, c))}</b></div>`).join('');
    };
    qe.addEventListener('change', upd); upd();
    $('[data-swap]').addEventListener('click', () => { [qe.from.value, qe.to.value] = [qe.to.value, qe.from.value]; upd(); });
  }

  // ---- Estimation complète et commande ----
  const f = $('[data-est]');
  if (f) {
    const pad = (n) => String(n).padStart(2, '0');
    const d = new Date(); f.date.min = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; f.date.value = f.date.min;
    f.time.value = `${pad((d.getHours() + 1) % 24)}:00`;
    ['from', 'to', 'svc'].forEach((k) => { if (qs.get(k) && f[k].querySelector(`option[value="${qs.get(k)}"]`)) f[k].value = qs.get(k); });
    if (qs.get('svc') === 'aeroport' && !qs.get('to')) f.to.value = 'aeroport';
    const set = (k, v, html) => { const el = $(`[data-s="${k}"]`); if (html) el.innerHTML = v; else el.textContent = v; };
    const calc = () => {
      const svc = f.svc.value, hourly = svc === 'heure', c = C[$('input[name="cls"]:checked', f).value];
      $('[data-hours]').hidden = !hourly; f.to.closest('.fld').hidden = hourly;
      const h = +f.time.value.split(':')[0], night = h >= 22 || h < 6, ar = f.ar.checked && !hourly;
      const km = dist(f.from.value, f.to.value);
      const lines = []; let tot;
      if (hourly) { tot = c.h * +f.h.value; lines.push([`Mise à disposition ${f.h.value} h`, tot]); }
      else {
        const one = f.from.value === f.to.value ? 3000 : fare(f.from.value, f.to.value, c); tot = one; lines.push(['Aller', one]);
        if (ar) { const back = r500(one * 0.9); tot += back; lines.push(['Retour (−10 %)', back]); }
      }
      if (svc === 'aeroport') { lines.push(['Accueil avec pancarte', 2000]); tot += 2000; }
      if (night) { const s = r500(tot * 0.3); lines.push(['Majoration de nuit (+30 %)', s]); tot += s; }
      const pax = +f.pax.value, pm = $('[data-paxmsg]');
      pm.hidden = pax <= c.pax; pm.textContent = `${pax} passagers : choisissez le SUV / 7 places ou deux véhicules.`;
      AG.classes.forEach((k) => { $(`[data-cp="${k.id}"]`).textContent = hourly ? `${fcfa(k.h)}/h` : f.from.value === f.to.value ? '' : fcfa(fare(f.from.value, f.to.value, k)); });
      set('trip', hourly ? `Au départ de ${Z[f.from.value][1]}` : `${Z[f.from.value][1]} → ${Z[f.to.value][1]}${ar ? ' (A/R)' : ''}`);
      set('km', hourly ? '—' : `≈ ${Math.round(km)} km`); set('cls', c.n);
      set('when', `${new Date(f.date.value + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à ${f.time.value.replace(':', ' h ')}`);
      set('lines', lines.map(([n, v]) => `<div><span>${n}</span><b>${fcfa(v)}</b></div>`).join(''), true);
      set('tot', fcfa(tot)); set('range', svc === 'mariage' || svc === 'affretement' ? 'Base indicative par véhicule : devis précis sur WhatsApp' : 'Prix confirmé par l\'opérateur à la commande');
      return { svc, c, tot, night, ar, hourly };
    };
    f.addEventListener('change', calc); f.addEventListener('input', calc); calc();
    $('[data-send]').addEventListener('click', () => {
      if (!check(f)) return;
      const r = calc(), sv = AG.services.find(([id]) => id === r.svc)[1];
      wa(`Bonjour Agex, je souhaite commander une course.\n\nService : ${sv}\n${r.hourly ? `Mise à disposition : ${f.h.value} h, départ ${Z[f.from.value][1]}` : `Trajet : ${Z[f.from.value][1]} → ${Z[f.to.value][1]}${r.ar ? ' (aller-retour)' : ''}`}\nDate : ${f.date.value.split('-').reverse().join('/')} à ${f.time.value}\nVéhicule : ${r.c.n} · ${f.pax.value} passager(s)\nPrix estimé : ${fcfa(r.tot)}${f.msg.value.trim() ? '\n\n' + f.msg.value.trim() : ''}\n\n${f.nom.value} · ${f.tel.value}`);
      toast('Votre commande s\'ouvre dans WhatsApp.');
    });
  }

  // ---- Abonnements ----
  const ab = $('[data-abo]');
  if (ab) {
    const fm = $('form', ab); let t = qs.get('t') === 'pro' ? 'pro' : 'scol';
    const tab = (k) => { t = k; $$('[data-t]', ab).forEach((b) => b.setAttribute('aria-selected', b.dataset.t === k)); $$('[data-p]', ab).forEach((p) => (p.hidden = p.dataset.p !== k)); upd(); };
    const upd = () => {
      const one = fm.from.value === fm.to.value ? 2500 : Math.max(2500, r500((2000 + 260 * dist(fm.from.value, fm.to.value)) * 0.85));
      const days = +fm.j.value * 4.33, m = +fm.m.value, disc = m === 9 ? 0.12 : m === 3 ? 0.05 : 0;
      let tot, det;
      if (t === 'scol') {
        const n = +fm.enf.value, trips = fm.sens.value === '2' ? 2 : 1;
        tot = one * trips * days * (1 + (n - 1) * 0.5); det = `${n} enfant${n > 1 ? 's' : ''} (même trajet : +50 % par enfant supplémentaire)`;
      } else {
        const n = +fm.emp.value, trips = +fm.psens.value, veh = Math.ceil(n / 3);
        tot = one * trips * days * veh * 1.2; det = `${n} employé${n > 1 ? 's' : ''} · ${veh} véhicule${veh > 1 ? 's' : ''} par trajet`;
      }
      tot = r500(tot * (1 - disc));
      $('[data-ab="tot"]').textContent = fcfa(tot) + ' / mois';
      $('[data-ab="det"]').textContent = `${det} · ${Z[fm.from.value][1]} → ${Z[fm.to.value][1]} · ${fm.j.value} j/sem.${disc ? ` · remise −${disc * 100} % incluse` : ''}`;
      return { tot, det };
    };
    $$('[data-t]', ab).forEach((b) => b.addEventListener('click', () => tab(b.dataset.t)));
    fm.addEventListener('change', upd); tab(t);
    $('[data-ab-send]').addEventListener('click', () => { const r = upd(); wa(`Bonjour Agex, je souhaite un abonnement ${t === 'scol' ? 'scolaire' : 'professionnel'}.\n\n${r.det}\nTrajet : ${Z[fm.from.value][1]} → ${Z[fm.to.value][1]}\n${fm.j.value} jours par semaine · engagement ${fm.m.selectedOptions[0].text}\nEstimation : ${fcfa(r.tot)} par mois`); toast('Votre demande s\'ouvre dans WhatsApp.'); });
  }

  // ---- Candidature chauffeur ----
  const cd = $('[data-cand]');
  if (cd) {
    cd.permis.addEventListener('change', () => ($('[data-permis]').hidden = cd.permis.value !== 'Moins de 3 ans'));
    cd.addEventListener('submit', (e) => {
      e.preventDefault(); if (!check(cd)) return;
      wa(`Bonjour Agex, je souhaite devenir chauffeur.\n\nNom : ${cd.nom.value}\nTéléphone : ${cd.tel.value}\nQuartier : ${Z[cd.q.value][1]}\nPermis B : ${cd.permis.value}\nVéhicule : ${cd.veh.value}\nDisponibilités : ${cd.dispo.value}${cd.exp.value.trim() ? '\nExpérience : ' + cd.exp.value.trim() : ''}`);
      toast('Votre candidature s\'ouvre dans WhatsApp.');
    });
  }

  // ---- Galerie ----
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

  // ---- Contact ----
  const ct = $('[data-contact]');
  if (ct) ct.addEventListener('submit', (e) => {
    e.preventDefault(); if (!check(ct)) return;
    wa(`Bonjour Agex (${ct.obj.value}),\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`);
    toast('Votre message s\'ouvre dans WhatsApp.');
  });
})();
