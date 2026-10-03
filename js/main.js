/* =========================================================
   NEAM SOFTWARES INDUSTRY — Interactions (volontairement légères)
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Année du pied de page ---------- */
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- En-tête : ombre au défilement + menu mobile ---------- */
  const header = $('.header');
  const toggle = $('.nav-toggle');
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = open => {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  };
  toggle.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
  $$('.nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Apparition douce au défilement ---------- */
  const groups = new Map();
  $$('.reveal').forEach(el => {
    const i = groups.get(el.parentElement) || 0;
    groups.set(el.parentElement, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 5) * 0.07}s`);
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-in'));
  }


  /* ---------- « Où en est votre entreprise ? » ---------- */
  const levels = $$('.level');
  levels.forEach((btn, i) => btn.addEventListener('click', () => {
    levels.forEach((b, j) => {
      const on = i === j;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
      $('#lvl-' + j).hidden = !on;
    });
  }));

  /* ---------- Formulaire de contact ---------- */
  const form = $('#contactForm');
  if (!form) return;
  const status = $('#formStatus');
  const select = $('#besoin');

  // Pré-sélection du besoin depuis l'URL (ex. contact.html?besoin=GuruTools)
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
      status.textContent = 'Merci d’indiquer votre nom, un email valide, votre besoin et un message.';
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
