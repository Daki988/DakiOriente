// Boko's Café : menu, ouvert maintenant, carte filtrable et commande à emporter, réservation de table, agenda, privatisation, galerie, contact.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const BK = window.BK || {};
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${BK.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fd = (v) => new Date(v + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const M = Object.fromEntries(BK.menu.map((m) => [m.id, m]));

  function toast(t) {
    let el = $('.bk-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'bk-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:300;background:#2A160E;color:#FBF4EA;padding:14px 22px;border-radius:999px;font:600 15px "Work Sans",Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border:2px solid #E8A317';
      document.body.appendChild(el);
    }
    el.textContent = t; el.style.opacity = 1; clearTimeout(el._t); el._t = setTimeout(() => (el.style.opacity = 0), 3000);
  }
  function check(form) {
    let ok = true;
    $$('[required]', form).forEach((i) => { const bad = !i.value.trim(); i.closest('.fld')?.classList.toggle('bad', bad); if (bad && ok) { i.focus(); ok = false; } });
    if (!ok) toast('Merci de compléter les champs en rouge.');
    return ok;
  }
  document.addEventListener('input', (e) => e.target.closest?.('.fld')?.classList.remove('bad'));

  // En-tête, menu, réseaux, apparition
  const hd = $('.hd'), burger = $('.burger');
  addEventListener('scroll', () => hd.classList.toggle('solid', scrollY > 20), { passive: true });
  burger.addEventListener('click', () => { const o = hd.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });
  const icon = (n, s = 18) => (window.brandSvg ? window.brandSvg(n, s) : '');
  $$('[data-soc]').forEach((el) => (el.innerHTML = BK.soc.map((n) => `<a href="../../social.html?slug=${BK.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${BK.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .sg, .avis figure, .ev, .vals>div').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // Ouvert maintenant (11 h – 23 h, dimanche : brunch 11 h – 15 h puis 19 h – 23 h)
  const op = $('[data-open]');
  if (op) {
    const n = new Date(), h = n.getHours() + n.getMinutes() / 60, sun = n.getDay() === 0;
    const open = sun ? (h >= 11 && h < 15) || (h >= 19 && h < 23) : h >= 11 && h < 23;
    op.innerHTML = open ? `<i class="dot"></i>Ouvert maintenant${sun && h < 15 ? ' · Afro Brunch en cours' : ''}` : `<i class="dot off"></i>Fermé · ${sun && h >= 15 && h < 19 ? 'réouverture à 19 h' : 'ouvre à 11 h'}`;
  }

  // ---- Commande à emporter (gardée sur l'appareil) ----
  const KEY = 'boko-cmd';
  let cart = {}; try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { cart = {}; }
  Object.keys(cart).forEach((k) => { if (!M[k]) delete cart[k]; });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* stockage indisponible */ } };
  const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const total = () => Object.entries(cart).reduce((a, [k, q]) => a + M[k].p * q, 0);
  const renderCart = () => {
    const n = count();
    $$('[data-cartn]').forEach((el) => { el.hidden = !n; el.textContent = n; });
    const c = $('[data-cart]'); if (!c) return;
    $('[data-lines]', c).innerHTML = n ? Object.entries(cart).map(([k, q]) => `<div class="cl"><span>${M[k].n}</span><div class="q"><button type="button" data-dec="${k}" aria-label="Retirer un ${M[k].n}">−</button><output>${q}</output><button type="button" data-inc="${k}" aria-label="Ajouter un ${M[k].n}">+</button></div><small>${fcfa(M[k].p * q)}</small></div>`).join('') : '<p class="empty">Ajoutez des plats avec le bouton « + Ajouter ».</p>';
    $('[data-ctot]').textContent = fcfa(total());
    const bar = $('[data-mbar]'); if (bar) { bar.hidden = !n; $('[data-mbn]').textContent = `${n} article${n > 1 ? 's' : ''} · ${fcfa(total())}`; }
    $$('[data-add]').forEach((b) => b.classList.toggle('ok', !!cart[b.dataset.add]));
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-add],[data-inc],[data-dec]'); if (!a) return;
    const k = a.dataset.add || a.dataset.inc || a.dataset.dec;
    if (a.dataset.dec) { cart[k]--; if (cart[k] <= 0) delete cart[k]; } else cart[k] = (cart[k] || 0) + 1;
    if (a.dataset.add) toast(`${M[k].n} ajouté à votre commande`);
    save(); renderCart();
  });
  const c = $('[data-cart]');
  if (c) {
    const sel = $('[data-ch]'); const now = new Date(); const start = Math.max(11.5, now.getHours() + 1 + (now.getMinutes() > 30 ? 0.5 : 0));
    const opts = []; for (let h = start; h <= 22.5; h += 0.5) opts.push(`${Math.floor(h)} h ${h % 1 ? '30' : '00'}`);
    sel.innerHTML = (opts.length ? ['Dès que possible', ...opts] : ['Demain midi', 'Demain soir']).map((o) => `<option>${o}</option>`).join('');
    $('[data-cclear]').addEventListener('click', () => { cart = {}; save(); renderCart(); });
    $('[data-csend]').addEventListener('click', () => {
      if (!count()) { toast('Votre commande est vide.'); return; }
      const mode = $('input[name="mode"]:checked', c).value;
      wa(`Bonjour ${BK.name}, je souhaite commander (${mode}).\n\n${Object.entries(cart).map(([k, q]) => `${q} × ${M[k].n} — ${fcfa(M[k].p * q)}`).join('\n')}\n\nTotal : ${fcfa(total())}\nRetrait : ${sel.value}${$('[data-cn]').value.trim() ? '\nNom : ' + $('[data-cn]').value.trim() : ''}`);
      toast('Votre commande s\'ouvre dans WhatsApp.');
    });
  }
  renderCart();

  // ---- Filtres de la carte ----
  const cats = $('[data-cats]');
  if (cats) {
    let cur = qs.get('c') || 'tout';
    const run = () => {
      const tg = $$('[data-mf] input:checked').map((i) => i.value);
      $$('[role=tab]', cats).forEach((b) => b.setAttribute('aria-selected', b.dataset.c === cur));
      let any = 0;
      $$('.mcat').forEach((s) => { let n = 0; $$('.di', s).forEach((d) => { const ok = tg.every((t) => d.dataset.tags.split(' ').includes(t)); d.hidden = !ok; n += ok; }); s.hidden = (cur !== 'tout' && s.dataset.cat !== cur) || !n; any += s.hidden ? 0 : n; });
      $('[data-mnone]').hidden = any > 0;
    };
    $$('[role=tab]', cats).forEach((b) => b.addEventListener('click', () => { cur = b.dataset.c; run(); }));
    $('[data-mf]').addEventListener('change', run); run();
  }

  // ---- Réservation ----
  const f = $('[data-res]');
  if (f) {
    const today = new Date(); f.date.min = iso(today); f.date.value = iso(today);
    if (qs.get('s')) { const r = $(`input[name="s"][value="${qs.get('s')}"]`, f); if (r) r.checked = true; }
    const nextSun = () => { const d = new Date(f.date.value + 'T12:00'); d.setDate(d.getDate() + ((7 - d.getDay()) % 7)); return iso(d); };
    if (qs.get('s') === 'brunch') f.date.value = nextSun();
    const SL = { midi: [12, 14.5], soir: [19, 22], brunch: [11, 13.5] };
    const R = (k, v) => ($(`[data-r="${k}"]`).textContent = v);
    const slots = () => {
      const s = $('input[name="s"]:checked', f).value, d = new Date(f.date.value + 'T12:00'), sun = d.getDay() === 0, msg = $('[data-smsg]');
      msg.hidden = true;
      if (s === 'brunch' && !sun) { msg.hidden = false; msg.innerHTML = `L'Afro Brunch a lieu le dimanche. <button type="button" data-sun>Choisir le ${fd(nextSun())}</button>`; }
      if (s === 'midi' && sun) { msg.hidden = false; msg.textContent = 'Le dimanche midi, place à l\'Afro Brunch (11 h – 15 h).'; }
      const isToday = f.date.value === iso(new Date()), nowH = new Date().getHours() + new Date().getMinutes() / 60;
      const [a, b] = SL[s]; const list = [];
      for (let h = a; h <= b; h += 0.5) if (!isToday || h > nowH + 0.5) list.push(h);
      const prev = $('input[name="h"]:checked', f)?.value;
      $('[data-slots]').innerHTML = (msg.hidden || s === 'soir') && list.length ? list.map((h, i) => { const v = `${Math.floor(h)} h ${h % 1 ? '30' : '00'}`; const busy = (s === 'soir' && (h === 20 || h === 20.5)) || (s === 'brunch' && h === 12); return `<label><input type="radio" name="h" value="${v}"${(prev ? prev === v : !i) ? ' checked' : ''}><span>${v}${busy ? '<small>Très demandé</small>' : ''}</span></label>`; }).join('') : `<p class="note">${list.length ? 'Choisissez un autre service ou une autre date.' : 'Plus de créneau aujourd\'hui pour ce service : choisissez une autre date.'}</p>`;
      if (!$('input[name="h"]:checked', f) && $('input[name="h"]', f)) $('input[name="h"]', f).checked = true;
      upd();
    };
    const upd = () => {
      const s = $('input[name="s"]:checked', f), h = $('input[name="h"]:checked', f), pax = +f.pax.value;
      R('svc', s.nextElementSibling.textContent); R('date', fd(f.date.value)); R('h', h ? h.value : '—'); R('pax', `${pax} personne${pax > 1 ? 's' : ''}`);
      $('[data-r-bw]').hidden = s.value !== 'brunch'; R('bp', `${fcfa(15000 * pax)} (15 000 × ${pax})`);
    };
    f.addEventListener('change', (e) => (e.target.name === 'h' || e.target.name === 'pax' || e.target.name === 'occ' || e.target.name === 'pl' ? upd() : slots()));
    f.addEventListener('click', (e) => { if (e.target.matches('[data-sun]')) { f.date.value = nextSun(); slots(); } });
    slots();
    $('[data-send]').addEventListener('click', () => {
      if (!check(f)) return;
      const h = $('input[name="h"]:checked', f); if (!h) { toast('Choisissez une heure disponible.'); return; }
      const s = $('input[name="s"]:checked', f);
      wa(`Bonjour ${BK.name}, je souhaite réserver une table.\n\n${s.nextElementSibling.textContent} · ${fd(f.date.value)} à ${h.value}\n${f.pax.value} personne(s) · ${f.occ.value} · ${f.pl.value}${f.msg.value.trim() ? '\n' + f.msg.value.trim() : ''}\n\n${f.nom.value} · ${f.tel.value}`);
      toast('Votre réservation s\'ouvre dans WhatsApp.');
    });
  }

  // ---- Agenda : prochains dimanches (brunch) et premier vendredi du mois (Afro Fusion) ----
  const ag = $('[data-agenda]');
  if (ag) {
    const ev = []; const d = new Date(); d.setHours(12, 0, 0, 0);
    for (let i = 0; i < 45 && ev.length < 5; i++) {
      const x = new Date(d); x.setDate(d.getDate() + i);
      if (x.getDay() === 0) ev.push([x, 'Afro Brunch', '11 h – 15 h · bissap et gingembre à volonté', 'reservation.html?s=brunch']);
      if (x.getDay() === 5 && x.getDate() <= 7) ev.push([x, 'Soirée Afro Fusion', 'Dès 20 h · musique live et menu dégustation', 'reservation.html?s=soir']);
    }
    ag.innerHTML = ev.map(([x, t, s, u]) => `<li><div class="dd"><b>${x.getDate()}</b><small>${x.toLocaleDateString('fr-FR', { month: 'short' })}</small></div><div><h3>${t}</h3><p>${x.toLocaleDateString('fr-FR', { weekday: 'long' })} · ${s}</p></div><a href="${u}">Réserver →</a></li>`).join('');
  }

  // ---- Privatisation ----
  const pv = $('[data-priv]');
  if (pv) {
    const d = new Date(); d.setDate(d.getDate() + 14); pv.date.min = iso(new Date()); pv.date.value = iso(d);
    const est = () => { const n = Math.max(10, Math.min(60, +pv.inv.value || 10)), b = [12500, 17500, 22500][pv.bud.selectedIndex]; $('[data-est]').textContent = `Budget estimé : environ ${fcfa(Math.round((n * b) / 5000) * 5000)} pour ${n} invités.`; };
    pv.addEventListener('input', est); pv.addEventListener('change', est); est();
    pv.addEventListener('submit', (e) => { e.preventDefault(); if (!check(pv)) return; wa(`Bonjour ${BK.name}, je souhaite privatiser le restaurant.\n\n${pv.type.value} · ${fd(pv.date.value)}\n${pv.inv.value} invités · budget ${pv.bud.value} par personne\n${$('[data-est]').textContent}\n\n${pv.nom.value} · ${pv.tel.value}`); toast('Votre demande s\'ouvre dans WhatsApp.'); });
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
  if (ct) ct.addEventListener('submit', (e) => { e.preventDefault(); if (!check(ct)) return; wa(`Bonjour ${BK.name},\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`); toast('Votre message s\'ouvre dans WhatsApp.'); });
})();
