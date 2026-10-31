// Assistant pas à pas générique utilisé par le back-office (fiche d'établissement et réseaux sociaux).
window.Wizard = function ({ steps, data, preview, onSave, onFinish, mount }) {
  const S = NEAMSTORE, esc = S.esc; const d = data; let i = 0;
  const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const root = document.querySelector(mount);
  root.innerHTML = `<div class="wiz"><div class="steps" id="wsteps"></div><div class="form" id="wform"></div><div class="prev"><h5>Aperçu en direct</h5><div id="wprev"></div></div></div>`;
  const $ = (id) => document.getElementById(id);
  const toast = (m) => { const t = document.getElementById('toast'); if (!t) return; t.textContent = m; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 2200); };
  function side() { $('wsteps').innerHTML = steps.map((s, k) => `<div class="st ${k < i ? 'd' : ''} ${k === i ? 'c' : ''} ${s.verif ? 'skip' : ''}" data-k="${k}"><i>${k < i ? '✓' : s.verif ? '–' : k + 1}</i><span>${esc(s.label)}</span></div>`).join(''); $('wsteps').querySelectorAll('.st').forEach((e) => e.onclick = () => { if (+e.dataset.k <= i || d._seen >= +e.dataset.k) { i = +e.dataset.k; draw(); } }); }
  function field(f) {
    const v = d[f.k] ?? '';
    if (f.type === 'textarea') return `<label class="field">${esc(f.l)}<textarea data-k="${f.k}" rows="5" maxlength="${f.max || 750}" placeholder="${esc(f.ph || '')}">${esc(v)}</textarea><span style="float:right;font-size:12px" data-c="${f.k}">${String(v).length}/${f.max || 750}</span></label>`;
    if (f.type === 'select') return `<label class="field">${esc(f.l)}<select data-k="${f.k}">${f.o.map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
    return `<label class="field">${esc(f.l)}<input data-k="${f.k}" type="${f.type || 'text'}" value="${esc(v)}" placeholder="${esc(f.ph || '')}" ${f.list ? `list="dl_${f.k}"` : ''}>${f.list ? `<datalist id="dl_${f.k}">${f.list.map((o) => `<option value="${esc(o)}">`).join('')}</datalist>` : ''}</label>`;
  }
  function body(s) {
    if (s.verif) return `<div class="verif"><div class="bad">✓</div><h2>${esc(s.t)}</h2><div class="hint" style="max-width:420px">${esc(s.h)}</div><div class="chips">${(s.opts || []).map((o) => `<span class="chip">${esc(o)}</span>`).join('')}</div><div style="background:#fef7e0;color:#8a5a00;padding:10px 14px;border-radius:8px;font-size:13px">Étape ignorée : environnement de démonstration NEAM, aucune vérification réelle.</div></div>`;
    if (s.done) return `<div class="verif"><div class="bad">✓</div><h2>${esc(s.t)}</h2><div class="hint">${esc(s.h)}</div><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">${(s.links || []).map(([l, u], k) => `<a class="cta ${k ? 'g' : ''}" href="${u()}">${esc(l)}</a>`).join('')}</div></div>`;
    let h = `<h2>${esc(s.t)}</h2>${s.h ? `<div class="hint">${esc(s.h)}</div>` : ''}`;
    (s.fields || []).forEach((f) => h += field(f));
    if (s.choice) h += `<div class="choices">${s.choice.o.map(([val, l, sub]) => `<div class="choice ${d[s.choice.k] === val ? 'on' : ''}" data-ck="${s.choice.k}" data-v="${val}"><i></i><div>${esc(l)}${sub ? `<div style="font-size:13px;color:#5f6368">${esc(sub)}</div>` : ''}</div></div>`).join('')}</div>`;
    if (s.chips) h += `<div class="chips">${s.chips.o.map((o) => `<span class="chip ${(d[s.chips.k] || []).includes(o) ? 'on' : ''}" data-chip="${s.chips.k}">${esc(o)}</span>`).join('')}</div>`;
    if (s.hours) { d.hrs = d.hrs || DAYS.map((x, k) => ({ open: k < 6, a: '08:00', b: '18:00' })); h += d.hrs.map((r, k) => `<div class="hrs"><b>${DAYS[k]}</b><label><input type="checkbox" data-h="${k}" ${r.open ? 'checked' : ''}> ${r.open ? 'Ouvert' : 'Fermé'}</label><input type="time" data-ha="${k}" value="${r.a}" ${r.open ? '' : 'disabled'}><input type="time" data-hb="${k}" value="${r.b}" ${r.open ? '' : 'disabled'}></div>`).join(''); }
    if (s.upload) { const u = s.upload, list = [].concat(d[u.k] || []); h += `<label class="up"><input type="file" accept="image/*" ${u.multi ? 'multiple' : ''} style="display:none" data-up="${u.k}" data-multi="${u.multi ? 1 : 0}">⬆ ${esc(u.l)}<div style="font-size:12px;margin-top:6px">JPG ou PNG · réduites automatiquement</div></label><div class="thumbs">${list.map((x) => `<span style="background-image:url('${x}')"></span>`).join('')}</div>`; }
    return h;
  }
  function draw() {
    const s = steps[i]; d._seen = Math.max(d._seen || 0, i); side();
    const last = i === steps.length - 1;
    $('wform').innerHTML = body(s) + (last ? '' : `<div class="nav"><button class="cta g" id="back" ${i ? '' : 'style="visibility:hidden"'}>Retour</button><div style="display:flex;gap:10px">${s.optional ? '<button class="cta g" id="skip">Ignorer</button>' : ''}<button class="cta" id="next">${i === steps.length - 2 ? 'Terminer' : 'Suivant'}</button></div></div>`);
    const F = $('wform');
    F.querySelectorAll('[data-k]').forEach((e) => e.addEventListener('input', () => { d[e.dataset.k] = e.value; const c = F.querySelector(`[data-c="${e.dataset.k}"]`); if (c) c.textContent = e.value.length + '/' + e.maxLength; upd(); }));
    F.querySelectorAll('[data-ck]').forEach((e) => e.onclick = () => { d[e.dataset.ck] = e.dataset.v; F.querySelectorAll(`[data-ck="${e.dataset.ck}"]`).forEach((x) => x.classList.toggle('on', x === e)); upd(); });
    F.querySelectorAll('[data-chip]').forEach((e) => e.onclick = () => { const k = e.dataset.chip, a = d[k] = d[k] || []; const ix = a.indexOf(e.textContent); ix < 0 ? a.push(e.textContent) : a.splice(ix, 1); e.classList.toggle('on'); upd(); });
    F.querySelectorAll('[data-h]').forEach((e) => e.onchange = () => { d.hrs[e.dataset.h].open = e.checked; draw(); upd(); });
    F.querySelectorAll('[data-ha],[data-hb]').forEach((e) => e.onchange = () => { const k = e.dataset.ha ?? e.dataset.hb; d.hrs[k][e.dataset.ha !== undefined ? 'a' : 'b'] = e.value; upd(); });
    F.querySelectorAll('[data-up]').forEach((e) => e.onchange = async () => { const arr = []; for (const f of e.files) arr.push(await S.readImage(f)); d[e.dataset.up] = e.dataset.multi === '1' ? [].concat(d[e.dataset.up] || [], arr).slice(-8) : arr[0]; draw(); upd(); });
    if ($('back')) $('back').onclick = () => { i--; draw(); };
    if ($('skip')) $('skip').onclick = () => { i++; draw(); };
    if ($('next')) $('next').onclick = () => { const miss = (s.fields || []).find((f) => f.req && !String(d[f.k] || '').trim()); if (miss) { toast('Renseignez : ' + miss.l); return; } onSave && onSave(d); i++; if (i === steps.length - 1) { onFinish && onFinish(d); toast('Enregistré · visible dans NEAM Atelier'); } draw(); };
    if (s.verif) setTimeout(() => {}, 0);
    upd();
  }
  function upd() { $('wprev').innerHTML = preview(d, steps[i]); }
  draw();
  return { go: (k) => { i = k; draw(); }, data: d };
};
