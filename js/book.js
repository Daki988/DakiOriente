/* =========================================================
   NEAM — Liseuse « livre » des ressources (Blueprint, Livre blanc)
   Double page sur ordinateur, page simple sur mobile,
   page qui tourne en 3D entre deux pages.
   Ouverture : un élément [data-book] avec data-pages, data-src (…{n}…), data-title, data-pdf.
   ========================================================= */
(() => {
  const triggers = document.querySelectorAll('[data-book]');
  if (!triggers.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = n => String(n).padStart(2, '0');
  let book = null, el = null, page = 0, busy = false, lastFocus = null;

  const isSpread = () => innerWidth >= 900 && innerHeight >= 520;
  const src = n => book.src.replace('{n}', pad(n));

  const build = () => {
    el = document.createElement('div');
    el.className = 'book';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = `
      <div class="book__bar">
        <span class="book__title"></span>
        <span class="book__count" aria-live="polite"></span>
        <div class="book__tools">
          <a class="book__btn book__dl" download>Télécharger le PDF</a>
          <button type="button" class="book__btn book__close" aria-label="Fermer la liseuse">Fermer ✕</button>
        </div>
      </div>
      <div class="book__stage">
        <button type="button" class="book__nav book__prev" aria-label="Page précédente">‹</button>
        <div class="book__spread"></div>
        <button type="button" class="book__nav book__next" aria-label="Page suivante">›</button>
      </div>
      <div class="book__progress"><i></i></div>
      <p class="book__hint">Touchez les bords, glissez ou utilisez les flèches du clavier pour tourner les pages.</p>`;
    document.body.appendChild(el);
    el.querySelector('.book__close').addEventListener('click', close);
    el.querySelector('.book__prev').addEventListener('click', () => turn(-1));
    el.querySelector('.book__next').addEventListener('click', () => turn(1));
    el.addEventListener('click', e => { if (e.target === el || e.target.classList.contains('book__stage')) close(); });
    // Glisser pour tourner (mobile)
    let x0 = null, y0 = null;
    el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) turn(dx < 0 ? 1 : -1);
      x0 = null;
    });
    // Toucher la moitié gauche / droite d'une page
    el.querySelector('.book__spread').addEventListener('click', e => {
      const r = e.currentTarget.getBoundingClientRect();
      turn(e.clientX - r.left < r.width / 2 ? -1 : 1);
    });
    addEventListener('resize', () => { if (el.classList.contains('is-open')) render(); });
  };

  // Pages visibles pour une position donnée
  // Double page : 0 = couverture seule à droite ; ensuite (2k, 2k+1) ; dernière page seule à gauche si paire.
  const view = p => {
    if (!isSpread()) return { left: null, right: p + 1 };
    if (p === 0) return { left: null, right: 1 };
    const l = p, r = p + 1 <= book.pages ? p + 1 : null;
    return { left: l, right: r };
  };
  const step = () => (isSpread() ? 2 : 1);
  const maxPos = () => (isSpread() ? (book.pages % 2 === 0 ? book.pages : book.pages - 1) : book.pages - 1);

  const pageEl = (n, cls) => {
    const d = document.createElement('div');
    d.className = `book__page ${cls}`;
    if (n) {
      const img = new Image();
      img.alt = `${book.title}, page ${n}`;
      img.decoding = 'async';
      img.src = src(n);
      d.appendChild(img);
    } else d.classList.add('is-empty');
    return d;
  };

  const render = () => {
    const sp = el.querySelector('.book__spread');
    const v = view(page);
    sp.classList.toggle('is-single', !isSpread());
    sp.style.setProperty('--ratio', book.ratio);
    sp.innerHTML = '';
    if (isSpread()) sp.append(pageEl(v.left, 'book__page--left'), pageEl(v.right, 'book__page--right'));
    else sp.append(pageEl(v.right, 'book__page--right'));
    const shown = [v.left, v.right].filter(Boolean);
    el.querySelector('.book__count').textContent = `Page ${shown.join('–')} / ${book.pages}`;
    el.querySelector('.book__prev').disabled = page <= 0;
    el.querySelector('.book__next').disabled = page >= maxPos();
    el.querySelector('.book__progress i').style.width = `${(Math.max(...shown) / book.pages) * 100}%`;
    // Préchargement des pages suivantes
    [1, 2, 3].forEach(k => { const n = Math.max(...shown) + k; if (n <= book.pages) new Image().src = src(n); });
  };

  // Tourner : une feuille 3D pivote autour de la reliure
  const turn = dir => {
    if (busy || !book) return;
    const next = page + dir * step();
    if (next < 0 || next > maxPos()) return;
    if (reduce) { page = next; render(); return; }
    busy = true;
    const sp = el.querySelector('.book__spread');
    const cur = view(page), nxt = view(next);
    const spread = isSpread();
    const leaf = document.createElement('div');
    leaf.className = `book__leaf ${dir > 0 ? 'is-forward' : 'is-back'}${spread ? '' : ' is-single'}`;
    if (spread) {
      // La feuille de droite (ou de gauche) se soulève et retombe de l'autre côté
      leaf.append(pageEl(dir > 0 ? cur.right : cur.left, 'book__face book__face--front'),
                  pageEl(dir > 0 ? nxt.left : nxt.right, 'book__face book__face--back'));
      const side = dir > 0 ? 'right' : 'left';
      sp.querySelector(`.book__page--${side}`).replaceWith(pageEl(dir > 0 ? nxt.right : nxt.left, `book__page--${side}`));
    } else if (dir > 0) {
      // Mobile : la page actuelle tourne et découvre la suivante
      leaf.append(pageEl(cur.right, 'book__face book__face--front'));
      sp.querySelector('.book__page--right').replaceWith(pageEl(nxt.right, 'book__page--right'));
    } else {
      // Mobile, retour : la page précédente revient se poser
      leaf.append(pageEl(nxt.right, 'book__face book__face--front'));
    }
    sp.appendChild(leaf);
    leaf.getBoundingClientRect();
    requestAnimationFrame(() => leaf.classList.add('is-turning'));
    const done = () => { if (!busy) return; page = next; busy = false; render(); };
    leaf.addEventListener('transitionend', e => { if (e.propertyName === 'transform') done(); });
    setTimeout(done, 1300);
  };

  const onKey = e => {
    if (!el || !el.classList.contains('is-open')) return;
    if (e.key === 'ArrowRight') turn(1);
    else if (e.key === 'ArrowLeft') turn(-1);
    else if (e.key === 'Escape') close();
  };

  const open = t => {
    if (!el) build();
    lastFocus = document.activeElement;
    book = { pages: +t.dataset.pages, src: t.dataset.src, title: t.dataset.title || 'Document', pdf: t.dataset.pdf || '', ratio: t.dataset.ratio || '0.71' };
    page = 0;
    el.querySelector('.book__title').textContent = book.title;
    const dl = el.querySelector('.book__dl');
    dl.href = book.pdf; dl.hidden = !book.pdf;
    render();
    el.classList.add('is-open');
    document.documentElement.classList.add('book-open');
    el.querySelector('.book__close').focus();
  };
  function close() {
    if (!el) return;
    el.classList.remove('is-open');
    document.documentElement.classList.remove('book-open');
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener('keydown', onKey);
  triggers.forEach(t => t.addEventListener('click', e => { e.preventDefault(); open(t); }));
})();
