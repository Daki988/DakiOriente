// AB Location : menu, recherche rapide, filtres de la flotte, réservation avec prix, simulateur entreprise, galerie, contact.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const AB = window.AB || {};
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${AB.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  const r500 = (n) => Math.round(n / 500) * 500;
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const plus = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
  const fd = (v) => new Date(v + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const V = Object.fromEntries(AB.flotte.map((v) => [v.id, v]));

  function toast(t) {
    let el = $('.ab-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'ab-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#0B0B0D;color:#fff;padding:14px 22px;border-radius:12px;font:700 15px Manrope,Arial;box-shadow:0 14px 40px rgba(0,0,0,.35);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border-left:5px solid #E1251B';
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

  // En-tête, menu, réseaux, apparition
  const hd = $('.hd'), burger = $('.burger');
  addEventListener('scroll', () => hd.classList.toggle('solid', scrollY > 20), { passive: true });
  burger.addEventListener('click', () => { const o = hd.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });
  const icon = (n, s = 18) => (window.brandSvg ? window.brandSvg(n, s) : '');
  $$('[data-soc]').forEach((el) => (el.innerHTML = AB.soc.map((n) => `<a href="../../social.html?slug=${AB.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${AB.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .vc, .avis figure, .steps li, .adv>div').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // Recherche rapide
  const q1 = $('[data-q1]'), q2 = $('[data-q2]');
  if (q1) { q1.min = plus(0); q1.value = plus(1); q2.min = plus(1); q2.value = plus(4); q1.addEventListener('change', () => { if (q2.value <= q1.value) { const d = new Date(q1.value + 'T12:00'); d.setDate(d.getDate() + 3); q2.value = iso(d); } q2.min = q1.value; }); }

  // Filtres de la flotte
  const vf = $('[data-vf]');
  if (vf) {
    const run = (k) => { $$('button', vf).forEach((b) => b.setAttribute('aria-pressed', b.dataset.k === k)); let n = 0; $$('.vc').forEach((c) => { const ok = k === 'tout' || c.dataset.cats.split(' ').includes(k); c.hidden = !ok; n += ok; }); $('[data-vn]').textContent = `${n} véhicule${n > 1 ? 's' : ''}`; };
    $$('button', vf).forEach((b) => b.addEventListener('click', () => run(b.dataset.k))); run('tout');
  }

  // Réservation
  const f = $('[data-res]');
  if (f) {
    f.d1.min = plus(0); f.d1.value = qs.get('d1') || plus(1); f.d2.value = qs.get('d2') || plus(4);
    if (qs.get('v') && V[qs.get('v')]) $(`input[name="v"][value="${qs.get('v')}"]`, f).checked = true;
    const set = (k, v, h) => { const el = $(`[data-s="${k}"]`); if (h) el.innerHTML = v; else el.textContent = v; };
    const calc = () => {
      const v = V[$('input[name="v"]:checked', f).value];
      if (f.d2.value < f.d1.value) f.d2.value = f.d1.value; f.d2.min = f.d1.value;
      const a = new Date(`${f.d1.value}T${f.h1.value || '09:00'}`), b = new Date(`${f.d2.value}T${f.h2.value || '09:00'}`);
      const days = Math.max(1, Math.ceil((b - a) / 864e5 - 1 / 24)); // 1 h de tolérance au retour
      const dm = $('[data-dmsg]'); dm.hidden = b > a; dm.textContent = 'Le retour doit être après le départ : 1 jour minimum compté.';
      const ch = $('[data-chauf] input', f); ch.disabled = v.vip; if (v.vip) ch.checked = false;
      const perm = f.permis.value === 'Moins de 2 ans'; $('[data-pmsg]').hidden = !perm || v.vip || ch.checked;
      const base = v.prix * days, disc = days >= 30 ? 0.25 : days >= 7 ? 0.1 : 0;
      const lines = [[`${days} jour${days > 1 ? 's' : ''} × ${fcfa(v.prix)}`, base]];
      if (disc) lines.push([`Remise ${days >= 30 ? 'mois' : 'semaine'} (−${disc * 100} %)`, -r500(base * disc), 'dc']);
      if (ch.checked) lines.push([`Chauffeur × ${days} j`, 15000 * days]);
      if (f.siege.checked) lines.push([`Siège enfant × ${days} j`, 3000 * days]);
      if (f.cond2.checked) lines.push(['Conducteur supplémentaire', 10000]);
      if (+f.lieu.value) lines.push(['Livraison', +f.lieu.value]);
      if (+f.ret.value) lines.push(['Reprise', +f.ret.value]);
      const tot = lines.reduce((s, l) => s + l[1], 0);
      set('car', $(`input[value="${v.id}"] + span .car`, f).outerHTML.replace('car sm', 'car'), true); set('name', v.n);
      set('days', `${fd(f.d1.value)} → ${fd(f.d2.value)} · ${days} j`);
      set('lines', lines.map(([n, x, c]) => `<div${c ? ` class="${c}"` : ''}><span>${n}</span><b>${x < 0 ? '−' + fcfa(-x) : fcfa(x)}</b></div>`).join(''), true);
      set('tot', fcfa(tot)); set('per', `soit ${fcfa(tot / days)} par jour`); set('caution', v.caution ? fcfa(v.caution) : 'Sans caution');
      return { v, days, tot, lines };
    };
    f.addEventListener('change', calc); f.addEventListener('input', calc); calc();
    $('[data-send]').addEventListener('click', () => {
      if (!check(f)) return;
      const c = calc();
      wa(`Bonjour ${AB.name}, je souhaite réserver un véhicule.\n\n${c.v.n} (${c.v.mod})\nDépart : ${fd(f.d1.value)} à ${f.h1.value}\nRetour : ${fd(f.d2.value)} à ${f.h2.value} (${c.days} j)\nRemise : ${f.lieu.selectedOptions[0].text} · Restitution : ${f.ret.selectedOptions[0].text}\n${c.lines.map(([n, x]) => `- ${n} : ${x < 0 ? '−' + fcfa(-x) : fcfa(x)}`).join('\n')}\nTotal estimé : ${fcfa(c.tot)}${f.vol.value.trim() ? '\nVol : ' + f.vol.value.trim() : ''}\nPermis : ${f.permis.value}\n\n${f.nom.value} · ${f.tel.value}`);
      toast('Votre réservation s\'ouvre dans WhatsApp.');
    });
  }

  // Simulateur entreprise
  const e = $('[data-ent]');
  if (e) {
    const sel = (n) => $(`[name="${n}"]`, e);
    const upd = () => {
      const v = V[sel('v').value], n = +sel('n').value, m = +sel('m').value, ch = +sel('ch').value;
      const disc = { 1: 0, 3: 0.05, 6: 0.1, 12: 0.15 }[m];
      const tot = r500((v.prix * 30 * 0.75 * (1 - disc) + ch * 15000 * 26 * 0.8) * n);
      $('[data-e="tot"]').textContent = fcfa(tot);
      $('[data-e="det"]').textContent = `${n} × ${v.n}${ch ? ' avec chauffeur' : ''}, engagement ${m} mois${disc ? ` (−${disc * 100} %)` : ''}, entretien et assurance inclus. Soit ${fcfa(tot / n)} par véhicule.`;
      return { v, n, m, ch, tot };
    };
    e.addEventListener('change', upd); upd();
    const d = $('[data-devis]');
    d.addEventListener('submit', (ev) => { ev.preventDefault(); if (!check(d)) return; const r = upd(); wa(`Bonjour ${AB.name}, demande de devis entreprise.\n\nEntreprise : ${d.ent.value} (${d.sec.value})\nBesoin estimé : ${r.n} × ${r.v.n}${r.ch ? ' avec chauffeur' : ''}, ${r.m} mois, environ ${fcfa(r.tot)} / mois${d.msg.value.trim() ? '\n' + d.msg.value.trim() : ''}\n\n${d.nom.value} · ${d.tel.value}`); toast('Votre demande s\'ouvre dans WhatsApp.'); });
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
    lb.addEventListener('click', (ev) => { if (ev.target === lb) close(); });
    addEventListener('keydown', (ev) => { if (lb.hidden) return; if (ev.key === 'Escape') close(); if (ev.key === 'ArrowRight') $('.nx', lb).click(); if (ev.key === 'ArrowLeft') $('.pv', lb).click(); });
  }

  // Contact
  const ct = $('[data-contact]');
  if (ct) ct.addEventListener('submit', (ev) => { ev.preventDefault(); if (!check(ct)) return; wa(`Bonjour ${AB.name},\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`); toast('Votre message s\'ouvre dans WhatsApp.'); });
})();
