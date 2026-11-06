// Bijouterie de l'Écrin : interactions (menu, sélection, filtres, guide des tailles, atelier, contact)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const AG = window.AG || {};
  const P = AG.prod || {};
  const qs = new URLSearchParams(location.search);
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  const wa = (t) => window.open(`https://wa.me/${AG.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');

  function toast(t) {
    let el = $('.dl-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'dl-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#3A0F1C;color:#fff;padding:14px 22px;font:500 14px Raleway,Arial;letter-spacing:.5px;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border-bottom:2px solid #C9A227';
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
  $$('.fld input, .fld textarea').forEach((i) => i.addEventListener('input', () => i.closest('.fld').classList.remove('bad')));

  // En-tête et menu mobile
  const hd = $('.hd'), burger = $('.burger');
  addEventListener('scroll', () => hd.classList.toggle('solid', scrollY > 20), { passive: true });
  burger.addEventListener('click', () => { const o = hd.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });

  // Réseaux
  const icon = (n, s = 18) => (window.brandSvg ? window.brandSvg(n, s) : '');
  $$('[data-soc]').forEach((el) => (el.innerHTML = ['instagram', 'facebook', 'tiktok'].map((n) => `<a href="../../social.html?slug=${AG.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));

  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .rays a, .grid>.pc, .avis figure, .gal button, .info>div').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // ---- Panier (gardé sur l'appareil du visiteur) ----
  const KEY = 'ecrin-selection';
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { cart = {}; }
  Object.keys(cart).forEach((k) => { if (!P[k]) delete cart[k]; });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* navigation privée */ } };
  const drawer = $('[data-drawer]'), veil = $('[data-veil]');
  const count = () => Object.values(cart).reduce((a, n) => a + n, 0);
  const sub = () => Object.entries(cart).reduce((a, [k, n]) => a + P[k].p * n, 0);
  function render() {
    $('[data-count]').textContent = count();
    $('[data-items]').innerHTML = count() ? Object.entries(cart).map(([k, n]) => `<li><img src="${P[k].ph}" alt=""><div><b>${P[k].t}</b><small>${fcfa(P[k].p)}</small></div><div class="qty"><button data-dec="${k}" aria-label="Retirer un ${P[k].t}">–</button>${n}<button data-inc="${k}" aria-label="Ajouter un ${P[k].t}">+</button></div></li>`).join('') : '<li class="emp">Votre panier est vide.</li>';
    $('[data-total]').textContent = 'à partir de ' + fcfa(sub());
  }
  const open = () => { drawer.hidden = false; veil.hidden = false; document.body.style.overflow = 'hidden'; $('[data-close-cart]').focus(); };
  const close = () => { drawer.hidden = true; veil.hidden = true; document.body.style.overflow = ''; };
  $('[data-open-cart]').onclick = open; $('[data-close-cart]').onclick = close; veil.onclick = close;
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) close(); });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-add]');
    if (a) { const k = a.dataset.add; cart[k] = (cart[k] || 0) + 1; save(); render(); a.classList.add('done'); setTimeout(() => a.classList.remove('done'), 900); const b = $('[data-open-cart]'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); toast(`${P[k].t} ajouté au panier`); return; }
    const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
    if (inc) { cart[inc.dataset.inc]++; save(); render(); }
    if (dec) { const k = dec.dataset.dec; cart[k]--; if (cart[k] <= 0) delete cart[k]; save(); render(); }
  });
  $('[data-order]').onclick = () => {
    if (!count()) { toast('Votre sélection est vide.'); return; }
    const d = $('[data-day]');
    wa(`Bonjour, je souhaite voir ces bijoux à la Bijouterie de l'Écrin :\n${Object.entries(cart).map(([k, n]) => `• ${n} × ${P[k].t} (à partir de ${fcfa(P[k].p)})`).join('\n')}\nPassage souhaité : ${d.options[d.selectedIndex].text}${$('[data-size]').value ? '\nTaille de bague : ' + $('[data-size]').value : ''}`);
    toast('Votre demande s\'ouvre dans WhatsApp.');
  };
  render();

  // ---- Boutique : rayons, public, tri ----
  const list = $('[data-list]');
  if (list) {
    const cards = $$('.pc', list); let r = qs.get('r') || '';
    const apply = () => {
      let n = 0;
      cards.forEach((c) => { const ok = !r || c.dataset.r === r; c.classList.toggle('out', !ok); n += ok; });
      $('.empty').hidden = n > 0;
      $$('[data-tabs] button').forEach((b) => b.classList.toggle('on', b.dataset.r === r));
    };
    $$('[data-tabs] button').forEach((b) => b.addEventListener('click', () => { r = b.dataset.r; apply(); }));
    $('[data-sort]').onchange = (e) => { const v = e.target.value; [...cards].sort((a, b) => (v ? (v === 'asc' ? 1 : -1) * (a.dataset.price - b.dataset.price) : cards.indexOf(a) - cards.indexOf(b))).forEach((c) => list.appendChild(c)); };
    apply();
  }

  // ---- Guide des tailles de bague (taille française = tour de doigt en mm) ----
  const sz = $('[data-sizer]');
  if (sz) {
    const tour = $('[data-tour]'), out = $('[data-taille]'), ring = $('[data-ring]');
    const upd = () => {
      let mm = parseFloat(String(tour.value).replace(',', '.'));
      if ($('[name=mesure]:checked').value === 'diam') mm = mm * Math.PI;
      const ok = mm >= 40 && mm <= 75;
      out.textContent = ok ? Math.round(mm) : '—';
      ring.style.setProperty('--d', ok ? (mm / Math.PI) * 6 + 'px' : '0px');
      $('[data-ask-size]').href = `https://wa.me/${AG.wa}?text=${encodeURIComponent('Bonjour, ma taille de bague est ' + (ok ? Math.round(mm) : '?') + '. Pouvez-vous me conseiller ?')}`;
    };
    sz.addEventListener('input', upd); sz.addEventListener('change', upd); upd();
  }

  // ---- Demande à l'atelier ----
  const at = $('[data-atelier]');
  if (at) {
    $$('[data-svc]').forEach((a) => a.addEventListener('click', () => { const o = [...at.querySelectorAll('[name=service]')].find((x) => x.value === a.dataset.svc); if (o) o.checked = true; }));
    if (qs.get('service')) { const o = $(`[name=service][value="${qs.get('service')}"]`, at); if (o) o.checked = true; }
    at.addEventListener('submit', (e) => {
      e.preventDefault(); if (!check(at)) return;
      wa(`Bonjour, demande pour l'atelier de la Bijouterie de l'Écrin.\nService : ${$('[name=service]:checked', at).value}\nBijou : ${at.bijou.value}${at.msg.value ? '\nDétails : ' + at.msg.value : ''}\n\n${at.nom.value} · ${at.tel.value}`);
      toast('Votre demande s\'ouvre dans WhatsApp.');
    });
  }

  // Galerie
  const lb = $('.lb');
  if (lb) {
    const photos = JSON.parse(lb.dataset.photos); let i = 0;
    const showP = () => { $('img', lb).src = photos[i]; $('img', lb).alt = $$('[data-gal] span')[i]?.textContent || ''; $('.ct', lb).textContent = `${i + 1} / ${photos.length}`; };
    const closeL = () => { lb.hidden = true; document.body.style.overflow = ''; };
    $$('[data-gal] [data-i]').forEach((b) => b.addEventListener('click', () => { i = +b.dataset.i; showP(); lb.hidden = false; document.body.style.overflow = 'hidden'; $('.x', lb).focus(); }));
    $('.x', lb).onclick = closeL;
    $('.pv', lb).onclick = () => { i = (i + photos.length - 1) % photos.length; showP(); };
    $('.nx', lb).onclick = () => { i = (i + 1) % photos.length; showP(); };
    lb.addEventListener('click', (e) => { if (e.target === lb) closeL(); });
    addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'Escape') closeL(); if (e.key === 'ArrowRight') $('.nx', lb).click(); if (e.key === 'ArrowLeft') $('.pv', lb).click(); });
  }

  // Contact
  const ct = $('[data-contact]');
  if (ct) ct.addEventListener('submit', (e) => {
    e.preventDefault(); if (!check(ct)) return;
    wa(`Bonjour,\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`);
    toast('Votre message s\'ouvre dans WhatsApp.');
  });
})();
