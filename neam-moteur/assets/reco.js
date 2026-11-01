// NEAM Atelier : bouton WhatsApp flottant des sites + surlignage d'une recommandation du digital score.
// Usage : <script src=".../assets/reco.js" data-slug="..." data-wa="241..."></script>
// Lien de démonstration : page.html?hl=<sélecteur CSS | autre sélecteur>&ht=<texte>
(function () {
  const me = document.currentScript;
  const base = me.src.replace(/assets\/reco\.js.*$/, '');
  const slug = me.dataset.slug || new URLSearchParams(location.search).get('slug') || '';
  const wa = me.dataset.wa;

  const css = document.createElement('style');
  css.textContent = `
  .neam-wa{position:fixed;right:18px;bottom:18px;z-index:900;width:58px;height:58px;border-radius:50%;background:#25d366;display:grid;place-items:center;box-shadow:0 10px 30px rgba(0,0,0,.28);transition:transform .25s}
  .neam-wa:hover{transform:scale(1.08)}.neam-wa svg{width:30px;height:30px}
  .neam-wa:after{content:'';position:absolute;inset:0;border-radius:50%;border:2px solid #25d366;animation:neamPing 2.2s infinite}
  @keyframes neamPing{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.6);opacity:0}}
  .neam-tag{display:none!important}
  .neam-hl{outline:3px solid #FFE309!important;outline-offset:6px;box-shadow:0 0 0 9999px rgba(0,0,0,.42)!important;border-radius:8px;animation:neamHl 1.6s ease-in-out 3}
  @keyframes neamHl{50%{outline-color:#F5AD10;outline-offset:12px}}
  .neam-tip{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2000;background:#0b0c0d;color:#fff;font:500 14px/1.45 Arial,sans-serif;padding:12px 16px;border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.4);max-width:min(560px,calc(100vw - 24px));display:flex;gap:12px;align-items:center}
  .neam-tip b{color:#FFE309}.neam-tip a{color:#111;background:#FFE309;border-radius:999px;padding:7px 12px;font-weight:700;text-decoration:none;white-space:nowrap;font-size:13px}
  .neam-tip button{background:none;border:0;color:#aaa;font-size:20px;cursor:pointer}
  @media(max-width:600px){.neam-wa{width:52px;height:52px;right:12px;bottom:12px}.neam-tip{font-size:13px;top:auto;bottom:76px}}`;
  document.head.appendChild(css);

  const WA = '<svg viewBox="0 0 448 512" fill="#fff"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>';
  // Bouton WhatsApp flottant (sites clients uniquement)
  if (wa) {
    const a = document.createElement('a');
    a.className = 'neam-wa'; a.href = `https://wa.me/${wa}`; a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', 'Écrire sur WhatsApp');
    a.innerHTML = WA;
    document.body.appendChild(a);
  }

  // Surlignage d'une recommandation appliquée
  const q = new URLSearchParams(location.search);
  const hl = q.get('hl'); if (!hl) return;
  const text = q.get('ht') || 'Recommandation appliquée';
  const tip = document.createElement('div');
  tip.className = 'neam-tip';
  tip.innerHTML = `<span>✓ <b>Recommandation appliquée</b><br>${text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</span>${slug ? `<a href="${base}score.html?slug=${encodeURIComponent(slug)}">← Digital score</a>` : ''}<button aria-label="Fermer">×</button>`;
  tip.querySelector('button').onclick = () => { tip.remove(); document.querySelectorAll('.neam-hl').forEach((e) => e.classList.remove('neam-hl')); };
  document.body.appendChild(tip);
  const sels = hl.split('|').map((s) => s.trim()).filter(Boolean);
  let tries = 0;
  const find = () => {
    for (const s of sels) {
      let els = []; try { els = [...document.querySelectorAll(s)]; } catch (e) { continue; }
      const el = els.find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(() => el.classList.add('neam-hl'), 350);
        setTimeout(() => el.classList.remove('neam-hl'), 9000);
        return;
      }
    }
    if (++tries < 30) setTimeout(find, 150);
  };
  if (document.readyState === 'complete') setTimeout(find, 200); else addEventListener('load', () => setTimeout(find, 200));
})();
