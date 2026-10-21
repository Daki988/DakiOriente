/* =========================================================
   NEAM — Assistant (chatbot)
   La fenêtre de discussion envoie la conversation à api/chat.php, qui répond
   avec l'IA (si la clé est configurée sur le serveur) ou avec les réponses
   préparées. Aucune clé n'est présente dans le navigateur.
   La conversation reste dans l'onglet (sessionStorage) : rien n'est enregistré ailleurs.
   ========================================================= */
(() => {
  const KEY = 'neam-chat';
  const MAX_KEEP = 40;
  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A2.5 2.5 0 0 1 4 13.5z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M8.5 9.5h7M8.5 12.5h4.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';
  const GREETING = 'Bonjour, je suis l’assistant de NEAM.\nJe réponds à vos questions sur nos services, nos produits, nos délais ou le diagnostic gratuit, et je vous oriente vers la bonne personne. Que puis-je faire pour vous ?';
  const START = ['Quels sont vos services ?', 'Combien coûte un site web ?', 'Comment être visible sur Google ?', 'Faire un diagnostic gratuit', 'Parler à un humain'];
  const HUMAN = {
    t: 'Avec plaisir. Notre équipe vous répond :\n- sur **WhatsApp** au 077 45 31 67 ;\n- par **téléphone** au 060 22 94 47, du lundi au samedi de 8 h 30 à 17 h 30 ;\n- par **e-mail** ou via le formulaire, avec une réponse sous **48 h ouvrées maximum**.',
    a: [
      { l: 'WhatsApp', h: 'https://wa.me/24177453167?text=Bonjour%20NEAM%2C%20je%20souhaite%20un%20diagnostic%20digital.' },
      { l: 'Appeler', h: 'tel:+24160229447' },
      { l: 'Formulaire de contact', h: 'contact.html' },
    ],
  };

  const store = {
    get() { try { return JSON.parse(sessionStorage.getItem(KEY)) || null; } catch (e) { return null; } },
    set(v) { try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } },
  };
  let state = store.get() || { open: false, msgs: [], chips: START, tip: false };
  const save = () => { state.msgs = state.msgs.slice(-MAX_KEEP); store.set(state); };

  // ---------- Construction ----------
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'chat-fab';
  fab.setAttribute('aria-label', 'Ouvrir l’assistant NEAM');
  fab.setAttribute('aria-controls', 'neamChat');
  fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML = ICON + (state.msgs.length ? '' : '<span class="chat-fab__dot" aria-hidden="true"></span>');

  const box = document.createElement('div');
  box.className = 'chat';
  box.id = 'neamChat';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Assistant NEAM');
  box.innerHTML = `
    <div class="chat__head">
      <span class="chat__avatar" aria-hidden="true">N</span>
      <div class="chat__who"><b>Assistant NEAM</b><span class="chat__status"><i></i>En ligne · répond en quelques secondes</span></div>
      <button type="button" class="chat__x" aria-label="Fermer l’assistant">×</button>
    </div>
    <div class="chat__log" role="log" aria-live="polite"></div>
    <div class="chat__chips"></div>
    <form class="chat__form">
      <textarea rows="1" maxlength="800" placeholder="Écrivez votre question…" aria-label="Votre message" enterkeyhint="send"></textarea>
      <button type="submit" class="chat__send" aria-label="Envoyer">→</button>
    </form>
    <p class="chat__note">Assistant automatique : il peut se tromper. N’indiquez pas de données sensibles. <a href="mentions-legales.html">Vos données</a> · <a href="contact.html">Écrire à l’équipe</a></p>`;

  document.body.append(fab, box);
  const log = box.querySelector('.chat__log');
  const chipsEl = box.querySelector('.chat__chips');
  const form = box.querySelector('.chat__form');
  const input = form.querySelector('textarea');
  const send = form.querySelector('.chat__send');

  // ---------- Affichage ----------
  const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const format = text => {
    const out = [];
    let list = null;
    text.split('\n').forEach(raw => {
      const line = raw.trim();
      if (/^[-•]\s+/.test(line)) {
        if (!list) { list = []; out.push(list); }
        list.push(line.replace(/^[-•]\s+/, ''));
      } else {
        list = null;
        if (line) out.push(line);
      }
    });
    return out.map(b => Array.isArray(b) ? '<ul>' + b.map(li => `<li>${inline(li)}</li>`).join('') + '</ul>' : `<p>${inline(b)}</p>`).join('');
  };
  const SAFE = /^(?:[a-z0-9-]+\.html(?:[?#][\w=&%.-]*)?|tel:\+?\d+|mailto:contact@neamindustry\.com|https:\/\/(?:wa\.me|www\.instagram\.com|gurutools\.pro|tremplin\.neamindustry\.com)\/[^\s"'<>]*)$/i;
  const acts = list => {
    const ok = (list || []).filter(x => x && x.l && SAFE.test(x.h || ''));
    if (!ok.length) return '';
    return '<div class="msg__acts">' + ok.map(x => {
      const ext = /^https:/.test(x.h);
      return `<a href="${esc(x.h)}"${ext ? ' target="_blank" rel="noopener"' : ''} data-chat-act>${esc(x.l)}${ext ? ' ↗' : ' →'}</a>`;
    }).join('') + '</div>';
  };
  const bubble = m => {
    const el = document.createElement('div');
    el.className = 'msg ' + (m.r === 'u' ? 'msg--me' : 'msg--bot');
    if (m.r === 'u') el.textContent = m.t;
    else el.innerHTML = format(m.t) + acts(m.a);
    return el;
  };
  const scroll = () => { log.scrollTop = log.scrollHeight; };
  const renderChips = () => {
    chipsEl.innerHTML = '';
    (state.chips || []).slice(0, 5).forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = c;
      b.addEventListener('click', () => ask(c));
      chipsEl.appendChild(b);
    });
  };
  const render = () => {
    log.innerHTML = '';
    log.appendChild(bubble({ r: 'a', t: GREETING }));
    state.msgs.forEach(m => log.appendChild(bubble(m)));
    renderChips();
    scroll();
  };

  // ---------- Ouverture ----------
  let tipEl = null;
  const hideTip = () => { if (tipEl) { tipEl.remove(); tipEl = null; } };
  const open = () => {
    hideTip();
    state.open = true; state.tip = true; save();
    render();
    box.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('chat-open');
    const dot = fab.querySelector('.chat-fab__dot');
    if (dot) dot.remove();
    if (matchMedia('(hover: hover)').matches) input.focus();
    neamTrack('chat_open');
  };
  const close = () => {
    state.open = false; save();
    box.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('chat-open');
    fab.focus();
  };
  fab.addEventListener('click', open);
  box.querySelector('.chat__x').addEventListener('click', close);
  box.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  log.addEventListener('click', e => {
    const a = e.target.closest('[data-chat-act]');
    if (a) neamTrack('chat_action', { target: a.getAttribute('href').split('?')[0] });
  });
  if (state.open && matchMedia('(min-width: 601px)').matches) open();

  // Petite bulle d'invitation, une seule fois par visite
  if (!state.tip) {
    setTimeout(() => {
      if (state.open || state.tip || document.body.classList.contains('is-loading')) return;
      state.tip = true; save();
      tipEl = document.createElement('div');
      tipEl.className = 'chat-tip';
      tipEl.innerHTML = 'Une question sur votre projet ? L’assistant NEAM vous répond tout de suite.<button type="button" aria-label="Masquer">×</button>';
      tipEl.addEventListener('click', e => { if (e.target.tagName === 'BUTTON') hideTip(); else open(); });
      document.body.appendChild(tipEl);
      setTimeout(hideTip, 12000);
    }, 9000);
  }

  // ---------- Envoi ----------
  let busy = false;
  const grow = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; };
  input.addEventListener('input', grow);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); }
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const t = input.value.trim();
    if (t) ask(t);
  });

  async function ask(text) {
    if (busy) return;
    text = text.slice(0, 800);
    state.msgs.push({ r: 'u', t: text });
    state.chips = [];
    input.value = ''; grow();
    log.appendChild(bubble({ r: 'u', t: text }));
    renderChips();
    scroll();
    neamTrack('chat_message', { n: state.msgs.filter(m => m.r === 'u').length });

    // Demande d'un interlocuteur humain : réponse immédiate, sans appel au serveur
    if (/^(parler|joindre|contacter).{0,20}(humain|quelqu|équipe|equipe|conseiller|personne)|^humain$/i.test(text)) {
      state.msgs.push({ r: 'a', t: HUMAN.t, a: HUMAN.a });
      state.chips = ['Faire un diagnostic gratuit', 'Quels sont vos services ?'];
      save(); render();
      return;
    }

    busy = true; send.disabled = true;
    const typing = document.createElement('div');
    typing.className = 'msg msg--bot msg--typing';
    typing.setAttribute('aria-label', 'L’assistant écrit…');
    typing.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(typing);
    scroll();

    const history = state.msgs.slice(-10).map(m => ({ role: m.r === 'u' ? 'user' : 'assistant', content: m.t }));
    const ctrl = 'AbortController' in window ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 45000) : 0;
    let reply;
    try {
      const res = await fetch('api/chat.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ messages: history, page: location.pathname }),
        signal: ctrl ? ctrl.signal : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.reply) throw new Error(data.error || `HTTP ${res.status}`);
      reply = { r: 'a', t: String(data.reply), a: (data.actions || []).map(x => ({ l: x.label, h: x.href })) };
      state.chips = Array.isArray(data.suggestions) ? data.suggestions.slice(0, 3).map(String) : [];
    } catch (err) {
      const limited = /trop|429/i.test(String(err && err.message));
      reply = {
        r: 'a',
        t: limited ? 'Vous m’avez posé beaucoup de questions en peu de temps. Réessayez dans quelques minutes, ou écrivez directement à notre équipe.' : 'Je n’arrive pas à répondre pour le moment. Notre équipe peut le faire directement : elle vous répond sous 48 h ouvrées maximum, et plus vite sur WhatsApp.',
        a: HUMAN.a,
      };
      state.chips = ['Parler à un humain'];
    }
    clearTimeout(timer);
    typing.remove();
    state.msgs.push(reply);
    save();
    log.appendChild(bubble(reply));
    renderChips();
    scroll();
    busy = false; send.disabled = false;
    if (matchMedia('(hover: hover)').matches) input.focus();
  }
})();
