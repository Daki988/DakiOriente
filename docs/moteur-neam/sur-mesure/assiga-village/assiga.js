// Assiga Village : menu, recherche rapide, calculateur de formules, calendrier de la nature, galerie, contact.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const AV = window.AV || {};
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${AV.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const nextSat = () => { const d = new Date(); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); return iso(d); };
  const fd = (v) => new Date(v + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const F = Object.fromEntries(AV.formules.map((f) => [f.id, f]));
  const O = Object.fromEntries(AV.options.map(([id, n, p]) => [id, { n, p }]));

  function toast(t) {
    let el = $('.av-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'av-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#08383D;color:#fff;padding:14px 22px;border-radius:999px;font:700 15px Figtree,Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border:2px solid #F2784B';
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
  $$('[data-soc]').forEach((el) => (el.innerHTML = AV.soc.map((n) => `<a href="../../social.html?slug=${AV.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${AV.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .fc, .un, .avis figure, .room, .univ article').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // Recherche rapide de l'accueil : samedi prochain par défaut
  const qd = $('[data-qd]'); if (qd) { qd.min = iso(new Date()); qd.value = nextSat(); }

  // Calendrier de la nature
  const renderNat = (el, m) => {
    el.innerHTML = AV.saisons.map((s) => { const on = s.m.includes(m); return `<div class="na${on ? '' : ' off'}"><img src="${s.ph}" alt="" loading="lazy"><span class="bd">${on ? 'En ce moment' : 'Hors saison'}</span><div><h3>${s.t}</h3><p>${s.d}</p></div></div>`; }).join('');
  };
  const thisM = new Date().getMonth() + 1;
  const n1 = $('[data-nat]'); if (n1) renderNat(n1, thisM);
  const n2 = $('[data-nat2]'), mo = $('[data-months]');
  if (n2) { $(`input[value="${thisM}"]`, mo).checked = true; renderNat(n2, thisM); mo.addEventListener('change', (e) => renderNat(n2, +e.target.value)); }

  // Calculateur de formules
  const f = $('[data-calc]');
  if (f) {
    f.d.min = iso(new Date()); f.d.value = qs.get('d') || nextSat();
    if (qs.get('f') && F[qs.get('f')]) $(`input[name="f"][value="${qs.get('f')}"]`, f).checked = true;
    if (qs.get('ad')) f.ad.value = qs.get('ad');
    const set = (k, v, h) => { const el = $(`[data-s="${k}"]`); if (h) el.innerHTML = v; else el.textContent = v; };
    const calc = () => {
      const fo = F[$('input[name="f"]:checked', f).value], ad = +f.ad.value, en = +f.en.value, pax = ad + en;
      const sej = fo.type === 'sejour'; $('[data-nuits]', f).hidden = !sej;
      const lines = []; let tot = 0;
      if (sej) {
        const need = Math.ceil(ad / 2); if (+f.ch.value < need) f.ch.value = need;
        const n = +f.n.value, ch = +f.ch.value;
        tot += fo.ch * ch * n; lines.push([`${ch} chambre${ch > 1 ? 's' : ''} double${ch > 1 ? 's' : ''} × ${n} nuit${n > 1 ? 's' : ''}`, fo.ch * ch * n]);
        if (en) { tot += fo.en * en * n; lines.push([`${en} enfant${en > 1 ? 's' : ''} × ${n} nuit${n > 1 ? 's' : ''}`, fo.en * en * n]); }
        const m = $('[data-cmsg]'); m.hidden = ad <= ch * 2 + 1; m.textContent = `${ad} adultes : prévoyez au moins ${need} chambres.`;
      } else {
        $('[data-cmsg]').hidden = true;
        tot += fo.ad * ad; lines.push([`${ad} adulte${ad > 1 ? 's' : ''} × ${fcfa(fo.ad)}`, fo.ad * ad]);
        if (en) { tot += fo.en * en; lines.push([`${en} enfant${en > 1 ? 's' : ''} × ${fcfa(fo.en)}`, fo.en * en]); }
      }
      $$('input[name="o"]', f).forEach((c) => {
        const sel = $(`[data-q="${c.value}"]`, f);
        [...sel.options].forEach((o) => (o.disabled = +o.value > pax)); if (+sel.value > pax) sel.value = pax;
        if (c.checked) { const q = +sel.value, o = O[c.value]; tot += o.p * q; lines.push([`${o.n} × ${q}`, o.p * q]); }
      });
      const d = new Date(f.d.value + 'T12:00').getDay();
      set('f', fo.n); set('d', fd(f.d.value) + (sej ? ` · ${f.n.value} nuit${+f.n.value > 1 ? 's' : ''}` : '')); set('p', `${ad} adulte${ad > 1 ? 's' : ''}${en ? `, ${en} enfant${en > 1 ? 's' : ''}` : ''}`);
      set('lines', lines.map(([n, v]) => `<div><span>${n}</span><b>${fcfa(v)}</b></div>`).join('') + (d === 0 || d === 6 ? '' : '<div><span>En semaine : départ sur demande</span><b></b></div>'), true);
      set('tot', fcfa(tot));
      return { fo, ad, en, tot, lines, sej };
    };
    f.addEventListener('change', calc); f.addEventListener('input', calc); calc();
    $('[data-send]').addEventListener('click', () => {
      if (!check(f)) return;
      const c = calc();
      wa(`Bonjour ${AV.name}, je souhaite réserver.\n\nFormule : ${c.fo.n}\nDate : ${fd(f.d.value)}${c.sej ? ` (${f.n.value} nuit(s), ${f.ch.value} chambre(s))` : ''}\nVoyageurs : ${c.ad} adulte(s)${c.en ? ', ' + c.en + ' enfant(s)' : ''}\n${c.lines.map(([n, v]) => `- ${n} : ${fcfa(v)}`).join('\n')}\nTotal estimé : ${fcfa(c.tot)}\nNavette : départ ${AV.heure}, ${AV.depart}${f.msg.value.trim() ? '\n\n' + f.msg.value.trim() : ''}\n\n${f.nom.value} · ${f.tel.value}`);
      toast('Votre réservation s\'ouvre dans WhatsApp.');
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
  const ct = $('[data-contact]');
  if (ct) ct.addEventListener('submit', (e) => { e.preventDefault(); if (!check(ct)) return; wa(`Bonjour ${AV.name} (${ct.obj.value}),\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`); toast('Votre message s\'ouvre dans WhatsApp.'); });
})();
