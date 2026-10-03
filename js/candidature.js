/* =========================================================
   NEAM × KANIE 30/30 — Candidature & test de maturité numérique
   - 12 questions réparties en 4 axes (0 à 3 points chacune)
   - Rapport envoyé à l’équipe NEAM via FormSubmit
   - Résultats téléchargeables en PDF (jsPDF, généré dans le navigateur)
   ========================================================= */
(() => {
  const RECIPIENT = 'daki.liaison@gmail.com';
  const ENDPOINT = `https://formsubmit.co/ajax/${RECIPIENT}`;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = $('#quiz');
  if (!root) return;

  /* ---------- Contenu du test ---------- */
  const DIMS = {
    visibilite: {
      label: 'Visibilité en ligne',
      reco: 'Créer ou refondre un site adapté au mobile, poser les fondations du référencement (SEO) et compléter votre fiche Google.',
    },
    image: {
      label: 'Image et communication',
      reco: 'Clarifier votre identité visuelle, définir une ligne éditoriale et publier régulièrement sur les bons réseaux sociaux.',
    },
    outils: {
      label: 'Outils et organisation',
      reco: 'Remplacer les fichiers dispersés par des outils adaptés et automatiser les tâches répétitives (devis, factures, relances).',
    },
    pilotage: {
      label: 'Données et stratégie',
      reco: 'Suivre quelques indicateurs clés et construire une feuille de route digitale sur 90 jours.',
    },
  };

  const QUESTIONS = [
    { dim: 'visibilite', text: 'Votre entreprise a-t-elle un site web ?', options: [
      ['Non, pas encore', 0], ['Une page simple ou un site ancien', 1], ['Un site à jour, mais peu adapté au mobile', 2], ['Un site à jour et adapté au mobile', 3] ] },
    { dim: 'visibilite', text: 'Quand un client cherche votre activité sur Google, vous trouve-t-il ?', options: [
      ['Non, jamais', 0], ['Je ne sais pas', 1], ['Seulement s’il tape notre nom', 2], ['Oui, nous apparaissons bien', 3] ] },
    { dim: 'visibilite', text: 'Votre entreprise apparaît-elle sur Google Maps avec des informations à jour ?', options: [
      ['Non', 0], ['Je ne sais pas', 1], ['Oui, mais la fiche est incomplète', 2], ['Oui, fiche complète avec photos et avis', 3] ] },
    { dim: 'image', text: 'Avez-vous une identité visuelle (logo, couleurs) utilisée partout ?', options: [
      ['Aucune', 0], ['Un logo seulement', 1], ['Logo et couleurs, utilisés de façon irrégulière', 2], ['Une identité cohérente sur tous nos supports', 3] ] },
    { dim: 'image', text: 'À quelle fréquence publiez-vous sur les réseaux sociaux ?', options: [
      ['Jamais, nous n’y sommes pas', 0], ['Rarement', 1], ['Quelques fois par mois', 2], ['Chaque semaine, avec un plan', 3] ] },
    { dim: 'image', text: 'Comment les clients vous contactent-ils en ligne ?', options: [
      ['Ils ne peuvent pas nous contacter en ligne', 0], ['Par téléphone uniquement', 1], ['WhatsApp ou messagerie, sans suivi', 2], ['Plusieurs canaux, avec un suivi des demandes', 3] ] },
    { dim: 'outils', text: 'Comment gérez-vous vos clients et vos ventes ?', options: [
      ['Sur papier ou de mémoire', 0], ['Avec Excel ou un cahier', 1], ['Avec un logiciel simple', 2], ['Avec un outil métier ou un CRM', 3] ] },
    { dim: 'outils', text: 'Vos tâches répétitives (devis, factures, relances) sont…', options: [
      ['Entièrement faites à la main', 0], ['Faites avec des modèles', 1], ['En partie automatisées', 2], ['Largement automatisées', 3] ] },
    { dim: 'outils', text: 'Votre équipe est-elle à l’aise avec les outils numériques ?', options: [
      ['Pas du tout', 0], ['Un peu', 1], ['Plutôt oui', 2], ['Oui, tout à fait', 3] ] },
    { dim: 'pilotage', text: 'Suivez-vous des chiffres clés (ventes, clients, visites) ?', options: [
      ['Non', 0], ['De temps en temps', 1], ['Chaque mois', 2], ['En continu, avec un tableau de bord', 3] ] },
    { dim: 'pilotage', text: 'Avez-vous déjà utilisé l’intelligence artificielle dans votre activité ?', options: [
      ['Jamais', 0], ['Nous avons essayé', 1], ['Parfois', 2], ['Régulièrement', 3] ] },
    { dim: 'pilotage', text: 'Avez-vous un plan pour développer votre présence digitale ?', options: [
      ['Non', 0], ['Quelques idées', 1], ['Des objectifs, mais pas de plan', 2], ['Un plan avec des étapes et un budget', 3] ] },
  ];

  const LEVELS = [
    { max: 25, name: 'Premiers pas', text: 'Votre entreprise est encore peu présente en ligne. C’est le profil pour lequel le programme peut avoir le plus d’impact : chaque action se verra rapidement.' },
    { max: 50, name: 'Bases posées', text: 'Les premières briques existent, mais elles ne travaillent pas encore ensemble. Le programme vous aidera à structurer votre présence et à gagner en régularité.' },
    { max: 75, name: 'En progression', text: 'Votre entreprise est déjà bien engagée dans le digital. Le programme vous aidera à optimiser vos outils et à transformer votre visibilité en clients.' },
    { max: 100, name: 'Avancé', text: 'Votre maturité numérique est solide. Le programme vous permettra d’accélérer : automatisation, IA et pilotage par les données.' },
  ];

  /* ---------- État ---------- */
  const answers = new Array(QUESTIONS.length).fill(null);
  let step = 0;
  let result = null;
  let profile = {};

  /* ---------- Construction des étapes de questions ---------- */
  const qContainer = $('#quizQuestions');
  qContainer.innerHTML = QUESTIONS.map((q, i) => `
    <section class="q-step" data-step="q" hidden>
      <span class="label">Question ${i + 1} / ${QUESTIONS.length} · ${DIMS[q.dim].label}</span>
      <h2 class="q-step__title">${q.text}</h2>
      <div class="q-options" role="radiogroup" aria-label="${q.text.replace(/"/g, '&quot;')}">
        ${q.options.map(([label, pts], j) => `
          <button type="button" class="q-option" role="radio" aria-checked="false" data-q="${i}" data-v="${j}">
            <span class="q-option__key">${String.fromCharCode(65 + j)}</span><span>${label}</span>
          </button>`).join('')}
      </div>
    </section>`).join('');

  const steps = $$('.q-step', root);
  const bar = $('#quizBar');
  const count = $('#quizCount');
  const backBtn = $('#quizBack');

  const show = n => {
    step = Math.max(0, Math.min(n, steps.length - 1));
    steps.forEach((s, i) => { s.hidden = i !== step; });
    const pct = Math.round((step / (steps.length - 1)) * 100);
    bar.style.width = `${pct}%`;
    count.textContent = step === steps.length - 1 ? 'Terminé' : `Étape ${step + 1} / ${steps.length - 1}`;
    backBtn.hidden = step === 0 || step === steps.length - 1;
    const current = steps[step];
    const focusable = $('h2, input, .q-option', current);
    if (focusable && step > 0) {
      if (focusable.tagName === 'H2') { focusable.tabIndex = -1; }
      focusable.focus({ preventScroll: true });
    }
    root.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  backBtn.addEventListener('click', () => show(step - 1));
  $$('[data-next]', root).forEach(b => b.addEventListener('click', () => show(step + 1)));

  /* ---------- Validation d’un groupe de champs ---------- */
  const validate = container => {
    let ok = true;
    $$('input, select, textarea', container).forEach(f => {
      const valid = f.checkValidity();
      const field = f.closest('.field, .check');
      if (field) field.classList.toggle('is-invalid', !valid);
      if (!valid && ok) { ok = false; f.focus(); }
    });
    return ok;
  };
  $$('input, select, textarea', root).forEach(f => f.addEventListener('input', () => {
    const field = f.closest('.field, .check');
    if (field) field.classList.remove('is-invalid');
  }));

  // Étape « entreprise »
  $('#stepCompany').addEventListener('submit', e => {
    e.preventDefault();
    if (!validate(e.currentTarget)) { $('#companyError').hidden = false; return; }
    $('#companyError').hidden = true;
    show(step + 1);
  });

  // Questions : un clic = une réponse, puis passage automatique
  $$('button.q-option', root).forEach(btn => btn.addEventListener('click', () => {
    const q = +btn.dataset.q;
    answers[q] = +btn.dataset.v;
    $$(`.q-option[data-q="${q}"]`, root).forEach(b => {
      const on = b === btn;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-checked', String(on));
    });
    setTimeout(() => show(step + 1), 220);
  }));

  /* ---------- Calcul du résultat ---------- */
  const computeResult = () => {
    const dims = {};
    Object.keys(DIMS).forEach(k => { dims[k] = { got: 0, max: 0 }; });
    QUESTIONS.forEach((q, i) => {
      dims[q.dim].max += 3;
      dims[q.dim].got += answers[i] == null ? 0 : q.options[answers[i]][1];
    });
    const got = Object.values(dims).reduce((a, d) => a + d.got, 0);
    const max = Object.values(dims).reduce((a, d) => a + d.max, 0);
    const score = Math.round((got / max) * 100);
    const level = LEVELS.find(l => score <= l.max);
    const byDim = Object.entries(dims).map(([k, d]) => ({ key: k, label: DIMS[k].label, pct: Math.round((d.got / d.max) * 100) }));
    const priorities = [...byDim].sort((a, b) => a.pct - b.pct).filter(d => d.pct < 75).slice(0, 3);
    if (!priorities.length) priorities.push([...byDim].sort((a, b) => a.pct - b.pct)[0]);
    return { score, level, byDim, priorities: priorities.map(p => ({ ...p, reco: DIMS[p.key].reco })) };
  };

  /* ---------- Rendu du résultat ---------- */
  const renderResult = () => {
    $('#resCompany').textContent = profile.entreprise;
    $('#resScore').textContent = result.score;
    $('#resRing').style.setProperty('--p', result.score);
    $('#resLevel').textContent = result.level.name;
    $('#resLevelText').textContent = result.level.text;
    $('#resDims').innerHTML = result.byDim.map(d => `
      <li><div class="res-dim__head"><span>${d.label}</span><b>${d.pct}%</b></div>
      <div class="res-dim__bar"><span style="width:${d.pct}%"></span></div></li>`).join('');
    $('#resPrio').innerHTML = result.priorities.map(p => `<li><b>${p.label}</b><span>${p.reco}</span></li>`).join('');
  };

  /* ---------- Rapport e-mail ---------- */
  const buildReport = () => {
    const lines = {
      _subject: `Candidature 30/30 — ${profile.entreprise} — ${result.score}/100 (${result.level.name})`,
      _template: 'table',
      _replyto: profile.email,
      'Entreprise': profile.entreprise,
      'Secteur': profile.secteur,
      'Ville': profile.ville,
      'Taille': profile.taille,
      'Contact': `${profile.nom}${profile.fonction ? ' — ' + profile.fonction : ''}`,
      'E-mail': profile.email,
      'Téléphone / WhatsApp': profile.telephone,
      'Score de maturité': `${result.score}/100 — ${result.level.name}`,
    };
    result.byDim.forEach(d => { lines[`Axe — ${d.label}`] = `${d.pct}%`; });
    lines['Priorités recommandées'] = result.priorities.map(p => p.label).join(', ');
    lines['Objectif principal'] = profile.objectif;
    lines['Motivation'] = profile.motivation;
    lines['Disponible pendant 30 jours'] = profile.dispo ? 'Oui' : 'Non';
    QUESTIONS.forEach((q, i) => {
      const a = answers[i] == null ? '—' : `${q.options[answers[i]][0]} (${q.options[answers[i]][1]}/3)`;
      lines[`Q${String(i + 1).padStart(2, '0')} — ${q.text}`] = a;
    });
    lines['Date'] = new Date().toLocaleString('fr-FR');
    return lines;
  };

  const sendReport = async () => {
    const status = $('#sendStatus');
    status.className = 'send-status is-pending';
    status.textContent = 'Envoi de votre candidature…';
    const report = buildReport();
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(report),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) !== 'true') throw new Error(data.message || `HTTP ${res.status}`);
      status.className = 'send-status is-ok';
      status.textContent = 'Candidature envoyée. L’équipe NEAM × KANIE reviendra vers vous rapidement.';
    } catch (err) {
      // Solution de secours : e-mail prérempli
      const body = Object.entries(report).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `${k} : ${v}`).join('\n');
      const href = `mailto:${RECIPIENT}?subject=${encodeURIComponent(report._subject)}&body=${encodeURIComponent(body)}`;
      status.className = 'send-status is-error';
      status.innerHTML = `L’envoi automatique n’a pas abouti. <a class="ulink" href="${href}">Envoyer ma candidature par e-mail</a> ou écrivez à ${RECIPIENT}.`;
    }
  };

  // Étape « motivation » : fin du questionnaire
  $('#stepFinal').addEventListener('submit', e => {
    e.preventDefault();
    if (!validate(e.currentTarget)) { $('#finalError').hidden = false; return; }
    $('#finalError').hidden = true;
    const c = new FormData($('#stepCompany'));
    const f = new FormData(e.currentTarget);
    profile = {
      entreprise: c.get('entreprise').trim(), secteur: c.get('secteur'), ville: c.get('ville').trim(), taille: c.get('taille'),
      nom: c.get('nom').trim(), fonction: (c.get('fonction') || '').trim(), email: c.get('email').trim(), telephone: c.get('telephone').trim(),
      objectif: f.get('objectif'), motivation: f.get('motivation').trim(), dispo: f.get('dispo') === 'oui',
    };
    result = computeResult();
    renderResult();
    show(steps.length - 1);
    sendReport();
  });

  /* ---------- PDF des résultats (exemplaire candidat) ---------- */
  const loadLogo = () => new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try {
        // Logo réduit sur fond blanc (JPEG) pour garder un PDF léger
        const c = document.createElement('canvas');
        c.width = 600; c.height = Math.round(600 * img.naturalHeight / img.naturalWidth);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve({ data: c.toDataURL('image/jpeg', 0.9), ratio: c.height / c.width });
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = 'assets/logo-light.png';
  });
  // Les polices PDF standard ne couvrent pas certains signes typographiques
  const safe = t => String(t).replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/[—–]/g, '-').replace(/…/g, '...').replace(/ | /g, ' ');

  const downloadPdf = async () => {
    const btn = $('#pdfBtn');
    if (!window.jspdf) { btn.textContent = 'PDF indisponible pour le moment'; return; }
    btn.disabled = true;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, M = 18;
    let y = 18;
    const ink = [15, 15, 16], muted = [118, 118, 124], yellow = [245, 179, 27], line = [227, 227, 224];

    const logo = await loadLogo();
    if (logo) doc.addImage(logo.data, 'JPEG', M, y, 42, 42 * logo.ratio);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...muted);
    doc.text(safe('Programme NEAM × KANIE 30/30'), W - M, y + 4, { align: 'right' });
    doc.text(new Date().toLocaleDateString('fr-FR'), W - M, y + 9, { align: 'right' });
    y += 24;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...ink);
    doc.text(safe('Test de maturité numérique'), M, y); y += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...muted);
    doc.text(safe(`${profile.entreprise} · ${profile.secteur} · ${profile.ville}`), M, y); y += 10;

    // Score
    doc.setFillColor(...yellow); doc.roundedRect(M, y, W - 2 * M, 30, 3, 3, 'F');
    doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(30);
    doc.text(`${result.score}/100`, M + 8, y + 19);
    doc.setFontSize(14); doc.text(safe(result.level.name), M + 62, y + 13);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    doc.text(doc.splitTextToSize(safe(result.level.text), W - 2 * M - 70), M + 62, y + 19);
    y += 40;

    // Axes
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(safe('Résultat par axe'), M, y); y += 7;
    result.byDim.forEach(d => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...ink);
      doc.text(safe(d.label), M, y);
      doc.text(`${d.pct}%`, W - M, y, { align: 'right' });
      y += 2.5;
      doc.setFillColor(...line); doc.rect(M, y, W - 2 * M, 3, 'F');
      doc.setFillColor(...ink); doc.rect(M, y, ((W - 2 * M) * d.pct) / 100, 3, 'F');
      y += 9;
    });

    // Priorités
    y += 2;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(safe('Vos priorités'), M, y); y += 7;
    result.priorities.forEach((p, i) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(safe(`${i + 1}. ${p.label}`), M, y); y += 5;
      doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 64);
      const t = doc.splitTextToSize(safe(p.reco), W - 2 * M - 5);
      doc.text(t, M + 5, y); y += t.length * 4.6 + 3; doc.setTextColor(...ink);
    });

    // Réponses
    y += 2;
    doc.setDrawColor(...line); doc.line(M, y, W - M, y); y += 7;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(safe('Vos réponses'), M, y); y += 6;
    doc.setFontSize(8.8);
    QUESTIONS.forEach((q, i) => {
      if (y > 272) { doc.addPage(); y = 20; }
      const a = answers[i] == null ? '-' : q.options[answers[i]][0];
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...muted);
      const qt = doc.splitTextToSize(safe(`${i + 1}. ${q.text}`), 100);
      doc.text(qt, M, y);
      doc.setTextColor(...ink);
      const at = doc.splitTextToSize(safe(a), W - 2 * M - 106);
      doc.text(at, M + 106, y);
      y += Math.max(qt.length, at.length) * 4 + 2.2;
    });

    // Pied de page
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFontSize(8); doc.setTextColor(...muted);
      doc.text(safe('NEAM Softwares Industry · Libreville, Gabon · Build a better tomorrow !'), M, 289);
      doc.text(safe('Résultat indicatif, établi à partir de vos réponses.'), W - M, 289, { align: 'right' });
    }

    const slug = profile.entreprise.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'entreprise';
    doc.save(`maturite-numerique-${slug}.pdf`);
    btn.disabled = false;
  };
  $('#pdfBtn').addEventListener('click', downloadPdf);

  show(0);
})();
