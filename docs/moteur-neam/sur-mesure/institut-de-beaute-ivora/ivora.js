// Institut Ivora : interactions (menu, carte des soins, réservation, bon cadeau, contact)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const AG = window.AG || {};
  const ALL = (AG.soins || []).concat(AG.forfaits || []);
  const byId = Object.fromEntries(ALL.map((s) => [s.id, s]));
  const qs = new URLSearchParams(location.search);
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) : ''}` : `${m} min`);
  const wa = (t) => window.open(`https://wa.me/${AG.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  const DAYN = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const fday = (d) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  function toast(t) {
    let el = $('.ivora-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'ivora-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#3B2A26;color:#fff;padding:14px 22px;border-radius:999px;font:500 15px Jost,Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s';
      document.body.appendChild(el);
    }
    el.textContent = t; el.style.opacity = 1; clearTimeout(el._t); el._t = setTimeout(() => (el.style.opacity = 0), 3800);
  }
  function check(form) {
    let ok = true;
    $$('[required]', form).forEach((i) => { const bad = !i.value.trim(); i.closest('.fld')?.classList.toggle('bad', bad); if (bad && ok) { i.focus(); ok = false; } });
    if (!ok) toast('Merci de compléter les champs en rouge.');
    return ok;
  }
  $$('.fld input, .fld textarea').forEach((i) => i.addEventListener('input', () => i.closest('.fld').classList.remove('bad')));

  // En-tête : transparent sur la photo d'accueil, menu mobile
  const hd = $('.hd'), burger = $('.burger');
  const onScroll = () => hd.classList.toggle('solid', scrollY > 40 || !hd.classList.contains('clear'));
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  burger.addEventListener('click', () => { const o = hd.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });

  // Réseaux
  const icon = (n, s = 18) => (window.brandSvg ? window.brandSvg(n, s) : '');
  $$('[data-soc]').forEach((el) => (el.innerHTML = ['instagram', 'facebook', 'tiktok'].map((n) => `<a href="../../social.html?slug=${AG.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));

  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .univ a, .forf article, .avis figure, .split .tx, .team>div, .gal button, .info>div, .menu li').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // Carte des soins : onglets (et lien direct #spa, #coiffure…)
  const tabs = $$('[data-tabs] button');
  const show = (id) => { tabs.forEach((b) => { const on = b.dataset.t === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }); $$('[data-pane]').forEach((p) => (p.hidden = p.dataset.pane !== id)); };
  tabs.forEach((b) => b.addEventListener('click', () => { show(b.dataset.t); history.replaceState(null, '', '#' + b.dataset.t); }));
  if (tabs.length && location.hash && $(`[data-pane="${location.hash.slice(1)}"]`)) show(location.hash.slice(1));

  // Réservation
  const f = $('[data-steps]');
  if (f) {
    const sel = new Set(byId[qs.get('soin')] ? [qs.get('soin')] : []);
    let cat = byId[qs.get('soin')]?.cat || AG.soins[0].cat;
    const picks = () => {
      $$('[data-rtabs] button').forEach((b) => b.classList.toggle('on', b.dataset.t === cat));
      $('[data-picks]').innerHTML = ALL.filter((s) => s.cat === cat).map((s) => `<label><input type="checkbox" value="${s.id}"${sel.has(s.id) ? ' checked' : ''}><span><span style="border:0;padding:0;display:block">${s.t}<small>${s.d} · ${dur(s.m)}</small></span><em>${fcfa(s.p)}</em></span></label>`).join('');
    };
    $$('[data-rtabs] button').forEach((b) => b.addEventListener('click', () => { cat = b.dataset.t; picks(); }));
    $('[data-picks]').addEventListener('change', (e) => { if (e.target.checked) sel.add(e.target.value); else sel.delete(e.target.value); sync(); });

    // Jours (7 prochains) et créneaux de 30 min ; le dimanche, sur rendez-vous de 10 h à 14 h
    const days = []; const d0 = new Date(); d0.setHours(12, 0, 0, 0);
    for (let i = 0; days.length < 7 && i < 14; i++) { const d = new Date(d0); d.setDate(d0.getDate() + i); if (![0].includes(d.getDay())) days.push(d); }
    const times = (d) => { const out = []; const [a, b] = [9, 18]; for (let m = a * 60; m <= b * 60; m += 30) out.push(`${Math.floor(m / 60)}:${m % 60 ? '30' : '00'}`); return out; };
    const taken = (d, s) => (d.getDate() * 5 + parseInt(s, 10) * 3 + (s.endsWith('30') ? 1 : 0)) % 5 === 0;
    const past = (d, s) => { const n = new Date(); if (d.toDateString() !== n.toDateString()) return false; const [h, m] = s.split(':').map(Number); return h * 60 + m < n.getHours() * 60 + n.getMinutes() + 60; };
    $('[data-days]').innerHTML = days.map((d, i) => `<label><input type="radio" name="jour" value="${i}"${i === 0 ? ' checked' : ''}><span>${DAYN[d.getDay()]}<b>${d.getDate()}</b>${d.toLocaleDateString('fr-FR', { month: 'short' })}</span></label>`).join('');
    const slots = () => {
      const d = days[+f.jour.value];
      $('[data-slots]').innerHTML = times(d).map((s) => `<label><input type="radio" name="slot" value="${s}"${taken(d, s) || past(d, s) ? ' disabled' : ''}><span>${s.replace(':', ' h ')}</span></label>`).join('');
      const first = $('[name=slot]:not(:disabled)', f); if (first) first.checked = true;
    };
    const S = (k, v) => ($(`[data-s="${k}"]`).textContent = v);
    function sync() {
      const items = [...sel].map((id) => byId[id]);
      $('[data-cart]').innerHTML = items.length ? items.map((s) => `<li><span>${s.t}</span><span><b>${fcfa(s.p)}</b> <button type="button" data-rm="${s.id}" aria-label="Retirer ${s.t}">×</button></span></li>`).join('') : '<li class="empty">Choisissez au moins un soin</li>';
      const s = $('[name=slot]:checked', f);
      S('jour', fday(days[+f.jour.value])); S('slot', s ? s.value.replace(':', ' h ') : 'Complet ce jour-là');
      S('dur', items.length ? dur(items.reduce((a, x) => a + x.m, 0)) : '—'); S('tot', fcfa(items.reduce((a, x) => a + x.p, 0)));
    }
    $('[data-cart]').addEventListener('click', (e) => { const id = e.target.dataset.rm; if (id) { sel.delete(id); picks(); sync(); } });
    f.addEventListener('change', (e) => { if (e.target.name === 'jour') slots(); sync(); });
    picks(); slots(); sync();
    $('[data-send]').addEventListener('click', () => {
      if (!sel.size) { toast('Choisissez au moins un soin.'); $('[data-picks]').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      if (!check(f)) return;
      const s = $('[name=slot]:checked', f); if (!s) { toast('Ce jour est complet : choisissez un autre jour.'); return; }
      const items = [...sel].map((id) => byId[id]);
      wa(`Bonjour ${"Institut Ivora"}, je souhaite réserver :\n${items.map((x) => `• ${x.t} (${dur(x.m)}) — ${fcfa(x.p)}`).join('\n')}\nLe ${fday(days[+f.jour.value])} à ${s.value.replace(':', ' h ')}\nTotal estimé : ${fcfa(items.reduce((a, x) => a + x.p, 0))}${f.msg.value ? '\nPrécision : ' + f.msg.value : ''}\n\n${f.nom.value} · ${f.tel.value}`);
      toast('Merci ' + f.nom.value + ' ! Votre demande s\'ouvre dans WhatsApp.');
    });
  }

  // Bon cadeau : aperçu en direct
  const g = $('[data-gift]');
  if (g) {
    const C = (k, v) => ($(`[data-c="${k}"]`).textContent = v);
    const sync = () => { C('val', g.val.value); C('pour', g.pour.value || '…'); C('de', g.de.value || '…'); C('mot', g.mot.value || 'Un moment rien qu\'à toi'); };
    g.addEventListener('input', sync); g.addEventListener('change', sync); sync();
    g.addEventListener('submit', (e) => {
      e.preventDefault(); if (!check(g)) return;
      wa(`Bonjour ${"Institut Ivora"}, je souhaite offrir un bon cadeau.\nValeur : ${g.val.value}\nPour : ${g.pour.value}\nDe la part de : ${g.de.value}${g.mot.value ? '\nMessage : « ' + g.mot.value + ' »' : ''}\nRemise : ${g.remise.value}\n\nMon numéro : ${g.tel.value}`);
      toast('Votre commande s\'ouvre dans WhatsApp.');
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
    wa(`Bonjour ${"Institut Ivora"},\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`);
    toast('Votre message s\'ouvre dans WhatsApp.');
  });
})();
