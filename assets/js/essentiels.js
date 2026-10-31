/* Page Essentiels : prix et stock à jour depuis le back-office (le contenu reste lisible sans script). */
(function () {
  "use strict";
  var c = window.DO_CONFIG || {}, byId = {};
  (window.PRODUCTS || []).forEach(function (p) { byId[p.id] = p; });
  var fcfa = function (n) { return Number(n).toLocaleString("fr-FR").replace(/ | /g, " ") + " FCFA"; };
  Array.prototype.forEach.call(document.querySelectorAll("[data-price]"), function (el) {
    var p = byId[el.getAttribute("data-price")], card = el.closest(".lp-card");
    if (!p) { card.hidden = true; return; } // produit retiré ou masqué dans le back-office
    el.textContent = fcfa(p.price);
    if (p.stock === 0) { var b = card.querySelector(".btn"); b.textContent = "Épuisé"; b.removeAttribute("href"); b.classList.add("is-off"); }
  });
  if (typeof c.freeShippingFrom === "number") Array.prototype.forEach.call(document.querySelectorAll("[data-free]"), function (el) { el.textContent = fcfa(c.freeShippingFrom); });
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
})();
