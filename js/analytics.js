/* =========================================================
   NEAM — Mesure d'audience (Google Analytics 4) et Google Ads
   SEUL FICHIER À MODIFIER : remplacez les deux identifiants ci-dessous.
   Tant qu'un identifiant contient « XXXX », rien n'est chargé.
   ========================================================= */
(() => {
  const GA4_ID = 'G-XXXXXXXXXX';   // Google Analytics 4 : Admin > Flux de données > ID de mesure
  const ADS_ID = 'AW-XXXXXXXXX';   // Google Ads : Outils > Conversions > balise Google

  const ids = [GA4_ID, ADS_ID].filter(id => id && !/X{4}/.test(id));
  window.dataLayer = window.dataLayer || [];
  if (!ids.length) return;
  window.gtag = function () { window.dataLayer.push(arguments); };
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ids[0];
  document.head.appendChild(s);
  window.gtag('js', new Date());
  ids.forEach(id => window.gtag('config', id));
})();
