// Données modifiables depuis le back-office (stockées dans le navigateur) + rendus partagés.
(function () {
  const KEY = 'neam-projets';
  const P = window.PROSPECTS = window.PROSPECTS || [];
  const ROOT = document.currentScript.src.replace(/assets\/store\.js.*$/, '');
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const saveAll = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); return true; } catch (e) { alert('Stockage du navigateur plein : utilisez des images plus légères.'); return false; } };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const slugify = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'et').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const initials = (n) => { const w = (n || '?').replace(/['’]/g, ' ').split(/\s+/).filter((x) => x && !/^(le|la|les|de|du|des|l|d|et|&)$/i.test(x)); return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || '?').slice(0, 2)).toUpperCase(); };
  const avatarFor = (p) => p.logo ? `<div style="width:100%;height:100%;background:#fff url('${p.logo}') center/cover no-repeat;border-radius:inherit"></div>` : `<svg viewBox="0 0 200 200" style="width:100%;height:100%;display:block"><rect width="200" height="200" fill="${p.pal.ink.match(/^#[0-3]/) ? p.pal.ink : p.pal.bg.match(/^#[0-3]/) ? p.pal.bg : '#1f2937'}"/><circle cx="100" cy="100" r="78" fill="none" stroke="${p.pal.accent}" stroke-width="3"/><text x="100" y="122" text-anchor="middle" font-family="Georgia,serif" font-size="64" font-weight="700" fill="${p.pal.accent}">${esc(initials(p.main || p.n))}</text></svg>`;
  const SECTORS = { hotel: 'Hôtel', resto: 'Restaurant', beaute: 'Institut de beauté', immo: 'Agence immobilière', sante: 'Cabinet médical', voyage: 'Agence de voyage', auto: 'Automobile', ecole: 'École / formation', luxe: 'Mode & luxe', boutique: 'Boutique', services: 'Services aux entreprises' };
  const HOURS = { hotel: ['Ouvert 24 h/24', 'Réception 24 h/24 · 7 j/7'], resto: ['Ferme à 23 h', 'Lun – Dim · 11 h – 23 h'], default: ['Ferme à 18 h', 'Lun – Sam · 8 h – 18 h'] };

  // Fusionne les projets enregistrés dans le back-office avec les 83 prospects
  function merge() {
    const db = load();
    for (const slug in db) {
      const o = db[slug]; let p = P.find((x) => x.slug === slug);
      if (!p) {
        const ref = P.find((x) => x.k === (o.k || 'services')) || P[0];
        p = { slug, n: o.n || slug, main: o.n || slug, s: SECTORS[o.k] || 'Entreprise', k: o.k || 'services', c: 'Libreville', t: '', e: '', d: null, r: null, v: 0, so: [], sc: 0, a: 'Nouveau projet', domain: slug.replace(/-/g, '') + '.ga', handle: slug.replace(/-/g, '').slice(0, 18) + '241', tagline: 'Bienvenue', intro: '', cta: 'Nous contacter', hours: HOURS[o.k] || HOURS.default, address: 'Libreville, Gabon', pal: ref.pal, font: ref.font, sig: false, photos: ref.photos.slice(), items: ref.items.slice(), ig: 0, fb: 0, custom: true };
        P.push(p);
      }
      Object.assign(p, o, { edited: true });
      if (o.n && !o.main) p.main = o.n;
      if (o.photosUp && o.photosUp.length) p.photos = o.photosUp.concat(p.photos).slice(0, 6);
      if (o.nets) p.so = [...new Set((p.so || []).concat(Object.keys(o.nets)))];
      p.avatar = (o.logo || !p.avatar) ? avatarFor(p) : p.avatar;
    }
  }
  merge();

  // Rendu des 4 profils réseaux (version dynamique, reprend les saisies du back-office)
  function phones(p, only) {
    const N = (p.nets || {}); const ph = p.photos; const pal = p.pal;
    const av = (s, ring) => `<div style="width:${s}px;height:${s}px;border-radius:50%;overflow:hidden;flex:none;${ring ? 'box-shadow:0 0 0 2px #fff,0 0 0 4px #e1306c' : ''}">${p.avatar}</div>`;
    const nf = (n) => (n >= 10000 ? (n / 1000).toFixed(1).replace('.', ',') + ' k' : (n || 0).toLocaleString('fr-FR'));
    const posts = (net) => ((N[net] && N[net].posts) || []).concat(ph).slice(0, 12);
    const grid = (net, ratio) => `<div class="g3">${posts(net).map((u) => `<div class="ph" style="aspect-ratio:${ratio};background-image:url('${u}')"></div>`).join('')}</div>`;
    const ig = N.instagram || {}, tt = N.tiktok || {}, fb = N.facebook || {}, li = N.linkedin || {};
    const out = {
      instagram: `<div class="phone"><div class="bar"><span>${esc(ig.user || p.handle)} ▾</span><span>☰</span></div><div style="display:flex;gap:14px;align-items:center;padding:14px">${av(78, 1)}<div style="display:flex;gap:12px;text-align:center;font-size:12px"><div><b style="display:block;font-size:15px">${posts('instagram').length}</b>publications</div><div><b style="display:block;font-size:15px">${nf(p.ig)}</b>followers</div><div><b style="display:block;font-size:15px">${p.ig ? 180 : 12}</b>suivi(e)s</div></div></div><div style="padding:0 14px 10px;font-size:12px;line-height:1.45"><b>${esc(ig.name || p.n)}</b><br><span style="color:#737373">${esc(ig.cat || p.s)}</span><br>${esc(ig.bio || p.tagline)}<br><span style="color:#00376b">${esc(ig.link || p.domain)}</span></div><div class="pb"><div>Suivre</div><div>Message</div><div>${esc(ig.btn || 'Contacter')}</div></div>${grid('instagram', '1/1')}</div>`,
      tiktok: `<div class="phone tt"><div class="bar" style="border-color:#222"><span>${esc(p.main)}</span><span>⋯</span></div><div style="text-align:center;padding:16px 14px"><div style="margin:0 auto;width:84px">${av(84)}</div><div style="font-weight:700;margin-top:8px">@${esc(tt.user || p.handle)}</div><div style="display:flex;justify-content:center;gap:18px;margin:12px 0;font-size:12px"><div><b style="display:block;font-size:15px">24</b>Suivis</div><div><b style="display:block;font-size:15px">${p.so.includes('tiktok') ? '1,2 k' : '0'}</b>Followers</div><div><b style="display:block;font-size:15px">${p.so.includes('tiktok') ? '18,6 k' : '0'}</b>J'aime</div></div><div style="background:#fe2c55;border-radius:4px;padding:9px;font-weight:700;width:170px;margin:0 auto;font-size:13px">Suivre</div><div style="margin-top:10px;color:#ccc;font-size:12px">${esc(tt.bio || p.tagline)} · ${esc(tt.link || p.domain)}</div></div>${grid('tiktok', '3/4')}</div>`,
      facebook: `<div class="phone"><div class="bar"><span style="color:#1877f2">‹ ${esc(p.main)}</span><span>🔍</span></div><div class="ph" style="height:130px;background-image:url('${fb.cover || ph[0]}')"></div><div style="margin:-44px 0 0 14px;width:92px;height:92px;border-radius:50%;border:4px solid #fff;overflow:hidden">${p.avatar}</div><div style="padding:6px 14px"><div style="font-size:19px;font-weight:700">${esc(fb.name || p.n)}</div><div style="color:#65676b;font-size:13px">${p.fb ? nf(p.fb) + ' J\'aime' : 'Nouvelle page'} · ${esc(fb.cat || p.s)}</div></div><div class="pb"><div style="background:#1877f2;color:#fff">${esc(fb.btn || p.cta)}</div><div>Message</div><div>J'aime</div></div><div style="padding:0 14px 10px;color:#65676b;font-size:12px;line-height:1.5">${esc(fb.bio || p.intro)}<br>${esc(p.t)} · ${esc(p.hours[1])}</div><div style="border-top:6px solid #eee;padding:12px 14px;font-size:12px;line-height:1.45"><b>${esc(p.main)}</b> · à l'instant<br>${esc(fb.post || p.tagline)}<div class="ph" style="height:170px;border-radius:6px;margin-top:8px;background-image:url('${posts('facebook')[0]}')"></div></div></div>`,
      linkedin: `<div class="phone li"><div style="background:#fff;margin-bottom:8px"><div class="bar"><span style="color:#0a66c2">in</span><span style="font-weight:400;font-size:13px;color:#666">🔍 Rechercher</span></div><div class="ph" style="height:90px;background-image:url('${li.cover || ph[2]}')"></div><div style="margin:-36px 0 0 14px;width:72px;height:72px;border-radius:8px;overflow:hidden;border:3px solid #fff">${p.avatar}</div><div style="padding:8px 14px 12px"><div style="font-size:18px;font-weight:700">${esc(li.name || p.n)}</div><div style="font-size:13px">${esc(li.tag || p.tagline)}</div><div style="color:#666;font-size:12px;margin-top:4px">${esc(li.sector || p.s)} · ${esc(p.c)}, Gabon · ${esc(li.size || '11-50 employés')}</div></div><div class="pb"><div style="background:#0a66c2;color:#fff">+ Suivre</div><div>Visiter le site</div></div></div><div style="background:#fff;padding:12px 14px;font-size:12px;line-height:1.5"><b>À propos</b><br>${esc(li.about || p.intro)}</div></div>`,
    };
    const list = only ? [only] : ['instagram', 'tiktok', 'facebook', 'linkedin'];
    return list.map((n) => `<div>${out[n]}<div style="text-align:center;font:13px Inter,Arial;color:#5f6368;margin-top:10px">${{ instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', linkedin: 'LinkedIn' }[n]}</div></div>`).join('');
  }
  const PHONE_CSS = `.phone{border:10px solid #111;border-radius:38px;height:760px;overflow:hidden;background:#fff;font-family:Inter,Arial,sans-serif;color:#111}.phone .bar{height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;font-weight:700;font-size:15px;border-bottom:1px solid #eee}.phone .pb{margin:0 14px 12px;display:flex;gap:6px}.phone .pb div{flex:1;background:#efefef;border-radius:8px;padding:7px;text-align:center;font-weight:700;font-size:12px}.phone .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}.phone .ph{background-size:cover;background-position:center}.phone.tt{background:#000;color:#fff}.phone.li{background:#f4f2ee}`;

  // Réduit une image importée avant stockage
  function readImage(file, max = 900) {
    return new Promise((res) => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .78)); }; im.src = r.result; }; r.readAsDataURL(file); });
  }
  const get = (slug) => load()[slug] || {};
  const put = (slug, patch) => { const db = load(); db[slug] = Object.assign(db[slug] || {}, patch); return saveAll(db); };
  const remove = (slug) => { const db = load(); delete db[slug]; saveAll(db); };
  const isDynamic = (p) => p.custom || p.edited;
  window.NEAMSTORE = { load, get, put, remove, merge, phones, PHONE_CSS, readImage, slugify, esc, SECTORS, ROOT, isDynamic, avatarFor };
})();
