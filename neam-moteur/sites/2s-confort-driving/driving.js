// 2S Confort Driving : interactions (menu, test du code, inscription, contact, galerie)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const AG = window.AG || {};
  const qs = new URLSearchParams(location.search);
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  const wa = (t) => window.open(`https://wa.me/${AG.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');

  function toast(t) {
    let el = $('.dr-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'dr-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#0D1B3E;color:#fff;padding:14px 20px;border-radius:10px;font:600 15px Barlow,Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border-left:5px solid #FFC20E';
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
  $$('.fld input, .fld textarea').forEach((i) => i.addEventListener('input', () => i.closest('.fld').classList.remove('bad')));

  // En-tête et menu mobile
  const hd = $('.hd'), burger = $('.burger');
  addEventListener('scroll', () => hd.classList.toggle('solid', scrollY > 20), { passive: true });
  burger.addEventListener('click', () => { const o = hd.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });

  // Réseaux
  const icon = (n, s = 18) => (window.brandSvg ? window.brandSvg(n, s) : '');
  $$('[data-soc]').forEach((el) => (el.innerHTML = ['facebook', 'linkedin', 'instagram', 'tiktok'].map((n) => `<a href="../../social.html?slug=${AG.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));

  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .grid>*, .steps li, .avis figure, .split .tx, .info>div').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // FAQ : une réponse ouverte à la fois
  $$('.qs details').forEach((d) => d.addEventListener('toggle', () => { if (d.open) $$('.qs details').forEach((o) => o !== d && (o.open = false)); }));

  // ---- Test du code ----
  const quiz = $('[data-quiz]');
  if (quiz) {
    const Q = AG.quiz || []; let i = 0, score = 0;
    const show = () => {
      $('[data-prog]').style.width = `${(i / Q.length) * 100}%`;
      if (i >= Q.length) return end();
      const q = Q[i];
      $('[data-q]').innerHTML = `<span class="n">Question ${i + 1} / ${Q.length}</span>${q.s}<h2>${q.q}</h2><div class="ans">${q.r.map((r, k) => `<button data-k="${k}">${r}</button>`).join('')}</div>`;
      $$('[data-q] .ans button').forEach((b) => b.addEventListener('click', () => {
        const k = +b.dataset.k, good = k === q.a; if (good) score++;
        $$('[data-q] .ans button').forEach((x, j) => { x.disabled = true; if (j === q.a) x.classList.add('good'); else if (j === k) x.classList.add('bad'); });
        $('[data-q]').insertAdjacentHTML('beforeend', `<p class="expl">${good ? '✅ Bonne réponse. ' : '❌ Mauvaise réponse. '}${q.e}</p><button class="btn y" data-next>${i + 1 < Q.length ? 'Question suivante' : 'Voir mon score'}</button>`);
        $('[data-next]').addEventListener('click', () => { i++; show(); });
      }));
      $('[data-q]').hidden = false; $('[data-res]').hidden = true;
    };
    const end = () => {
      const pct = Math.round((score / Q.length) * 100);
      $('[data-q]').hidden = true; $('[data-res]').hidden = false;
      $('[data-score]').style.setProperty('--p', pct + '%'); $('[data-score]').innerHTML = `<span>${score}/${Q.length}</span>`;
      $('[data-res-t]').textContent = pct >= 85 ? 'Excellent, vous êtes presque prêt !' : pct >= 60 ? 'Pas mal, encore un petit effort' : 'Le code, ça s\'apprend : on vous accompagne';
      $('[data-res-p]').textContent = 'À l\'examen, il faut au moins 35 bonnes réponses sur 40. Nos cours et tests blancs vous y préparent.';
    };
    $('[data-restart]').onclick = () => { i = 0; score = 0; show(); };
    show();
  }

  // ---- Inscription ----
  const f = $('[data-steps]');
  if (f) {
    const F = AG.formules || {};
    if (F[qs.get('formule')]) $(`[name=formule][value="${qs.get('formule')}"]`, f).checked = true;
    const S = (k, v) => ($(`[data-s="${k}"]`).textContent = v);
    const sync = () => {
      const x = F[f.formule.value]; const n = parseInt(f.paie.value.replace(/\D/g, ''), 10) || 1;
      S('formule', x.t); S('prix', fcfa(x.p)); S('paie', f.paie.value); S('ech', n > 1 ? `${n} × ${fcfa(x.p / n)}` : fcfa(x.p));
    };
    f.addEventListener('change', sync); sync();
    $('[data-send]').addEventListener('click', () => {
      if (!check(f)) return;
      const x = F[f.formule.value];
      const list = (name) => $$(`[name=${name}]:checked`, f).map((c) => c.value).join(', ');
      wa(`Bonjour 2S Confort Driving, je souhaite m'inscrire.\nFormule : ${x.t} (${fcfa(x.p)})\nPaiement : ${f.paie.value}${list('dispo') ? '\nDisponibilités : ' + list('dispo') : ''}${list('deja') ? '\nJ\'ai ' + list('deja') : ''}${f.naiss.value ? '\nDate de naissance : ' + new Date(f.naiss.value + 'T12:00').toLocaleDateString('fr-FR') : ''}${f.quartier.value ? '\nQuartier : ' + f.quartier.value : ''}\n\n${f.nom.value} · ${f.tel.value}`);
      toast('Votre inscription s\'ouvre dans WhatsApp. Nous vous rappelons sous 24 h.');
    });
  }

  // Galerie
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

  // Contact
  const ct = $('[data-contact]');
  if (ct) ct.addEventListener('submit', (e) => {
    e.preventDefault(); if (!check(ct)) return;
    wa(`Bonjour 2S Confort Driving,\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`);
    toast('Votre message s\'ouvre dans WhatsApp.');
  });
})();
