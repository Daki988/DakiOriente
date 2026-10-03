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

  /* ---------- Apparitions au défilement ---------- */
  const groups = new Map();
  $$('.reveal').forEach(el => {
    const i = groups.get(el.parentElement) || 0;
    groups.set(el.parentElement, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 5) * 0.08}s`);
  });
  const targets = $$('.reveal, .lines');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(el => io.observe(el));
  } else {
    targets.forEach(el => el.classList.add('is-in'));
  }


  /* ---------- Animation « L'évolution » : pilotée par le défilement ---------- */
  const evo = $('#evolution');
  if (evo) {
    const scenes = $$('.sc', evo);
    const stepsEl = $$('.evo__step', evo);
    const bar = $('#evoBar');
    // Valeurs d'illustration par étape (en %)
    const METERS = { vis: [5, 12, 55, 80, 95], org: [10, 35, 45, 55, 95], time: [0, 15, 25, 40, 85] };
    const meters = $$('[data-meter]', evo);
    let current = -1;
    const setStage = i => {
      if (i === current) return;
      current = i;
      scenes.forEach((s, j) => s.classList.toggle('is-active', j === i));
      stepsEl.forEach((s, j) => s.classList.toggle('is-active', j === i));
      meters.forEach(m => { m.style.width = `${METERS[m.dataset.meter][i]}%`; });
    };
    const progress = () => {
      const r = evo.getBoundingClientRect();
      const total = r.height - innerHeight;
      return Math.min(1, Math.max(0, -r.top / total));
    };
    const onEvoScroll = () => {
      const p = progress();
      bar.style.width = `${(p * 100).toFixed(1)}%`;
      setStage(Math.min(scenes.length - 1, Math.floor(p * scenes.length)));
    };
    addEventListener('scroll', onEvoScroll, { passive: true });
    addEventListener('resize', onEvoScroll);
    onEvoScroll();
    // Un clic sur une étape fait défiler jusqu'à elle
    $$('[data-evo]', evo).forEach(btn => btn.addEventListener('click', () => {
      const i = +btn.dataset.evo;
      const top = evo.getBoundingClientRect().top + scrollY;
      const total = evo.offsetHeight - innerHeight;
      scrollTo({ top: top + total * ((i + 0.5) / scenes.length), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }));
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
