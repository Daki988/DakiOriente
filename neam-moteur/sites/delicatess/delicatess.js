// Delicatess : interactions (menu, panier, filtres de la boutique, quiz parfum, contact)
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
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#111;color:#fff;padding:14px 22px;font:500 14px Montserrat,Arial;letter-spacing:.5px;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border-bottom:2px solid #C5A46D';
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
  const KEY = 'delicatess-panier';
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
    $('[data-total]').textContent = fcfa(sub() + (count() ? +$('[data-mode]').value : 0));
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
  $('[data-mode]').onchange = render;
  $('[data-order]').onclick = () => {
    if (!count()) { toast('Votre panier est vide.'); return; }
    const mode = $('[data-mode]');
    wa(`Bonjour Delicatess, je souhaite commander :\n${Object.entries(cart).map(([k, n]) => `• ${n} × ${P[k].t} — ${fcfa(P[k].p * n)}`).join('\n')}\n${mode.options[mode.selectedIndex].text}${$('[data-wrap]').checked ? '\nAvec emballage cadeau' : ''}\nTotal : ${$('[data-total]').textContent}`);
    toast('Votre commande s\'ouvre dans WhatsApp.');
  };
  render();

  // ---- Boutique : rayons, public, tri ----
  const list = $('[data-list]');
  if (list) {
    const cards = $$('.pc', list); let r = qs.get('r') || '';
    const apply = () => {
      const pour = $('[data-pour]').value; let n = 0;
      cards.forEach((c) => { const ok = (!r || c.dataset.r === r) && (!pour || c.dataset.pour === pour || c.dataset.pour === 'mixte'); c.classList.toggle('out', !ok); n += ok; });
      $('.empty').hidden = n > 0;
      $$('[data-tabs] button').forEach((b) => b.classList.toggle('on', b.dataset.r === r));
    };
    $$('[data-tabs] button').forEach((b) => b.addEventListener('click', () => { r = b.dataset.r; apply(); }));
    $('[data-pour]').onchange = apply;
    $('[data-sort]').onchange = (e) => { const v = e.target.value; [...cards].sort((a, b) => (v ? (v === 'asc' ? 1 : -1) * (a.dataset.price - b.dataset.price) : cards.indexOf(a) - cards.indexOf(b))).forEach((c) => list.appendChild(c)); };
    apply();
  }

  // ---- Quiz « Trouver mon parfum » ----
  const quiz = $('[data-quiz]');
  if (quiz) {
    const ans = {}; const steps = ['pour', 'moment', 'fam'];
    const show = (k) => $$('.q', quiz).forEach((q) => (q.hidden = q.dataset.q !== k));
    $$('.q button', quiz).forEach((b) => b.addEventListener('click', () => {
      const k = b.closest('.q').dataset.q; ans[k] = b.dataset.v;
      const i = steps.indexOf(k);
      if (i < 2) { show(steps[i + 1]); return; }
      // Recommandation : même famille d'abord, puis le public, puis l'intensité selon le moment
      const strong = ans.moment !== 'jour';
      const score = ([, x]) => (x.fam === ans.fam ? 4 : 0) + (x.pour === ans.pour || x.pour === 'mixte' || ans.pour === 'mixte' ? 2 : -3) + (strong ? (['oud', 'oriental', 'boise'].includes(x.fam) ? 1 : 0) : (['frais', 'floral'].includes(x.fam) ? 1 : 0));
      const best = Object.entries(P).filter(([, x]) => x.fam).sort((a, b) => score(b) - score(a)).slice(0, 3);
      $('[data-res-list]').innerHTML = best.map(([id, x]) => `<article class="pc"><div class="im"><img src="${x.ph}" alt=""></div><div class="bd"><small>${x.pour}</small><h3>${x.t}</h3><p>${x.d}</p><div class="pp"><b>${fcfa(x.p)}</b><button class="add" data-add="${id}">Ajouter</button></div></div></article>`).join('');
      $('[data-res-t]').textContent = { femme: 'Pour elle', homme: 'Pour lui', mixte: 'Pour tous' }[ans.pour] + ', ' + { jour: 'au quotidien', soir: 'pour vos soirées', occasion: 'pour les grandes occasions' }[ans.moment];
      $('[data-ask]').href = `https://wa.me/${AG.wa}?text=${encodeURIComponent(`Bonjour Delicatess, je cherche un parfum ${{ femme: 'pour femme', homme: 'pour homme', mixte: 'mixte' }[ans.pour]}, ${{ jour: 'pour tous les jours', soir: 'pour le soir', occasion: 'pour une grande occasion' }[ans.moment]}, plutôt ${$(`.q[data-q=fam] [data-v="${ans.fam}"]`).textContent.toLowerCase()}. Que me conseillez-vous ?`)}`;
      $('[data-ask]').target = '_blank';
      show(''); $('[data-res]').hidden = false;
    }));
    $('[data-restart]').onclick = () => { $('[data-res]').hidden = true; show('pour'); };
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
    wa(`Bonjour Delicatess,\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`);
    toast('Votre message s\'ouvre dans WhatsApp.');
  });
})();
