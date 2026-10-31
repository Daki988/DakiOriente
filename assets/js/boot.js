/* Démarrage : récupère le catalogue et les réglages tenus à jour dans le back-office (/api/catalog),
   puis charge les scripts de la page. Sans serveur (démo, hors ligne), le site garde products.js. */
(function () {
  var me = document.currentScript;
  var scripts = (me.getAttribute("data-scripts") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);

  function load(i) {
    if (i >= scripts.length) return;
    var s = document.createElement("script");
    s.src = scripts[i];
    s.onload = function () { load(i + 1); };
    document.body.appendChild(s);
  }

  function apply(data) {
    if (!data) return;
    if (Array.isArray(data.products) && data.products.length) {
      window.PRODUCTS = data.products.filter(function (p) { return !p.hidden; });
    }
    if (Array.isArray(data.categories) && data.categories.length) window.CATEGORIES = data.categories;
    var s = data.settings || {};
    var c = window.DO_CONFIG;
    // En ligne, les réglages du back-office font foi, même vides (WhatsApp est facultatif)
    if (typeof s.whatsapp === "string") c.whatsapp = s.whatsapp;
    if (typeof s.phone === "string") c.phone = s.phone;
    ["shippingFee", "freeShippingFrom", "cutoffHour"].forEach(function (k) { if (typeof s[k] === "number") c[k] = s[k]; });
    if (s.legal) c.legal = s.legal;
    c.online = true; // un serveur répond : commandes et suivi passent par l'API
  }

  var done = false;
  function go(data) { if (done) return; done = true; try { apply(data); } catch (e) { /* catalogue par défaut */ } load(0); }

  if (!window.fetch || location.protocol === "file:") return go(null);
  var timer = setTimeout(function () { go(null); }, 3000);
  fetch("/api/catalog", { cache: "no-store" })
    .then(function (r) { return r.ok && (r.headers.get("content-type") || "").indexOf("json") > -1 ? r.json() : null; })
    .then(function (d) { clearTimeout(timer); go(d); })
    .catch(function () { clearTimeout(timer); go(null); });
})();
