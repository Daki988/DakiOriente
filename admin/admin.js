/* ==========================================================
   Daki Oriente — back-office
   Commandes, produits, réglages et lettre d'information.
   Le jeton de session reste dans l'onglet (sessionStorage) et expire après 12 h.
   ========================================================== */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var fcfa = function (n) { return Number(n || 0).toLocaleString("fr-FR").replace(/ | /g, " ") + " FCFA"; };
  var when = function (iso) { return iso ? new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""; };
  var session = {
    get: function () { try { return sessionStorage.getItem("do_admin") || ""; } catch (e) { return ""; } },
    set: function (v) { try { v ? sessionStorage.setItem("do_admin", v) : sessionStorage.removeItem("do_admin"); } catch (e) { /* onglet privé */ } }
  };

  var STATUSES = [
    ["commandee", "Commandée"], ["preparee", "Préparée"], ["en_route", "En livraison"],
    ["tentative", "Tentative"], ["livree", "Livrée"], ["annulee", "Annulée"]
  ];
  var LABEL = {}; STATUSES.forEach(function (s) { LABEL[s[0]] = s[1]; });
  var LEGAL_FIELDS = [
    ["name", "Raison sociale ou nom commercial"], ["form", "Forme juridique (SARL, SAS, entreprise individuelle…)"],
    ["rccm", "N° RCCM"], ["nif", "NIF"], ["address", "Adresse du siège"], ["email", "E-mail de contact"],
    ["phone", "Téléphone de contact"], ["director", "Directeur·rice de la publication"]
  ];

  var data = { orders: [], catalog: null, settings: null, subscribers: [] };
  var ui = { tab: "dash", order: null, product: null, dirty: false };

  /* ---------- Outils ---------- */
  var toastTimer;
  function toast(msg, bad) {
    var t = $("#toast");
    t.textContent = msg; t.classList.toggle("is-bad", !!bad); t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }

  function api(path, opts) {
    opts = opts || {};
    var headers = opts.headers || {};
    headers.authorization = "Bearer " + session.get();
    if (opts.json !== undefined) { headers["content-type"] = "application/json"; opts.body = JSON.stringify(opts.json); }
    return fetch("/api/admin/" + path, { method: opts.method || "GET", headers: headers, body: opts.body, cache: "no-store" })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (b) {
          if (r.status === 401) { logout(); throw new Error(b.error || "Session expirée."); }
          if (!r.ok) throw new Error(b.error || "Erreur " + r.status);
          return b;
        });
      });
  }

  function imgSrc(p) {
    if (p.img) return /^(\/|https?:)/.test(p.img) ? p.img : "../" + p.img;
    return "../assets/img/sm/" + p.id + ".jpg";
  }

  /* ---------- Connexion ---------- */
  function showLogin() { $("#app").hidden = true; $("#login").hidden = false; $("#login-form [name=password]").focus(); }
  function logout() { session.set(""); showLogin(); }

  $("#login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = $("button", e.target), err = $("#login-err");
    btn.disabled = true; err.textContent = "";
    fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: e.target.password.value }) })
      .then(function (r) { return r.json().then(function (b) { if (!r.ok) throw new Error(b.error || "Connexion impossible."); return b; }); })
      .then(function (b) { session.set(b.token); e.target.reset(); start(); })
      .catch(function (x) { err.textContent = x.message; })
      .then(function () { btn.disabled = false; });
  });
  $("#logout").addEventListener("click", logout);

  /* ---------- Onglets ---------- */
  function tab(name) {
    if (ui.tab === "products" && name !== "products" && ui.dirty && !window.confirm("Des modifications de produits ne sont pas publiées. Quitter quand même ?")) return;
    ui.tab = name;
    $$("#tabs button").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-tab") === name); });
    $$("[data-panel]").forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== name; });
    if (name === "dash") renderDash();
    if (name === "orders") renderOrders();
    if (name === "products") renderProducts();
    if (name === "settings") renderSettings();
    if (name === "newsletter") loadNewsletter();
  }
  $("#tabs").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) tab(b.getAttribute("data-tab")); });

  /* ---------- Chargement ---------- */
  function loadOrders() {
    return api("orders").then(function (b) {
      data.orders = b.orders || [];
      var n = data.orders.filter(function (o) { return o.status === "commandee"; }).length;
      $("#count-new").textContent = n ? n : "";
    });
  }
  function loadAll() {
    return Promise.all([
      loadOrders(),
      api("catalog").then(function (b) { data.catalog = b; }),
      api("settings").then(function (b) { data.settings = b; })
    ]);
  }

  function start() {
    $("#login").hidden = true; $("#app").hidden = false;
    loadAll().then(function () { tab(ui.tab); }).catch(function (e) { toast(e.message, true); });
  }

  /* ---------- Tableau de bord ---------- */
  function renderDash() {
    var o = data.orders, now = new Date();
    var open = o.filter(function (x) { return ["commandee", "preparee", "en_route", "tentative"].indexOf(x.status) > -1; });
    var month = o.filter(function (x) { var d = new Date(x.deliveredAt || 0); return x.status === "livree" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    var ca = month.reduce(function (s, x) { return s + (x.total || 0); }, 0);
    var s = data.settings || { legal: {} }, legal = s.legal || {};
    var missing = LEGAL_FIELDS.filter(function (f) { return !legal[f[0]]; });
    var published = data.catalog && Array.isArray(data.catalog.products) && data.catalog.products.length;
    var check = [
      [published, "Catalogue publié depuis l'onglet Produits (les prix sont alors vérifiés côté serveur à chaque commande)."],
      [!missing.length, missing.length ? "Informations légales à compléter dans Réglages : " + missing.map(function (f) { return f[1]; }).join(", ") + "." : "Informations légales complètes (mentions légales, CGV)."],
      [!!s.phone, "Numéro de téléphone de la boutique renseigné (affiché au client après sa commande)."],
      [null, "Déclaration du traitement des données clients auprès de l'APDPVP, y compris le stockage hors du Gabon (Union européenne)."],
      [null, "Relecture des CGV et de la communication par un·e juriste gabonais·e (article 313 du Code pénal)."],
      [null, "Retirer la protection par mot de passe du site (Netlify) une fois tout validé."]
    ];
    $("#panel-dash").innerHTML =
      '<div class="kpis">' +
      '<div class="kpi"><span>À confirmer</span><b>' + o.filter(function (x) { return x.status === "commandee"; }).length + "</b></div>" +
      '<div class="kpi"><span>En cours</span><b>' + open.length + "</b></div>" +
      '<div class="kpi"><span>Livrées ce mois-ci</span><b>' + month.length + "</b></div>" +
      '<div class="kpi"><span>Encaissé ce mois-ci</span><b>' + fcfa(ca) + "</b></div>" +
      "</div>" +
      '<div class="card"><h2>Avant l\'ouverture au public</h2><ul class="todo-list">' +
      check.map(function (c) { return "<li><span class=\"" + (c[0] ? "okk\">✓" : "ko\">" + (c[0] === null ? "○" : "!")) + "</span><span>" + esc(c[1]) + "</span></li>"; }).join("") +
      "</ul></div>";
  }

  /* ---------- Commandes ---------- */
  $("#o-filter").addEventListener("change", renderOrders);
  $("#o-search").addEventListener("input", renderOrders);
  $("#o-refresh").addEventListener("click", function () { loadOrders().then(renderOrders).then(function () { toast("Commandes à jour."); }).catch(function (e) { toast(e.message, true); }); });

  function filtered() {
    var f = $("#o-filter").value, q = $("#o-search").value.trim().toLowerCase();
    return data.orders.filter(function (o) {
      if (f === "open" && ["livree", "annulee"].indexOf(o.status) > -1) return false;
      if (f !== "open" && f !== "all" && o.status !== f) return false;
      if (!q) return true;
      var c = o.customer || {};
      return [o.ref, c.name, c.phone, c.address].join(" ").toLowerCase().indexOf(q) > -1;
    });
  }

  function renderOrders() {
    var list = filtered();
    $("#o-list").innerHTML = list.length ? list.map(function (o) {
      var c = o.customer || {};
      return '<button class="row' + (ui.order === o.ref ? " is-on" : "") + '" data-ref="' + esc(o.ref) + '">' +
        "<b>" + esc(o.ref) + " · " + esc(c.name || "—") + '</b><span class="st st--' + o.status + '">' + LABEL[o.status] + "</span>" +
        "<small>" + when(o.createdAt) + " · " + esc((c.address || "").slice(0, 40)) + "</small><small>" + fcfa(o.total) + "</small></button>";
    }).join("") : '<p class="empty">Aucune commande ici.</p>';
    renderOrder();
  }
  $("#o-list").addEventListener("click", function (e) { var r = e.target.closest("[data-ref]"); if (r) { ui.order = r.getAttribute("data-ref"); renderOrders(); } });

  function pad(n) { return String(n).padStart(2, "0"); }
  function dateVal(iso) { if (!iso) return ""; var d = new Date(iso); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function timeVal(iso) { if (!iso) return ""; var d = new Date(iso); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }

  function renderOrder() {
    var box = $("#o-detail"), o = data.orders.filter(function (x) { return x.ref === ui.order; })[0];
    if (!o) { box.innerHTML = '<p class="empty">Choisissez une commande à gauche.</p>'; return; }
    var c = o.customer || {}, tel = (c.phone || "").replace(/[^\d+]/g, "");
    var wa = tel.replace(/\D/g, ""); if (wa.length === 8 || wa.length === 9) wa = "241" + wa.replace(/^0/, "");
    box.innerHTML =
      '<div class="d-head"><div><h2>' + esc(o.ref) + '</h2><small class="hint">Reçue le ' + when(o.createdAt) + " · code de suivi " + esc(o.code) + '</small></div><span class="st st--' + o.status + '">' + LABEL[o.status] + "</span></div>" +
      '<div class="grid2">' +
      "<div><h3>Client·e</h3>" + (c.purged ? '<p class="purged">Coordonnées effacées le ' + when(c.purged) + " (30 jours après la clôture).</p>" :
        '<dl class="kv"><dt>Nom</dt><dd>' + esc(c.name) + "</dd><dt>Téléphone</dt><dd>" + (tel ? '<a href="tel:' + esc(tel) + '">' + esc(c.phone) + "</a>" : "—") +
        (wa ? ' · <a href="https://wa.me/' + wa + '" target="_blank" rel="noopener">WhatsApp</a>' : "") + "</dd>" +
        "<dt>Adresse</dt><dd>" + esc(c.address) + "</dd><dt>Créneau</dt><dd>" + esc(c.slot || "—") + "</dd><dt>Paiement</dt><dd>" + esc(c.pay || "—") + "</dd>" +
        "<dt>Appel</dt><dd>" + (c.call ? "Souhaite être appelé·e avant la livraison" : "Pas d'appel demandé") + "</dd></dl>") + "</div>" +
      "<div><h3>Panier</h3><table class=\"lines\">" + (o.items || []).map(function (l) { return "<tr><td>" + l.qty + " × " + esc(l.name || l.id) + " <small>(" + esc(l.id) + ")</small></td><td>" + fcfa(l.price * l.qty) + "</td></tr>"; }).join("") +
      "<tr><td>Livraison</td><td>" + (o.ship ? fcfa(o.ship) : "Offerte") + "</td></tr><tr><td>Total à encaisser</td><td>" + fcfa(o.total) + "</td></tr></table></div>" +
      "</div>" +
      "<h3>Statut</h3><div class=\"steps\" id=\"o-steps\">" + STATUSES.map(function (s) { return '<button data-st="' + s[0] + '"' + (o.status === s[0] ? ' class="is-on"' : "") + ">" + s[1] + "</button>"; }).join("") + "</div>" +
      '<form class="form" id="o-form" style="margin-top:16px">' +
      '<fieldset><legend>Livraison (visible par le client)</legend>' +
      '<label>Jour<input type="date" name="day" value="' + dateVal(o.windowStart) + '"></label>' +
      '<label>Arrêts avant le sien<input type="number" min="0" max="50" name="stopsBefore" value="' + (o.stopsBefore || 0) + '"></label>' +
      '<label>De<input type="time" name="from" value="' + timeVal(o.windowStart) + '"></label>' +
      '<label>À<input type="time" name="to" value="' + timeVal(o.windowEnd) + '"></label>' +
      '<label class="full">Message au client <small>(affiché sur la page de suivi : restez neutre, sans nommer les produits)</small><input name="note" maxlength="300" value="' + esc(o.note) + '"></label>' +
      '<label class="full">Ajouter une étape au suivi <small>(facultatif)</small><input name="event" maxlength="120" placeholder="Ex. : Le livreur arrive dans votre quartier"></label>' +
      "</fieldset>" +
      '<label>Note interne <small>(jamais visible par le client)</small><textarea name="internal" maxlength="500">' + esc(o.internal) + "</textarea></label>" +
      '<div class="actions"><button class="btn btn--primary" type="submit">Enregistrer</button><button class="btn btn--ghost" type="button" id="o-del">Supprimer la commande</button></div>' +
      '<div class="confirm" id="o-confirm" hidden>Supprimer définitivement ' + esc(o.ref) + ' ? <button class="btn btn--danger btn--sm" type="button" id="o-del-yes">Oui, supprimer</button><button class="btn btn--ghost btn--sm" type="button" id="o-del-no">Annuler</button></div>' +
      "</form>" +
      "<h3>Historique</h3><ul class=\"events\">" + (o.events || []).slice().reverse().map(function (ev) { return "<li><time>" + when(ev.t) + "</time>" + esc(ev.label) + (ev.place ? " · " + esc(ev.place) : "") + "</li>"; }).join("") + "</ul>";

    $("#o-steps").addEventListener("click", function (e) {
      var b = e.target.closest("[data-st]"); if (!b || b.classList.contains("is-on")) return;
      patch(o.ref, { status: b.getAttribute("data-st") }, "Statut mis à jour : " + LABEL[b.getAttribute("data-st")] + ".");
    });
    $("#o-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target, body = { stopsBefore: f.stopsBefore.value, note: f.note.value, internal: f.internal.value };
      if (f.day.value && f.from.value && f.to.value) {
        body.windowStart = new Date(f.day.value + "T" + f.from.value).toISOString();
        body.windowEnd = new Date(f.day.value + "T" + f.to.value).toISOString();
      } else if (!f.day.value) { body.windowStart = null; body.windowEnd = null; }
      if (f.event.value.trim()) body.event = { label: f.event.value.trim(), place: "Libreville" };
      patch(o.ref, body, "Commande enregistrée.");
    });
    $("#o-del").addEventListener("click", function () { $("#o-confirm").hidden = false; });
    $("#o-del-no").addEventListener("click", function () { $("#o-confirm").hidden = true; });
    $("#o-del-yes").addEventListener("click", function () {
      api("orders/" + encodeURIComponent(o.ref), { method: "DELETE" }).then(function () {
        data.orders = data.orders.filter(function (x) { return x.ref !== o.ref; }); ui.order = null; renderOrders(); toast("Commande supprimée.");
      }).catch(function (e) { toast(e.message, true); });
    });
  }

  function patch(ref, body, msg) {
    api("orders/" + encodeURIComponent(ref), { method: "PATCH", json: body }).then(function (b) {
      data.orders = data.orders.map(function (x) { return x.ref === ref ? b.order : x; });
      $("#count-new").textContent = data.orders.filter(function (o) { return o.status === "commandee"; }).length || "";
      renderOrders(); toast(msg);
    }).catch(function (e) { toast(e.message, true); });
  }

  /* ---------- Produits ---------- */
  var products = null, categories = null;
  function ensureCatalog() {
    if (products) return;
    var c = data.catalog || {};
    var fromServer = Array.isArray(c.products) && c.products.length;
    products = JSON.parse(JSON.stringify(fromServer ? c.products : window.PRODUCTS || []));
    categories = JSON.parse(JSON.stringify(Array.isArray(c.categories) && c.categories.length ? c.categories : window.CATEGORIES || []));
    $("#p-hint").textContent = fromServer
      ? "Catalogue en ligne, mis à jour le " + when(c.updatedAt) + ". Vos changements ne sont visibles qu'après « Publier les modifications »."
      : "Le catalogue n'a encore jamais été publié : la boutique affiche le catalogue de départ. Vérifiez-le puis cliquez sur « Publier les modifications ».";
  }
  function setDirty(v) { ui.dirty = v; $("#p-save").textContent = v ? "Publier les modifications •" : "Publier les modifications"; }

  $("#p-search").addEventListener("input", renderProductList);
  function renderProducts() { ensureCatalog(); renderProductList(); renderProduct(); }
  function renderProductList() {
    var q = $("#p-search").value.trim().toLowerCase();
    var catLabel = {}; categories.forEach(function (c) { catLabel[c.id] = c.short || c.label; });
    $("#p-list").innerHTML = products.filter(function (p) { return !q || (p.id + " " + p.name).toLowerCase().indexOf(q) > -1; }).map(function (p) {
      var flag = p.hidden ? "Masqué" : p.stock === 0 ? "Épuisé" : p.stock != null ? "Stock " + p.stock : "";
      return '<button class="row row--p' + (ui.product === p.id ? " is-on" : "") + '" data-id="' + esc(p.id) + '"><img class="thumb" src="' + esc(imgSrc(p)) + '" alt="" loading="lazy">' +
        "<b>" + esc(p.name) + "</b><small>" + fcfa(p.price) + "</small><small>" + esc(p.id) + " · " + esc(catLabel[p.cat] || p.cat) + "</small><small>" + esc(flag) + "</small></button>";
    }).join("");
  }
  $("#p-list").addEventListener("click", function (e) { var r = e.target.closest("[data-id]"); if (r) { ui.product = r.getAttribute("data-id"); renderProductList(); renderProduct(); } });

  $("#p-add").addEventListener("click", function () {
    ensureCatalog();
    var n = 1, id; do { id = "N" + String(n++).padStart(2, "0"); } while (products.some(function (p) { return p.id === id; }));
    products.unshift({ id: id, cat: (categories[0] || {}).id || "", name: "Nouveau produit", price: 0, desc: "", points: [], tags: [], art: "kit", hue: 330, stock: null, hidden: true });
    ui.product = id; setDirty(true); renderProducts();
  });

  function renderProduct() {
    var box = $("#p-detail"), p = products.filter(function (x) { return x.id === ui.product; })[0];
    if (!p) { box.innerHTML = '<p class="empty">Choisissez un produit à gauche.</p>'; return; }
    box.innerHTML =
      '<form class="form" id="p-form">' +
      '<div class="pimg"><img src="' + esc(imgSrc(p)) + '" alt=""><label>Changer la photo <small>(JPG, PNG ou WebP, 3 Mo max., carrée de préférence. Pas de photo explicite.)</small><input type="file" accept="image/jpeg,image/png,image/webp" id="p-file"></label></div>' +
      "<fieldset><legend>Fiche</legend>" +
      '<label>Référence<input name="id" value="' + esc(p.id) + '" maxlength="10" required></label>' +
      '<label>Catégorie<select name="cat">' + categories.map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === p.cat ? " selected" : "") + ">" + esc(c.label) + "</option>"; }).join("") + "</select></label>" +
      '<label class="full">Nom<input name="name" value="' + esc(p.name) + '" maxlength="80" required></label>' +
      '<label>Prix de vente (FCFA)<input type="number" name="price" min="0" step="500" value="' + (p.price || 0) + '" required></label>' +
      '<label>Ancien prix <small>(barré, facultatif)</small><input type="number" name="old" min="0" step="500" value="' + (p.old || "") + '"></label>' +
      '<label>Stock <small>(vide = non suivi, 0 = épuisé)</small><input type="number" name="stock" min="0" value="' + (p.stock == null ? "" : p.stock) + '"></label>' +
      '<label>Badge <small>(ex. Best-seller, Nouveau)</small><input name="badge" maxlength="30" value="' + esc(p.badge) + '"></label>' +
      '<label class="full">Description<textarea name="desc" maxlength="600">' + esc(p.desc) + "</textarea></label>" +
      '<label class="full">Points forts <small>(un par ligne, 6 max.)</small><textarea name="points">' + esc((p.points || []).join("\n")) + "</textarea></label>" +
      '<label class="full">Mots-clés du quiz <small>(séparés par des virgules : moi, couple, cadeau, debut, inter, pro, doux, intense, seduire, distance)</small><input name="tags" value="' + esc((p.tags || []).join(", ")) + '"></label>' +
      "</fieldset>" +
      '<div class="checks"><label><input type="checkbox" name="hidden"' + (p.hidden ? " checked" : "") + "> Masquer de la boutique</label>" +
      '<label><input type="checkbox" name="discreet"' + (p.discreet ? " checked" : "") + "> Photo discrète (illustration au lieu de la photo)</label></div>" +
      '<div class="actions"><button class="btn btn--primary" type="submit">Appliquer</button><button class="btn btn--ghost" type="button" id="p-del">Retirer du catalogue</button></div>' +
      '<p class="hint">« Appliquer » met à jour la liste ; « Publier les modifications » en haut les met en ligne.</p>' +
      "</form>";

    $("#p-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target, newId = f.id.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!newId) return toast("Référence invalide.", true);
      if (newId !== p.id && products.some(function (x) { return x.id === newId; })) return toast("Cette référence existe déjà.", true);
      p.id = newId; p.cat = f.cat.value; p.name = f.name.value.trim(); p.price = Number(f.price.value) || 0;
      if (f.old.value) p.old = Number(f.old.value); else delete p.old;
      p.stock = f.stock.value === "" ? null : Number(f.stock.value);
      if (f.badge.value.trim()) p.badge = f.badge.value.trim(); else delete p.badge;
      p.desc = f.desc.value.trim();
      p.points = f.points.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 6);
      p.tags = f.tags.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      p.hidden = f.hidden.checked; p.discreet = f.discreet.checked;
      ui.product = p.id; setDirty(true); renderProductList(); renderProduct(); toast("Modifié. Pensez à publier.");
    });
    $("#p-del").addEventListener("click", function () {
      if (!window.confirm("Retirer « " + p.name + " » du catalogue ? (Pour le cacher temporairement, cochez plutôt « Masquer ».)")) return;
      products = products.filter(function (x) { return x !== p; }); ui.product = null; setDirty(true); renderProducts();
    });
    $("#p-file").addEventListener("change", function (e) {
      var file = e.target.files[0]; if (!file) return;
      if (file.size > 3 * 1024 * 1024) return toast("Photo trop lourde (3 Mo maximum).", true);
      toast("Envoi de la photo…");
      api("images", { method: "POST", headers: { "content-type": file.type }, body: file }).then(function (b) {
        p.img = b.url; delete p.pos; setDirty(true); renderProductList(); renderProduct(); toast("Photo ajoutée. Pensez à publier.");
      }).catch(function (x) { toast(x.message, true); });
    });
  }

  $("#p-save").addEventListener("click", function () {
    ensureCatalog();
    var btn = this; btn.disabled = true;
    api("catalog", { method: "PUT", json: { products: products, categories: categories } }).then(function (b) {
      data.catalog = { products: JSON.parse(JSON.stringify(products)), categories: categories, updatedAt: new Date().toISOString() };
      setDirty(false); products = null; renderProducts(); toast(b.count + " produits publiés sur la boutique.");
    }).catch(function (e) { toast(e.message, true); }).then(function () { btn.disabled = false; });
  });

  /* ---------- Réglages ---------- */
  function renderSettings() {
    var s = data.settings || { legal: {} }, l = s.legal || {};
    $("#s-form").innerHTML =
      "<fieldset><legend>Contact et livraison</legend>" +
      '<label>Téléphone de la boutique <small>(affiché après la commande)</small><input name="phone" value="' + esc(s.phone) + '" placeholder="+241 …"></label>' +
      '<label>WhatsApp <small>(facultatif, chiffres avec indicatif : 241…)</small><input name="whatsapp" value="' + esc(s.whatsapp) + '" inputmode="numeric"></label>' +
      '<label>Frais de livraison (FCFA)<input type="number" min="0" step="500" name="shippingFee" value="' + s.shippingFee + '"></label>' +
      '<label>Livraison offerte dès (FCFA)<input type="number" min="0" step="1000" name="freeShippingFrom" value="' + s.freeShippingFrom + '"></label>' +
      '<label>Heure limite pour une livraison le jour même<input type="number" min="0" max="23" name="cutoffHour" value="' + s.cutoffHour + '"></label>' +
      "</fieldset>" +
      "<fieldset><legend>Informations légales <small>(mentions légales et CGV, loi n° 025/2021)</small></legend>" +
      LEGAL_FIELDS.map(function (f) { return '<label>' + esc(f[1]) + '<input name="legal_' + f[0] + '" value="' + esc(l[f[0]]) + '" maxlength="200"></label>'; }).join("") +
      "</fieldset>" +
      '<p class="hint">Note : WhatsApp Business interdit la vente de produits pour adultes dans ses règles d\'utilisation. Les commandes sont donc enregistrées par le site ; WhatsApp reste un simple moyen de contact facultatif.</p>' +
      '<div class="actions"><button class="btn btn--primary" type="submit">Enregistrer les réglages</button></div>';
  }
  $("#s-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, legal = {};
    LEGAL_FIELDS.forEach(function (x) { legal[x[0]] = f["legal_" + x[0]].value.trim(); });
    api("settings", { method: "PUT", json: {
      phone: f.phone.value.trim(), whatsapp: f.whatsapp.value.trim(), shippingFee: f.shippingFee.value,
      freeShippingFrom: f.freeShippingFrom.value, cutoffHour: f.cutoffHour.value, legal: legal
    } }).then(function (b) { data.settings = b.settings; renderSettings(); toast("Réglages enregistrés."); })
      .catch(function (x) { toast(x.message, true); });
  });

  /* ---------- Lettre d'information ---------- */
  function loadNewsletter() {
    api("newsletter").then(function (b) { data.subscribers = b.subscribers || []; renderNewsletter(); }).catch(function (e) { toast(e.message, true); });
  }
  function renderNewsletter() {
    var s = data.subscribers;
    $("#n-hint").textContent = s.length + " abonné·e(s). Chaque inscription a été faite avec consentement explicite (case cochée). Supprimez une adresse dès qu'une désinscription est demandée.";
    $("#n-list").innerHTML = s.length ? '<table class="nl"><thead><tr><th>E-mail</th><th>Inscription</th><th></th></tr></thead><tbody>' + s.map(function (x) {
      return "<tr><td>" + esc(x.email) + "</td><td>" + when(x.consentAt) + '</td><td><button class="btn btn--ghost btn--sm" data-del="' + esc(x.id) + '">Supprimer</button></td></tr>';
    }).join("") + "</tbody></table>" : '<p class="empty">Aucun abonné pour le moment.</p>';
  }
  $("#n-list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-del]"); if (!b) return;
    var id = b.getAttribute("data-del");
    api("newsletter/" + encodeURIComponent(id), { method: "DELETE" }).then(function () {
      data.subscribers = data.subscribers.filter(function (x) { return x.id !== id; }); renderNewsletter(); toast("Adresse supprimée.");
    }).catch(function (x) { toast(x.message, true); });
  });
  $("#n-export").addEventListener("click", function () {
    var csv = "email,inscription\n" + data.subscribers.map(function (x) { return '"' + String(x.email).replace(/"/g, '""') + '",' + (x.consentAt || ""); }).join("\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "lettre-info-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
  });

  window.addEventListener("beforeunload", function (e) { if (ui.dirty) { e.preventDefault(); e.returnValue = ""; } });

  if (session.get()) start(); else showLogin();
})();
