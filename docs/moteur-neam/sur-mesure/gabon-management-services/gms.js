// Gabon Management Services : interactions (menu, recherche de biens, fiche et visite, simulateur propriétaire, dossier locataire, contact)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WI = window.WI || {};
  const BIENS = WI.biens || [];
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${WI.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  const short = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' M' : Math.round(n / 1000) + ' 000') + ' FCFA';

  function toast(t) {
    let el = $('.wi-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'wi-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#24343A;color:#fff;padding:14px 20px;border-radius:12px;font:600 15px Inter,Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border-left:5px solid #1A9C9F';
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
  $$('[data-soc]').forEach((el) => (el.innerHTML = ['facebook', 'instagram', 'linkedin'].map((n) => `<a href="../../social.html?slug=${WI.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${WI.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));

  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .svs>*, .avis figure, .info>div, .qz a').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // ---- Fiche du bien et demande de visite ----
  const md = $('[data-md]');
  if (md) {
    const J = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
    const days = []; const d = new Date();
    while (days.length < 8) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) days.push(`${J[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`); }
    $('[data-jours]').innerHTML = days.map((x) => `<option>${x}</option>`).join('');
    let cur = null, last = null;
    const pic = (src) => { $('[data-mimg]').src = src; $$('[data-mth] button').forEach((b) => b.classList.toggle('on', b.dataset.src === src)); };
    const open = (ref) => {
      const b = BIENS.find((x) => x.ref === ref); if (!b) return; cur = b; last = document.activeElement;
      $('[data-mp]').textContent = fcfa(b.prix) + (b.tr === 'location' ? ' / mois' : '');
      $('[data-mt]').textContent = b.t; $('[data-mq]').textContent = `${b.q} · ${b.type} · ${b.tr === 'location' ? 'à louer' : 'à vendre'}${b.meuble ? ' · meublé' : ''}`;
      $('[data-mf]').innerHTML = [b.m2 && `${b.m2} m²`, b.ch && `${b.ch} chambre${b.ch > 1 ? 's' : ''}`, b.sdb && `${b.sdb} salle${b.sdb > 1 ? 's' : ''} de bain`].filter(Boolean).map((x) => `<li>${x}</li>`).join('');
      $('[data-ma]').innerHTML = b.atouts.map((a) => `<li>${a}</li>`).join('');
      $('[data-mth]').innerHTML = b.ph.map((p) => `<button type="button" data-src="${p}" aria-label="Voir la photo"><img src="${p}" alt=""></button>`).join('');
      $$('[data-mth] button').forEach((x) => x.addEventListener('click', () => pic(x.dataset.src)));
      pic(b.ph[0]); $('[data-mimg]').alt = b.t; $('[data-mref]').textContent = b.ref;
      md.hidden = false; document.body.style.overflow = 'hidden'; $('[data-close]', md).focus();
    };
    const close = () => { md.hidden = true; document.body.style.overflow = ''; if (last) last.focus(); };
    document.addEventListener('click', (e) => { const o = e.target.closest('[data-open]'); if (o) open(o.dataset.open); });
    $('[data-close]', md).addEventListener('click', close);
    md.addEventListener('click', (e) => { if (e.target === md) close(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !md.hidden) close(); });
    const vf = $('[data-visit]');
    vf.addEventListener('submit', (e) => {
      e.preventDefault(); if (!check(vf)) return;
      wa(`Bonjour ${WI.name}, je souhaite visiter le bien ${cur.ref} : ${cur.t} (${cur.q}), ${fcfa(cur.prix)}${cur.tr === 'location' ? ' / mois' : ''}.\nDisponibilité : ${vf.jour.value}, ${vf.moment.value.toLowerCase()}.\n\n${vf.nom.value} · ${vf.tel.value}`);
      toast('Votre demande de visite s\'ouvre dans WhatsApp.');
    });
    if (qs.get('bien')) open(qs.get('bien'));
  }

  // ---- Liste des biens : filtres ----
  const flt = $('[data-flt]');
  if (flt) {
    const range = $('[data-max]');
    if (qs.get('tr')) { const r = $(`input[name="tr"][value="${qs.get('tr')}"]`, flt); if (r) r.checked = true; }
    if (qs.get('type')) flt.querySelector('[name="type"]').value = qs.get('type');
    if (qs.get('q')) flt.querySelector('[name="q"]').value = qs.get('q');
    const setRange = (keep) => {
      const tr = $('input[name="tr"]:checked', flt).value, ps = BIENS.filter((b) => b.tr === tr).map((b) => b.prix);
      const mx = Math.max(...ps), step = tr === 'vente' ? 5e6 : 50000;
      range.min = step; range.max = Math.ceil(mx / step) * step; range.step = step; if (!keep) range.value = range.max;
    };
    const apply = () => {
      const tr = $('input[name="tr"]:checked', flt).value, type = flt.querySelector('[name="type"]').value, q = flt.querySelector('[name="q"]').value;
      const ch = +flt.querySelector('[name="ch"]').value, mx = +range.value, mb = flt.querySelector('[name="meuble"]').checked;
      $('[data-bv]').textContent = short(mx) + (tr === 'location' ? ' / mois' : '');
      const cards = $$('.bcs.all .bc'); let n = 0;
      cards.forEach((c) => { const ok = c.dataset.tr === tr && (!type || c.dataset.type === type) && (!q || c.dataset.q === q) && +c.dataset.ch >= ch && +c.dataset.prix <= mx && (!mb || BIENS.find((b) => b.ref === c.dataset.ref).meuble); c.hidden = !ok; if (ok) n++; });
      const tri = $('[data-tri]').value, box = $('.bcs.all');
      cards.sort((a, b) => (tri === 'pa' ? a.dataset.prix - b.dataset.prix : tri === 'pd' ? b.dataset.prix - a.dataset.prix : b.dataset.m2 - a.dataset.m2)).forEach((c) => box.appendChild(c));
      $('[data-nb]').textContent = `${n} bien${n > 1 ? 's' : ''} ${tr === 'location' ? 'à louer' : 'à vendre'}${q ? ' · ' + q : ''}`;
      $('[data-none]').hidden = n > 0;
    };
    flt.addEventListener('change', (e) => { if (e.target.name === 'tr') setRange(); apply(); });
    flt.addEventListener('input', apply); $('[data-tri]').addEventListener('change', apply);
    setRange(); apply();
    $('[data-alert]').addEventListener('click', () => { const tr = $('input[name="tr"]:checked', flt).value; wa(`Bonjour ${WI.name}, je cherche un bien ${tr === 'location' ? 'à louer' : 'à acheter'} : ${flt.querySelector('[name="type"]').value || 'tout type'}, ${flt.querySelector('[name="q"]').value || 'tout Libreville'}, ${flt.querySelector('[name="ch"]').value}+ chambres, budget max ${short(+range.value)}. Merci de me prévenir si un bien se libère.`); });
  }

  // ---- Simulateur propriétaire ----
  const lo = $('[data-loyer]');
  if (lo) {
    const R = (k, t) => ($(`[data-r="${k}"]`).textContent = t);
    const calc = () => {
      const l = +lo.value, rate = 0.1 + $$('[data-opt]').filter((x) => x.checked).reduce((s, x) => s + +x.dataset.opt, 0);
      $('[data-lv]').textContent = fcfa(l);
      const brut = l * 12, hon = brut * rate;
      R('brut', fcfa(brut)); R('hon', `${fcfa(hon)} (${Math.round(rate * 100)} %)`); R('net', fcfa(brut - hon)); R('mois', `soit ${fcfa((brut - hon) / 12)} reversés chaque mois`);
    };
    lo.addEventListener('input', calc); $$('[data-opt]').forEach((x) => x.addEventListener('change', calc)); calc();
  }
  const cf = $('[data-confier]');
  if (cf) cf.addEventListener('submit', (e) => {
    e.preventDefault(); if (!check(cf)) return;
    wa(`Bonjour ${WI.name}, je souhaite : ${cf.besoin.value}.\nBien : ${cf.type.value}, ${cf.q.value}${cf.m2.value ? ', ' + cf.m2.value + ' m²' : ''}${cf.msg.value.trim() ? '\n' + cf.msg.value.trim() : ''}\n\n${cf.nom.value} · ${cf.tel.value}`);
    toast('Votre demande d\'estimation s\'ouvre dans WhatsApp.');
  });

  // ---- Dossier locataire ----
  const dos = $('[data-dossier]');
  if (dos) {
    const KEY = 'wi-dossier'; let saved = [];
    try { saved = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { saved = []; }
    const boxes = $$('input', dos); boxes.forEach((b, i) => (b.checked = !!saved[i]));
    const upd = () => {
      const req = boxes.filter((b) => b.dataset.req === '1'), ok = req.filter((b) => b.checked).length;
      $('[data-g]').style.width = `${(ok / req.length) * 100}%`;
      $('[data-gp]').textContent = ok === req.length ? 'Votre dossier est prêt : demandez une visite !' : `${ok} / ${req.length} documents indispensables`;
      try { localStorage.setItem(KEY, JSON.stringify(boxes.map((b) => b.checked))); } catch (e) { /* stockage indisponible */ }
    };
    dos.addEventListener('change', upd); upd();
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
    wa(`Bonjour ${WI.name},\nObjet : ${ct.objet.value}\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`);
    toast('Votre message s\'ouvre dans WhatsApp.');
  });
})();
