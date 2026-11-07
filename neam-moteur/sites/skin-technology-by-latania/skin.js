// Skin Technology by Latania : interactions (menu, sélection de produits, diagnostic de peau, rendez-vous, contact)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SK = window.SK || {};
  const P = SK.p || {}, S = SK.s || {};
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${SK.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  const fcfa = (n) => n ? Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA' : 'Offert';

  function toast(t) {
    let el = $('.sk-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'sk-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#0E0D0C;color:#fff;padding:14px 22px;font:400 15px Jost,Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border-bottom:2px solid #C9A24A';
      document.body.appendChild(el);
    }
    el.textContent = t; el.style.opacity = 1; clearTimeout(el._t); el._t = setTimeout(() => (el.style.opacity = 0), 3200);
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
  $$('[data-soc]').forEach((el) => (el.innerHTML = ['instagram', 'tiktok', 'facebook'].map((n) => `<a href="../../social.html?slug=${SK.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${SK.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));

  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .gms>*, .prs>*, .avis figure, .grid>*, .so, .info>div').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // ---- Sélection (gardée sur l'appareil) ----
  const KEY = 'skt-sel';
  let sel = {};
  try { sel = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { sel = {}; }
  Object.keys(sel).forEach((k) => { if (!P[k]) delete sel[k]; });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(sel)); } catch (e) { /* stockage indisponible */ } render(); };
  const count = () => Object.values(sel).reduce((a, b) => a + b, 0);
  const total = () => Object.entries(sel).reduce((s, [k, q]) => s + P[k][3] * q, 0);
  const add = (id, q = 1) => { sel[id] = (sel[id] || 0) + q; save(); };
  function render() {
    $$('[data-count]').forEach((c) => { c.textContent = count(); c.classList.toggle('z', !count()); });
    $$('[data-add]').forEach((b) => { const n = sel[b.dataset.add]; b.classList.toggle('in', !!n); b.textContent = n ? `✓ Ajouté (${n})` : '+ Ajouter'; });
    const list = $('[data-list]'); if (!list) return;
    const ids = Object.keys(sel);
    list.innerHTML = ids.length ? ids.map((k) => `<div class="it"><div>${P[k][0]}<small>${P[k][1]} · ${P[k][2]} · ${fcfa(P[k][3])}</small></div><div class="qty"><button type="button" data-m="${k}" aria-label="Retirer un">−</button><span>${sel[k]}</span><button type="button" data-p="${k}" aria-label="Ajouter un">+</button></div><b>${fcfa(P[k][3] * sel[k])}</b></div>`).join('') : '<p class="empty">Votre sélection est vide. Ajoutez des produits ou faites le <a href="diagnostic.html">diagnostic</a>.</p>';
    const liv = $('input[name="mode"]:checked')?.value.startsWith('Livraison') ? 2000 : 0;
    $('[data-total]').textContent = fcfa(total() + (ids.length ? liv : 0)).replace('Offert', '0 FCFA');
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-add]'); if (a) { add(a.dataset.add); toast(`${P[a.dataset.add][0]} ajouté à votre sélection.`); }
    const m = e.target.closest('[data-m]'); if (m) { const k = m.dataset.m; if (--sel[k] <= 0) delete sel[k]; save(); }
    const p = e.target.closest('[data-p]'); if (p) { sel[p.dataset.p]++; save(); }
  });
  render();

  // ---- Boutique : filtres ----
  const flt = $('[data-flt]');
  if (flt) {
    let g = qs.get('gamme') || '', c = qs.get('besoin') || '';
    const fc = $('[data-fc]');
    const apply = () => {
      $$('button', flt).forEach((b) => b.classList.toggle('on', b.dataset.f === g));
      let n = 0;
      $$('.prs.all .pr').forEach((p) => { const ok = (!g || p.dataset.g === g) && (!c || p.dataset.c.split(' ').includes(c)); p.hidden = !ok; if (ok) n++; });
      $('[data-nb]').textContent = `${n} produit${n > 1 ? 's' : ''}`;
    };
    $$('button', flt).forEach((b) => b.addEventListener('click', () => { g = b.dataset.f; apply(); }));
    fc.value = c; fc.addEventListener('change', () => { c = fc.value; apply(); });
    apply();
    const ord = $('[data-order]');
    ord.addEventListener('change', () => { $('[data-adr]').hidden = !ord.mode.value.startsWith('Livraison'); render(); });
    ord.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!count()) { toast('Ajoutez au moins un produit à votre sélection.'); return; }
      if (!check(ord)) return;
      const liv = ord.mode.value.startsWith('Livraison');
      wa(`Bonjour Skin Technology by Latania, je souhaite commander :\n\n${Object.entries(sel).map(([k, q]) => `- ${P[k][0]} (${P[k][2]}) × ${q} : ${fcfa(P[k][3] * q)}`).join('\n')}\n\n${ord.mode.value}${liv && ord.adr.value ? ' : ' + ord.adr.value : ''}\nTotal : ${fcfa(total() + (liv ? 2000 : 0))}\n\n${ord.nom.value} · ${ord.tel.value}`);
      toast('Votre commande s\'ouvre dans WhatsApp.');
    });
  }

  // ---- Diagnostic de peau ----
  const quiz = $('[data-quiz]');
  if (quiz) {
    const qsets = $$('[data-q]', quiz), res = $('[data-res]'), prog = $('[data-prog]');
    let i = 0;
    const show = (n) => { i = n; qsets.forEach((f, k) => (f.hidden = k !== i)); res.hidden = true; prog.style.width = `${(i / qsets.length) * 100}%`; };
    const val = (n) => $(`input[name="${n}"]:checked`, quiz)?.value;
    quiz.addEventListener('change', (e) => { if (e.target.type === 'radio') setTimeout(() => (i < qsets.length - 1 ? show(i + 1) : result()), 220); });
    $$('[data-back]', quiz).forEach((b) => b.addEventListener('click', () => show(i - 1)));
    function routine() {
      const t = val('type'), c = val('concern'), sens = val('sens') === 'oui', age = val('age');
      const clean = (t === 'grasse' || t === 'mixte') && !sens ? 'gel-pure' : 'lait-hydra';
      const serum = { taches: 'serum-clarifiant', imperfections: 'serum-pure', eclat: 'serum-clarifiant', rides: 'serum-caviar', secheresse: 'huile-hydra' }[c];
      const day = (c === 'taches' || c === 'eclat') ? 'creme-jour-clarifiante' : 'creme-hydra';
      const night = (c === 'rides' || age === 'plus') ? 'creme-nuit-caviar' : 'creme-hydra';
      const am = [clean, serum, day];
      const pm = [clean, serum, night];
      const extra = [];
      if ((t === 'grasse' || c === 'imperfections') && !sens) extra.push('masque-pure');
      if (age === 'plus' || c === 'rides') extra.push('contour-caviar');
      if ((c === 'taches' || c === 'eclat') && !sens) extra.push('lotion-clarifiante');
      let soin = { taches: 'eclat', imperfections: 'acne', eclat: 'nettoyage', rides: 'caviar', secheresse: 'nettoyage' }[c];
      if (!sens && c === 'taches' && age !== '25') soin = 'peeling';
      if (!sens && c === 'rides' && age === 'plus') soin = 'microneedling';
      if (sens) soin = 'diagnostic';
      return { am, pm, extra, soin, sens };
    }
    function result() {
      const r = routine(), all = [...new Set([...r.am, ...r.pm, ...r.extra])];
      const tot = all.reduce((s, k) => s + P[k][3], 0);
      const li = (k, w) => `<li><span>${P[k][0]}</span><em>${w}</em></li>`;
      const labels = ['Nettoyer', 'Traiter', 'Protéger'];
      qsets.forEach((f) => (f.hidden = true)); prog.style.width = '100%';
      res.innerHTML = `<span class="tag">Votre routine personnalisée</span><h2>Peau ${$(`input[name="type"]:checked + span b`, quiz).textContent.toLowerCase()}, objectif <em>${$(`input[name="concern"]:checked + span b`, quiz).textContent.toLowerCase()}</em></h2>
${r.sens ? '<p class="warn">Votre peau est sensible : nous vous conseillons de commencer par un diagnostic à l\'institut, et d\'introduire un seul nouveau produit à la fois.</p>' : ''}
<div class="rt"><div><h3>Le matin</h3><ol>${r.am.map((k, j) => li(k, labels[j])).join('')}</ol></div><div><h3>Le soir</h3><ol>${r.pm.map((k, j) => li(k, ['Démaquiller', 'Traiter', 'Nourrir'][j])).join('')}</ol></div></div>
${r.extra.length ? `<p class="lead">En plus : ${r.extra.map((k) => P[k][0].toLowerCase()).join(', ')}.</p>` : ''}
<div class="rsoin"><div><small>Le soin conseillé à l'institut</small><b>${S[r.soin][0]}</b>${S[r.soin][1]} · ${fcfa(S[r.soin][2])}</div><a class="btn g sm" href="rendez-vous.html?soin=${r.soin}">Réserver ce soin</a></div>
<div class="row"><button class="btn g" data-addall>Ajouter la routine (${fcfa(tot)})</button><button class="btn line" data-sendr>Recevoir sur WhatsApp</button><button class="btn line" data-restart>Recommencer</button></div>`;
      res.hidden = false; res.scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('[data-addall]', res).addEventListener('click', () => { all.forEach((k) => { if (!sel[k]) sel[k] = 1; }); save(); toast('Routine ajoutée à votre sélection.'); setTimeout(() => (location.href = 'produits.html#sel'), 700); });
      $('[data-sendr]', res).addEventListener('click', () => wa(`Bonjour Skin Technology by Latania, j'ai fait le diagnostic en ligne.\nPeau : ${val('type')}, préoccupation : ${val('concern')}, sensible : ${val('sens')}, âge : ${val('age')}.\n\nRoutine proposée :\nMatin : ${r.am.map((k) => P[k][0]).join(', ')}\nSoir : ${r.pm.map((k) => P[k][0]).join(', ')}\nSoin conseillé : ${S[r.soin][0]}\n\nPouvez-vous me conseiller ?`));
      $('[data-restart]', res).addEventListener('click', () => { $$('input', quiz).forEach((x) => (x.checked = false)); show(0); quiz.scrollIntoView({ behavior: 'smooth' }); });
    }
    show(0);
  }

  // ---- Rendez-vous ----
  const rdv = $('[data-rdv]');
  if (rdv) {
    const qsn = qs.get('soin'); if (qsn) { const r = $(`input[name="soin"][value="${qsn}"]`, rdv); if (r) r.checked = true; }
    const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'], MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const SLOTS = ['9 h', '10 h 30', '12 h', '14 h', '15 h 30', '17 h'];
    const days = []; const d = new Date(); d.setHours(12, 0, 0, 0);
    while (days.length < 12) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) days.push(new Date(d)); }
    $('[data-days]').innerHTML = days.map((x, k) => `<label><input type="radio" name="jour" value="${k}"${k ? '' : ' checked'}><span>${JOURS[x.getDay()]}<b>${x.getDate()}</b>${MOIS[x.getMonth()]}</span></label>`).join('');
    const taken = (k, s) => ((days[k].getDate() * 7 + s * 13) % 5) === 0;
    const fillSlots = () => {
      const k = +rdv.jour.value, prev = rdv.slot && rdv.slot.value;
      $('[data-slots]').innerHTML = SLOTS.map((s, j) => `<label><input type="radio" name="slot" value="${s}"${taken(k, j) ? ' disabled' : ''}><span>${s}</span></label>`).join('');
      const free = $$('input[name="slot"]:not(:disabled)', rdv);
      (free.find((x) => x.value === prev) || free[0]).checked = true;
    };
    const set = (k, t) => ($(`[data-s="${k}"]`).textContent = t);
    const upd = () => {
      const s = S[rdv.soin.value], x = days[+rdv.jour.value];
      set('soin', s[0]); set('duree', s[1]); set('jour', x.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })); set('slot', rdv.slot.value); set('prix', fcfa(s[2]));
      set('tip', rdv.first.value === 'oui' && rdv.soin.value !== 'diagnostic' ? 'Première visite : le diagnostic de peau vous est offert avant le soin.' : '');
    };
    fillSlots(); upd();
    rdv.addEventListener('change', (e) => { if (e.target.name === 'jour') fillSlots(); upd(); });
    $('[data-send]').addEventListener('click', () => {
      if (!check(rdv)) return;
      const s = S[rdv.soin.value];
      wa(`Bonjour Skin Technology by Latania, je souhaite prendre rendez-vous.\n\nSoin : ${s[0]} (${s[1]}, ${fcfa(s[2])})\nDate : ${$('[data-s="jour"]').textContent} à ${rdv.slot.value}\nPremière visite : ${rdv.first.value}\n\n${rdv.nom.value} · ${rdv.tel.value}`);
      toast('Votre demande de rendez-vous s\'ouvre dans WhatsApp.');
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
    wa(`Bonjour Skin Technology by Latania,\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`);
    toast('Votre message s\'ouvre dans WhatsApp.');
  });
})();
