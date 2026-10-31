/* Pages légales : complète les informations de l'entreprise saisies dans le back-office (Réglages). */
(function () {
  "use strict";
  var c = window.DO_CONFIG || {}, legal = c.legal || {};
  var fcfa = function (n) { return Number(n).toLocaleString("fr-FR").replace(/ | /g, " ") + " FCFA"; };
  Array.prototype.forEach.call(document.querySelectorAll("[data-legal]"), function (el) {
    var v = legal[el.getAttribute("data-legal")];
    if (v) { el.textContent = v; el.classList.remove("todo"); }
  });
  var set = function (sel, txt) { Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) { el.textContent = txt; }); };
  if (typeof c.shippingFee === "number") set("[data-legal-fee]", fcfa(c.shippingFee));
  if (typeof c.freeShippingFrom === "number") set("[data-legal-free]", fcfa(c.freeShippingFrom));
  if (typeof c.cutoffHour === "number") set("[data-legal-cutoff]", c.cutoffHour + " h");
  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
})();
