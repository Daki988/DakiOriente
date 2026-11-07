// Awax Music School : interactions (menu, cours, quiz, planning, inscription, galerie, contact)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const AW = window.AW || {};
  const CO = AW.cours || {};
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${AW.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';

  function toast(t) {
    let el = $('.aw-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'aw-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#1B1036;color:#fff;padding:14px 22px;border-radius:999px;font:600 15px Inter,Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border:2px solid #FF6B1A';
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
  if (burger) burger.addEventListener('click', () => { const o = hd.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });

  // Réseaux
  const icon = (n, s = 18) => (window.brandSvg ? window.brandSvg(n, s) : '');
  $$('[data-soc]').forEach((el) => (el.innerHTML = ['facebook', 'instagram', 'youtube'].map((n) => `<a href="../../social.html?slug=${AW.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${AW.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));

  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .ins>*, .fms>*, .avis figure, .grid>*').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // ---- Cours : onglets ----
  const tabs = $('[data-tabs]');
  if (tabs) {
    const open = (id, push) => {
      if (!$(`[data-pane="${id}"]`)) return;
      $$('button', tabs).forEach((b) => { const on = b.dataset.t === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      $$('[data-pane]').forEach((p) => (p.hidden = p.dataset.pane !== id));
      if (push) history.replaceState(null, '', '#' + id);
    };
    $$('button', tabs).forEach((b) => b.addEventListener('click', () => open(b.dataset.t, true)));
    if (location.hash) open(location.hash.slice(1));
  }

  // ---- Quiz : quel instrument ? ----
  const quiz = $('[data-quiz]');
  if (quiz) {
    const Q = AW.quiz || []; let i = 0, sc = {};
    const show = () => {
      $('[data-prog]').style.width = `${(i / Q.length) * 100}%`;
      if (i >= Q.length) return end();
      const [q, ans] = Q[i];
      $('[data-q]').innerHTML = `<span class="n">Question ${i + 1} / ${Q.length}</span><h2>${q}</h2><div class="ans">${ans.map(([t], k) => `<button data-k="${k}">${t}</button>`).join('')}</div>`;
      $$('[data-q] button').forEach((b) => b.addEventListener('click', () => { Object.entries(ans[+b.dataset.k][1]).forEach(([c, p]) => (sc[c] = (sc[c] || 0) + p)); i++; show(); }));
      $('[data-q]').hidden = false; $('[data-res]').hidden = true;
    };
    const end = () => {
      const top = Object.entries(sc).sort((a, b) => b[1] - a[1]);
      const [id] = top[0], alt = top[1] ? CO[top[1][0]][0] : '';
      const c = CO[id];
      $('[data-q]').hidden = true;
      $('[data-res]').innerHTML = `<img src="${c[1]}" alt="${c[0]}"><div><span class="tag">Ton instrument</span><h2>${c[0]}</h2><p class="alt">${alt ? `Tu pourrais aussi aimer : ${alt.toLowerCase()}.` : ''} Accessible dès ${c[2]} ans.</p><div class="row"><a class="btn o" href="inscription.html?cours=${id}">Réserver un cours d'essai</a><a class="btn line" href="cours.html#${id}">Voir le cours</a><button class="btn line" data-again>Recommencer</button></div></div>`;
      $('[data-res]').hidden = false;
      $('[data-again]').addEventListener('click', () => { i = 0; sc = {}; show(); });
    };
    show();
  }

  // ---- Planning : filtres ----
  const pf = $('[data-pf]');
  if (pf) {
    const sel = $('[name="cours"]', pf);
    if (CO[qs.get('cours')]) sel.value = qs.get('cours');
    const apply = () => {
      const c = sel.value, s = $('input[name="site"]:checked', pf).value;
      $$('.day').forEach((d) => { let n = 0; $$('.sl', d).forEach((x) => { const ok = (!c || x.dataset.c === c) && (!s || x.dataset.s === s); x.hidden = !ok; if (ok) n++; }); $('.empty', d).hidden = n > 0; });
    };
    pf.addEventListener('change', apply); apply();
  }

  // ---- Inscription ----
  const f = $('[data-insc]');
  if (f) {
    const pre = (name, v) => { const r = v && $(`input[name="${name}"][value="${v}"]`, f); if (r) r.checked = true; };
    pre('cours', qs.get('cours')); pre('formule', qs.get('formule')); pre('site', qs.get('site'));
    const F = Object.fromEntries((AW.formules || []).map(([id, t, d, p]) => [id, [t, p]]));
    const set = (k, t) => ($(`[data-s="${k}"]`).textContent = t);
    const val = (n) => $(`input[name="${n}"]:checked`, f)?.value;
    const upd = () => {
      const c = CO[val('cours')], age = +f.age.value, fo = F[val('formule')];
      set('eleve', (f.eleve.value.trim() || 'Élève') + (age ? `, ${age} ans` : ''));
      set('cours', `${c[0]} · ${val('niveau').toLowerCase()}`); set('formule', fo[0]); set('site', AW.sites[val('site')]);
      set('mois', fcfa(fo[1])); set('first', `+ ${fcfa(AW.insc)} d'inscription le premier mois`);
      const m = $('[data-agemsg]');
      if (age && age < c[2]) { m.hidden = false; m.textContent = `Le cours de ${c[0].toLowerCase()} commence à ${c[2]} ans. Nous vous proposerons un éveil musical ou la chorale en attendant.`; } else m.hidden = true;
    };
    f.addEventListener('input', upd); f.addEventListener('change', upd); upd();
    $('[data-send]').addEventListener('click', () => {
      if (!check(f)) return;
      const jours = $$('input[name="jours"]:checked', f).map((x) => x.value);
      wa(`Bonjour Awax Music School, je souhaite une inscription.\n\nÉlève : ${f.eleve.value}, ${f.age.value} ans\nCours : ${$('[data-s="cours"]').textContent}\nFormule : ${$('[data-s="formule"]').textContent}\nSite : ${$('[data-s="site"]').textContent}${jours.length ? '\nJours préférés : ' + jours.join(', ') : ''}\n\n${f.nom.value} · ${f.tel.value}`);
      toast('Votre inscription s\'ouvre dans WhatsApp. À très vite pour le cours d\'essai !');
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
    wa(`Bonjour Awax Music School,\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`);
    toast('Votre message s\'ouvre dans WhatsApp.');
  });
})();
