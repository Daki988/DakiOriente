// Asian Auto Gabon : interactions (menu, catalogue, demande de pièce par n° de châssis, galerie, contact)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const AG = window.AG || {};
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${AG.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');

  function toast(t) {
    let el = $('.ag-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'ag-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#111317;color:#fff;padding:14px 20px;border-radius:8px;font:600 15px Inter,Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border-left:5px solid #D62828';
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
  document.addEventListener('input', (e) => e.target.closest?.('.fld')?.classList.remove('bad'));

  // En-tête et menu mobile
  const hd = $('.hd'), burger = $('.burger');
  addEventListener('scroll', () => hd.classList.toggle('solid', scrollY > 20), { passive: true });
  if (burger) burger.addEventListener('click', () => { const o = hd.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });

  // Réseaux
  const icon = (n, s = 18) => (window.brandSvg ? window.brandSvg(n, s) : '');
  $$('[data-soc]').forEach((el) => (el.innerHTML = ['facebook', 'linkedin', 'instagram', 'tiktok'].map((n) => `<a href="../../social.html?slug=${AG.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));

  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .grid>*, .avis figure, .info>div').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // ---- Catalogue : onglets (avec #famille dans l'adresse) ----
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

  // ---- Demande de pièce ----
  const dv = $('[data-devis]');
  if (dv) {
    const plist = $('[data-plist]');
    let n = 0;
    const addRow = (val = '') => {
      n++;
      const row = document.createElement('div'); row.className = 'prow';
      row.innerHTML = `<label class="fld"><span>Pièce ${plist.children.length + 1}</span><input name="p${n}" placeholder="Ex. : plaquettes avant"></label><label class="fld"><span>Qté</span><input name="q${n}" type="number" min="1" max="99" value="1" inputmode="numeric"></label><button type="button" aria-label="Retirer cette pièce">×</button>`;
      $('input', row).value = val;
      $('button', row).addEventListener('click', () => { if (plist.children.length > 1) { row.remove(); renum(); upd(); } else { $('input', row).value = ''; upd(); } });
      plist.appendChild(row); return row;
    };
    const renum = () => $$('.prow', plist).forEach((r, i) => ($('span', r).textContent = `Pièce ${i + 1}`));
    const parts = () => $$('.prow', plist).map((r) => { const [p, q] = $$('input', r); return [p.value.trim(), Math.max(1, +q.value || 1)]; }).filter(([p]) => p);

    // Préremplissage depuis la recherche rapide ou le catalogue
    const mq = qs.get('marque');
    if (mq) { const r = $$('input[name="marque"]', dv).find((i) => i.value === mq); if (r) r.checked = true; }
    addRow(qs.get('piece') || '');
    if (qs.get('vin')) dv.vin.value = qs.get('vin').toUpperCase().slice(0, 17);
    $('[data-addp]').addEventListener('click', () => { $('input', addRow()).focus(); upd(); });

    // Numéro de châssis : 17 caractères, sans I, O ni Q
    const vinState = () => {
      const v = dv.vin.value.toUpperCase().replace(/\s/g, ''); const em = $('[data-vin-state]');
      if (dv.vin.value !== v) dv.vin.value = v;
      if (!v) { em.textContent = '(facultatif)'; em.className = ''; return true; }
      if (/[IOQ]/.test(v)) { em.textContent = 'Les lettres I, O et Q n\'existent pas'; em.className = 'ko'; return false; }
      if (!/^[A-Z0-9]+$/.test(v)) { em.textContent = 'Lettres et chiffres seulement'; em.className = 'ko'; return false; }
      if (v.length < 17) { em.textContent = `${v.length} / 17`; em.className = 'ko'; return false; }
      em.textContent = '✓ Format valide'; em.className = 'ok'; return true;
    };
    const val = (name) => $(`input[name="${name}"]:checked`, dv)?.value || '';
    const veh = () => [val('marque'), dv.modele.value.trim(), dv.annee.value, dv.moteur.value].filter(Boolean).join(' · ');
    const set = (k, t) => ($(`[data-s="${k}"]`).textContent = t);
    function upd() {
      vinState();
      set('veh', dv.modele.value.trim() ? veh() : val('marque') + ' · modèle à préciser');
      set('vin', dv.vin.value || 'non renseigné');
      const p = parts(); set('nb', p.length ? p.reduce((s, [, q]) => s + q, 0) + ' (' + p.length + ' référence' + (p.length > 1 ? 's' : '') + ')' : 'aucune');
      set('rec', val('rec'));
      $('[data-mail]').href = `mailto:${AG.mail || 'magasin@asianauto-gabon.com'}?subject=${encodeURIComponent('Demande de pièce : ' + veh())}&body=${encodeURIComponent(text())}`;
    }
    const text = () => {
      const p = parts();
      return `Bonjour Asian Auto Gabon, je cherche des pièces d'origine.\n\nVéhicule : ${veh()}\nN° de châssis : ${dv.vin.value || 'non renseigné'}\n\nPièces :\n${p.map(([t, q]) => `- ${t} × ${q}`).join('\n') || '- à préciser'}\n\nRéception : ${val('rec')}\n${dv.nom.value} · ${dv.tel.value}`;
    };
    dv.addEventListener('input', upd); dv.addEventListener('change', upd); upd();

    $('[data-send]').addEventListener('click', () => {
      if (!check(dv)) return;
      if (!vinState()) { dv.vin.closest('.fld').classList.add('bad'); dv.vin.focus(); toast('Vérifiez le numéro de châssis, ou laissez-le vide.'); return; }
      if (!parts().length) { const i = $('.prow input', plist); i.closest('.fld').classList.add('bad'); i.focus(); toast('Indiquez au moins une pièce.'); return; }
      wa(text());
      toast('Votre demande s\'ouvre dans WhatsApp. Réponse avec prix et délai.');
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
    wa(`Bonjour Asian Auto Gabon,\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`);
    toast('Votre message s\'ouvre dans WhatsApp.');
  });
})();
