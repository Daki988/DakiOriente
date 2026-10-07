/* TREMPLIN by NEAM — interactions (amélioration progressive : tout fonctionne aussi sans JS) */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const csrf = () => ($('meta[name="csrf-token"]') || {}).content || '';

  /* Menu mobile */
  $$('[data-menu-open]').forEach(b => b.addEventListener('click', () => {
    const m = $('#mobile-menu'); if (!m) return;
    m.classList.add('open'); b.setAttribute('aria-expanded', 'true');
    const first = $('a, button', m.querySelector('.panel')); first && first.focus();
  }));
  $$('[data-menu-close]').forEach(b => b.addEventListener('click', () => {
    const m = $('#mobile-menu'); m && m.classList.remove('open');
    $$('[data-menu-open]').forEach(x => x.setAttribute('aria-expanded', 'false'));
  }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const m = $('#mobile-menu.open'); if (m) m.classList.remove('open');
      $$('details.dropdown[open]').forEach(d => d.removeAttribute('open'));
    }
  });
  document.addEventListener('click', e => {
    $$('details.dropdown[open]').forEach(d => { if (!d.contains(e.target)) d.removeAttribute('open'); });
  });

  /* Toasts */
  $$('.toast').forEach((t, i) => {
    const close = () => { t.classList.add('out'); setTimeout(() => t.remove(), 260); };
    const btn = $('button', t); btn && btn.addEventListener('click', close);
    setTimeout(close, 5000 + i * 600);
  });
  window.tremplinToast = function (msg, type = 'success') {
    let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'alert alert-' + type + ' toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    box.appendChild(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260); }, 3500);
  };

  /* Afficher / masquer le mot de passe */
  $$('[data-pw-toggle]').forEach(b => b.addEventListener('click', () => {
    const input = b.parentElement.querySelector('input');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', show ? 'true' : 'false');
    b.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
  }));

  /* Confirmation des actions destructives */
  $$('form[data-confirm]').forEach(f => f.addEventListener('submit', e => {
    if (!window.confirm(f.dataset.confirm)) e.preventDefault();
  }));

  /* État de chargement sur les boutons de soumission */
  $$('form').forEach(f => f.addEventListener('submit', e => {
    if (e.defaultPrevented || f.dataset.noLoading !== undefined || f.dataset.fav !== undefined || f.method.toLowerCase() === 'get') return;
    const b = e.submitter || $('button[type=submit], button:not([type])', f);
    if (b && !b.dataset.loading) {
      b.dataset.loading = '1';
      setTimeout(() => { b.setAttribute('disabled', ''); b.insertAdjacentHTML('afterbegin', '<span class="spinner" aria-hidden="true"></span>'); }, 0);
    }
  }));

  /* Favoris en AJAX */
  $$('form[data-fav]').forEach(f => f.addEventListener('submit', async e => {
    e.preventDefault();
    const b = $('button', f);
    try {
      const r = await fetch(f.action, { method: 'POST', headers: { 'X-CSRF-Token': csrf(), 'Accept': 'application/json' }, body: new FormData(f) });
      if (r.status === 401 || r.redirected) { window.location = '/connexion'; return; }
      const d = await r.json();
      b.classList.toggle('on', d.favorite);
      b.setAttribute('aria-pressed', d.favorite ? 'true' : 'false');
      b.setAttribute('aria-label', d.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris');
      window.tremplinToast(d.favorite ? 'Ajoutée à tes favoris' : 'Retirée de tes favoris');
    } catch (err) { f.submit(); }
  }));

  /* Barres de progression animées */
  const bars = $$('.bar > i[data-w]');
  if (bars.length) requestAnimationFrame(() => bars.forEach(i => { i.style.width = i.dataset.w + '%'; }));

  /* Copier dans le presse-papiers */
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const target = document.getElementById(b.dataset.copy);
    const text = target ? (target.value || target.innerText) : b.dataset.text;
    try { await navigator.clipboard.writeText(text); window.tremplinToast('Copié dans le presse-papiers'); } catch (e) { }
  }));

  /* Atelier CV : la feuille A4 est mise à l'échelle de son conteneur, avec les repères de changement de page */
  const fitCv = () => $$('[data-cv-fit]').forEach(box => {
    const scope = box.querySelector('.cv-scope');
    if (!scope || !box.clientWidth) return;
    const sheet = scope.firstElementChild;
    const k = box.clientWidth / sheet.offsetWidth;
    scope.style.transform = 'scale(' + k + ')';
    if (box.hasAttribute('data-cv-marks')) {
      box.style.height = Math.ceil(sheet.offsetHeight * k) + 'px';
      const pageH = sheet.offsetWidth * 297 / 210;
      let marks = box.querySelector('.cv-pagemarks');
      if (!marks) { marks = document.createElement('div'); marks.className = 'cv-pagemarks'; box.appendChild(marks); }
      marks.innerHTML = '';
      for (let n = 1; n * pageH < sheet.offsetHeight - 40; n++) {
        const m = document.createElement('div'); m.className = 'cv-pagemark'; m.style.top = Math.round(n * pageH * k) + 'px';
        m.innerHTML = '<span>Page ' + (n + 1) + '</span>'; marks.appendChild(m);
      }
    }
  });
  if ($('[data-cv-fit]')) {
    fitCv();
    window.addEventListener('resize', fitCv);
    if (document.fonts) document.fonts.ready.then(fitCv);
    window.addEventListener('load', fitCv);
  }
  $$('[data-cv-cat]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    $$('[data-cv-cat]').forEach(x => x.classList.toggle('active', x === a));
    $$('.cv-tcard').forEach(c => { c.hidden = !!a.dataset.cvCat && c.dataset.cat !== a.dataset.cvCat; });
    fitCv();
  }));

  /* Impression */
  $$('[data-print]').forEach(b => b.addEventListener('click', () => window.print()));

  /* Soumission automatique des filtres */
  $$('form[data-autosubmit] select, form[data-autosubmit] input[type=checkbox], form[data-autosubmit] input[type=radio]').forEach(el =>
    el.addEventListener('change', () => el.form.requestSubmit ? el.form.requestSubmit() : el.form.submit()));

  /* Kanban recruteur : glisser-déposer (alternative clavier : menu de statut sur chaque carte) */
  const kanban = $('[data-kanban]');
  if (kanban) {
    let dragged = null;
    $$('.k-card', kanban).forEach(c => {
      c.setAttribute('draggable', 'true');
      c.addEventListener('dragstart', () => { dragged = c; c.classList.add('dragging'); });
      c.addEventListener('dragend', () => { c.classList.remove('dragging'); dragged = null; });
    });
    $$('.col', kanban).forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drop'); });
      col.addEventListener('dragleave', () => col.classList.remove('drop'));
      col.addEventListener('drop', async e => {
        e.preventDefault(); col.classList.remove('drop');
        if (!dragged || dragged.parentElement === $('.col-body', col)) return;
        const body = $('.col-body', col); body.prepend(dragged);
        const fd = new FormData(); fd.append('status', col.dataset.status); fd.append('_csrf', csrf());
        const r = await fetch('/entreprise/candidatures/' + dragged.dataset.id + '/statut', { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd });
        if (r.ok) {
          window.tremplinToast('Statut mis à jour — le candidat a été notifié');
          $$('.col', kanban).forEach(c => { const n = $('.n', c); if (n) n.textContent = $$('.k-card', c).length; });
          const sel = $('select[name=status]', dragged); if (sel) sel.value = col.dataset.status;
        } else { window.tremplinToast('Impossible de mettre à jour le statut', 'error'); }
      });
    });
  }

  /* Graphiques (Chart.js chargé localement) */
  if (window.Chart) {
    Chart.defaults.font.family = '"Plus Jakarta Sans", system-ui, sans-serif';
    Chart.defaults.color = '#5a6788';
    Chart.defaults.locale = 'fr-FR';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    $$('canvas[data-chart]').forEach(cv => {
      const cfg = JSON.parse(cv.dataset.chart);
      const palette = ['#0057ff', '#ffc21a', '#12a150', '#7c4dff', '#f0457e', '#00b4ff', '#ff8a00'];
      cfg.data.datasets.forEach((ds, i) => {
        const c = ds.color || palette[i % palette.length];
        if (cfg.type === 'doughnut') { ds.backgroundColor = ds.backgroundColor || palette; ds.borderWidth = 0; }
        else if (cfg.type === 'line') { ds.borderColor = c; ds.backgroundColor = c + '22'; ds.fill = true; ds.tension = .35; ds.pointRadius = 3; ds.borderWidth = 2.5; }
        else { ds.backgroundColor = c; ds.borderRadius = 6; ds.maxBarThickness = 34; }
      });
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      new Chart(cv, Object.assign({ options: {} }, cfg, {
        options: Object.assign({
          responsive: true, maintainAspectRatio: false, animation: reduce ? false : { duration: 700 },
          plugins: { legend: { display: cfg.data.datasets.length > 1 || cfg.type === 'doughnut', position: 'bottom' } },
          scales: cfg.type === 'doughnut' ? {} : { y: { beginAtZero: true, grid: { color: '#eef2f9' }, ticks: { precision: 0 } }, x: { grid: { display: false } } },
          cutout: cfg.type === 'doughnut' ? '68%' : undefined,
        }, cfg.options || {})
      }));
    });
  }

  /* Offre : code métier proposé à partir de l'intitulé, compétences reprises de la fiche métier (référentiel v1.1) */
  const occ = $('[data-occ-form]');
  if (occ) {
    const sel = $('#occupation_id'), title = $('#title'), hint = $('[data-occ-hint]', occ);
    const confirmBox = $('input[name="occupation_confirmed"]', occ);
    let timer = null;
    const suggest = () => {
      const t = (title.value || '').trim();
      if (t.length < 4 || (confirmBox && confirmBox.checked)) return;
      fetch(occ.dataset.suggest + '?titre=' + encodeURIComponent(t), { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(r => r.json()).then(d => {
          if (!d.suggestion) { hint.textContent = 'Aucun code évident : choisis la fiche la plus proche, l\'intitulé sera examiné par l\'équipe de curation.'; return; }
          sel.value = String(d.suggestion.id);
          hint.textContent = 'Code proposé : ' + d.suggestion.code + ' (' + d.suggestion.title + ', indice de confiance ' + d.suggestion.confidence + ' %). Vérifie-le puis confirme.';
        }).catch(() => {});
    };
    title && title.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(suggest, 600); });
    if (title && !sel.value) suggest();
    const fill = $('[data-occ-fill]', occ);
    fill && fill.addEventListener('click', () => {
      if (!sel.value) { window.tremplinToast('Choisis d\'abord une fiche métier.', 'warning'); return; }
      fetch(occ.dataset.sheet + '/' + sel.value + '/fiche', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(r => r.json()).then(d => {
          const rows = $$('[data-occ-rows] tbody tr', occ);
          d.skills.forEach((s, i) => {
            const tr = rows[i]; if (!tr) return;
            $('select[name="skill_id[]"]', tr).value = String(s.skill_id);
            $('select[name="skill_level[]"]', tr).value = String(s.level);
            $('input[name="skill_weight[]"]', tr).value = String(Math.max(1, s.weight || 1));
            $('select[name="skill_blocking[]"]', tr).value = s.blocking ? '1' : '0';
          });
          rows.slice(d.skills.length).forEach(tr => { $('select[name="skill_id[]"]', tr).value = ''; });
          const edu = $('#education_min'); if (edu) edu.value = String(d.education_min);
          const elim = $('input[name="education_eliminatory"]'); if (elim && d.regulated) elim.checked = true;
          window.tremplinToast(d.skills.length + ' compétences reprises de la fiche ' + d.code + ' : ajuste les niveaux et les poids si besoin.');
        }).catch(() => window.tremplinToast('Fiche indisponible pour le moment.', 'error'));
    });
  }

  /* Paiement : relance automatique du statut */
  const pay = $('[data-poll-payment]');
  if (pay) setTimeout(() => window.location.reload(), 6000);
})();
