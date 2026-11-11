// Fattal Travel & Tourism : menu, recherche, filtres de destinations, devis en ligne, guide visas, galerie, contact.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const FT = window.FT || {};
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${FT.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  const r5 = (n) => Math.round(n / 5000) * 5000;
  const D = Object.fromEntries(FT.dest.map((d) => [d.id, d]));
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const plus = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
  const fd = (v) => (v ? new Date(v + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

  function toast(t) {
    let el = $('.ft-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'ft-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#0B2545;color:#fff;padding:14px 22px;border-radius:999px;font:700 15px Manrope,Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border:2px solid #FF7A45';
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

  // En-tête, menu, réseaux, apparition
  const hd = $('.hd'), burger = $('.burger');
  addEventListener('scroll', () => hd.classList.toggle('solid', scrollY > 20), { passive: true });
  burger.addEventListener('click', () => { const o = hd.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });
  const icon = (n, s = 18) => (window.brandSvg ? window.brandSvg(n, s) : '');
  $$('[data-soc]').forEach((el) => (el.innerHTML = FT.soc.map((n) => `<a href="../../social.html?slug=${FT.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${FT.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .dc, .avis figure, .svs article, .steps li').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // Recherche de l'accueil (onglets Vol / Vol + hôtel / Visa)
  const sr = $('[data-srch]');
  if (sr) {
    const f = $('form', sr); f.aller.min = plus(0); f.aller.value = plus(14); f.retour.value = plus(28);
    $$('[data-k]', sr).forEach((b) => b.addEventListener('click', () => {
      $$('[data-k]', sr).forEach((x) => x.setAttribute('aria-selected', x === b)); f.type.value = b.dataset.k;
      $('[data-ret]', f).hidden = b.dataset.k === 'visa';
    }));
  }

  // Filtre des destinations
  const df = $('[data-df]');
  if (df) {
    const run = (k) => {
      $$('button', df).forEach((b) => b.setAttribute('aria-pressed', b.dataset.k === k));
      let n = 0; $$('.dc').forEach((c) => { const ok = k === 'tout' || c.dataset.th.split(' ').includes(k); c.hidden = !ok; n += ok; });
      $('[data-dn]').textContent = `${n} destination${n > 1 ? 's' : ''}`; $('[data-dnone]').hidden = n > 0;
    };
    $$('button', df).forEach((b) => b.addEventListener('click', () => run(b.dataset.k))); run('tout');
  }

  // Devis
  const dv = $('[data-devis]');
  if (dv) {
    dv.aller.min = plus(0); dv.aller.value = qs.get('aller') || plus(14); dv.retour.value = qs.get('retour') || plus(28);
    if (qs.get('dest') && dv.dest.querySelector(`option[value="${qs.get('dest')}"]`)) dv.dest.value = qs.get('dest');
    if (qs.get('ad')) { dv.ad.value = qs.get('ad'); }
    const t = qs.get('type'); if (t === 'sejour') $('input[value="hotel"]', dv).checked = true; if (t === 'visa') $('input[value="visa"]', dv).checked = true;
    const lim = { ad: [1, 9], en: [0, 8], bb: [0, 4] };
    const setN = (k, v) => { v = Math.max(lim[k][0], Math.min(lim[k][1], v)); if (k === 'bb') v = Math.min(v, +dv.ad.value); dv[k].value = v; dv[k + 'o'].value = v; };
    ['ad', 'en', 'bb'].forEach((k) => setN(k, +dv[k].value));
    $$('[data-p]', dv).forEach((b) => b.addEventListener('click', () => { setN(b.dataset.p, +dv[b.dataset.p].value + 1); calc(); }));
    $$('[data-m]', dv).forEach((b) => b.addEventListener('click', () => { setN(b.dataset.m, +dv[b.dataset.m].value - 1); if (b.dataset.m === 'ad') setN('bb', +dv.bb.value); calc(); }));
    const set = (k, v) => ($(`[data-s="${k}"]`).textContent = v);
    const calc = () => {
      const trajet = $('input[name="trajet"]:checked', dv).value, d = D[dv.dest.value], ad = +dv.ad.value, en = +dv.en.value, bb = +dv.bb.value;
      $('[data-ret]', dv).hidden = trajet === 'as'; $('[data-autre]', dv).hidden = dv.dest.value !== 'autre';
      const xs = $$('input[name="x"]:checked', dv).map((x) => x.closest('label').querySelector('b').textContent);
      $('[data-hotel]', dv).hidden = !$('input[value="hotel"]', dv).checked;
      set('from', dv.from.value.match(/\((\w+)\)/)[1]); set('to', d ? d.n : (dv.autre.value || 'À préciser'));
      set('dates', trajet === 'as' ? fd(dv.aller.value) : `${fd(dv.aller.value)} → ${fd(dv.retour.value)}`);
      set('pax', [`${ad} adulte${ad > 1 ? 's' : ''}`, en && `${en} enfant${en > 1 ? 's' : ''}`, bb && `${bb} bébé${bb > 1 ? 's' : ''}`].filter(Boolean).join(', '));
      set('x', xs.length ? xs.join(', ') : 'Vol seul');
      if (!d) { set('tot', 'Sur devis'); set('det', 'Destination à préciser : nous revenons vers vous sous 24 h.'); return { d, xs, trajet, tot: 0 }; }
      const k = (trajet === 'as' ? 0.62 : trajet === 'multi' ? 1.35 : 1) * +dv.cl.value;
      const tot = d.prix * k * (ad + en * 0.75 + bb * 0.1);
      set('tot', `${fcfa(r5(tot * 0.9))} – ${fcfa(r5(tot * 1.2))}`);
      set('det', `Vol ${dv.cl.selectedOptions[0].text.toLowerCase()}, ${trajet === 'as' ? 'aller simple' : trajet === 'multi' ? 'multi-destinations' : 'aller-retour'}, tous voyageurs${dv.flex.checked ? ' · dates flexibles : souvent moins cher' : ''}. Hôtel, visa et services en plus chiffrés dans le devis.`);
      return { d, xs, trajet, tot };
    };
    dv.addEventListener('change', calc); dv.addEventListener('input', calc); calc();
    $('[data-send]').addEventListener('click', () => {
      if (!check(dv)) return;
      const c = calc(), dest = c.d ? `${c.d.n} (${c.d.pays})` : dv.autre.value || 'à préciser';
      wa(`Bonjour ${FT.name}, je souhaite un devis.\n\nTrajet : ${dv.from.value} → ${dest} (${$('input[name="trajet"]:checked', dv).closest('label').textContent})\nAller : ${fd(dv.aller.value)}${c.trajet !== 'as' ? `\nRetour : ${fd(dv.retour.value)}` : ''}${dv.flex.checked ? ' (dates flexibles)' : ''}\nVoyageurs : ${$('[data-s="pax"]').textContent}\nClasse : ${dv.cl.selectedOptions[0].text}\nServices : ${$('[data-s="x"]').textContent}${$('input[value="hotel"]', dv).checked ? ` (${dv.etoiles.value}, ${dv.ch.value} chambre(s))` : ''}${c.tot ? `\nBudget vol indicatif : ${$('[data-s="tot"]').textContent}` : ''}${dv.msg.value.trim() ? '\n\n' + dv.msg.value.trim() : ''}\n\n${dv.nom.value} · ${dv.tel.value}`);
      toast('Votre demande de devis s\'ouvre dans WhatsApp.');
    });
  }

  // Guide visas : liste à cocher par destination (gardée sur l'appareil)
  const vz = $('[data-visa]');
  if (vz) {
    const sel = $('select', vz); const KEY = 'ftt-visa';
    let st = {}; try { st = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { st = {}; }
    if (qs.get('d') && D[qs.get('d')]) sel.value = qs.get('d');
    const v = (k) => $(`[data-v="${k}"]`, vz);
    const prog = () => { const all = $$('input', v('docs')), ok = all.filter((i) => i.checked).length; v('g').style.width = (ok / all.length) * 100 + '%'; v('gp').textContent = ok === all.length ? 'Dossier complet : faites-le vérifier avant le dépôt.' : `${ok} / ${all.length} pièces prêtes`; return all.filter((i) => !i.checked).map((i) => i.nextElementSibling.textContent); };
    const show = () => {
      const d = D[sel.value], V = FT.visas[d.visa], done = st[d.id] || [];
      v('t').textContent = V.t; v('delai').textContent = V.delai; v('rdv').textContent = V.rdv;
      v('docs').innerHTML = V.docs.map((t, i) => `<li><label><input type="checkbox" data-i="${i}"${done.includes(i) ? ' checked' : ''}><span>${t}</span></label></li>`).join('');
      prog();
    };
    vz.addEventListener('change', (e) => {
      if (e.target === sel) return show();
      st[sel.value] = $$('input:checked', v('docs')).map((i) => +i.dataset.i); try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (er) { /* stockage indisponible */ }
      prog();
    });
    show();
    $('[data-vsend]').addEventListener('click', () => { const miss = prog(), d = D[sel.value]; wa(`Bonjour ${FT.name}, je prépare un visa pour ${d.n} (${d.pays}).\n\n${miss.length ? 'Il me manque encore :\n- ' + miss.join('\n- ') : 'J\'ai toutes les pièces de la liste.'}\n\nPouvez-vous vérifier mon dossier ?`); toast('Votre demande s\'ouvre dans WhatsApp.'); });
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
  if (ct) {
    if (qs.get('obj') && ct.obj.querySelector(`option[value="${qs.get('obj')}"]`)) ct.obj.value = qs.get('obj');
    ct.addEventListener('submit', (e) => { e.preventDefault(); if (!check(ct)) return; wa(`Bonjour ${FT.name} (${ct.obj.selectedOptions[0].text}),\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`); toast('Votre message s\'ouvre dans WhatsApp.'); });
  }
})();
