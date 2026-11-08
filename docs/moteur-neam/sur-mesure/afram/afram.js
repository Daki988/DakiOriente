// AFRAM : interactions (menu, recherche de programmes, onglets, dossier, simulateur, brochure, candidature, contact)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const AF = window.AF || {};
  const qs = new URLSearchParams(location.search);
  const wa = (t) => window.open(`https://wa.me/${AF.wa}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  const fcfa = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  const PR = Object.fromEntries((AF.progs || []).map((p) => [p.id, p]));

  function toast(t) {
    let el = $('.af-toast');
    if (!el) {
      el = document.createElement('div'); el.className = 'af-toast'; el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#16154F;color:#fff;padding:14px 22px;font:600 15px Inter,Arial;box-shadow:0 14px 40px rgba(0,0,0,.3);max-width:calc(100vw - 32px);text-align:center;transition:opacity .3s;border-top:3px solid #C9A04A';
      document.body.appendChild(el);
    }
    el.textContent = t; el.style.opacity = 1; clearTimeout(el._t); el._t = setTimeout(() => (el.style.opacity = 0), 3600);
  }
  function check(scope) {
    let ok = true;
    $$('[required]', scope).forEach((i) => { const bad = !i.value.trim(); i.closest('.fld')?.classList.toggle('bad', bad); if (bad && ok) { i.focus(); ok = false; } });
    if (!ok) toast('Merci de compléter les champs en rouge.');
    return ok;
  }
  document.addEventListener('input', (e) => e.target.closest?.('.fld')?.classList.remove('bad'));

  // En-tête et menu mobile
  const hd = $('.hd'), burger = $('.burger');
  addEventListener('scroll', () => hd.classList.toggle('solid', scrollY > 30), { passive: true });
  if (burger) burger.addEventListener('click', () => { const o = hd.classList.toggle('open'); burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });

  // Réseaux
  const icon = (n, s = 18) => (window.brandSvg ? window.brandSvg(n, s) : '');
  $$('[data-soc]').forEach((el) => (el.innerHTML = ['facebook', 'linkedin'].map((n) => `<a href="../../social.html?slug=${AF.slug}&net=${n}" aria-label="${n}">${icon(n)}</a>`).join('') + `<a href="https://wa.me/${AF.wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`));

  // Apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
  $$('.sec .wrap>*, .lv>*, .pcs>*, .news>*, .ent>*, .vvm>*').forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('rv'); io.observe(e); } });

  // Accueil : onglets Bachelor / Masters
  const ht = $('[data-ht]');
  if (ht) {
    const show = (n) => { $$('button', ht).forEach((b) => b.classList.toggle('on', b.dataset.n === n)); $$('[data-hp] .pc').forEach((c) => (c.hidden = c.dataset.niv !== n)); };
    $$('button', ht).forEach((b) => b.addEventListener('click', () => show(b.dataset.n))); show('Bachelor');
  }

  // Programmes : filtres niveau et domaine
  const flt = $('[data-flt]');
  if (flt) {
    let niv = qs.get('niv') || '', dom = qs.get('dom') || '';
    const apply = () => {
      $$('[data-n]', flt).forEach((b) => b.classList.toggle('on', b.dataset.n === niv));
      $$('[data-d]', flt).forEach((b) => b.classList.toggle('on', b.dataset.d === dom));
      let n = 0; $$('.pcs.all .pc').forEach((c) => { const ok = (!niv || c.dataset.niv === niv) && (!dom || c.dataset.dom === dom); c.hidden = !ok; if (ok) n++; });
      $('[data-nb]').textContent = `${n} programme${n > 1 ? 's' : ''}${niv ? ' · ' + (niv === 'Master' ? 'Masters' : niv) : ''}`;
    };
    $$('[data-n]', flt).forEach((b) => b.addEventListener('click', () => { niv = b.dataset.n; apply(); }));
    $$('[data-d]', flt).forEach((b) => b.addEventListener('click', () => { dom = b.dataset.d; apply(); }));
    apply();
  }

  // Fiche programme : onglet actif selon la section visible
  const pt = $('[data-ptabs]');
  if (pt) {
    const links = $$('a', pt);
    const so = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
    $$('.blk').forEach((b) => so.observe(b));
  }

  // Admissions : pièces du dossier
  const dt = $('[data-dt]');
  if (dt) {
    const show = (n) => { $$('button', dt).forEach((b) => b.classList.toggle('on', b.dataset.n === n)); $('[data-dos]').innerHTML = (AF.dossier[n] || []).map((x) => `<li><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg> ${x}</li>`).join(''); };
    $$('button', dt).forEach((b) => b.addEventListener('click', () => show(b.dataset.n))); show('Bachelor');
  }

  // Simulateur de financement
  const sn = $('[data-sn]');
  if (sn) {
    let niv = 'Bachelor', st = 'non';
    const R = (k, t) => ($(`[data-r="${k}"]`).textContent = t);
    const calc = () => {
      $$('button', sn).forEach((b) => b.classList.toggle('on', b.dataset.n === niv)); $$('[data-ss] button').forEach((b) => b.classList.toggle('on', b.dataset.n === st));
      const F = AF.frais[niv], adm = F.admin[st], scol = st === 'boursier' ? 0 : F.scol, uni = AF.frais.uniforme, tr = $('[data-su]').checked;
      const m = scol / F.mois, ins = adm + (tr ? uni / 3 : uni) + m;
      R('ins', fcfa(ins)); R('mois', scol ? `${fcfa(m)}${tr ? ' (+ ' + fcfa(uni / 3) + ' les 2 premiers mois)' : ''}` : (tr ? `${fcfa(uni / 3)} les 2 premiers mois` : '—'));
      R('tot', fcfa(adm + scol + uni));
      R('det', `${niv} · ${st === 'boursier' ? 'boursier' : 'non boursier'} : frais administratifs ${fcfa(adm)}${scol ? `, scolarité ${fcfa(scol)} en ${F.mois} mensualités` : ''}, uniforme ${fcfa(uni)}.`);
    };
    $$('button', sn).forEach((b) => b.addEventListener('click', () => { niv = b.dataset.n; calc(); }));
    $$('[data-ss] button').forEach((b) => b.addEventListener('click', () => { st = b.dataset.n; calc(); }));
    $('[data-su]').addEventListener('change', calc); calc();
  }

  // Brochure
  const br = $('[data-broch]');
  if (br) {
    if (PR[qs.get('prog')]) br.prog.value = qs.get('prog');
    const txt = () => `Bonjour AFRAM, je souhaite recevoir la brochure : ${br.prog.options[br.prog.selectedIndex].text}.\n${br.nom.value} · ${br.tel.value}${br.mail.value ? ' · ' + br.mail.value : ''}`;
    br.addEventListener('submit', (e) => { e.preventDefault(); if (!check(br)) return; wa(txt()); toast('Votre demande de brochure s\'ouvre dans WhatsApp.'); });
    $('[data-bmail]').addEventListener('click', () => { if (!check(br)) return; location.href = `mailto:${AF.mail}?subject=${encodeURIComponent('Demande de brochure')}&body=${encodeURIComponent(txt())}`; });
  }

  // Candidature en 3 étapes
  const ap = $('[data-apply]');
  if (ap) {
    if (PR[qs.get('prog')]) ap.prog.value = qs.get('prog');
    let st = 0;
    const steps = $$('[data-st]', ap), lis = $$('[data-steps] li');
    const fillLevel = () => {
      const p = PR[ap.prog.value], m = p.niv === 'Master';
      $('[data-annee]').innerHTML = (m ? ['Master 1', 'Master 2'] : ['1re année', '2e année', '3e année']).map((x) => `<option>${x}</option>`).join('');
      $('[data-dipl]').innerHTML = (m ? ['Licence', 'Bachelor', 'Master 1', 'Autre diplôme bac + 3'] : ['Baccalauréat', 'Bac + 1', 'Bac + 2', 'Autre']).map((x) => `<option>${x}</option>`).join('');
    };
    const show = () => {
      steps.forEach((s, i) => (s.hidden = i !== st)); lis.forEach((l, i) => { l.classList.toggle('on', i === st); l.classList.toggle('done', i < st); });
      $('[data-prev]').hidden = st === 0; $('[data-next]').hidden = st === steps.length - 1; $('[data-submit]').hidden = st !== steps.length - 1;
      if (st === 2) $('[data-recap]').innerHTML = `<b>${PR[ap.prog.value].t}</b> · ${ap.annee.value} · ${ap.rentree.value}<br>${ap.diplome.value} (${ap.an.value}) · ${ap.etab.value} · ${$('input[name="statut"]:checked', ap).value}`;
    };
    ap.prog.addEventListener('change', fillLevel); fillLevel(); show();
    $('[data-next]').addEventListener('click', () => { if (!check(steps[st])) return; st++; show(); ap.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('[data-prev]').addEventListener('click', () => { st--; show(); });
    ap.addEventListener('submit', (e) => {
      e.preventDefault(); if (!check(steps[st])) return;
      wa(`Bonjour AFRAM, voici ma candidature.\n\nProgramme : ${PR[ap.prog.value].t} (${ap.annee.value}, ${ap.rentree.value})\nParcours : ${ap.diplome.value} ${ap.an.value}, ${ap.etab.value}\nStatut : ${$('input[name="statut"]:checked', ap).value}\n\n${ap.prenom.value} ${ap.nom.value} · ${ap.tel.value}${ap.mail.value ? ' · ' + ap.mail.value : ''}${ap.moti.value.trim() ? '\n\nMotivation : ' + ap.moti.value.trim() : ''}`);
      toast('Votre candidature s\'ouvre dans WhatsApp. Le service des admissions vous recontacte.');
    });
  }

  // Galerie
  const lb = $('.lb');
  if (lb) {
    const photos = JSON.parse(lb.dataset.photos); let i = 0;
    const showP = () => { $('img', lb).src = photos[i]; $('img', lb).alt = $$('[data-gal] span')[i]?.textContent || ''; $('.ct', lb).textContent = `${i + 1} / ${photos.length}`; };
    const close = () => { lb.hidden = true; document.body.style.overflow = ''; };
    $$('[data-gal] [data-i]').forEach((b) => b.addEventListener('click', () => { i = +b.dataset.i; showP(); lb.hidden = false; document.body.style.overflow = 'hidden'; $('.x', lb).focus(); }));
    $('.x', lb).onclick = close;
    $('.pv', lb).onclick = () => { i = (i + photos.length - 1) % photos.length; showP(); };
    $('.nx', lb).onclick = () => { i = (i + 1) % photos.length; showP(); };
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') $('.nx', lb).click(); if (e.key === 'ArrowLeft') $('.pv', lb).click(); });
  }

  // Entreprises et contact
  const en = $('[data-ent]');
  if (en) en.addEventListener('submit', (e) => { e.preventDefault(); if (!check(en)) return; wa(`Bonjour AFRAM, entreprise ${en.soc.value} : ${en.besoin.value}.${en.msg.value.trim() ? '\n' + en.msg.value.trim() : ''}\n\n${en.nom.value} · ${en.tel.value}`); toast('Votre demande s\'ouvre dans WhatsApp.'); });
  const ct = $('[data-contact]');
  if (ct) ct.addEventListener('submit', (e) => { e.preventDefault(); if (!check(ct)) return; wa(`Bonjour AFRAM (${ct.qui.value}),\n${ct.msg.value}\n\n${ct.nom.value} · ${ct.tel.value}`); toast('Votre message s\'ouvre dans WhatsApp.'); });
})();
