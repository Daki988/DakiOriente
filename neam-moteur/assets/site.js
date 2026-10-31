// Interactions communes des sites clients : menu, apparitions, galerie, filtres, panier, réservations, rendez-vous, formulaires.
(function () {
  const S = window.SITE || {};
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' FCFA';
  const wa = (txt) => `https://wa.me/${S.wa}?text=${encodeURIComponent(txt)}`;
  // Menu mobile
  $('.burger')?.addEventListener('click', () => $('.hd nav').classList.toggle('open'));
  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  $$('.rv').forEach((e) => io.observe(e));
  // Compteurs
  const ioc = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; const el = e.target, to = +el.dataset.count, suf = el.dataset.suf || ''; let t0; const step = (t) => { t0 = t0 || t; const k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('fr-FR') + suf; if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); ioc.unobserve(el); }), { threshold: .5 });
  $$('[data-count]').forEach((e) => ioc.observe(e));
  // Fenêtre modale
  const ov = document.createElement('div'); ov.className = 'ov'; ov.innerHTML = '<div class="box"><button class="x" aria-label="Fermer">×</button><div class="ct"></div></div>'; document.body.appendChild(ov);
  const open = (html, lb) => { $('.ct', ov).innerHTML = html; ov.classList.toggle('lb', !!lb); ov.classList.add('on'); document.body.style.overflow = 'hidden'; };
  const close = () => { ov.classList.remove('on'); document.body.style.overflow = ''; };
  $('.x', ov).onclick = close; ov.addEventListener('click', (e) => { if (e.target === ov) close(); }); addEventListener('keydown', (e) => e.key === 'Escape' && close());
  window.SITEUI = { open, close };
  // Galerie (lightbox)
  $$('[data-lb]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); open(`<img src="${a.dataset.lb}" alt="">`, true); }));
  // Contenus détaillés (chambres, biens, produits, destinations…)
  $$('[data-open]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); const t = document.getElementById(b.dataset.open); if (t) { open(t.innerHTML); bindAll($('.ct', ov)); } }));
  // Filtres par onglets
  $$('[data-tabs]').forEach((tb) => { const scope = document.getElementById(tb.dataset.tabs); $$('button', tb).forEach((b) => b.addEventListener('click', () => { $$('button', tb).forEach((x) => x.classList.toggle('on', x === b)); const f = b.dataset.f; $$('[data-c]', scope).forEach((it) => it.classList.toggle('hide', f !== 'all' && !it.dataset.c.split(' ').includes(f))); })); });
  // Panier → commande WhatsApp
  const cart = []; let cartBtn, drawer;
  function cartUI() {
    if (!cartBtn) {
      cartBtn = document.createElement('button'); cartBtn.className = 'cartbtn'; document.body.appendChild(cartBtn);
      drawer = document.createElement('aside'); drawer.className = 'drawer'; document.body.appendChild(drawer);
      cartBtn.onclick = () => drawer.classList.add('on');
    }
    const n = cart.reduce((a, l) => a + l.q, 0), tot = cart.reduce((a, l) => a + l.q * l.p, 0);
    cartBtn.classList.toggle('on', n > 0); cartBtn.innerHTML = `🛒 ${S.cartLabel || 'Ma commande'} <i>${n}</i>`;
    const msg = `Bonjour ${S.name}, je souhaite commander :\n` + cart.map((l) => `• ${l.q} × ${l.n}${l.p ? ' (' + fcfa(l.p) + ')' : ''}`).join('\n') + (tot ? `\nTotal : ${fcfa(tot)}` : '');
    drawer.innerHTML = `<div class="dh"><b style="font-family:var(--h);font-size:24px">${S.cartLabel || 'Ma commande'}</b><button class="x" style="position:static">×</button></div><div class="dl">${cart.map((l, i) => `<div class="ln"><div><b>${l.n}</b><br><small>${l.p ? fcfa(l.p) : 'Prix sur demande'}</small></div><div class="qty"><button data-q="${i}" data-d="-1">−</button>${l.q}<button data-q="${i}" data-d="1">+</button></div></div>`).join('') || '<p style="padding:20px 0;opacity:.7">Votre sélection est vide.</p>'}</div><div class="df"><div class="total"><span>Total</span><b>${fcfa(tot)}</b></div><label style="font-size:14px">Livraison / retrait<select id="mode" style="width:100%;padding:12px;border-radius:12px;margin-top:6px"><option>Retrait sur place</option><option>Livraison à ${S.city || 'Libreville'}</option></select></label><a class="btn wa" id="send" target="_blank" href="#">Envoyer la commande sur WhatsApp</a><small style="opacity:.6;text-align:center">Démonstration NEAM : le message est prêt à être envoyé au ${S.phone}.</small></div>`;
    $('.x', drawer).onclick = () => drawer.classList.remove('on');
    $$('[data-q]', drawer).forEach((b) => b.onclick = () => { const l = cart[+b.dataset.q]; l.q += +b.dataset.d; if (l.q <= 0) cart.splice(+b.dataset.q, 1); cartUI(); });
    const send = $('#send', drawer); const upd = () => send.href = wa(msg + `\nMode : ${$('#mode', drawer).value}`); $('#mode', drawer).onchange = upd; upd();
  }
  function bindAll(root) {
    $$('[data-add]', root).forEach((b) => b.addEventListener('click', () => { const n = b.dataset.add, p = +b.dataset.price || 0; const l = cart.find((x) => x.n === n); l ? l.q++ : cart.push({ n, p, q: 1 }); cartUI(); b.classList.add('ok'); const t = b.textContent; b.textContent = '✓'; setTimeout(() => { b.classList.remove('ok'); b.textContent = t; }, 900); }));
    $$('[data-go]', root).forEach((b) => b.addEventListener('click', () => { location.href = b.dataset.go; }));
  }
  bindAll(document);
  // Calendrier + créneaux
  $$('[data-cal]').forEach((cal) => {
    const out = document.getElementById(cal.dataset.cal); const d0 = new Date(); const J = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    cal.innerHTML = Array.from({ length: 14 }, (_, i) => { const d = new Date(d0); d.setDate(d0.getDate() + i + 1); const closed = d.getDay() === 0 && !S.sunday; return `<button type="button" ${closed ? 'disabled' : ''} data-d="${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}"><small>${J[d.getDay()]}</small>${d.getDate()}</button>`; }).join('');
    $$('button', cal).forEach((b) => b.onclick = () => { $$('button', cal).forEach((x) => x.classList.toggle('on', x === b)); out.value = b.dataset.d; });
  });
  $$('[data-slots]').forEach((sl) => { const out = document.getElementById(sl.dataset.slots); $$('button', sl).forEach((b) => b.onclick = () => { $$('button', sl).forEach((x) => x.classList.toggle('on', x === b)); out.value = b.textContent; }); });
  // Étapes de formulaire
  $$('[data-steps]').forEach((f) => { const st = $$('.step', f), dots = $$('.steps i', f); let i = 0; const show = () => { st.forEach((s, k) => s.classList.toggle('on', k === i)); dots.forEach((d, k) => d.classList.toggle('on', k <= i)); }; $$('[data-next]', f).forEach((b) => b.onclick = () => { i = Math.min(st.length - 1, i + 1); show(); }); $$('[data-prev]', f).forEach((b) => b.onclick = () => { i = Math.max(0, i - 1); show(); }); show(); });
  // Calcul de séjour / location
  $$('[data-calc]').forEach((f) => {
    const run = () => {
      const sel = $('[data-unit]', f), p = +(sel.selectedOptions ? sel.selectedOptions[0].dataset.price : sel.dataset.price) || 0;
      const a = $('[name=arrivee]', f)?.valueAsDate, b = $('[name=depart]', f)?.valueAsDate; const n = a && b ? Math.max(1, Math.round((b - a) / 864e5)) : 1;
      const qty = +($('[name=qte]', f)?.value || 1);
      let tot = p * n * qty; $$('[data-extra]:checked', f).forEach((c) => tot += (+c.dataset.extra) * (c.dataset.per === 'n' ? n * qty : 1));
      $('[data-total]', f).textContent = fcfa(tot); const lab = $('[data-nights]', f); if (lab) lab.textContent = `${n} ${S.unit || 'nuit'}${n > 1 ? 's' : ''}${qty > 1 ? ' × ' + qty : ''}`;
      f.dataset.sum = fcfa(tot);
    };
    const t = new Date(); t.setDate(t.getDate() + 7); const t2 = new Date(t); t2.setDate(t.getDate() + 2);
    if ($('[name=arrivee]', f)) $('[name=arrivee]', f).valueAsDate = t; if ($('[name=depart]', f)) $('[name=depart]', f).valueAsDate = t2;
    const pre = new URLSearchParams(location.search).get('choix'); if (pre && $('[data-unit]', f)) { const o = [...$('[data-unit]', f).options].find((x) => x.value === pre); if (o) o.selected = true; }
    f.addEventListener('input', run); f.addEventListener('change', run); run();
  });
  // Estimation immobilière
  $$('[data-estimate]').forEach((f) => { const run = () => { const s = +f.surface.value || 0, z = +f.zone.value || 0, k = +f.etat.value || 1; const v = s * z * k; $('[data-total]', f).textContent = v ? fcfa(v * .93) + ' – ' + fcfa(v * 1.07) : '—'; f.dataset.sum = fcfa(v); }; f.addEventListener('input', run); run(); });
  // Filtres immobilier (budget)
  $$('[data-budget]').forEach((r) => { const scope = document.getElementById(r.dataset.budget), lab = r.nextElementSibling; const run = () => { lab.textContent = 'Jusqu\'à ' + fcfa(+r.value); $$('[data-price]', scope).forEach((c) => c.style.display = +c.dataset.price <= +r.value ? '' : 'none'); }; r.addEventListener('input', run); run(); });
  // Envoi des formulaires → récapitulatif + WhatsApp
  $$('form[data-form]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(f), lines = [];
    for (const [k, v] of fd.entries()) if (String(v).trim()) lines.push([k.replace(/_/g, ' '), v]);
    if (f.dataset.sum) lines.push(['Total estimé', f.dataset.sum]);
    const title = f.dataset.form;
    const txt = `Bonjour ${S.name}, ${title.toLowerCase()} :\n` + lines.map(([k, v]) => `• ${k} : ${v}`).join('\n');
    open(`<div class="in" style="text-align:center"><div style="width:76px;height:76px;border-radius:50%;background:#22c55e;color:#fff;font-size:40px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">✓</div><h3 style="font-size:30px">${title} : c'est noté !</h3><p class="muted" style="margin:10px 0 20px">Récapitulatif envoyé à ${S.name}. Vous recevrez une confirmation par WhatsApp.</p><div style="text-align:left;background:var(--soft);border-radius:16px;padding:18px;margin-bottom:20px">${lines.map(([k, v]) => `<div style="display:flex;justify-content:space-between;gap:16px;padding:4px 0"><span class="muted" style="text-transform:capitalize">${k}</span><b style="text-align:right">${v}</b></div>`).join('')}</div><a class="btn wa" target="_blank" href="${wa(txt)}">Confirmer sur WhatsApp</a><p class="muted" style="font-size:13px;margin-top:14px">Démonstration NEAM : aucune donnée n'est réellement transmise.</p></div>`);
    f.reset(); $$('.on', f).forEach((x) => x.classList.remove('on'));
  }));
})();
