/* =========================================================
   NEAM SOFTWARES INDUSTRY — Interactions
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Preloader ---------- */
  document.body.classList.add('is-loading');
  const hidePreloader = () => {
    $('#preloader').classList.add('is-done');
    document.body.classList.remove('is-loading');
  };
  window.addEventListener('load', () => setTimeout(hidePreloader, 600));
  setTimeout(hidePreloader, 3500); // safety net

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Nav ---------- */
  const nav = $('#nav');
  const toggle = $('#navToggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }));

  // Active link per section
  const links = $$('#navLinks a:not(.btn)');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id]').forEach(s => spy.observe(s));

  /* ---------- Scroll-driven effects ---------- */
  const progress = $('.scroll-progress');
  const timeline = $('.timeline');
  const manifesto = $('#manifestoText');

  // Split manifesto into words for the scroll highlight
  const highlights = ['technologie', 'personnes.', 'impact', 'mesurable.', 'idée'];
  manifesto.innerHTML = manifesto.textContent.trim().split(/\s+/).map(w => {
    const hl = highlights.includes(w.toLowerCase()) ? ' hl' : '';
    return `<span class="w${hl}">${w}</span>`;
  }).join(' ');
  const words = $$('.w', manifesto);

  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('is-scrolled', y > 40);

    // Manifesto: light words progressively
    const r = manifesto.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));

    // Timeline fill
    const t = timeline.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (innerHeight * 0.75 - t.top) / t.height));
    timeline.style.setProperty('--fill', (f * 100).toFixed(1) + '%');
  };
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const groups = new Map();
  $$('.reveal').forEach(el => {
    const parent = el.parentElement;
    const i = groups.get(parent) || 0;
    groups.set(parent, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 6) * 0.08}s`);
  });
  const revealer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealer.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => revealer.observe(el));

  /* ---------- Counters ---------- */
  const counter = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      const dur = 1600;
      const t0 = performance.now();
      const step = now => {
        const k = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suffix;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      counter.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => counter.observe(el));

  /* ---------- Typed words ---------- */
  const typed = $('#typed');
  const wordsToType = ['logiciels', 'applications', 'plateformes', 'expériences', 'solutions'];
  let wi = 0, ci = wordsToType[0].length, deleting = true;
  const type = () => {
    const word = wordsToType[wi];
    ci += deleting ? -1 : 1;
    typed.textContent = word.slice(0, ci);
    let delay = deleting ? 45 : 90;
    if (!deleting && ci === word.length) { deleting = true; delay = 2000; }
    else if (deleting && ci === 0) { deleting = false; wi = (wi + 1) % wordsToType.length; delay = 300; }
    setTimeout(type, delay);
  };
  if (!reduceMotion) setTimeout(type, 2600);

  /* ---------- Terminal ---------- */
  const term = $('#terminal');
  const script = [
    ['p', '$ '], ['', 'neam init --project "votre-idee"\n'],
    ['c', '  ▲ Analyse des besoins...\n'],
    ['ok', '  ✔ '], ['', 'Architecture générée\n'],
    ['p', '$ '], ['', 'neam build --stack modern --secure\n'],
    ['ok', '  ✔ '], ['', 'Tests passés · Performance optimisée\n'],
    ['p', '$ '], ['', 'neam deploy --env production\n'],
    ['ok', '  ✔ '], ['', 'En ligne. Impact : '], ['p', 'ACTIVÉ ▲\n'],
  ];
  let termStarted = false;
  const runTerminal = async () => {
    if (termStarted) return;
    termStarted = true;
    for (const [cls, text] of script) {
      const span = document.createElement('span');
      if (cls) span.className = cls;
      term.appendChild(span);
      const instant = cls !== '' || reduceMotion;
      if (instant) { span.textContent = text; await wait(cls === 'c' ? 500 : 120); continue; }
      for (const ch of text) { span.textContent += ch; await wait(28); }
      await wait(250);
    }
  };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  new IntersectionObserver((entries, o) => {
    if (entries[0].isIntersecting) { runTerminal(); o.disconnect(); }
  }, { threshold: 0.4 }).observe(term);

  /* ---------- Pointer effects ---------- */
  if (finePointer && !reduceMotion) {
    const glow = $('.cursor-glow');
    addEventListener('pointermove', e => {
      glow.style.transform = `translate(${e.clientX - 260}px, ${e.clientY - 260}px)`;
    }, { passive: true });

    // Card tilt + spotlight
    $$('.tilt').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    // Magnetic buttons
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  } else {
    $('.cursor-glow').style.display = 'none';
  }

  /* ---------- Hero network canvas ---------- */
  const canvas = $('#network');
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], dpr = Math.min(devicePixelRatio || 1, 2);
  const mouse = { x: -9999, y: -9999 };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(110, Math.floor((W * H) / 14000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6,
      gold: Math.random() < 0.18,
    }));
  };
  const LINK = 140;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      // gentle mouse attraction
      const dx = mouse.x - n.x, dy = mouse.y - n.y, d2 = dx * dx + dy * dy;
      if (d2 < 40000) { n.x += dx * 0.004; n.y += dy * 0.004; }
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
        if (d < LINK) {
          const alpha = (1 - d / LINK) * 0.35;
          ctx.strokeStyle = a.gold || b.gold ? `rgba(245,179,27,${alpha})` : `rgba(255,255,255,${alpha * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const md = Math.hypot(mouse.x - a.x, mouse.y - a.y);
      if (md < 180) {
        ctx.strokeStyle = `rgba(245,179,27,${(1 - md / 180) * 0.6})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
    for (const n of nodes) {
      ctx.fillStyle = n.gold ? '#f5b31b' : 'rgba(255,255,255,.7)';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.gold ? n.r + 0.8 : n.r, 0, Math.PI * 2); ctx.fill();
    }
  };
  let heroVisible = true;
  new IntersectionObserver(e => { heroVisible = e[0].isIntersecting; }).observe(canvas);
  const loop = () => { if (heroVisible) draw(); requestAnimationFrame(loop); };

  resize();
  addEventListener('resize', resize);
  canvas.parentElement.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  if (reduceMotion) draw(); else loop();

  /* ---------- Contact form ---------- */
  const form = $('#contactForm');
  const status = $('#formStatus');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    $$('input, textarea, select', form).forEach(f => {
      const ok = f.checkValidity();
      f.closest('.field').classList.toggle('is-invalid', !ok);
      if (!ok) valid = false;
    });
    if (!valid) { status.textContent = 'Merci de compléter correctement tous les champs.'; return; }

    const data = new FormData(form);
    const subject = encodeURIComponent(`[NEAM] ${data.get('service')} — ${data.get('name')}`);
    const body = encodeURIComponent(`Nom : ${data.get('name')}\nEmail : ${data.get('email')}\nProjet : ${data.get('service')}\n\n${data.get('message')}`);
    window.location.href = `mailto:contact@neam-softwares.com?subject=${subject}&body=${body}`;
    status.textContent = 'Merci ! Votre messagerie va s’ouvrir pour finaliser l’envoi. ▲';
    form.reset();
  });
  $$('input, textarea, select', form).forEach(f =>
    f.addEventListener('input', () => f.closest('.field').classList.remove('is-invalid')));
})();
