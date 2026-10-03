# NEAM SOFTWARES INDUSTRY — Site web

**Build a better tomorrow !**

Site vitrine statique, en plusieurs pages (HTML / CSS / JavaScript, sans outil de build).

## Pages
- `index.html` — Accueil
- `services.html` — Les 4 pôles, la méthode, les secteurs
- `produits.html` — GuruTools et Tremplin
- `programme.html` — Programme NEAM × KANIE 30/30
- `a-propos.html` — Positionnement, vision, mission, valeurs
- `contact.html` — Coordonnées et formulaire
- `candidature.html` — Candidature au programme 30/30 sous forme de test de maturité numérique

L’en-tête et le pied de page sont identiques sur chaque page : pensez à modifier toutes les pages si vous les changez.

## Lancer en local
```bash
python3 -m http.server 8000
```
puis ouvrez http://localhost:8000

## Fichiers communs
- `css/style.css` — styles
- `js/main.js` — menu mobile, apparitions douces, formulaire de contact
- `assets/` — logos et favicon

## À personnaliser
- Adresse email de contact : `contact@neamindustry.com` (pages HTML et `js/main.js`) — à confirmer
- Le formulaire ouvre la messagerie du visiteur (mailto). Pour recevoir les demandes directement, il faudra le relier à un service d’envoi de formulaires.
- Le lien `contact.html?besoin=GuruTools` pré-sélectionne le besoin dans le formulaire.

## Candidature 30/30 (test de maturité numérique)
- 12 questions sur 4 axes (visibilité, image et communication, outils, données et stratégie), score sur 100 et priorités.
- Le rapport de candidature est envoyé à **daki.liaison@gmail.com** via le service gratuit [FormSubmit](https://formsubmit.co) (`js/candidature.js`, constante `RECIPIENT`).
- **Activation obligatoire** : à la toute première candidature, FormSubmit envoie un e-mail de confirmation à cette adresse. Il faut cliquer sur « Activate Form » ; les candidatures suivantes arrivent alors directement. FormSubmit propose ensuite un identifiant aléatoire à utiliser à la place de l’adresse dans `ENDPOINT`, pour ne plus l’afficher dans le code du site.
- Si l’envoi échoue, le candidat voit un lien pour envoyer sa candidature par e-mail.
- Le PDF des résultats est généré dans le navigateur avec jsPDF (`js/vendor/jspdf.umd.min.js`, version 2.5.1).
