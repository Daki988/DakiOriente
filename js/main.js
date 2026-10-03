/* =========================================================
   NEAM SOFTWARES INDUSTRY — Interactions
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- En-tête ---------- */
  const header = $('.header');
  const toggle = $('.nav-toggle');
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const setMenu = open => {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Fermer' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
  $$('.nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Titres ligne par ligne ---------- */
  $$('.lines').forEach(el => $$('.line > span', el).forEach((s, i) => s.style.setProperty('--i', i)));

  /* ---------- Apparitions au défilement (démarrent après le chargement) ---------- */
  const groups = new Map();
  $$('.reveal').forEach(el => {
    const i = groups.get(el.parentElement) || 0;
    groups.set(el.parentElement, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 5) * 0.08}s`);
  });
  const startReveal = () => {
    const targets = $$('.reveal, .lines');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      targets.forEach(el => io.observe(el));
    } else {
      targets.forEach(el => el.classList.add('is-in'));
    }
  };

  /* ---------- Animation de chargement : du cahier à l'IA ---------- */
  const loader = $('#loader');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!loader || reduce) {
    startReveal();
  } else {
    document.body.classList.add('is-loading');
    // Version complète à la première visite, version courte ensuite
    let quick = false;
    try { quick = sessionStorage.getItem('neam-loader') === '1'; sessionStorage.setItem('neam-loader', '1'); } catch (e) { /* stockage indisponible */ }
    const icons = $$('.loader__icon', loader);
    const label = $('#loaderLabel');
    const bar = $('#loaderBar');
    const LABELS = ['Le cahier', 'Le tableur', 'Le site web', 'Le mobile', 'L’intelligence artificielle'];
    const STEP = quick ? 110 : 320;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      loader.classList.add('is-done');
      document.body.classList.remove('is-loading');
      startReveal();
      setTimeout(() => loader.remove(), 900);
    };
    const showLogo = () => {
      loader.classList.add('is-logo');
      bar.style.width = '100%';
      setTimeout(finish, quick ? 250 : 650);
    };
    let i = 0;
    const next = () => {
      icons.forEach((ic, j) => ic.classList.toggle('is-on', j === i));
      label.textContent = LABELS[i];
      bar.style.width = `${((i + 1) / (icons.length + 1)) * 100}%`;
      i++;
      setTimeout(i < icons.length ? next : showLogo, STEP);
    };
    next();
    setTimeout(finish, 5000); // sécurité
  }

  /* ---------- Accordéon des expertises ---------- */
  $$('.acc__item').forEach(item => {
    const btn = $('.acc__btn', item);
    const panel = $('.acc__panel', item);
    const sync = () => {
      const open = item.classList.contains('is-open');
      btn.setAttribute('aria-expanded', String(open));
      panel.inert = !open;
    };
    btn.addEventListener('click', () => { item.classList.toggle('is-open'); sync(); });
    sync();
  });
  // Ouvre l'expertise visée par l'ancre (ex. services.html#ia-automatisation)
  const openFromHash = () => {
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains('acc__item') && !target.classList.contains('is-open')) $('.acc__btn', target).click();
  };
  openFromHash();
  addEventListener('hashchange', openFromHash);

  /* ---------- Formulaire de contact ---------- */
  const form = $('#contactForm');
  if (!form) return;
  const status = $('#formStatus');
  const select = $('#besoin');
  const wanted = new URLSearchParams(location.search).get('besoin');
  if (wanted) {
    const opt = [...select.options].find(o => o.value && o.value.toLowerCase().startsWith(wanted.toLowerCase()));
    if (opt) select.value = opt.value;
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    $$('input, select, textarea', form).forEach(f => {
      const ok = f.checkValidity();
      f.closest('.field').classList.toggle('is-invalid', !ok);
      if (!ok) valid = false;
    });
    if (!valid) {
      status.textContent = 'Merci d’indiquer votre nom, un e-mail valide, votre besoin et un message.';
      status.classList.add('is-error');
      return;
    }
    status.classList.remove('is-error');
    const d = new FormData(form);
    const company = d.get('entreprise') ? ` (${d.get('entreprise')})` : '';
    const subject = encodeURIComponent(`[Site NEAM] ${d.get('besoin')} — ${d.get('nom')}${company}`);
    const body = encodeURIComponent(
      `Nom : ${d.get('nom')}\nEntreprise : ${d.get('entreprise') || '-'}\nEmail : ${d.get('email')}\nTéléphone : ${d.get('telephone') || '-'}\nBesoin : ${d.get('besoin')}\n\n${d.get('message')}`
    );
    location.href = `mailto:contact@neamindustry.com?subject=${subject}&body=${body}`;
    status.textContent = 'Votre messagerie s’ouvre avec votre demande préremplie. Si rien ne s’ouvre, écrivez-nous à contact@neamindustry.com.';
  });
  $$('input, select, textarea', form).forEach(f =>
    f.addEventListener('input', () => f.closest('.field').classList.remove('is-invalid')));
})();
