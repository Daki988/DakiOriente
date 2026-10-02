/* =========================================================
   NEAM SOFTWARES INDUSTRY — Interactions
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const clamp01 = v => Math.min(1, Math.max(0, v));

  /* ---------- Boot sequence ---------- */
  const boot = $('#boot');
  const bootLog = $('#bootLog');
  const bootBar = $('#bootBar');
  let booted = false;
  const finishBoot = () => {
    if (booted) return;
    booted = true;
    boot.classList.add('is-done');
    document.body.classList.remove('is-booting');
  };
  const runBoot = async () => {
    if (reduceMotion) return finishBoot();
    document.body.classList.add('is-booting');
    const lines = [
      'NEAM OS · initialisation',
      'Module DIGITAL & WEB',
      'Module LOGICIELS & OUTILS',
      'Module IA & AUTOMATISATION',
      'Module CONSEIL & FORMATION',
    ];
    for (let i = 0; i < lines.length; i++) {
      if (booted) return;
      bootLog.innerHTML += `${lines[i]} <span class="ok">[OK]</span>\n`;
      bootBar.style.width = `${((i + 1) / lines.length) * 100}%`;
      await wait(170);
    }
    await wait(250);
    finishBoot();
  };
  runBoot();
  setTimeout(finishBoot, 4000); // safety net

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Clock (Libreville, UTC+1) ---------- */
  const clock = $('#clock');
  const tick = () => {
    try {
      clock.textContent = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Libreville', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());
    } catch { clock.textContent = new Date().toLocaleTimeString('fr-FR'); }
  };
  tick(); setInterval(tick, 1000);

  /* ---------- Nav ---------- */
  const nav = $('#nav');
  const toggle = $('#navToggle');
  const setMenu = open => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  const links = $$('#navLinks a:not(.btn)');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id]').forEach(s => spy.observe(s));

  /* ---------- Text scramble (decoding effect) ---------- */
  const GLYPHS = '▲◆#%&*+=/\\<>01ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const scramble = el => {
    const final = el.dataset.text || el.textContent;
    el.dataset.text = final;
    if (reduceMotion) { el.textContent = final; return; }
    let frame = 0;
    const total = 26;
    const run = () => {
      const revealed = Math.floor((frame / total) * final.length);
      let out = '';
      for (let i = 0; i < final.length; i++) {
        const ch = final[i];
        out += i < revealed || ch === ' ' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (frame++ < total) requestAnimationFrame(run);
      else el.textContent = final;
    };
    run();
  };

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
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      if (e.target.hasAttribute('data-scramble')) scramble(e.target);
      $$('[data-scramble]', e.target).forEach(scramble);
      revealer.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => revealer.observe(el));

  /* ---------- Count-up ---------- */
  const countUp = (el, end, suffix = '', dur = 1500, pad = 0) => {
    if (reduceMotion) { el.textContent = String(end).padStart(pad, '0') + suffix; return; }
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3)))).padStart(pad, '0') + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      countUp(e.target, +e.target.dataset.count, e.target.dataset.suffix || '', 1600);
      counterObs.unobserve(e.target);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach(el => counterObs.observe(el));

  /* ---------- Scroll-driven effects ---------- */
  const progress = $('.scroll-progress');
  const steps = $('#steps');
  const stepItems = $$('.step', steps);
  const month = $('#month');
  const monthFill = $('#monthFill');
  const dayCount = $('#dayCount');
  const weekDots = $$('.month__track i', month);
  const weeks = $$('.week', month);

  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('is-scrolled', y > 40);

    // Method: fill line and light steps
    const sr = steps.getBoundingClientRect();
    const sf = clamp01((innerHeight * 0.6 - sr.top) / sr.height);
    steps.style.setProperty('--fill', `${(sf * 100).toFixed(1)}%`);
    stepItems.forEach(s => {
      const r = s.getBoundingClientRect();
      s.classList.toggle('is-on', r.top + 30 < innerHeight * 0.6);
    });

    // Programme: 30-day progress
    const mr = month.getBoundingClientRect();
    const mf = clamp01((innerHeight * 0.75 - mr.top) / (mr.height * 0.9));
    monthFill.style.width = `${(mf * 100).toFixed(1)}%`;
    const day = Math.round(mf * 30);
    dayCount.textContent = String(day).padStart(2, '0');
    weekDots.forEach((d, i) => d.classList.toggle('is-on', mf >= i / 4 - 0.001 && mf > 0));
    weeks.forEach((w, i) => w.classList.toggle('is-on', mf > i / 4));
  };
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Deliverables checklist ---------- */
  const checklist = $('#checklist');
  new IntersectionObserver(async (entries, o) => {
    if (!entries[0].isIntersecting) return;
    o.disconnect();
    for (const li of $$('li', checklist)) {
      li.classList.add('is-done');
      if (!reduceMotion) await wait(180);
    }
  }, { threshold: 0.35 }).observe(checklist);

  /* ---------- Pôles: tabs + auto-cycle ---------- */
  const polesWrap = $('.poles__wrap');
  const tabs = $$('.pole-tab');
  const panels = $$('.console__panel');
  const consolePath = $('#consolePath');
  const paths = { web: 'digital-web', soft: 'logiciels-outils', ai: 'ia-automatisation', consult: 'conseil-formation' };
  const CYCLE = 7000;
  polesWrap.style.setProperty('--cycle', `${CYCLE}ms`);
  let current = 0, cycleTimer = null, paused = false, polesVisible = false, userPicked = false;

  const animateTicks = panel => $$('[data-tick]', panel).forEach(el => countUp(el, +el.dataset.tick, el.dataset.suffix || '', 1400));
  const selectPole = (i, focus = false) => {
    current = i;
    tabs.forEach((t, j) => {
      const on = j === i;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      // restart progress bar animation
      const bar = $('.pole-tab__bar span', t);
      bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    });
    panels.forEach((p, j) => {
      const on = j === i;
      p.hidden = !on;
      p.classList.remove('is-active');
      if (on) { void p.offsetWidth; p.classList.add('is-active'); }
    });
    $$('.caps li', panels[i]).forEach((li, k) => li.style.setProperty('--i', k));
    consolePath.textContent = `neam://poles/${paths[tabs[i].dataset.pole]}`;
    animateTicks(panels[i]);
    if (focus) tabs[i].focus();
    schedule();
  };
  const schedule = () => {
    clearTimeout(cycleTimer);
    if (reduceMotion || userPicked || paused || !polesVisible) return;
    cycleTimer = setTimeout(() => selectPole((current + 1) % tabs.length), CYCLE);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { userPicked = true; polesWrap.classList.add('is-paused'); selectPole(i); });
    t.addEventListener('keydown', e => {
      const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!k) return;
      e.preventDefault();
      userPicked = true; polesWrap.classList.add('is-paused');
      selectPole((i + k + tabs.length) % tabs.length, true);
    });
  });
  polesWrap.addEventListener('pointerenter', () => { paused = true; polesWrap.classList.add('is-paused'); clearTimeout(cycleTimer); });
  polesWrap.addEventListener('pointerleave', () => {
    paused = false;
    if (!userPicked) { polesWrap.classList.remove('is-paused'); selectPole(current); }
  });
  new IntersectionObserver(e => {
    const was = polesVisible;
    polesVisible = e[0].isIntersecting;
    if (polesVisible && !was) selectPole(current); else if (!polesVisible) clearTimeout(cycleTimer);
  }, { threshold: 0.3 }).observe(polesWrap);
  selectPole(0);

  /* ---------- Pointer effects ---------- */
  if (finePointer && !reduceMotion) {
    const glow = $('.cursor-glow');
    addEventListener('pointermove', e => {
      glow.style.transform = `translate(${e.clientX - 260}px, ${e.clientY - 260}px)`;
    }, { passive: true });

    $$('.tilt').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 7}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    $$('.magnetic').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  } else {
    $('.cursor-glow').style.display = 'none';
  }

  /* ---------- Hero: 3D data globe ---------- */
  const canvas = $('#globe');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0, R = 0, cx = 0, cy = 0;
  let points = [], arcs = [], stars = [];
  let rotY = 0, rotX = -0.35, targetRX = -0.35, targetRY = 0;

  const fib = n => {
    const pts = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      pts.push({ x: Math.cos(ga * i) * r, y, z: Math.sin(ga * i) * r, gold: Math.random() < 0.08 });
    }
    return pts;
  };
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.min(W, H) * (W < 700 ? 0.42 : 0.36);
    cx = W / 2; cy = H * 0.48;
    points = fib(W < 700 ? 380 : 620);
    arcs = Array.from({ length: 7 }, () => ({
      a: points[(Math.random() * points.length) | 0],
      b: points[(Math.random() * points.length) | 0],
      t: Math.random(), speed: 0.004 + Math.random() * 0.004,
    }));
    stars = Array.from({ length: Math.floor((W * H) / 9000) }, () => ({ x: Math.random() * W, y: Math.random() * H, a: Math.random() * 0.5 + 0.1 }));
  };
  const project = (p, sy, cyR, sx, cxR) => {
    // rotate around Y then X
    const x1 = p.x * cyR - p.z * sy;
    const z1 = p.x * sy + p.z * cyR;
    const y2 = p.y * cxR - z1 * sx;
    const z2 = p.y * sx + z1 * cxR;
    const persp = 1 / (1.9 - z2 * 0.5);
    return { x: cx + x1 * R * persp * 1.3, y: cy + y2 * R * persp * 1.3, z: z2 };
  };
  const slerpPoint = (a, b, t, lift) => {
    let x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t, z = a.z + (b.z - a.z) * t;
    const len = Math.hypot(x, y, z) || 1;
    const h = 1 + Math.sin(Math.PI * t) * lift;
    return { x: (x / len) * h, y: (y / len) * h, z: (z / len) * h };
  };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) { ctx.fillStyle = `rgba(255,255,255,${s.a * 0.5})`; ctx.fillRect(s.x, s.y, 1, 1); }

    rotY += 0.0022;
    rotX += (targetRX - rotX) * 0.04;
    const ry = rotY + targetRY;
    const sy = Math.sin(ry), cyR = Math.cos(ry), sx = Math.sin(rotX), cxR = Math.cos(rotX);

    // halo
    const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.5);
    g.addColorStop(0, 'rgba(245,179,27,0.07)'); g.addColorStop(1, 'rgba(245,179,27,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2); ctx.fill();

    // orbit rings
    ctx.lineWidth = 1;
    for (let k = 0; k < 2; k++) {
      ctx.strokeStyle = k ? 'rgba(47,211,224,0.18)' : 'rgba(245,179,27,0.16)';
      ctx.beginPath();
      for (let a = 0; a <= 64; a++) {
        const t = (a / 64) * Math.PI * 2;
        const rr = 1.28 + k * 0.16;
        const tilt = k ? 0.5 : -0.3;
        const p = project({ x: Math.cos(t) * rr, y: Math.sin(t) * rr * Math.sin(tilt), z: Math.sin(t) * rr * Math.cos(tilt) }, sy, cyR, sx, cxR);
        a ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // points
    for (const p of points) {
      const q = project(p, sy, cyR, sx, cxR);
      const front = (q.z + 1) / 2;
      if (p.gold) {
        ctx.fillStyle = `rgba(245,179,27,${0.25 + front * 0.75})`;
        ctx.fillRect(q.x - 1.5, q.y - 1.5, 3, 3);
      } else {
        ctx.fillStyle = `rgba(230,235,240,${0.06 + front * 0.5})`;
        ctx.fillRect(q.x - 0.8, q.y - 0.8, 1.6, 1.6);
      }
    }

    // data arcs with travelling packets
    for (const arc of arcs) {
      arc.t += arc.speed;
      if (arc.t > 1.4) {
        arc.a = points[(Math.random() * points.length) | 0];
        arc.b = points[(Math.random() * points.length) | 0];
        arc.t = 0;
      }
      ctx.beginPath();
      for (let s = 0; s <= 30; s++) {
        const q = project(slerpPoint(arc.a, arc.b, s / 30, 0.35), sy, cyR, sx, cxR);
        s ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
      }
      ctx.strokeStyle = 'rgba(47,211,224,0.22)';
      ctx.stroke();
      const tt = Math.min(1, arc.t);
      const head = project(slerpPoint(arc.a, arc.b, tt, 0.35), sy, cyR, sx, cxR);
      ctx.fillStyle = '#f5b31b';
      ctx.shadowColor = '#f5b31b'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(head.x, head.y, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  };
  let heroVisible = true;
  new IntersectionObserver(e => { heroVisible = e[0].isIntersecting; }).observe(canvas);
  const loop = () => { if (heroVisible) draw(); requestAnimationFrame(loop); };
  resize();
  addEventListener('resize', resize);
  canvas.parentElement.addEventListener('pointermove', e => {
    const nx = e.clientX / innerWidth - 0.5;
    const ny = e.clientY / innerHeight - 0.5;
    targetRY = nx * 0.8;
    targetRX = -0.35 + ny * 0.5;
  });
  if (reduceMotion) draw(); else loop();

  /* ---------- Pre-fill service from CTA ---------- */
  const serviceSelect = $('#f-service');
  $$('[data-service]').forEach(a => a.addEventListener('click', () => { serviceSelect.value = a.dataset.service; }));

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
    if (!valid) { status.textContent = 'Merci de renseigner votre nom, un email valide, votre besoin et un message.'; return; }

    const d = new FormData(form);
    const subject = encodeURIComponent(`[NEAM] ${d.get('service')} — ${d.get('name')}${d.get('company') ? ' (' + d.get('company') + ')' : ''}`);
    const body = encodeURIComponent(`Nom : ${d.get('name')}\nEntreprise : ${d.get('company') || '-'}\nEmail : ${d.get('email')}\nBesoin : ${d.get('service')}\n\n${d.get('message')}`);
    window.location.href = `mailto:contact@neamindustry.com?subject=${subject}&body=${body}`;
    status.textContent = 'Votre messagerie s’ouvre avec la demande préremplie. Si rien ne s’ouvre, écrivez-nous à contact@neamindustry.com.';
  });
  $$('input, textarea, select', form).forEach(f =>
    f.addEventListener('input', () => f.closest('.field').classList.remove('is-invalid')));
})();
