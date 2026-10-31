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

  // Bouton WhatsApp flottant (sites clients uniquement)
  if (wa) {
    const a = document.createElement('a');
    a.className = 'neam-wa'; a.href = `https://wa.me/${wa}`; a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', 'Écrire sur WhatsApp');
    a.innerHTML = '<svg viewBox="0 0 32 32" fill="#fff"><path d="M16 3a13 13 0 00-11.2 19.6L3 29l6.6-1.7A13 13 0 1016 3zm0 23.6a10.6 10.6 0 01-5.4-1.5l-.4-.2-3.9 1 1-3.8-.2-.4A10.6 10.6 0 1116 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.7 8.7 0 01-4.3-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 00-.9.4 3.6 3.6 0 00-1.1 2.7 6.3 6.3 0 001.3 3.3 14.4 14.4 0 005.5 4.9c2 .9 2.8.9 3.8.8a3.2 3.2 0 002.1-1.5 2.6 2.6 0 00.2-1.5c-.1-.2-.3-.3-.6-.4z"/></svg>';
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
