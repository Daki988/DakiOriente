# Escapade Travel Agency : site sur mesure

Site fait à la main à partir de la maquette Figma validée (fichier « NEAM — Escapade Travel Agency »).

- `data.js` : contenus (agence, 8 destinations, lignes aériennes, avis, équipe).
- `build.js` : génère les pages dans `neam-moteur/sites/escapade-travel-agency/` (`node build.js`).
- `escapade.css`, `escapade.js` : style et interactions (filtres, réservation, formulaires envoyés sur WhatsApp).
- `gen-live.js` ne réécrit pas ce site (liste `HAND`) : il lit seulement `pages.json`.

Infos réelles : adresse, téléphones, e-mail, activité (annuaires). À confirmer avec l'agence : logo, destinations, prix, horaires, équipe.
