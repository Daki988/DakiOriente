// Chouchou Lazare : interactions (menu, collections, étapes du raphia, demande sur mesure, galerie, contact)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CL = window.CL || {};
  const P = CL.p || {};
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${CL.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');

  function toast(t) {
    let el = $('.cl-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'cl-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#141110;color:#F6F0E4;padding:14px 22px;font:400 15px Jost,Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border-bottom:3px solid #C8693A';
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
  $$('[data-soc]').forEach((el) => (el.innerHTML = ['instagram', 'facebook'].map((n) => `<a href="../../social.html?slug=${CL.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${CL.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));

  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .pcs>*, .tl li, .uses>div, .info>div').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // ---- Collections : filtre ----
  const flt = $('[data-flt]');
  if (flt) {
    const apply = (l) => {
      $$('button', flt).forEach((b) => b.classList.toggle('on', b.dataset.f === l));
      $$('.pcs.all .pc').forEach((p) => (p.hidden = !!l && p.dataset.l !== l));
    };
    $$('button', flt).forEach((b) => b.addEventListener('click', () => apply(b.dataset.f)));
    apply(qs.get('ligne') || '');
  }

  // ---- Le raphia : étapes ----
  const st = $('[data-steps]');
  if (st) {
    const go = (i) => {
      $$('button', st).forEach((b) => { const on = +b.dataset.s === i; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      $$('[data-p]').forEach((p) => (p.hidden = +p.dataset.p !== i));
    };
    $$('button', st).forEach((b) => b.addEventListener('click', () => go(+b.dataset.s)));
  }

  // ---- Demande sur mesure ----
  const sm = $('[data-sm]');
  if (sm) {
    if (P[qs.get('piece')]) sm.piece.value = qs.get('piece');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    sm.date.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const set = (k, t) => ($(`[data-s="${k}"]`).textContent = t);
    const MES = ['poitrine', 'taille', 'hanches', 'hauteur'];
    const upd = () => {
      set('occ', $('input[name="occ"]:checked', sm).value);
      const p = P[sm.piece.value];
      set('piece', p ? `${p[0]} (${p[1]})` : 'Création libre');
      if (p && document.activeElement === sm.piece) sm.mat.value = p[1] === 'Wax' ? 'Wax' : p[1] === 'Raphia' ? 'Raphia' : 'Raphia et wax';
      set('mat', sm.mat.value);
      // Délai : le raphia demande du temps
      const msg = $('[data-delai]');
      if (sm.date.value) {
        const d = new Date(sm.date.value + 'T12:00'), wk = Math.floor((d - today) / 6048e5);
        const need = /Raphia/.test(sm.mat.value) ? 6 : 3;
        set('date', d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));
        msg.hidden = false;
        if (wk >= need) { msg.className = 'msg ok'; msg.textContent = `Dans ${wk} semaines : le temps qu'il faut pour une belle pièce${need === 6 ? ' en raphia' : ''}.`; }
        else { msg.className = 'msg'; msg.textContent = `Dans ${Math.max(wk, 0)} semaine${wk > 1 ? 's' : ''} : c'est court${need === 6 ? ' pour le raphia (6 semaines conseillées)' : ' (3 semaines conseillées)'}. Appelez-nous, nous verrons ce qui est possible.`; }
      } else { set('date', 'à préciser'); msg.hidden = true; }
      const m = MES.map((k) => sm[k].value).filter(Boolean);
      set('mes', m.length ? `${m.length} / 4 renseignées` : 'à l\'atelier');
      const sz = $('[data-size]');
      const t = +sm.poitrine.value, h = +sm.hanches.value;
      if (t && h) {
        const S = [[80, 88, '36'], [84, 92, '38'], [88, 96, '40'], [92, 100, '42'], [96, 104, '44'], [100, 108, '46'], [106, 114, '48'], [112, 120, '50']];
        const f = S.find(([a, b]) => t <= a + 2 && h <= b + 2) || S[S.length - 1];
        sz.hidden = false; sz.textContent = `Repère : taille ${f[2]} environ. Chaque pièce sera de toute façon ajustée à vos mesures.`;
      } else sz.hidden = true;
    };
    sm.addEventListener('input', upd); sm.addEventListener('change', upd); upd();
    $('[data-send]').addEventListener('click', () => {
      if (!check(sm)) return;
      const m = MES.map((k) => (sm[k].value ? `${k} ${sm[k].value} cm` : '')).filter(Boolean).join(', ');
      wa(`Bonjour, je souhaite une création Chouchou Lazare.\n\nOccasion : ${$('input[name="occ"]:checked', sm).value}\nPièce : ${$('[data-s="piece"]').textContent}\nMatière : ${sm.mat.value}\nPour : ${sm.pour.value}\nÉvénement : ${$('[data-s="date"]').textContent}${m ? '\nMesures : ' + m : ''}${sm.idee.value.trim() ? '\nIdée : ' + sm.idee.value.trim() : ''}\n\n${sm.nom.value} · ${sm.tel.value}`);
      toast('Votre demande s\'ouvre dans WhatsApp. Nous vous rappelons pour un rendez-vous à l\'atelier.');
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
    wa(`Bonjour Chouchou Lazare,\nObjet : ${ct.objet.value}\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`);
    toast('Votre message s\'ouvre dans WhatsApp.');
  });
})();
