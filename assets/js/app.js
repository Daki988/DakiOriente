/* ==========================================================
   Daki Oriente — logique de la boutique
   ========================================================== */
(function () {
  "use strict";

  /* ---------- Réglages : à adapter ---------- */
  var CONFIG = {
    whatsapp: "24100000000",      // numéro WhatsApp de la boutique, format international sans "+"
    shippingFee: 2000,            // frais de livraison (FCFA)
    freeShippingFrom: 30000,      // livraison offerte à partir de (FCFA)
    exitUrl: "https://www.google.com/search?q=m%C3%A9t%C3%A9o+libreville"
  };

  var CATS = window.CATEGORIES;
  var PRODUCTS = window.PRODUCTS;
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });
  var catById = {};
  CATS.forEach(function (c) { catById[c.id] = c; });

  /* ---------- Utilitaires ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fcfa = function (n) { return n.toLocaleString("fr-FR").replace(/ | /g, " ") + " FCFA"; };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* navigation privée */ } }
  };
  var waLink = function (text) { return "https://wa.me/" + CONFIG.whatsapp + (text ? "?text=" + encodeURIComponent(text) : ""); };

  /* ---------- Illustrations (SVG abstraits, élégants et non explicites) ---------- */
  var uid = 0;
  function art(type, hue) {
    var id = "g" + (++uid);
    var h = hue || 330;
    var defs = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="hsl(' + h + ' 80% 82%)"/>' +
      '<stop offset=".55" stop-color="hsl(' + h + ' 60% 58%)"/>' +
      '<stop offset="1" stop-color="hsl(' + h + ' 55% 32%)"/></linearGradient>' +
      '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f0d3b0"/><stop offset="1" stop-color="#b98a5f"/></linearGradient></defs>';
    var f = 'fill="url(#' + id + ')"', gold = 'fill="url(#' + id + 'g)"', hl = 'fill="#fff" opacity=".35"';
    var shapes = {
      wand: '<g transform="rotate(-28 50 50)"><rect x="42" y="30" width="16" height="62" rx="8" ' + f + '/><circle cx="50" cy="22" r="16" ' + f + '/><rect x="42" y="56" width="16" height="5" ' + gold + '/><ellipse cx="44" cy="17" rx="4" ry="7" ' + hl + '/><circle cx="50" cy="74" r="2.4" fill="#fff" opacity=".7"/></g>',
      bullet: '<g transform="rotate(-30 50 50)"><rect x="40" y="18" width="20" height="66" rx="10" ' + f + '/><rect x="40" y="66" width="20" height="5" ' + gold + '/><rect x="44" y="24" width="4" height="30" rx="2" ' + hl + '/></g>',
      egg: '<ellipse cx="50" cy="54" rx="26" ry="32" ' + f + '/><ellipse cx="41" cy="40" rx="7" ry="11" ' + hl + '/><circle cx="72" cy="22" r="8" ' + gold + '/><path d="M70 30 Q66 40 62 30" stroke="#f0d3b0" stroke-width="1.5" fill="none" opacity=".6"/>',
      ring: '<circle cx="50" cy="50" r="28" fill="none" stroke="url(#' + id + ')" stroke-width="14"/><circle cx="50" cy="22" r="9" ' + gold + '/><path d="M30 34 A26 26 0 0 1 44 25" stroke="#fff" stroke-opacity=".4" stroke-width="4" fill="none" stroke-linecap="round"/>',
      sleeve: '<rect x="30" y="14" width="40" height="72" rx="14" ' + f + '/><rect x="30" y="14" width="40" height="12" rx="6" ' + gold + '/><ellipse cx="50" cy="20" rx="10" ry="3" fill="#000" opacity=".35"/><rect x="36" y="32" width="5" height="44" rx="2.5" ' + hl + '/>',
      bottle: '<rect x="44" y="10" width="12" height="10" rx="2" ' + gold + '/><rect x="32" y="20" width="36" height="68" rx="12" ' + f + '/><rect x="36" y="44" width="28" height="22" rx="3" fill="#fff" opacity=".85"/><rect x="40" y="50" width="20" height="2.5" fill="#3a2b20" opacity=".6"/><rect x="40" y="56" width="14" height="2" fill="#3a2b20" opacity=".4"/><rect x="36" y="26" width="5" height="14" rx="2.5" ' + hl + '/>',
      box: '<rect x="20" y="30" width="60" height="44" rx="6" ' + f + '/><rect x="20" y="30" width="60" height="10" rx="4" fill="#000" opacity=".15"/><circle cx="50" cy="56" r="10" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/><circle cx="50" cy="56" r="4" fill="#fff" opacity=".7"/><rect x="25" y="34" width="22" height="3" rx="1.5" ' + hl + '/>',
      lingerie: '<path d="M18 30 Q26 26 34 30 L50 52 L66 30 Q74 26 82 30 Q86 48 74 58 Q62 64 50 54 Q38 64 26 58 Q14 48 18 30Z" ' + f + '/><path d="M24 34 Q34 36 44 48 M76 34 Q66 36 56 48" stroke="#fff" stroke-opacity=".35" stroke-width="1.5" fill="none"/><path d="M34 70 Q50 62 66 70 L58 86 Q50 90 42 86Z" ' + f + '/><circle cx="50" cy="54" r="2.5" ' + gold + '/>',
      candle: '<rect x="28" y="40" width="44" height="46" rx="8" ' + f + '/><ellipse cx="50" cy="42" rx="22" ry="5" fill="#000" opacity=".2"/><path d="M50 14 Q60 26 50 36 Q40 26 50 14Z" ' + gold + '/><path d="M50 22 Q54 28 50 33 Q46 28 50 22Z" fill="#fff" opacity=".8"/><rect x="33" y="48" width="5" height="30" rx="2.5" ' + hl + '/>',
      feather: '<path d="M78 16 Q40 24 28 72 L34 74 Q52 40 78 16Z" ' + f + '/><path d="M78 16 Q60 52 34 74" stroke="#fff" stroke-opacity=".5" stroke-width="1.5" fill="none"/><rect x="22" y="70" width="6" height="22" rx="3" transform="rotate(20 25 81)" ' + gold + '/>',
      kit: '<rect x="18" y="38" width="64" height="46" rx="6" ' + f + '/><path d="M14 30 H86 V42 H14Z" ' + f + ' opacity=".85"/><rect x="45" y="30" width="10" height="54" ' + gold + '/><path d="M50 30 Q36 12 30 24 Q34 32 50 30 Q64 32 70 24 Q64 12 50 30Z" ' + gold + '/>'
    };
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' + defs + (shapes[type] || shapes.egg) + "</svg>";
  }
  /* Photo produit (assets/img/<id>.jpg), avec repli sur l'illustration si l'image manque */
  function pic(p) {
    return '<img src="' + (p.img || "assets/img/" + p.id + ".jpg") + '" alt="' + esc(p.name) + '" loading="lazy"' +
      (p.pos ? ' style="object-position:' + p.pos + '"' : "") + ' onerror="this.replaceWith(document.createRange().createContextualFragment(window.__art(\'' + p.art + '\',' + p.hue + ')))">';
  }
  window.__art = art;
  function artBg(hue) { return 'style="--h:' + (hue || 330) + '"'; }

  /* ---------- Vérification d'âge ---------- */
  var gate = $("#agegate");
  if (!store.get("do_age_ok", false)) { gate.hidden = false; document.body.classList.add("locked"); }
  $("#agegate-yes").addEventListener("click", function () {
    store.set("do_age_ok", true);
    gate.hidden = true; document.body.classList.remove("locked");
  });

  /* ---------- Sortie rapide ---------- */
  function quickExit() { window.location.replace(CONFIG.exitUrl); }
  $("#quick-exit").addEventListener("click", quickExit);
  var lastEsc = 0;
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var now = Date.now();
    if (now - lastEsc < 600) quickExit();
    lastEsc = now;
    closeAll();
  });

  /* ---------- En-tête & menu ---------- */
  var header = $("#header");
  window.addEventListener("scroll", function () { header.classList.toggle("scrolled", window.scrollY > 10); }, { passive: true });
  var burger = $("#burger"), nav = $("#nav");
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
  $$("#nav a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); burger.setAttribute("aria-expanded", false); }); });

  $$("[data-whatsapp]").forEach(function (a) {
    a.href = waLink("Bonjour, j'ai une question sur un produit Daki Oriente.");
    a.target = "_blank"; a.rel = "noopener";
  });
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Collections ---------- */
  $("#collections-grid").innerHTML = CATS.map(function (c) {
    var n = PRODUCTS.filter(function (p) { return p.cat === c.id; }).length;
    return '<button class="coll" data-cat="' + c.id + '">' +
      "<div><h3>" + esc(c.label) + "</h3><p>" + esc(c.hint) + "</p>" +
      '<span class="coll__go">' + n + " produits</span></div>" +
      '<div class="coll__art art-bg" ' + artBg(c.hue) + '><img src="assets/img/cat-' + c.id + '.jpg" alt="" loading="lazy"></div></button>';
  }).join("");
  $$(".coll").forEach(function (b) {
    b.addEventListener("click", function () { setFilter(b.dataset.cat); $("#boutique").scrollIntoView(); });
  });
  $("#footer-cats").innerHTML = CATS.map(function (c) { return '<li><a href="#boutique" data-cat="' + c.id + '">' + esc(c.label) + "</a></li>"; }).join("");
  $$("#footer-cats a").forEach(function (a) { a.addEventListener("click", function () { setFilter(a.dataset.cat); }); });

  /* ---------- Boutique ---------- */
  var state = { cat: "all", q: "", sort: "featured" };
  var filtersEl = $("#filters");
  filtersEl.innerHTML = [{ id: "all", short: "Tout voir" }].concat(CATS).map(function (c) {
    var n = c.id === "all" ? PRODUCTS.length : PRODUCTS.filter(function (p) { return p.cat === c.id; }).length;
    return '<button class="chip" role="tab" data-cat="' + c.id + '" aria-selected="' + (c.id === "all") + '">' + esc(c.short) + "<small>" + n + "</small></button>";
  }).join("");
  filtersEl.addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (b) setFilter(b.dataset.cat); });
  $("#search").addEventListener("input", function (e) { state.q = e.target.value.trim().toLowerCase(); renderGrid(); });
  $("#sort").addEventListener("change", function (e) { state.sort = e.target.value; renderGrid(); });

  function setFilter(cat) {
    state.cat = cat;
    $$(".chip", filtersEl).forEach(function (c) { c.setAttribute("aria-selected", c.dataset.cat === cat); });
    renderGrid();
  }

  var rank = { "Best-seller": 0, "Coup de cœur": 1, "Nouveau": 2, "Idéal pour débuter": 3 };
  function renderGrid() {
    var norm = function (s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    var q = norm(state.q);
    var list = PRODUCTS.filter(function (p) {
      if (state.cat !== "all" && p.cat !== state.cat) return false;
      if (!q) return true;
      return norm(p.name + " " + p.desc + " " + catById[p.cat].label).indexOf(q) !== -1;
    });
    if (state.sort === "asc") list.sort(function (a, b) { return a.price - b.price; });
    else if (state.sort === "desc") list.sort(function (a, b) { return b.price - a.price; });
    else list.sort(function (a, b) { return (rank[a.badge] !== undefined ? rank[a.badge] : 9) - (rank[b.badge] !== undefined ? rank[b.badge] : 9); });

    $("#grid").innerHTML = list.map(cardHTML).join("");
    $("#empty").hidden = list.length > 0;
  }

  function cardHTML(p, i) {
    var promo = p.old ? '<span class="badge badge--promo">-' + Math.round((1 - p.price / p.old) * 100) + " %</span>" : "";
    return '<article class="card" style="animation-delay:' + Math.min(i || 0, 12) * 40 + 'ms">' +
      '<div class="card__media art-bg" ' + artBg(p.hue) + ' data-open="' + p.id + '">' + pic(p) +
      (p.badge ? '<span class="badge">' + esc(p.badge) + "</span>" : "") + promo +
      '<button class="card__quick" data-add="' + p.id + '" aria-label="Ajouter ' + esc(p.name) + ' au panier">Ajouter au panier</button></div>' +
      '<div class="card__body"><span class="card__cat">' + esc(catById[p.cat].label) + "</span>" +
      '<h3 class="card__name" data-open="' + p.id + '">' + esc(p.name) + "</h3>" +
      '<span class="price">' + fcfa(p.price) + (p.old ? "<s>" + fcfa(p.old) + "</s>" : "") + "</span></div></article>";
  }

  /* Clics délégués : ajout rapide et ouverture de fiche, partout sur la page */
  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    if (add) {
      e.stopPropagation();
      addToCart(add.dataset.add, 1);
      if (add.classList.contains("card__quick")) {
        add.classList.add("done"); add.textContent = "Ajouté ✓";
        setTimeout(function () { add.classList.remove("done"); add.textContent = "Ajouter au panier"; }, 1400);
      }
      return;
    }
    var open = e.target.closest("[data-open]");
    if (open && !open.closest(".modal")) openProduct(open.dataset.open);
  });

  /* ---------- Vitrine du haut ---------- */
  function floatHTML(id, cls) {
    var p = byId[id];
    return '<div class="float ' + cls + '" data-open="' + p.id + '"><span class="float__img art-bg" ' + artBg(p.hue) + ">" + pic(p) + "</span>" +
      '<span class="float__txt">' + (p.badge ? "<small>" + esc(p.badge) + "</small>" : "") + "<strong>" + esc(p.name) + "</strong><span>" + fcfa(p.price) + "</span></span>" +
      '<button class="add-mini" data-add="' + p.id + '" aria-label="Ajouter ' + esc(p.name) + ' au panier">+</button></div>';
  }
  $("#hero-product").innerHTML =
    '<div class="hero__photo"><img src="assets/img/hero.jpg" alt="Un couple enlacé, complice, dans un lit aux draps blancs"></div>' +
    floatHTML("E01", "float--a") + floatHTML("L01", "float--b") +
    '<div class="hero__stamp"><strong>Colis 100&nbsp;% neutre</strong><span>Personne ne saura.</span></div>';

  /* ---------- Best-sellers ---------- */
  var rail = $("#bestsellers");
  rail.innerHTML = PRODUCTS.filter(function (p) { return p.badge === "Best-seller" || p.badge === "Coup de cœur"; }).map(cardHTML).join("");
  $$("[data-rail]").forEach(function (b) {
    b.addEventListener("click", function () { rail.scrollBy({ left: Number(b.dataset.rail) * rail.clientWidth * 0.8, behavior: "smooth" }); });
  });

  /* ---------- Offre vedette ---------- */
  (function () {
    var p = byId["C02"];
    $("#feature").outerHTML =
      '<div class="feature art-bg" ' + artBg(p.hue) + '><div class="feature__copy"><span class="label">Offre du moment</span>' +
      "<h2>Envie de pimenter vos soirées à deux&nbsp;?</h2>" +
      "<p>" + esc(p.desc) + "</p>" +
      '<div class="feature__price">' + fcfa(p.price) + "<s>" + fcfa(p.old) + '</s><span class="feature__save">-' + fcfa(p.old - p.price) + "</span></div>" +
      '<div class="hero__cta" style="margin:0"><button class="btn btn--primary btn--lg" data-add="' + p.id + '">Ajouter au panier</button>' +
      '<button class="btn btn--outline btn--lg" data-open="' + p.id + '">Voir le détail</button></div></div>' +
      '<div class="feature__art"><img src="assets/img/feature.jpg" alt="' + esc(p.name) + '" loading="lazy"></div></div>';
  })();

  /* ---------- Fiche produit ---------- */
  var pmModal = $("#product-modal");
  function openProduct(id) {
    var p = byId[id]; if (!p) return;
    var qty = 1;
    $("#pm").innerHTML =
      '<div class="pm__media art-bg" ' + artBg(p.hue) + ">" + pic(p) + "</div>" +
      '<div class="pm__body"><span class="label">' + esc(catById[p.cat].label) + (p.badge ? " · " + esc(p.badge) : "") + "</span>" +
      '<h3 id="pm-name">' + esc(p.name) + "</h3>" +
      '<div class="pm__price">' + fcfa(p.price) + (p.old ? "<s>" + fcfa(p.old) + "</s>" : "") + "</div>" +
      '<p class="muted">' + esc(p.desc) + "</p>" +
      '<ul class="pm__points">' + p.points.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
      '<div class="pm__actions"><div class="qty"><button data-q="-1" aria-label="Moins">−</button><span id="pm-qty">1</span><button data-q="1" aria-label="Plus">+</button></div>' +
      '<button class="btn btn--primary" id="pm-add">Ajouter au panier</button></div>' +
      '<div class="pm__trust"><span>📦<br>Colis neutre</span><span>💵<br>Payé à la livraison</span><span>✓<br>Matières sûres</span></div></div>';
    $$("[data-q]", pmModal).forEach(function (b) {
      b.addEventListener("click", function () { qty = Math.max(1, Math.min(10, qty + Number(b.dataset.q))); $("#pm-qty").textContent = qty; });
    });
    $("#pm-add").addEventListener("click", function () { addToCart(p.id, qty); closeModal(pmModal); openCart(); });
    openModal(pmModal);
  }

  var lastFocus = null;
  function openModal(m) { lastFocus = document.activeElement; m.hidden = false; document.body.classList.add("locked"); var c = m.querySelector(".modal__close"); if (c) c.focus(); }
  function closeModal(m) { m.hidden = true; if (gate.hidden && $$(".modal:not([hidden]), .drawer:not([hidden])").length === 0) document.body.classList.remove("locked"); if (lastFocus) lastFocus.focus(); }
  $$(".modal").forEach(function (m) { m.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeModal(m); }); });
  function closeAll() { $$(".modal").forEach(function (m) { if (!m.hidden) closeModal(m); }); if (!drawer.hidden) closeCart(); }

  /* ---------- Panier (stocké uniquement sur l'appareil) ---------- */
  var cart = store.get("do_cart", {});
  Object.keys(cart).forEach(function (id) { if (!byId[id]) delete cart[id]; });
  var drawer = $("#drawer");

  function saveCart() { store.set("do_cart", cart); renderCart(); }
  function addToCart(id, n) {
    cart[id] = Math.min(10, (cart[id] || 0) + n);
    saveCart();
    toast("Ajouté au panier · " + byId[id].name);
    var c = $("#cart-count"); c.classList.add("bump"); setTimeout(function () { c.classList.remove("bump"); }, 300);
  }
  function totals() {
    var sub = 0, count = 0;
    Object.keys(cart).forEach(function (id) { sub += byId[id].price * cart[id]; count += cart[id]; });
    var ship = sub === 0 || sub >= CONFIG.freeShippingFrom ? 0 : CONFIG.shippingFee;
    return { sub: sub, ship: ship, total: sub + ship, count: count };
  }
  function renderCart() {
    var t = totals();
    $("#cart-count").textContent = t.count;
    var ids = Object.keys(cart);
    if (!ids.length) {
      $("#cart-items").innerHTML = '<div class="cart-empty"><strong>Votre panier est vide.</strong>Mais vos envies, elles, ne demandent qu\'à s\'exprimer.<br><br><a href="#boutique" class="btn btn--outline btn--sm" data-close-cart>Explorer la boutique</a></div>';
      $("#cart-foot").innerHTML = "";
      return;
    }
    $("#cart-items").innerHTML = ids.map(function (id) {
      var p = byId[id];
      return '<div class="line"><div class="line__thumb art-bg" ' + artBg(p.hue) + ">" + pic(p) + "</div>" +
        '<div><div class="line__name">' + esc(p.name) + '</div><div class="line__price">' + fcfa(p.price) + "</div>" +
        '<div class="qty"><button data-dec="' + id + '" aria-label="Moins">−</button><span>' + cart[id] + '</span><button data-inc="' + id + '" aria-label="Plus">+</button></div></div>' +
        '<button class="line__rm" data-rm="' + id + '">Retirer</button></div>';
    }).join("");
    var left = CONFIG.freeShippingFrom - t.sub;
    var pct = Math.min(100, Math.round(t.sub / CONFIG.freeShippingFrom * 100));
    $("#cart-foot").innerHTML =
      '<div class="ship">' + (left > 0 ? "Plus que <strong>" + fcfa(left) + "</strong> pour la livraison offerte." : "🎉 Livraison offerte !") +
      '<div class="ship__bar"><i style="width:' + pct + '%"></i></div></div>' +
      '<div class="totals"><div><span>Sous-total</span><span>' + fcfa(t.sub) + "</span></div>" +
      "<div><span>Livraison discrète</span><span>" + (t.ship ? fcfa(t.ship) : "Offerte") + "</span></div>" +
      '<div class="grand"><span>Total</span><span>' + fcfa(t.total) + "</span></div></div>" +
      '<button class="btn btn--primary btn--full" id="to-checkout">Commander, payer à la livraison →</button>' +
      '<p class="reassure">📦 Colis neutre · 🔒 Aucun compte · 💵 Rien à payer en ligne</p>';
    $("#to-checkout").addEventListener("click", function () { closeCart(); openCheckout(); });
  }
  $("#cart-items").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.inc) cart[b.dataset.inc] = Math.min(10, cart[b.dataset.inc] + 1);
    if (b.dataset.dec) { cart[b.dataset.dec]--; if (cart[b.dataset.dec] <= 0) delete cart[b.dataset.dec]; }
    if (b.dataset.rm) delete cart[b.dataset.rm];
    saveCart();
  });
  function openCart() { lastFocus = document.activeElement; drawer.hidden = false; document.body.classList.add("locked"); $(".modal__close", drawer).focus(); }
  function closeCart() { drawer.hidden = true; if (gate.hidden && $$(".modal:not([hidden])").length === 0) document.body.classList.remove("locked"); }
  $("#cart-open").addEventListener("click", openCart);
  drawer.addEventListener("click", function (e) { if (e.target.closest("[data-close-cart]")) closeCart(); });

  /* ---------- Commande ---------- */
  var coModal = $("#checkout-modal");
  var coBodyHTML = $("#checkout-body").innerHTML;
  function openCheckout() {
    $("#checkout-body").innerHTML = coBodyHTML;
    var t = totals();
    $("#co-total").innerHTML = "<span>À payer à la livraison</span><span>" + fcfa(t.total) + "</span>";
    $("#checkout-form").addEventListener("submit", submitOrder);
    openModal(coModal);
  }
  function submitOrder(e) {
    e.preventDefault();
    var f = new FormData(e.target), t = totals();
    var ref = "DO-" + Date.now().toString(36).toUpperCase().slice(-6);
    var lines = Object.keys(cart).map(function (id) { return "• " + cart[id] + " × " + byId[id].name + " (" + fcfa(byId[id].price * cart[id]) + ")"; });
    var msg = "Bonjour Daki Oriente, voici ma commande " + ref + " :\n\n" + lines.join("\n") +
      "\n\nLivraison : " + (t.ship ? fcfa(t.ship) : "offerte") + "\nTotal : " + fcfa(t.total) +
      "\n\nNom : " + f.get("name") + "\nTél : " + f.get("phone") + "\nAdresse : " + f.get("address") +
      "\nCréneau : " + f.get("slot") + "\nPaiement : " + f.get("pay") +
      (f.get("call") ? "\nMerci de m'appeler avant de passer." : "");
    var link = waLink(msg);
    cart = {}; saveCart();
    $("#checkout-body").innerHTML =
      '<div class="success"><div class="success__icon">✓</div><span class="label">Commande ' + ref + "</span>" +
      "<h3>Merci, c'est entre nous.</h3>" +
      '<p class="muted">Envoyez-nous le récapitulatif sur WhatsApp pour confirmer : nous vous répondons en moins d\'une heure et votre colis neutre part aussitôt.</p>' +
      '<a class="btn btn--primary btn--full" href="' + link + '" target="_blank" rel="noopener">Confirmer sur WhatsApp →</a>' +
      '<p class="muted small" style="margin-top:14px">Vous paierez ' + fcfa(t.total) + " à la réception, en " + esc(f.get("pay")) + ".</p></div>";
  }

  /* ---------- Quiz ---------- */
  var QUIZ = [
    { q: "Pour qui cherchez-vous ?", key: "who", opts: [["Pour moi, une femme", "elle"], ["Pour moi, un homme", "lui"], ["Pour nous deux", "couple"], ["Pour faire un cadeau", "cadeau"]] },
    { q: "Où en êtes-vous ?", key: "lvl", opts: [["Je découvre, en douceur", "debut"], ["J'ai déjà quelques habitudes", "inter"], ["Je sais ce que j'aime", "pro"]] },
    { q: "Quelle est votre envie du moment ?", key: "mood", opts: [["Sensualité & tendresse", "doux"], ["Des sensations intenses", "intense"], ["Séduire, surprendre", "seduire"], ["Me protéger, en tout confort", "safe"]] }
  ];
  var answers = {}, step = 0;
  function scoreProduct(p) {
    var s = 0, a = answers;
    var map = { elle: ["elle", "lingerie"], lui: ["lui"], couple: ["couple", "sensualite"], cadeau: ["couple", "lingerie", "sensualite"] };
    if (map[a.who] && map[a.who].indexOf(p.cat) !== -1) s += 5;
    if (a.who === "lui" && (p.id === "L05" || p.id === "P03")) s += 3;
    if (a.who === "elle" && p.cat === "lingerie" && p.id === "L05") s -= 6;
    if (a.lvl === "debut" && (p.badge === "Idéal pour débuter" || p.price < 15000)) s += 2;
    if (a.lvl === "pro" && p.price >= 25000) s += 2;
    if (a.mood === "doux" && (p.cat === "sensualite" || p.art === "feather" || p.art === "candle")) s += 3;
    if (a.mood === "intense" && (p.cat === "elle" || p.cat === "lui" || p.id === "C01")) s += 3;
    if (a.mood === "seduire" && (p.cat === "lingerie" || p.id === "C03")) s += 4;
    if (a.mood === "safe" && p.cat === "essentiels") s += 6;
    if (a.who === "cadeau" && p.art === "kit") s += 3;
    if (p.badge === "Best-seller" || p.badge === "Coup de cœur") s += 1;
    return s;
  }
  function renderQuiz() {
    var card = $("#quiz-card");
    var bars = '<div class="quiz__progress">' + QUIZ.map(function (_, i) { return '<span class="' + (i <= step ? "on" : "") + '"></span>'; }).join("") + "</div>";
    if (step < QUIZ.length) {
      var Q = QUIZ[step];
      card.innerHTML = bars + '<p class="quiz__step">Question ' + (step + 1) + " sur " + QUIZ.length + '</p><div class="quiz__q">' + Q.q + '</div><div class="quiz__opts">' +
        Q.opts.map(function (o) { return '<button class="quiz__opt" data-v="' + o[1] + '">' + o[0] + "</button>"; }).join("") + "</div>";
      $$(".quiz__opt", card).forEach(function (b) { b.addEventListener("click", function () { answers[Q.key] = b.dataset.v; step++; renderQuiz(); }); });
      return;
    }
    var top = PRODUCTS.map(function (p) { return { p: p, s: scoreProduct(p) }; })
      .sort(function (a, b) { return b.s - a.s || a.p.price - b.p.price; }).slice(0, 3);
    card.innerHTML = bars + '<p class="quiz__step">Votre sélection sur mesure</p><div class="quiz__q">Voici ce qui devrait vous <mark>plaire</mark>.</div>' +
      '<div class="quiz__results">' + top.map(function (x) {
        var p = x.p;
        return '<button class="quiz__item" data-open="' + p.id + '"><span class="quiz__thumb art-bg" ' + artBg(p.hue) + ">" + pic(p) + "</span><span><strong>" + esc(p.name) + "</strong><span>" + fcfa(p.price) + "</span></span></button>";
      }).join("") + '</div><button class="quiz__restart" id="quiz-restart">Recommencer le quiz</button>';
    $("#quiz-restart").addEventListener("click", function () { answers = {}; step = 0; renderQuiz(); });
  }

  /* ---------- Newsletter ---------- */
  $("#newsletter").addEventListener("submit", function (e) {
    e.preventDefault();
    $("#newsletter-msg").textContent = "C'est noté ! Votre code : SECRET10 (-10 % sur la première commande).";
    e.target.reset();
  });

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* ---------- Apparition au scroll ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    $$(".section .container > *:not(.feature), .step").forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }

  renderGrid();
  renderCart();
  renderQuiz();
})();
