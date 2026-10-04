/* =========================================================
   NEAM Digital Score™ — interface de l'outil d'audit
   discover → site (×N) → psi → report → (coordonnées) unlock → mail
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const API = 'api/audit.php?step=';
  const form = $('#dsForm');
  if (!form) return;
  const run = $('#dsRun'), preview = $('#dsPreview'), reportBox = $('#dsReport'), status = $('#dsStatus');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let aid = null, report = null, honeypot = '';

  const call = async (step, body, timeout = 100000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(API + step, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...body, website: honeypot }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Erreur ${res.status}`);
      return data;
    } finally { clearTimeout(t); }
  };

  /* ---------- Progression des 7 moteurs ---------- */
  const eng = i => $(`[data-engine="${i}"]`, run);
  const setEng = (i, state) => { const el = eng(i); if (el) el.dataset.state = state; };
  const say = t => { $('#dsRunMsg').textContent = t; };
  const show = el => { [form, run, preview, reportBox].forEach(x => { x.hidden = x !== el; }); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = new FormData(form);
    honeypot = d.get('website') || '';
    const company = (d.get('company') || '').trim();
    let ok = true;
    ['company', 'sector', 'city', 'country'].forEach(n => {
      const f = form.elements[n];
      const bad = !String(f.value || '').trim();
      f.closest('.field').classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { status.textContent = 'Indiquez le nom de l’entreprise, le secteur, la ville et le pays.'; return; }
    status.textContent = '';

    $('#dsRunName').textContent = company;
    $$('[data-engine]', run).forEach(el => { el.dataset.state = ''; });
    show(run);
    try {
      // 1. Discovery
      setEng(0, 'run'); say('Recherche de votre site, de votre fiche Google et de vos concurrents…');
      const disc = await call('discover', {
        company, sector: d.get('sector'), city: d.get('city'), country: d.get('country'), url: d.get('url'),
        activity: d.get('activity'), socials: d.get('socials'), competitors: d.getAll('competitor').filter(Boolean),
        clients: d.get('clients'), basket: d.get('basket'),
      }, 40000);
      aid = disc.aid;
      await wait(400); setEng(0, 'done');

      // 2-4. Collecte + audit (site de l'entreprise) et concurrents, en parallèle
      setEng(1, 'run'); setEng(2, 'run');
      const comps = disc.sites.filter(i => i >= 0);
      if (comps.length) setEng(3, 'run');
      say(disc.website ? `Lecture de ${disc.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}${comps.length ? ` et de ${comps.length} concurrent(s)` : ''}…` : 'Aucun site trouvé : analyse de votre présence sur Google et les réseaux…');
      let done = 0;
      const total = disc.sites.length;
      const jobs = disc.sites.map(idx => call('site', { aid, idx }, 60000).catch(() => null).then(r => {
        done++;
        if (idx === -1) { setEng(1, 'done'); setEng(2, 'done'); }
        if (total > 1) say(`Sites analysés : ${done} / ${total}…`);
        return r;
      }));
      if (disc.psi) jobs.push(...disc.sites.map(idx => call('psi', { aid, idx }, 95000).catch(() => null)));
      await Promise.all(jobs);
      setEng(1, 'done'); setEng(2, 'done');
      setEng(3, comps.length || disc.sources.places ? 'done' : 'skip');

      // 5-7. Score, analyste, recommandations
      setEng(4, 'run'); say('Calcul du NEAM Digital Score™…');
      const rep = await call('report', { aid }, 90000);
      setEng(4, 'done'); setEng(5, 'run'); say('Interprétation des résultats…');
      await wait(500); setEng(5, 'done'); setEng(6, 'run'); say('Priorisation des actions…');
      await wait(500); setEng(6, 'done'); say('Terminé.');
      await wait(400);
      renderPreview(rep.preview);
    } catch (err) {
      show(form);
      status.textContent = err.name === 'AbortError' ? 'L’analyse a pris trop de temps. Merci de réessayer.' : err.message;
    }
  });

  /* ---------- Éléments visuels ---------- */
  const ring = (score, size = 150) => {
    const r = 56, c = 2 * Math.PI * r, off = c * (1 - score / 100);
    return `<svg class="ds-ring" viewBox="0 0 140 140" width="${size}" height="${size}" aria-hidden="true">
      <circle cx="70" cy="70" r="${r}" class="ds-ring__bg"/>
      <circle cx="70" cy="70" r="${r}" class="ds-ring__fg" style="stroke-dasharray:${c};stroke-dashoffset:${off}"/>
      <text x="70" y="70" class="ds-ring__v">${score}</text><text x="70" y="94" class="ds-ring__t">/100</text></svg>`;
  };
  const tone = v => v == null ? 'na' : v < 40 ? 'low' : v < 60 ? 'mid' : v < 80 ? 'ok' : 'top';
  const bars = axes => `<div class="ds-axes">${axes.map(a => `
      <div class="ds-axis ds-axis--${tone(a.score)}">
        <div class="ds-axis__top"><span>${esc(a.label)}</span><b>${a.score == null ? 'Non mesuré' : a.score + '/100'}</b></div>
        <div class="ds-axis__bar"><i style="width:${a.score ?? 0}%"></i>${a.competitors != null ? `<em style="left:${a.competitors}%" title="Moyenne des concurrents : ${a.competitors}/100"></em>` : ''}</div>
      </div>`).join('')}
      ${axes.some(a => a.competitors != null) ? '<p class="ds-legend"><em></em> Moyenne de vos concurrents</p>' : ''}</div>`;
  const prio = p => `<span class="ds-p ds-p--${p}">P${p}</span>`;
  const ord = n => n === 1 ? '1ᵉʳ' : `${n}ᵉ`;

  /* ---------- Aperçu gratuit ---------- */
  const renderPreview = p => {
    const more = Math.max(0, p.action_count - p.problems.length);
    preview.innerHTML = `
      <div class="ds-head">
        <span class="label">Résultat · ${esc(p.company)}</span>
        <div class="ds-scorebox">
          ${ring(p.score)}
          <div>
            <span class="k">NEAM Digital Score™</span>
            <h2>${esc(p.level.name)}</h2>
            <p>${esc(p.level.text)}</p>
            <ul class="ds-kpis">
              ${p.total > 1 ? `<li><b>${ord(p.rank)} / ${p.total}</b><span>position face à vos concurrents</span></li>` : ''}
              <li><b>${p.problem_count}</b><span>problème(s) prioritaire(s)</span></li>
              <li><b>${p.opportunity_count}</b><span>opportunité(s) détectée(s)</span></li>
            </ul>
          </div>
        </div>
        ${p.partial ? '<p class="ds-warn">Votre site est construit en JavaScript : une partie des critères n’a pas pu être lue automatiquement. Ce score est partiel ; un expert NEAM peut compléter l’audit.</p>' : ''}
      </div>
      ${bars(p.axes)}
      <div class="ds-teaser">
        <h3>Vos ${p.problems.length} premiers problèmes</h3>
        <ol class="ds-problems">${p.problems.map(x => `<li>${prio(x.priority)} ${esc(x.title)}</li>`).join('')}</ol>
        ${more ? `<p class="ds-locked">+ ${more} autre(s) action(s), ${p.opportunity_count} opportunité(s), le benchmark concurrentiel et votre plan sur 30 jours dans l’audit complet.</p>` : ''}
      </div>
      <form class="form ds-gate" id="dsGate" novalidate>
        <h3>Recevez l’audit complet, gratuitement</h3>
        <p>Diagnostic détaillé, benchmark, opportunités et plan d’action priorisé&nbsp;: affiché ici, en PDF et par e-mail.</p>
        <div class="form__row">
          <div class="field"><label for="g-nom">Nom et prénom</label><input id="g-nom" name="nom" autocomplete="name" required></div>
          <div class="field"><label for="g-fonction">Fonction <em>(facultatif)</em></label><input id="g-fonction" name="fonction" autocomplete="organization-title"></div>
        </div>
        <div class="form__row">
          <div class="field"><label for="g-email">E-mail</label><input id="g-email" name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label for="g-tel">Téléphone / WhatsApp <em>(facultatif)</em></label><input id="g-tel" name="telephone" type="tel" autocomplete="tel"></div>
        </div>
        <label class="ds-consent"><input type="checkbox" name="consent" checked> J’accepte qu’un expert NEAM me recontacte au sujet de cet audit.</label>
        <div class="form__foot"><button type="submit" class="btn btn--yellow">Recevoir l’audit complet <span class="arr">→</span></button><p class="form__status" id="dsGateStatus" role="status"></p></div>
      </form>
      <p class="ds-restart"><button type="button" class="ulink" data-restart>Analyser une autre entreprise</button></p>`;
    show(preview);
    $('#dsGate').addEventListener('submit', unlock);
  };

  const unlock = async e => {
    e.preventDefault();
    const g = e.target, st = $('#dsGateStatus', g);
    const d = new FormData(g);
    const email = (d.get('email') || '').trim();
    let ok = true;
    [['nom', v => v.trim().length > 1], ['email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())]].forEach(([n, test]) => {
      const bad = !test(String(d.get(n) || ''));
      g.elements[n].closest('.field').classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { st.textContent = 'Indiquez votre nom et une adresse e-mail valide.'; return; }
    const btn = $('button[type=submit]', g);
    btn.disabled = true; st.textContent = 'Préparation de votre audit…';
    try {
      const r = await call('unlock', { aid, nom: d.get('nom'), fonction: d.get('fonction'), email, telephone: d.get('telephone'), consent: d.get('consent') === 'on' });
      report = r.report;
      renderReport(email);
      sendMail(email);
    } catch (err) {
      st.textContent = err.message; btn.disabled = false;
    }
  };

  /* ---------- Retour sur investissement ---------- */
  const fcfa = n => Math.round(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');
  const money = c => c[1] === 0 ? 'gratuit (à faire soi-même)' : `${c[0] ? fcfa(c[0]) : '0'} à ${fcfa(c[1])} FCFA`;
  const pct = u => `${String(u[0]).replace('.', ',')} à ${String(u[1]).replace('.', ',')} %`;
  const num = v => parseInt(String(v || '').replace(/\D/g, ''), 10) || 0;
  const businessCA = () => {
    const c = $('#roi-clients', reportBox), b = $('#roi-basket', reportBox);
    return c && b ? num(c.value) * num(b.value) : (report.business ? (report.business.clients || 0) * (report.business.basket || 0) : 0);
  };
  // Pour chaque action : gain mensuel [bas, haut], coût moyen et délai de retour (mois)
  const roiOf = (a, ca) => {
    const gain = [ca * a.roi.up[0] / 100, ca * a.roi.up[1] / 100];
    const cost = (a.roi.cost[0] + a.roi.cost[1]) / 2;
    const gMid = (gain[0] + gain[1]) / 2;
    return { gain, cost, payback: cost === 0 ? 0 : gMid > 0 ? cost / gMid : null, roi12: cost > 0 && gMid > 0 ? (gMid * 12 - cost) / cost : null };
  };
  const payLabel = p => p == null ? '—' : p === 0 ? 'immédiat' : p < 1 ? 'moins d’1 mois' : p > 36 ? 'plus de 3 ans' : `${Math.ceil(p)} mois`;
  const renderRoi = () => {
    const ca = businessCA();
    const rows = report.actions.filter(a => a.roi);
    $('#roi-ca', reportBox).textContent = ca ? `${fcfa(ca)} FCFA` : '—';
    $('#roi-rows', reportBox).innerHTML = rows.map(a => {
      const x = roiOf(a, ca);
      return `<tr><th>${prio(a.priority)} ${esc(a.title)}</th><td>${money(a.roi.cost)}</td><td>+${pct(a.roi.up)}</td><td>${ca ? `${fcfa(x.gain[0])} à ${fcfa(x.gain[1])} FCFA` : '—'}</td><td>${ca ? payLabel(x.payback) : '—'}</td></tr>`;
    }).join('');
    const s = report.roi;
    const g = [ca * s.up[0] / 100, ca * s.up[1] / 100];
    const cMid = (s.cost[0] + s.cost[1]) / 2, gMid = (g[0] + g[1]) / 2;
    $('#roi-sum', reportBox).innerHTML = `
      <div><span class="k">Plan complet</span><b>+${pct(s.up)}</b><small>de chiffre d’affaires estimé</small></div>
      <div><span class="k">Investissement</span><b>${fcfa(s.cost[0])} à ${fcfa(s.cost[1])}</b><small>FCFA, sur ${s.days} jours de mise en œuvre</small></div>
      <div><span class="k">Gain mensuel</span><b>${ca ? `${fcfa(g[0])} à ${fcfa(g[1])}` : '—'}</b><small>${ca ? 'FCFA par mois' : 'indiquez vos chiffres ci-dessus'}</small></div>
      <div><span class="k">Rentabilisé en</span><b>${ca ? payLabel(gMid ? cMid / gMid : null) : '—'}</b><small>${ca && gMid ? `ROI sur 12 mois : ${Math.round((gMid * 12 - cMid) / cMid * 100)} %` : 'en moyenne'}</small></div>`;
  };

  /* ---------- Rapport complet ---------- */
  const conf = c => c == null ? '<span class="ds-conf ds-conf--na">—</span>' : `<span class="ds-conf"><i style="width:${c}%"></i><b>${c}&nbsp;%</b></span>`;
  const renderReport = email => {
    const r = report;
    const medals = ['🥇', '🥈', '🥉'];
    const comps = r.competitors;
    const benchRows = r.axes.map(a => `<tr><th>${esc(a.label)}</th><td class="is-self">${a.score ?? '—'}</td>${comps.map(c => `<td>${c.axes[a.key] ?? '—'}</td>`).join('')}</tr>`).join('');
    reportBox.innerHTML = `
      <div class="ds-head">
        <span class="label">NEAM Digital Audit · ${esc(r.date)}</span>
        <div class="ds-scorebox">
          ${ring(r.score)}
          <div>
            <span class="k">${esc(r.company)} · ${esc(r.sector)} · ${esc(r.city)}, ${esc(r.country)}</span>
            <h2>${esc(r.level.name)}</h2>
            <p>${esc(r.analysis.summary)}</p>
            <div class="actions"><button type="button" class="btn btn--yellow" id="dsPdf">Télécharger le PDF <span class="arr">↓</span></button><a class="btn btn--line" href="contact.html?besoin=NEAM%20Digital%20Score">Parler à un expert</a></div>
            <p class="ds-mail" id="dsMail" role="status">Envoi du rapport à ${esc(email)}…</p>
          </div>
        </div>
        ${r.partial ? '<p class="ds-warn">Site construit en JavaScript : une partie des critères n’a pas pu être lue automatiquement. Score partiel.</p>' : ''}
      </div>

      <section class="ds-block"><h3><span>01</span>Ce que NEAM a trouvé</h3>
        <p class="ds-note">Chaque information est accompagnée d’un niveau de confiance. Rien n’est inventé&nbsp;: ce qui n’a pas été trouvé est indiqué comme tel.</p>
        <div class="ds-table-wrap"><table class="ds-table"><thead><tr><th>Donnée</th><th>Valeur</th><th>Source</th><th>Confiance</th></tr></thead><tbody>
        ${r.discovery.map(x => `<tr><th>${esc(x.label)}</th><td>${esc(x.value)}${x.warning ? `<small class="ds-w">${esc(x.warning)}</small>` : ''}</td><td>${esc(x.source)}</td><td>${conf(x.confidence)}</td></tr>`).join('')}
        </tbody></table></div>
      </section>

      <section class="ds-block"><h3><span>02</span>Votre score, axe par axe</h3>
        ${bars(r.axes)}
        <div class="ds-axisdetail">${r.axes.map(a => `<details${a.fail.length ? '' : ''}><summary><b>${esc(a.label)}</b><span>${a.score == null ? 'Non mesuré' : a.score + '/100'}${a.competitors != null ? ` · concurrents ${a.competitors}/100` : ''}</span></summary>
          <ul class="ds-checks">${a.fail.map(f => `<li class="${f.partial ? 'is-warn' : 'is-bad'}">${esc(f.note)}</li>`).join('')}${a.pass.map(t => `<li class="is-ok">${esc(t)}</li>`).join('')}</ul></details>`).join('')}</div>
      </section>

      ${r.gbp ? `<section class="ds-block"><h3><span>03</span>Google Business &amp; réputation</h3>
        <div class="ds-gbp"><div class="ds-gbp__score"><b>${r.gbp.score}</b><span>/100</span><small>Google Business Score</small></div>
        <ul class="ds-checks">
          <li class="${r.gbp.rating >= 4.2 ? 'is-ok' : r.gbp.rating >= 3.5 ? 'is-warn' : 'is-bad'}">Note ${r.gbp.rating != null ? String(r.gbp.rating).replace('.', ',') + '/5' : 'absente'}</li>
          <li class="${r.gbp.reviews >= 50 ? 'is-ok' : r.gbp.reviews >= 15 ? 'is-warn' : 'is-bad'}">${r.gbp.reviews} avis${r.gbp.competitor_reviews != null ? ` (vos concurrents : ${r.gbp.competitor_reviews} en moyenne)` : ''}</li>
          <li class="${r.gbp.hours ? 'is-ok' : 'is-bad'}">Horaires ${r.gbp.hours ? 'renseignés' : 'absents'}</li>
          <li class="${r.gbp.phone ? 'is-ok' : 'is-bad'}">Téléphone ${r.gbp.phone ? 'présent' : 'absent'}</li>
          <li class="${r.gbp.website ? 'is-ok' : 'is-bad'}">Lien vers le site ${r.gbp.website ? 'présent' : 'absent'}</li>
          <li class="${r.gbp.photos >= 5 ? 'is-ok' : 'is-warn'}">${r.gbp.photos} photo(s)</li>
        </ul></div>
        ${r.gbp.maps_url ? `<p><a class="ulink" href="${esc(r.gbp.maps_url)}" target="_blank" rel="noopener">Voir la fiche sur Google Maps ↗</a></p>` : ''}
      </section>` : ''}

      <section class="ds-block"><h3><span>04</span>Benchmark concurrentiel</h3>
        ${comps.length ? `
        <p class="ds-note">${esc(r.analysis.competition)}</p>
        <div class="ds-table-wrap"><table class="ds-table ds-bench"><thead><tr><th>Axe</th><th class="is-self">${esc(r.company)}</th>${comps.map(c => `<th>${esc(c.name)}${c.relevance ? `<small>pertinence ${c.relevance}/100</small>` : ''}</th>`).join('')}</tr></thead>
        <tbody>${benchRows}<tr class="ds-total"><th>Score global</th><td class="is-self">${r.score}</td>${comps.map(c => `<td>${c.score}</td>`).join('')}</tr></tbody></table></div>
        <ol class="ds-rank">${r.ranking.map((x, i) => `<li class="${x.self ? 'is-self' : ''}"><span>${medals[i] || (i + 1) + '.'}</span>${esc(x.name)}<b>${x.score}</b></li>`).join('')}</ol>`
        : `<p class="ds-note">${esc(r.analysis.competition)}</p>`}
        ${r.skipped && r.skipped.length ? `<p class="ds-note">Non analysés&nbsp;: ${r.skipped.map(s => `${esc(s.name)} (${esc(s.reason)})`).join(', ')}.</p>` : ''}
      </section>

      <section class="ds-block"><h3><span>05</span>Les ${r.problems.length} principaux problèmes</h3>
        <ol class="ds-problems ds-problems--full">${r.problems.map(x => `<li>${prio(x.priority)}<div><b>${esc(x.title)}</b><span>${esc(x.detail)}</span></div></li>`).join('')}</ol>
      </section>

      ${r.opportunities.length ? `<section class="ds-block"><h3><span>06</span>Opportunités détectées <em class="ds-opp-score">Opportunity Score ${r.opportunity_score}/100</em></h3>
        <div class="ds-opps">${r.opportunities.map(o => `<article class="ds-opp"><span class="k">Opportunité ${esc(o.level.toLowerCase())}</span><h4>${esc(o.title)}</h4><p>${esc(o.evidence)}</p><p><b>Action&nbsp;:</b> ${esc(o.action)}</p><p class="ds-opp__impact">${esc(o.impact)}</p></article>`).join('')}</div>
      </section>` : ''}

      <section class="ds-block"><h3><span>07</span>Vos actions, priorisées</h3>
        <p class="ds-note">${esc(r.analysis.advice)}</p>
        <div class="ds-table-wrap"><table class="ds-table"><thead><tr><th>Action</th><th>Impact</th><th>Difficulté</th><th>Priorité</th><th>Quand</th></tr></thead><tbody>
        ${r.actions.map(a => `<tr><th>${esc(a.title)}</th><td>${esc(a.impact)}</td><td>${esc(a.difficulty)}</td><td>${prio(a.priority)}</td><td>${esc(a.when_label)}</td></tr>`).join('')}
        </tbody></table></div>
        <div class="ds-actions">${r.actions.map(a => `<details><summary>${prio(a.priority)} <b>${esc(a.title)}</b></summary>
          ${a.why.length ? `<p><span class="k">Pourquoi&nbsp;?</span>${a.why.map(esc).join(' · ')}</p>` : ''}
          <p><span class="k">Pourquoi c’est important</span>${esc(a.importance)}</p>
          <p><span class="k">Que faire</span>${esc(a.todo)}</p>
          ${a.roi ? `<p><span class="k">Coût et gain estimés</span>${money(a.roi.cost)} · hausse du chiffre d’affaires de ${pct(a.roi.up)} · ${a.roi.days} jour(s) de mise en œuvre</p>` : ''}
          <p class="ds-meta">Impact ${esc(a.impact.toLowerCase())} · difficulté ${esc(a.difficulty.toLowerCase())} · ${esc(a.when_label)} · ${esc(a.axes.join(', '))}</p></details>`).join('')}</div>
      </section>

      <section class="ds-block" id="dsRoi"><h3><span>08</span>Retour sur investissement estimé</h3>
        <p class="ds-note">Indiquez votre activité pour chiffrer ce que chaque action peut vous rapporter. Les hypothèses sont prudentes et indicatives&nbsp;: un expert NEAM les affine avec vous.</p>
        <div class="ds-roi-in">
          <div class="field"><label for="roi-clients">Clients par mois</label><input id="roi-clients" type="number" min="0" inputmode="numeric" value="${r.business && r.business.clients ? r.business.clients : ''}" placeholder="Ex. : 80"></div>
          <div class="field"><label for="roi-basket">Panier moyen (FCFA)</label><input id="roi-basket" type="text" inputmode="numeric" value="${r.business && r.business.basket ? fcfa(r.business.basket) : ''}" placeholder="Ex. : 25 000"></div>
          <div class="ds-roi-ca"><span class="k">Chiffre d’affaires mensuel</span><b id="roi-ca">—</b></div>
        </div>
        <div class="ds-roi-sum" id="roi-sum"></div>
        <div class="ds-table-wrap"><table class="ds-table ds-roi"><thead><tr><th>Action</th><th>Coût estimé</th><th>Hausse du CA</th><th>Gain mensuel</th><th>Rentabilisé en</th></tr></thead><tbody id="roi-rows"></tbody></table></div>
      </section>

      <section class="ds-block"><h3><span>09</span>Votre plan d’action</h3>
        <div class="ds-plan">${r.plan.map(p => `<div class="ds-plan__col${p.key.startsWith('s') ? '' : ' ds-plan__col--long'}"><span class="k">${esc(p.label)}</span><ul>${p.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>
      </section>

      <section class="ds-block ds-sources"><h3><span>10</span>Sources et limites</h3>
        <ul>
          <li>Site web analysé automatiquement (${r.criteria_count} critères mesurés sur ${r.criteria_total}).</li>
          <li>Google Business&nbsp;: ${r.sources.places ? 'données Google Maps' : 'non mesuré dans ce test'}.</li>
          <li>Performance mobile&nbsp;: ${r.sources.pagespeed ? 'Google PageSpeed Insights' : 'temps de réponse mesuré par NEAM'}.</li>
          <li>Synthèse&nbsp;: ${r.analysis.source === 'ai' ? 'rédigée par l’analyste IA de NEAM à partir des résultats calculés' : 'générée automatiquement à partir des résultats calculés'}.</li>
          <li>Coûts et gains&nbsp;: barème indicatif NEAM, hypothèses prudentes. Les effets des actions ne s’additionnent pas&nbsp;: le total est calculé de façon dégressive et plafonné.</li>
          <li>L’activité des réseaux sociaux (abonnés, fréquence) n’est pas mesurée automatiquement&nbsp;: un audit approfondi la complète.</li>
        </ul>
      </section>

      <div class="ds-cta"><p class="statement">Envie de passer à l’action&nbsp;? <span class="dim">Un expert NEAM vous explique votre audit et construit avec vous le plan des 30 prochains jours.</span></p>
        <div class="actions"><a class="btn btn--yellow" href="contact.html?besoin=NEAM%20Digital%20Score">Parler à un expert <span class="arr">→</span></a><button type="button" class="btn btn--line" data-restart>Analyser une autre entreprise</button></div></div>`;
    show(reportBox);
    const roiInputs = ['#roi-clients', '#roi-basket'].map(q => $(q, reportBox));
    roiInputs.forEach(i => i.addEventListener('input', renderRoi));
    renderRoi();
    $('#dsPdf').addEventListener('click', async () => { const doc = await buildPdf(); if (doc) doc.save(doc.__filename); });
  };

  const sendMail = async email => {
    const el = () => $('#dsMail');
    try {
      const doc = await buildPdf();
      const pdf = doc ? doc.output('datauristring').split(',')[1] : '';
      const r = await call('mail', { aid, pdf }, 60000);
      if (el()) el().textContent = r.clientMail === false ? 'Votre audit est prêt. L’e-mail n’a pas pu être envoyé : téléchargez le PDF ci-dessus.' : `Votre audit complet a été envoyé à ${email}.`;
    } catch {
      if (el()) el().textContent = 'Votre audit est prêt. L’e-mail n’a pas pu être envoyé : téléchargez le PDF ci-dessus.';
    }
  };

  document.addEventListener('click', e => {
    if (e.target.closest('[data-restart]')) { aid = null; report = null; show(form); }
  });

  /* ---------- PDF ---------- */
  const safe = t => String(t ?? '').replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/[—–]/g, '-').replace(/…/g, '...').replace(/[  ]/g, ' ')
    .replace(/[ᵉ]/g, 'e').replace(/ʳ/g, 'r').replace(/™/g, '(TM)').replace(/[^\x20-\xFF\n]/g, '');
  const loadLogo = () => new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try {
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

  const buildPdf = async () => {
    if (!window.jspdf || !report) return null;
    const r = report;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, M = 16, CW = W - 2 * M;
    const ink = [15, 15, 16], muted = [118, 118, 124], yellow = [245, 179, 27], line = [227, 227, 224];
    const pc = { 1: [214, 69, 69], 2: [224, 138, 0], 3: [180, 150, 0] };
    let y = 16;
    const need = h => { if (y + h > 280) { doc.addPage(); y = 18; } };
    const txt = (t, size = 10, style = 'normal', color = ink, indent = 0, lh = 4.6) => {
      doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color);
      const lines = doc.splitTextToSize(safe(t), CW - indent);
      need(lines.length * lh);
      doc.text(lines, M + indent, y); y += lines.length * lh;
    };
    const h2 = (n, t) => { y += 4; need(14); doc.setFillColor(...yellow); doc.rect(M, y - 4, 1.6, 6, 'F'); txt(`${n}  ${t}`, 13, 'bold'); y += 2; };
    const row = (cells, widths, opts = {}) => {
      doc.setFont('helvetica', opts.bold ? 'bold' : 'normal'); doc.setFontSize(opts.size || 9);
      const wrapped = cells.map((c, i) => doc.splitTextToSize(safe(c), widths[i] - 2));
      const h = Math.max(...wrapped.map(w => w.length)) * 4 + 2.4;
      need(h);
      if (opts.fill) { doc.setFillColor(...opts.fill); doc.rect(M, y - 3.6, CW, h, 'F'); }
      let x = M;
      wrapped.forEach((w, i) => { doc.setTextColor(...((opts.colors && opts.colors[i]) || ink)); doc.text(w, x + 1, y); x += widths[i]; });
      y += h - 1.2;
      doc.setDrawColor(...line); doc.line(M, y - 2.6, W - M, y - 2.6);
    };

    const logo = await loadLogo();
    if (logo) doc.addImage(logo.data, 'JPEG', M, y, 40, 40 * logo.ratio);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...muted);
    doc.text('NEAM DIGITAL AUDIT', W - M, y + 4, { align: 'right' });
    doc.text(safe(r.date), W - M, y + 9, { align: 'right' });
    y += 24;
    txt(r.company, 20, 'bold');
    txt(`${r.sector} · ${r.city}, ${r.country}`, 11, 'normal', muted); y += 4;

    doc.setFillColor(...yellow); doc.roundedRect(M, y, CW, 32, 3, 3, 'F');
    doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(30);
    doc.text(`${r.score}/100`, M + 8, y + 15);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.text('NEAM DIGITAL SCORE (TM)', M + 8, y + 23);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text(safe(r.level.name), M + 66, y + 10);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    const lt = [r.level.text];
    if (r.ranking.length > 1) lt.push(`Position concurrentielle : ${r.rank} / ${r.ranking.length}`);
    doc.text(doc.splitTextToSize(safe(lt.join('  ')), CW - 72), M + 66, y + 16);
    y += 40;
    if (r.partial) { txt('Audit partiel : site construit en JavaScript, une partie des critères n\'a pas pu être lue automatiquement.', 9, 'italic', muted); y += 2; }

    h2('01', 'Synthèse');
    txt(r.analysis.summary, 10); y += 1.5; txt(r.analysis.competition, 10); y += 1.5; txt(r.analysis.advice, 10, 'bold');

    h2('02', 'Scores par axe');
    r.axes.forEach(a => {
      need(10);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...ink);
      doc.text(safe(a.label), M, y);
      doc.text(a.score == null ? 'Non mesuré' : `${a.score}/100${a.competitors != null ? `  (concurrents ${a.competitors})` : ''}`, W - M, y, { align: 'right' });
      y += 2.4;
      doc.setFillColor(...line); doc.rect(M, y, CW, 2.6, 'F');
      doc.setFillColor(...ink); doc.rect(M, y, CW * (a.score || 0) / 100, 2.6, 'F');
      if (a.competitors != null) { doc.setFillColor(...yellow); doc.rect(M + CW * a.competitors / 100 - .6, y - 1, 1.2, 4.6, 'F'); }
      y += 8;
    });

    h2('03', 'Ce que NEAM a trouvé');
    row(['Donnée', 'Valeur', 'Source', 'Confiance'], [32, 84, 40, 22], { bold: true, fill: [244, 244, 242] });
    r.discovery.forEach(x => row([x.label, x.value + (x.warning ? ` (${x.warning})` : ''), x.source, x.confidence == null ? '-' : `${x.confidence} %`], [32, 84, 40, 22]));

    if (r.gbp) {
      h2('04', 'Google Business & réputation');
      txt(`Google Business Score : ${r.gbp.score}/100 · Note ${r.gbp.rating ?? '-'}/5 · ${r.gbp.reviews} avis${r.gbp.competitor_reviews != null ? ` (concurrents : ${r.gbp.competitor_reviews} en moyenne)` : ''} · ${r.gbp.photos} photo(s) · horaires ${r.gbp.hours ? 'renseignés' : 'absents'}`, 10);
    }

    if (r.competitors.length) {
      h2('05', 'Benchmark concurrentiel');
      const n = r.competitors.length + 1, first = 40, w = (CW - first) / n;
      row(['Axe', r.company, ...r.competitors.map(c => c.name)], [first, ...Array(n).fill(w)], { bold: true, fill: [244, 244, 242], size: 8 });
      r.axes.forEach(a => row([a.label, a.score ?? '-', ...r.competitors.map(c => c.axes[a.key] ?? '-')], [first, ...Array(n).fill(w)], { size: 8.5 }));
      row(['Score global', r.score, ...r.competitors.map(c => c.score)], [first, ...Array(n).fill(w)], { bold: true, size: 9 });
      y += 2;
      txt('Classement : ' + r.ranking.map((x, i) => `${i + 1}. ${x.name} (${x.score})`).join('   '), 9.5, 'normal', muted);
    }

    h2('06', 'Les principaux problèmes');
    r.problems.forEach((p, i) => { txt(`${i + 1}. [P${p.priority}] ${p.title}`, 10, 'bold', pc[p.priority]); txt(p.detail, 9.5, 'normal', [60, 60, 64], 5); y += 1.5; });

    if (r.opportunities.length) {
      h2('07', `Opportunités (Opportunity Score ${r.opportunity_score}/100)`);
      r.opportunities.forEach(o => { txt(`${o.title} - opportunité ${o.level.toLowerCase()}`, 10, 'bold'); txt(o.evidence, 9.5, 'normal', [60, 60, 64], 5); txt(`Action : ${o.action} Impact : ${o.impact}`, 9.5, 'normal', [60, 60, 64], 5); y += 1.5; });
    }

    h2('08', 'Plan d\'action priorisé');
    row(['Action', 'Impact', 'Difficulté', 'Priorité', 'Quand'], [74, 24, 24, 18, 38], { bold: true, fill: [244, 244, 242] });
    r.actions.forEach(a => row([a.title, a.impact, a.difficulty, `P${a.priority}`, a.when_label], [74, 24, 24, 18, 38], { colors: [ink, ink, ink, pc[a.priority], ink] }));
    y += 3;
    r.actions.forEach(a => {
      need(22);
      txt(`[P${a.priority}] ${a.title}`, 10, 'bold', pc[a.priority]);
      if (a.why.length) txt('Pourquoi ? ' + a.why.join(' · '), 9, 'normal', [60, 60, 64], 5);
      txt('Pourquoi c\'est important : ' + a.importance, 9, 'normal', [60, 60, 64], 5);
      txt('Que faire : ' + a.todo, 9, 'normal', ink, 5);
      y += 2;
    });

    h2('09', 'Retour sur investissement estimé');
    const ca = businessCA();
    txt(ca ? `Base : chiffre d'affaires mensuel de ${fcfa(ca)} FCFA. Hypothèses prudentes et indicatives.` : 'Indiquez votre nombre de clients et votre panier moyen pour chiffrer les gains. Hypothèses prudentes et indicatives.', 9, 'italic', muted);
    y += 2;
    row(['Action', 'Coût estimé (FCFA)', 'Hausse du CA', 'Gain mensuel (FCFA)', 'Rentabilisé en'], [62, 34, 24, 34, 24], { bold: true, fill: [244, 244, 242], size: 8.5 });
    report.actions.filter(a => a.roi).forEach(a => {
      const x = roiOf(a, ca);
      row([a.title, a.roi.cost[1] === 0 ? 'gratuit' : `${fcfa(a.roi.cost[0])} - ${fcfa(a.roi.cost[1])}`, `+${pct(a.roi.up)}`, ca ? `${fcfa(x.gain[0])} - ${fcfa(x.gain[1])}` : '-', ca ? payLabel(x.payback) : '-'], [62, 34, 24, 34, 24], { size: 8.5 });
    });
    y += 2;
    const s9 = report.roi;
    txt(`Plan complet : +${pct(s9.up)} de chiffre d'affaires estimé, pour ${fcfa(s9.cost[0])} à ${fcfa(s9.cost[1])} FCFA d'investissement${ca ? `, soit ${fcfa(ca * s9.up[0] / 100)} à ${fcfa(ca * s9.up[1] / 100)} FCFA de gain par mois` : ''}.`, 10, 'bold');

    h2('10', 'Votre plan');
    r.plan.forEach(p => { txt(p.label, 10, 'bold'); p.items.forEach(i => txt('- ' + i, 9.5, 'normal', [60, 60, 64], 5)); y += 1; });

    y += 4;
    txt(`Sources : site web analysé automatiquement (${r.criteria_count} critères mesurés)${r.sources.places ? ', Google Maps' : ''}${r.sources.pagespeed ? ', Google PageSpeed Insights' : ''}. L'activité des réseaux sociaux n'est pas mesurée automatiquement.`, 8.5, 'italic', muted);
    y += 3;
    txt('Passez à l\'action avec NEAM : contact@neamindustry.com · www.neamindustry.com', 10, 'bold');

    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...muted);
      doc.text(safe('NEAM Softwares Industry · Libreville, Gabon · Build a better tomorrow !'), M, 290);
      doc.text(`${p} / ${pages}`, W - M, 290, { align: 'right' });
    }
    const slug = r.company.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'entreprise';
    doc.__filename = `neam-digital-score-${slug}.pdf`;
    return doc;
  };
})();
