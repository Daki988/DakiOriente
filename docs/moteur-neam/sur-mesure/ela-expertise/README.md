# ELA Expertise : site sur mesure

Site fait à la main à partir de la maquette validée (fichier Figma « NEAM — ELA Expertise », import en attente).

- `data.js` : contenus (cabinet, 7 services réels, cas d'usage, FAQ, formulaire, galerie).
- `build.js` : génère les pages dans `neam-moteur/sites/ela-expertise/` (`node build.js`).
- `ela.css`, `ela.js` : style et interactions (FAQ, demande d'expertise par e-mail ou WhatsApp, galerie).
- `gen-live.js` ne réécrit pas ce site (liste `HAND`) : il lit seulement `pages.json`.

Infos réelles (annuaires) : logo, slogan, services, adresse, BP, téléphones, e-mail, position GPS.
À confirmer avec le cabinet : délais (48 h / 10 jours), horaires, zones d'intervention, portrait de l'expert.
L'extrait de rapport (villa à 285 000 000 FCFA) est fictif et signalé comme tel sur le site.
