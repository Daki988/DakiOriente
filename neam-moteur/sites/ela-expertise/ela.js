// ELA Expertise : interactions (menu, FAQ, demande d'expertise, contact, galerie)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const AG = window.AG || {};
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${AG.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  const mail = (subject, t) => { location.href = `mailto:${AG.mail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(t)}`; };

  function toast(t) {
    let el = $('.ela-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'ela-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#0B2540;color:#fff;padding:14px 20px;border-radius:10px;font:600 15px Inter,Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s';
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

  // En-tête : ombre au défilement, menu mobile
  const hd = $('.hd'), burger = $('.burger');
  addEventListener('scroll', () => hd.classList.toggle('solid', scrollY > 30), { passive: true });
  burger.addEventListener('click', () => { const o = hd.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });

  // Icônes officielles des réseaux
  const icon = (n, s = 18) => (window.brandSvg ? window.brandSvg(n, s) : '');
  $$('[data-soc]').forEach((el) => (el.innerHTML = ['facebook', 'linkedin', 'instagram', 'tiktok'].map((n) => `<a href="../../social.html?slug=${AG.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${AG.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));
  $$('[data-wa-ic]').forEach((b) => b.insertAdjacentHTML('afterbegin', icon('whatsapp', 18)));

  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .srv>a, .cas>div, .met .tx, .exp article, .mth>div, .gal button, .info>div, .cta').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // FAQ : une seule réponse ouverte à la fois
  $$('.qs details').forEach((d) => d.addEventListener('toggle', () => { if (d.open) $$('.qs details').forEach((o) => o !== d && (o.open = false)); }));

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

  // Demande d'expertise : récapitulatif en direct, envoi par e-mail ou WhatsApp
  const f = $('[data-req]');
  if (f) {
    const TYPE = { immobiliere: 'villa', immobilisations: 'entreprise', entreprise: 'entreprise', risques: 'immeuble', amo: 'immeuble', patrimoine: 'villa', 'risk-management': 'immeuble' };
    const OBJ = { immobilisations: 'Bilan comptable', entreprise: 'Autre', risques: 'Assurance' };
    const t = qs.get('type');
    if (TYPE[t]) $(`[data-k="${TYPE[t]}"]`, f).checked = true;
    if (OBJ[t]) $(`[name=objet][value="${OBJ[t]}"]`, f).checked = true;
    const S = (k, v) => ($(`[data-s="${k}"]`).textContent = v);
    const docs = () => $$('[name=docs]:checked', f).map((x) => x.value);
    const sync = () => {
      S('bien', f.bien.value); S('lieu', f.lieu.value || 'À préciser'); S('objet', f.objet.value);
      S('docs', docs().join(', ') || 'Aucun pour l\'instant'); S('delai', f.delai.value);
    };
    f.addEventListener('input', sync); f.addEventListener('change', sync); sync();
    const text = () => `Bonjour, je souhaite une expertise.\nBien : ${f.bien.value}\nLieu : ${f.lieu.value}${f.surface.value ? `\nSurface : ${f.surface.value}` : ''}\nObjet : ${f.objet.value}\nDocuments disponibles : ${docs().join(', ') || 'aucun pour l\'instant'}\nÉchéance : ${f.delai.value}${f.msg.value ? `\nPrécisions : ${f.msg.value}` : ''}\n\n${f.nom.value} · ${f.tel.value}${f.mail.value ? ' · ' + f.mail.value : ''}`;
    $$('[data-send]').forEach((b) => b.addEventListener('click', () => {
      if (!check(f)) return;
      if (b.dataset.send === 'wa') { wa(text()); toast('Votre demande s\'ouvre dans WhatsApp.'); } else { mail(`Demande d'expertise · ${f.bien.value} · ${f.lieu.value}`, text()); toast('Votre messagerie s\'ouvre avec la demande prête à envoyer.'); }
    }));
  }

  // Contact
  const ct = $('[data-contact]');
  if (ct) ct.addEventListener('submit', (e) => {
    e.preventDefault(); if (!check(ct)) return;
    mail(`${ct.objet.value} · ${ct.nom.value}`, `${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`);
    toast('Merci ! Votre messagerie s\'ouvre avec le message prêt à envoyer.');
  });
})();
