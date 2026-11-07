// Fishing Gabon Club : interactions (menu, saisons, réservation 48 h à l'avance, galerie, contact)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const FG = window.FG || {};
  const SP = FG.sp || {}, MOIS = FG.mois || [];
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${FG.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  const LV = ['Rare', 'Possible', 'Meilleure période'];

  function toast(t) {
    let el = $('.fg-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'fg-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#0B2A3C;color:#fff;padding:14px 20px;border-radius:14px;font:700 15px "DM Sans",Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border-left:5px solid #F29E38';
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
  $$('[data-soc]').forEach((el) => (el.innerHTML = ['facebook', 'instagram'].map((n) => `<a href="../../social.html?slug=${FG.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${FG.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));

  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .fms>*, .grid>*, .avis figure, .info>div').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  const month = new Date().getMonth();

  // ---- Accueil : ce qui mord ce mois-ci ----
  const now = $('[data-now]');
  if (now) {
    $('[data-now-m]').textContent = (MOIS[month] || '').toLowerCase();
    const list = Object.entries(SP).filter(([, [, s]]) => s[month] > 0).sort((a, b) => b[1][1][month] - a[1][1][month]).slice(0, 4);
    now.innerHTML = list.map(([id, [n, s]]) => `<li>${n}<span>${LV[s[month]]}</span></li>`).join('');
  }

  // ---- Espèces : choix du mois ----
  const months = $('[data-months]');
  if (months) {
    const setM = (m) => {
      $$('button', months).forEach((b) => { const on = +b.dataset.m === m; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      $$('[data-sp]').forEach((c) => {
        const v = +c.dataset.s[m]; c.className = 'sp l' + v; c.style.order = 2 - v;
        $('[data-lv]', c).textContent = `${MOIS[m]} · ${LV[v]}`;
      });
      $$('.cal thead th').forEach((th, i) => th.classList.toggle('on', i === m + 1));
      $$('.cal tbody tr').forEach((tr) => $$('td', tr).forEach((td, i) => td.classList.toggle('on', i === m)));
    };
    $$('button', months).forEach((b) => b.addEventListener('click', () => setM(+b.dataset.m)));
    const qm = parseInt(qs.get('mois'), 10);
    setM(qm >= 0 && qm < 12 ? qm : month);
  }

  // ---- Réservation ----
  const rs = $('[data-resa]');
  if (rs) {
    const pad = (n) => String(n).padStart(2, '0');
    const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const min = new Date(); min.setHours(0, 0, 0, 0); min.setDate(min.getDate() + 2);
    rs.date.min = iso(min);
    const fmtDate = (v) => new Date(v + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const cur = () => $('input[name="formule"]:checked', rs);
    let nb = 2;
    const esp = $('[data-esp]'), seasonMsg = $('[data-season]'), dateMsg = $('[data-date-msg]');

    // Préremplissage
    const qf = qs.get('formule'), qe = qs.get('espece');
    let pick = qf && $(`input[name="formule"][value="${qf}"]`, rs);
    if (!pick && qe) pick = $$('input[name="formule"]', rs).find((i) => i.dataset.sp.split(',').includes(qe));
    if (pick) pick.checked = true;

    const fillEsp = (keep) => {
      const ids = cur().dataset.sp.split(',');
      const prev = keep || esp.value;
      esp.innerHTML = (ids.length > 1 ? '<option value="">Pas de préférence</option>' : '') + ids.map((id) => `<option value="${id}">${SP[id] ? SP[id][0] : id}</option>`).join('');
      if (ids.includes(prev)) esp.value = prev;
    };
    const dateOk = () => {
      const v = rs.date.value;
      if (!v) { dateMsg.hidden = true; return false; }
      if (v < rs.date.min) { dateMsg.hidden = false; dateMsg.className = 'msg'; dateMsg.textContent = `Réservation 48 h à l'avance : première date possible le ${fmtDate(rs.date.min)}.`; return false; }
      dateMsg.hidden = true; return true;
    };
    const season = () => {
      const id = esp.value; if (!id || !SP[id]) { seasonMsg.hidden = true; return; }
      const [n, s] = SP[id];
      if (!rs.date.value) {
        const best = s.map((v, i) => (v === 2 ? MOIS[i].toLowerCase() : null)).filter(Boolean);
        seasonMsg.hidden = false; seasonMsg.className = 'msg ok'; seasonMsg.textContent = `${n} : meilleure période en ${best.join(', ')}.`; return;
      }
      const m = new Date(rs.date.value + 'T12:00').getMonth(), v = s[m];
      seasonMsg.hidden = false; seasonMsg.className = v === 2 ? 'msg ok' : 'msg';
      seasonMsg.textContent = v === 2 ? `Bonne pioche : ${MOIS[m].toLowerCase()} est la meilleure période (${n.toLowerCase()}).` : v === 1 ? `${n} : possible en ${MOIS[m].toLowerCase()}, sans être la meilleure période.` : `${n} : rare en ${MOIS[m].toLowerCase()}. Le guide vous proposera une alternative.`;
    };
    const setNb = (n) => {
      const max = +cur().dataset.max; nb = Math.min(Math.max(1, n), max);
      $('[data-n]').textContent = nb; rs.nb.value = nb;
      $('[data-minus]').disabled = nb <= 1; $('[data-plus]').disabled = nb >= max;
    };
    const set = (k, t) => ($(`[data-s="${k}"]`).textContent = t);
    const upd = () => {
      const f = cur(), price = +f.dataset.price;
      set('f', f.dataset.name);
      set('d', rs.date.value ? fmtDate(rs.date.value) + ' · ' + rs.creneau.value.replace(/ \(.*\)/, '') : 'à choisir');
      set('n', `${nb} · ${$('input[name="niveau"]:checked', rs).value.toLowerCase()}`);
      set('e', esp.value ? SP[esp.value][0] : 'pas de préférence');
      set('p', price ? fcfa(price) : 'Sur devis');
      set('pp', price ? `la pirogue, soit ${fcfa(price / nb)} par personne` : 'selon la destination et la durée');
      dateOk(); season();
    };
    fillEsp(qe); setNb(nb);
    rs.addEventListener('change', (e) => { if (e.target.name === 'formule') { fillEsp(); setNb(nb); } upd(); });
    rs.addEventListener('input', upd);
    $('[data-minus]').addEventListener('click', () => { setNb(nb - 1); upd(); });
    $('[data-plus]').addEventListener('click', () => { setNb(nb + 1); upd(); });
    upd();

    $('[data-send]').addEventListener('click', () => {
      if (!check(rs)) return;
      if (!dateOk()) { rs.date.closest('.fld').classList.add('bad'); rs.date.focus(); toast('Choisissez une date au moins 48 h à l\'avance.'); return; }
      const f = cur(), price = +f.dataset.price;
      wa(`Bonjour Fishing Gabon Club, je souhaite réserver une sortie.\n\nFormule : ${f.dataset.name}\nDate : ${fmtDate(rs.date.value)}, départ ${rs.creneau.value.toLowerCase()}\nPersonnes : ${nb} (niveau ${$('input[name="niveau"]:checked', rs).value.toLowerCase()})\nEspèce visée : ${esp.value ? SP[esp.value][0] : 'pas de préférence'}\nTarif indicatif : ${price ? fcfa(price) + ' la pirogue' : 'sur devis'}${rs.msg.value.trim() ? '\n\n' + rs.msg.value.trim() : ''}\n\n${rs.nom.value} · ${rs.tel.value}`);
      toast('Votre demande s\'ouvre dans WhatsApp. Le guide vous confirme la sortie.');
    });
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
    wa(`Bonjour Fishing Gabon Club,\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`);
    toast('Votre message s\'ouvre dans WhatsApp.');
  });
})();
