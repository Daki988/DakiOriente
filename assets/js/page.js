/* ==========================================================
   Daki Oriente — pages secondaires (Le Guide, Suivi de commande)
   Vérification d'âge, sortie rapide, menu, compteur du panier,
   et pour le guide : sommaire actif, barre de lecture, produits liés.
   ========================================================== */
(function () {
  "use strict";

  var CONFIG = window.DO_CONFIG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var fcfa = function (n) { return n.toLocaleString("fr-FR").replace(/ | /g, " ") + " FCFA"; };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* navigation privée */ } }
  };
  var byId = {};
  window.PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  /* ---------- Vérification d'âge (même choix que sur la boutique) ---------- */
  var gate = $("#agegate");
  if (!store.get("do_age_ok", false)) { gate.hidden = false; document.body.classList.add("locked"); }
  $("#agegate-yes").addEventListener("click", function () {
    store.set("do_age_ok", true);
    gate.hidden = true; document.body.classList.remove("locked");
  });

  /* ---------- Sortie rapide ---------- */
  function quickExit() {
    $("#cover").hidden = false;
    document.title = CONFIG.exitTitle;
    document.body.classList.add("locked");
    if (window.top === window.self) { window.location.replace(CONFIG.exitUrl); return; }
    try { window.top.location.replace(CONFIG.exitUrl); } catch (e) { /* navigation bloquée : la publicité reste affichée */ }
  }
  $("#quick-exit").addEventListener("click", quickExit);
  var lastEsc = 0;
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (Date.now() - lastEsc < 600) quickExit();
    lastEsc = Date.now();
  });

  /* ---------- En-tête, menu, panier ---------- */
  var header = $("#header"), nav = $("#nav"), burger = $("#burger");
  burger.addEventListener("click", function () { burger.setAttribute("aria-expanded", nav.classList.toggle("open")); });
  $$("#nav a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); }); });
  var cart = store.get("do_cart", {}), count = 0;
  Object.keys(cart).forEach(function (id) { if (byId[id]) count += cart[id]; });
  $("#cart-count").textContent = count;
  $("#year").textContent = new Date().getFullYear();
  $$("[data-whatsapp]").forEach(function (a) {
    a.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent("Bonjour, j'ai une question (lu dans votre guide).");
    a.target = "_blank"; a.rel = "noopener";
  });

  /* ---------- Produits liés à chaque article ---------- */
  $$("[data-products]").forEach(function (box) {
    var ids = box.dataset.products.split(",").filter(function (id) { return byId[id]; });
    box.innerHTML = '<p class="g-products__title">Les produits dont on parle</p><div class="g-products__list">' + ids.map(function (id) {
      var p = byId[id], src = p.img || "assets/img/" + p.id + ".jpg";
      return '<a class="g-prod" href="index.html#p-' + p.id + '"><span class="g-prod__img"><img src="' + src.replace("assets/img/", "assets/img/sm/") + '" alt="" loading="lazy"' + (p.pos ? ' style="object-position:' + p.pos + '"' : "") + "></span>" +
        "<span class=\"g-prod__txt\"><strong>" + esc(p.name) + "</strong><span>" + fcfa(p.price) + "</span></span></a>";
    }).join("") + "</div>";
  });

  /* ---------- Sommaire actif et barre de lecture ---------- */
  var links = $$("#g-toc a"), arts = $$(".g-art"), bar = $("#g-progress");
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 10);
    if (!bar || !arts.length) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + "%";
    var current = arts[0];
    arts.forEach(function (a) { if (a.getBoundingClientRect().top < window.innerHeight * 0.35) current = a; });
    links.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + current.id); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
