/* ==========================================================
   Daki Oriente — suivi de commande
   Sources de données, dans l'ordre :
   1. les commandes passées sur cet appareil (stockées localement) ;
   2. la feuille de suivi en ligne (TRACKING.csvUrl), mise à jour par la boutique ;
   3. la commande d'exemple DO-DEMO24 (code 0000), pour la démonstration.
   ========================================================== */
(function () {
  "use strict";

  var TRACKING = {
    // Lien CSV d'une feuille Google Sheets publiée (Fichier > Partager > Publier sur le Web > CSV).
    // Colonnes attendues : voir docs/suivi-modele.csv. Laissez vide pour le mode démonstration.
    csvUrl: "",
    whatsapp: window.DO_CONFIG.whatsapp, // à régler dans assets/js/config.js
    demoRef: "DO-DEMO24",
    demoCode: "0000"
  };

  var STEPS = [
    { id: "commandee", label: "Commandée" },
    { id: "preparee", label: "Préparée" },
    { id: "en_route", label: "En cours de livraison" },
    { id: "livree", label: "Livrée" }
  ];
  var STEP_INDEX = { commandee: 0, preparee: 1, en_route: 2, tentative: 2, livree: 3 };
  var SLOTS = { "Matin (9 h – 12 h)": [9, 12], "Après-midi (12 h – 17 h)": [12, 17], "Soir (17 h – 21 h)": [17, 21] };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var fcfa = function (n) { return Number(n).toLocaleString("fr-FR").replace(/ | /g, " ") + " FCFA"; };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* navigation privée */ } }
  };
  var byId = {};
  (window.PRODUCTS || []).forEach(function (p) { byId[p.id] = p; });

  /* ---------- Dates ---------- */
  function hm(d) { return d.getHours() + " h " + String(d.getMinutes()).padStart(2, "0"); }
  function dayLabel(d) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var x = new Date(d); x.setHours(0, 0, 0, 0);
    var diff = Math.round((x - today) / 86400000);
    if (diff === 0) return "aujourd'hui";
    if (diff === 1) return "demain";
    if (diff === -1) return "hier";
    return x.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  }
  function windowFor(order) {
    // Créneau de 2 h : celui choisi par le client, ou calculé à partir de maintenant
    if (order.windowStart && order.windowEnd) return [new Date(order.windowStart), new Date(order.windowEnd)];
    var base = new Date(order.createdAt), s = new Date(base), slot = SLOTS[order.slot];
    s.setDate(s.getDate() + (base.getHours() >= 16 ? 1 : 0));
    if (slot) s.setHours(slot[0], 0, 0, 0); else { s = new Date(Math.max(Date.now(), base.getTime()) + 3600000); s.setMinutes(s.getMinutes() < 30 ? 15 : 45, 0, 0); }
    var e = new Date(s.getTime() + 2 * 3600000);
    return [s, e];
  }

  /* ---------- Stockage local des commandes ---------- */
  function localOrders() { return store.get("do_orders", []); }
  function saveLocal(order) {
    var all = localOrders().filter(function (o) { return o.ref !== order.ref; });
    all.unshift(order);
    store.set("do_orders", all.slice(0, 10));
  }

  function demoOrder() {
    var now = Date.now(), h = 3600000;
    return {
      ref: TRACKING.demoRef, code: TRACKING.demoCode, demo: true,
      items: [["E05", 1], ["H02", 1], ["P04", 1]], total: 31700,
      name: "Exemple", address: "Louis, près de la pharmacie", slot: "Après-midi (12 h – 17 h)", pay: "Airtel Money",
      status: "en_route", stopsBefore: 3, createdAt: new Date(now - 20 * h).toISOString(),
      windowStart: new Date(now + 0.6 * h).toISOString(), windowEnd: new Date(now + 2.6 * h).toISOString(),
      events: [
        { t: new Date(now - 20 * h).toISOString(), label: "Commande reçue", place: "Boutique en ligne" },
        { t: new Date(now - 18 * h).toISOString(), label: "Commande confirmée sur WhatsApp", place: "Libreville" },
        { t: new Date(now - 3 * h).toISOString(), label: "Colis neutre préparé et scellé", place: "Entrepôt, Libreville" },
        { t: new Date(now - 1 * h).toISOString(), label: "Le livreur a pris en charge votre colis", place: "Libreville" }
      ]
    };
  }

  /* ---------- Feuille de suivi en ligne (CSV) ---------- */
  function parseCSV(text) {
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    var head = rows.shift() || [];
    return rows.filter(function (r) { return r.join("").trim(); }).map(function (r) {
      var o = {}; head.forEach(function (h, k) { o[h.trim()] = (r[k] || "").trim(); }); return o;
    });
  }
  function fromSheet(row) {
    // events : "2026-10-08 12:28;En cours de livraison;Libreville | ..."
    var events = (row.events || "").split("|").map(function (e) {
      var p = e.split(";"); if (!p[0].trim()) return null;
      return { t: new Date(p[0].trim().replace(" ", "T")).toISOString(), label: (p[1] || "").trim(), place: (p[2] || "").trim() };
    }).filter(Boolean);
    var day = row.date_livraison || "";
    return {
      ref: row.ref, code: row.code, status: row.statut || "commandee", stopsBefore: Number(row.arrets_avant || 0),
      windowStart: day && row.creneau_debut ? new Date(day + "T" + row.creneau_debut).toISOString() : null,
      windowEnd: day && row.creneau_fin ? new Date(day + "T" + row.creneau_fin).toISOString() : null,
      deliveredAt: row.livree_a ? new Date(row.livree_a.replace(" ", "T")).toISOString() : null,
      note: row.message || "", events: events, fromSheet: true
    };
  }
  function lookupSheet(ref, code) {
    if (!TRACKING.csvUrl || !window.fetch) return Promise.resolve(null);
    return fetch(TRACKING.csvUrl + (TRACKING.csvUrl.indexOf("?") > -1 ? "&" : "?") + "t=" + Date.now())
      .then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (txt) {
        var row = parseCSV(txt).filter(function (r) { return (r.ref || "").toUpperCase() === ref && r.code === code; })[0];
        return row ? fromSheet(row) : null;
      })
      .catch(function () { return null; });
  }

  function findOrder(ref, code) {
    ref = ref.trim().toUpperCase(); code = code.trim();
    var local = localOrders().filter(function (o) { return o.ref === ref; })[0];
    return lookupSheet(ref, code).then(function (remote) {
      if (remote && local) { // la feuille fait foi pour le statut, l'appareil garde le détail du panier
        ["status", "stopsBefore", "windowStart", "windowEnd", "deliveredAt", "note"].forEach(function (k) { if (remote[k] != null && remote[k] !== "") local[k] = remote[k]; });
        if (remote.events.length) local.events = remote.events;
        return local;
      }
      if (remote) return remote;
      if (local && (local.code === code || !code)) return local;
      if (ref === TRACKING.demoRef && code === TRACKING.demoCode) return store.get("do_demo_order", null) || demoOrder();
      return null;
    });
  }

  /* ---------- Rendu ---------- */
  function headline(o) {
    var w = windowFor(o);
    switch (o.status) {
      case "livree":
        var d = o.deliveredAt ? new Date(o.deliveredAt) : new Date(((o.events || []).slice(-1)[0] || {}).t || Date.now());
        return { title: "Livrée " + dayLabel(d) + " à " + hm(d), sub: "Bonne découverte. Une question sur l'utilisation ? Écrivez-nous, sans gêne." };
      case "tentative":
        return { title: "Nous n'avons pas pu vous remettre le colis", sub: "Il reste chez nous, toujours scellé. Nouvelle tentative le prochain jour ouvré : ajoutez des instructions ou écrivez-nous pour choisir le créneau.", warn: true };
      case "en_route":
        return { title: "Arrive " + dayLabel(w[0]) + " entre " + hm(w[0]) + " et " + hm(w[1]), sub: o.stopsBefore > 0 ? "Votre livreur est en tournée." : "Votre colis sera livré au prochain arrêt. Restez joignable." };
      case "preparee":
        return { title: "Livraison prévue " + dayLabel(w[0]) + " entre " + hm(w[0]) + " et " + hm(w[1]), sub: "Votre colis neutre est prêt et scellé. Il part bientôt." };
      default:
        return { title: "Commande reçue, nous la préparons", sub: "Livraison prévue " + dayLabel(w[0]) + " entre " + hm(w[0]) + " et " + hm(w[1]) + ". Pensez à confirmer sur WhatsApp si ce n'est pas déjà fait." };
    }
  }

  function stepper(o) {
    var cur = STEP_INDEX[o.status] || 0;
    return '<ol class="trk-steps" aria-label="Progression de la livraison">' + STEPS.map(function (s, i) {
      var st = i < cur || (i === cur && o.status === "livree") ? "done" : i === cur ? "current" : "todo";
      if (i === cur && o.status === "tentative") st = "warn";
      return '<li class="trk-step trk-step--' + st + '"' + (st === "current" || st === "warn" ? ' aria-current="step"' : "") + '><span class="trk-step__dot"></span><span class="trk-step__label">' + (i === 2 && o.status === "tentative" ? "Tentative de livraison" : s.label) + "</span></li>";
    }).join("") + "</ol>";
  }

  function mapHTML(o) {
    // Plan stylisé : le point vert (livreur) se rapproche de votre adresse à chaque arrêt
    var n = Math.max(0, Math.min(8, o.stopsBefore || 0)), t = 1 - n / 8;
    var path = [[40, 210], [40, 150], [140, 150], [140, 90], [250, 90], [250, 50], [330, 50]];
    var segs = [], total = 0;
    for (var i = 1; i < path.length; i++) { var dx = path[i][0] - path[i - 1][0], dy = path[i][1] - path[i - 1][1], l = Math.hypot(dx, dy); segs.push(l); total += l; }
    var target = total * (0.15 + 0.8 * t), acc = 0, pos = path[0];
    for (var k = 0; k < segs.length; k++) {
      if (acc + segs[k] >= target) { var r = (target - acc) / segs[k]; pos = [path[k][0] + (path[k + 1][0] - path[k][0]) * r, path[k][1] + (path[k + 1][1] - path[k][1]) * r]; break; }
      acc += segs[k];
    }
    var bubble = n === 0 ? "Votre colis sera livré au prochain arrêt" : n === 1 ? "1 livraison avant la vôtre" : n + " livraisons avant la vôtre";
    var streets = "";
    [30, 70, 110, 150, 190, 230].forEach(function (y) { streets += '<line x1="0" y1="' + y + '" x2="400" y2="' + (y + 8) + '"/>'; });
    [20, 90, 140, 200, 250, 310, 370].forEach(function (x) { streets += '<line x1="' + x + '" y1="0" x2="' + (x - 10) + '" y2="260"/>'; });
    // Le fond s'étire à la taille du cadre ; le livreur et votre adresse sont placés en pourcentage, sans déformation
    var pct = function (pt) { return "left:" + (pt[0] / 4).toFixed(1) + "%;top:" + (pt[1] / 2.6).toFixed(1) + "%"; };
    return '<div class="trk-map"><svg viewBox="0 0 400 260" preserveAspectRatio="none" aria-hidden="true">' +
      '<rect width="400" height="260" class="trk-map__bg"/><g class="trk-map__streets">' + streets + "</g>" +
      '<rect x="270" y="150" width="90" height="70" rx="10" class="trk-map__park"/>' +
      '<polyline points="' + path.map(function (p) { return p.join(","); }).join(" ") + '" class="trk-map__route"/>' +
      "</svg>" +
      '<span class="trk-map__home" style="' + pct([330, 50]) + '" aria-hidden="true"></span>' +
      '<span class="trk-map__courier" style="' + pct(pos) + '" aria-hidden="true"></span>' +
      '<div class="trk-map__bubble" style="' + pct(pos) + '">' + bubble + "</div>" +
      '<span class="trk-map__live">Mis à jour ' + (o.updatedAt ? "à " + hm(new Date(o.updatedAt)) : "à l'instant") + "</span></div>";
  }

  function itemsHTML(o) {
    var items = (o.items || []).filter(function (it) { return byId[it[0]]; });
    if (!items.length) return "";
    return '<div class="trk-items">' + items.map(function (it) {
      var p = byId[it[0]];
      return '<span class="trk-item" title="' + esc(p.name) + '"><img src="assets/img/sm/' + p.id + '.jpg" alt="' + esc(p.name) + '" loading="lazy">' + (it[1] > 1 ? "<b>×" + it[1] + "</b>" : "") + "</span>";
    }).join("") + "</div>";
  }

  function historyHTML(o) {
    var ev = (o.events || []).slice().sort(function (a, b) { return new Date(b.t) - new Date(a.t); });
    if (!ev.length) return "";
    var html = "", lastDay = "";
    ev.forEach(function (e) {
      var d = new Date(e.t), day = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      if (day !== lastDay) { html += '<li class="trk-hist__day">' + day + "</li>"; lastDay = day; }
      html += '<li class="trk-hist__ev"><time>' + hm(d).replace(" h ", ":") + "</time><span><strong>" + esc(e.label) + "</strong>" + (e.place ? "<em>" + esc(e.place) + "</em>" : "") + "</span></li>";
    });
    return '<details class="trk-block trk-hist"' + (o.status === "tentative" ? " open" : "") + '><summary>Historique détaillé</summary><ol>' + html + "</ol></details>";
  }

  function maskAddress(a) {
    // Seul le quartier reste lisible
    if (!a) return "";
    return esc(String(a).split(",")[0].split(" ").slice(0, 3).join(" ")) + " · ••••••";
  }

  function instructionsForm(o) {
    var ins = o.instructions || {};
    return '<form class="trk-ins" id="trk-ins" hidden>' +
      "<h4>Instructions pour le livreur</h4>" +
      '<label>Code du portail, interphone ou repère<input id="trk-ins-code" name="code" value="' + esc(ins.code) + '" placeholder="Ex. : portail bleu, sonnette 2"></label>' +
      '<label>Si vous êtes absent·e<select id="trk-ins-absent" name="absent">' +
      ["Ne pas laisser le colis, me rappeler", "Le remettre au gardien", "Le remettre à un voisin de confiance", "Le déposer en point relais"].map(function (x) { return "<option" + (ins.absent === x ? " selected" : "") + ">" + x + "</option>"; }).join("") + "</select></label>" +
      '<label>Ce que le livreur annonce<select id="trk-ins-say" name="say">' +
      ["« Livraison pour vous »", "Le nom de l'expéditeur : DO Distribution", "Seulement mon prénom"].map(function (x) { return "<option" + (ins.say === x ? " selected" : "") + ">" + x + "</option>"; }).join("") + "</select></label>" +
      '<label>Autre précision<textarea id="trk-ins-note" name="note" rows="2" placeholder="Ex. : appelez-moi en arrivant, je descends">' + esc(ins.note) + "</textarea></label>" +
      '<div class="trk-ins__actions"><button class="btn btn--primary" type="submit">Enregistrer et prévenir le livreur</button><button class="btn btn--outline" type="button" data-trk="close-ins">Annuler</button></div>' +
      "</form>";
  }

  var current = null;
  function render(o) {
    current = o;
    var h = headline(o), res = $("#trk-result");
    res.innerHTML =
      '<article class="trk-card' + (h.warn ? " trk-card--warn" : "") + '">' +
      '<header class="trk-head"><div><span class="label">Commande ' + esc(o.ref) + (o.demo ? ' · <span class="trk-demo">exemple</span>' : "") + "</span>" +
      "<h3>" + h.title + "</h3><p>" + h.sub + "</p>" + (o.note ? '<p class="trk-note">' + esc(o.note) + "</p>" : "") + "</div>" + itemsHTML(o) + "</header>" +
      (o.status === "en_route" ? mapHTML(o) : "") +
      '<div class="trk-block">' + stepper(o) + "</div>" +
      '<div class="trk-actions">' +
      '<button class="trk-action" data-trk="ins"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>' + (o.instructions ? "Modifier mes instructions" : "Ajouter des instructions pour la livraison") + "</button>" +
      '<button class="trk-action" data-trk="share"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>Partager le suivi</button>' +
      '<a class="trk-action" target="_blank" rel="noopener" href="https://wa.me/' + TRACKING.whatsapp + "?text=" + encodeURIComponent("Bonjour, j'ai une question sur ma commande " + o.ref + ".") + '"><svg viewBox="0 0 24 24"><path d="M4 20l1.5-4A8 8 0 1112 20a8 8 0 01-4-1L4 20z"/></svg>Écrire au livreur</a>' +
      "</div>" + instructionsForm(o) +
      '<p class="trk-sent" id="trk-ins-sent" hidden>✓ Instructions enregistrées. <a target="_blank" rel="noopener" href="#">Les envoyer au livreur sur WhatsApp →</a></p>' +
      (o.demo ? '<div class="trk-demo-bar"><span>Mode démonstration : faites avancer la livraison pour voir chaque étape.</span><button class="btn btn--outline btn--sm" data-trk="next">Étape suivante</button><button class="btn btn--sm trk-link" data-trk="reset">Recommencer</button></div>' : "") +
      '<div class="trk-grid">' +
      '<div class="trk-block"><h4>Livraison discrète</h4><p>Livreur Daki Oriente<br>Numéro de suivi : <strong class=\"nowrap\">' + esc(o.ref) + "</strong></p><p class=\"muted small\">Colis marron sans logo. Expéditeur indiqué : DO Distribution.</p></div>" +
      (o.address ? '<div class="trk-block"><h4>Adresse de livraison</h4><p>' + esc(o.name || "") + "<br>" + maskAddress(o.address) + '</p><p class="muted small">Adresse masquée sur cet écran, par discrétion.</p></div>' : "") +
      (o.total ? '<div class="trk-block"><h4>Paiement à la livraison</h4><p><strong>' + fcfa(o.total) + "</strong><br>" + esc(o.pay || "") + "</p></div>" : "") +
      "</div>" + historyHTML(o) + "</article>";
    res.hidden = false;
    renderList();
  }

  function renderList() {
    var list = localOrders(), el = $("#trk-mine");
    if (!list.length) { el.innerHTML = '<p class="muted small">Astuce : essayez la commande d\'exemple <button class="trk-link" data-trk="demo">' + TRACKING.demoRef + "</button>, code " + TRACKING.demoCode + ".</p>"; return; }
    el.innerHTML = '<p class="trk-mine__title">Vos commandes sur cet appareil</p>' + list.map(function (o) {
      return '<button class="trk-chip' + (current && current.ref === o.ref ? " is-active" : "") + '" data-trk-open="' + esc(o.ref) + '"><strong>' + esc(o.ref) + "</strong><span>" + (STEPS[STEP_INDEX[o.status] || 0].label) + "</span></button>";
    }).join("") + '<button class="trk-chip" data-trk="demo"><strong>' + TRACKING.demoRef + "</strong><span>Exemple</span></button>";
  }

  /* ---------- Démonstration : faire avancer la commande ---------- */
  function advanceDemo() {
    var o = current, now = new Date();
    var push = function (label, place) { o.events = o.events || []; o.events.push({ t: now.toISOString(), label: label, place: place || "Libreville" }); };
    if (o.status === "commandee") { o.status = "preparee"; push("Colis neutre préparé et scellé", "Entrepôt, Libreville"); }
    else if (o.status === "preparee") {
      o.status = "en_route"; o.stopsBefore = 4;
      var s = new Date(now.getTime() + 45 * 60000); o.windowStart = s.toISOString(); o.windowEnd = new Date(s.getTime() + 2 * 3600000).toISOString();
      push("Le livreur a pris en charge votre colis");
    }
    else if (o.status === "en_route" && o.stopsBefore > 0) { o.stopsBefore--; if (o.stopsBefore === 0) push("Vous êtes le prochain arrêt"); }
    else if (o.status === "en_route") { o.status = "livree"; o.deliveredAt = now.toISOString(); push("Colis remis en main propre", (o.address || "Libreville").split(",")[0]); }
    else if (o.status === "livree") { o.status = "commandee"; o.stopsBefore = 0; o.deliveredAt = null; o.windowStart = o.windowEnd = null; o.events = (o.events || []).slice(0, 1); }
    else if (o.status === "tentative") { o.status = "en_route"; o.stopsBefore = 2; push("Nouvelle tentative de livraison"); }
    o.updatedAt = now.toISOString();
    persist(o); render(o);
  }
  function persist(o) {
    if (o.ref === TRACKING.demoRef) store.set("do_demo_order", o); else if (!o.fromSheet) saveLocal(o);
  }

  function copy(text) {
    var done = function () { toast("Lien de suivi copié"); };
    try {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); });
    } catch (e) { fallbackCopy(text); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("Lien de suivi copié"); } catch (e) { toast(text); }
    ta.remove();
  }
  function toast(msg) {
    var t = $("#toast"); if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }

  /* ---------- Événements ---------- */
  function lookup(ref, code) {
    var msg = $("#trk-msg"); msg.textContent = "Recherche en cours…";
    return findOrder(ref, code).then(function (o) {
      if (!o) { msg.textContent = "Aucune commande ne correspond. Vérifiez le numéro (ex. : DO-K3F9QZ) et les 4 derniers chiffres de votre téléphone."; $("#trk-result").hidden = true; return; }
      msg.textContent = ""; render(o);
      $("#trk-result").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
  if (document.readyState !== "loading") init();
  var inited = false;
  function init() {
    if (inited || !$("#suivi")) return; inited = true;
    $("#trk-form").addEventListener("submit", function (e) {
      e.preventDefault();
      lookup($("#trk-ref").value, $("#trk-code").value);
    });
    $("#suivi").addEventListener("click", function (e) {
      var b = e.target.closest("[data-trk], [data-trk-open]"); if (!b) return;
      var a = b.dataset.trk;
      if (b.dataset.trkOpen) { var o = localOrders().filter(function (x) { return x.ref === b.dataset.trkOpen; })[0]; if (o) { $("#trk-ref").value = o.ref; $("#trk-code").value = o.code || ""; lookup(o.ref, o.code || ""); } }
      else if (a === "demo") { $("#trk-ref").value = TRACKING.demoRef; $("#trk-code").value = TRACKING.demoCode; lookup(TRACKING.demoRef, TRACKING.demoCode); }
      else if (a === "next") advanceDemo();
      else if (a === "reset") { store.set("do_demo_order", null); render(demoOrder()); }
      else if (a === "ins") { var f = $("#trk-ins"); f.hidden = !f.hidden; if (!f.hidden) $("#trk-ins-code").focus(); }
      else if (a === "close-ins") $("#trk-ins").hidden = true;
      else if (a === "share") copy("Suivi de colis DO Distribution, commande " + current.ref + " : " + location.href.split("#")[0] + "#suivi");
    });
    $("#suivi").addEventListener("submit", function (e) {
      if (e.target.id !== "trk-ins") return;
      e.preventDefault();
      var f = new FormData(e.target);
      current.instructions = { code: f.get("code"), absent: f.get("absent"), say: f.get("say"), note: f.get("note") };
      persist(current);
      var txt = "Instructions de livraison pour la commande " + current.ref + " :\n" +
        (current.instructions.code ? "• Repère / code : " + current.instructions.code + "\n" : "") +
        "• Si absent·e : " + current.instructions.absent + "\n• À annoncer : " + current.instructions.say +
        (current.instructions.note ? "\n• Précision : " + current.instructions.note : "");
      render(current);
      $("#trk-ins-sent").hidden = false;
      $("#trk-ins-sent a").href = "https://wa.me/" + TRACKING.whatsapp + "?text=" + encodeURIComponent(txt);
    });
    renderList();
  }

  /* API utilisée par la boutique au moment de la commande */
  window.DOTrack = {
    save: function (order) { saveLocal(order); renderList(); },
    open: function (ref, code) {
      $("#trk-ref").value = ref; $("#trk-code").value = code || "";
      $("#suivi").scrollIntoView({ behavior: "smooth" });
      lookup(ref, code || "");
    }
  };
})();
