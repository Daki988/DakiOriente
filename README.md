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
- 14 questions sur 5 axes (visibilité, image et communication, outils, données et stratégie, engagement digital), score sur 100 et priorités.
- Le rapport de candidature est envoyé à **daki.liaison@gmail.com** via le service gratuit [FormSubmit](https://formsubmit.co) (`js/candidature.js`, constante `RECIPIENT`).
- **Activation obligatoire** : à la toute première candidature, FormSubmit envoie un e-mail de confirmation à cette adresse. Il faut cliquer sur « Activate Form » ; les candidatures suivantes arrivent alors directement. FormSubmit propose ensuite un identifiant aléatoire à utiliser à la place de l’adresse dans `ENDPOINT`, pour ne plus l’afficher dans le code du site.
- Si l’envoi échoue, le candidat voit un lien pour envoyer sa candidature par e-mail.
- Le PDF des résultats est généré dans le navigateur avec jsPDF (`js/vendor/jspdf.umd.min.js`, version 2.5.1).

## Mise en ligne (LWS)
1. Hébergement web mutualisé LWS (l’offre **LWS Perso** suffit : site statique, 5 adresses e-mail, nom de domaine et SSL inclus).
2. Dans le panneau LWS, ouvrir le **Gestionnaire de fichiers** (ou un client FTP comme FileZilla) et envoyer **le contenu** de l’archive dans le dossier `htdocs` (pas le dossier lui-même) : les fichiers `.html`, les dossiers `css/`, `js/`, `assets/`, ainsi que `.htaccess`, `robots.txt` et `sitemap.xml`.
3. Activer le **certificat SSL** (Let’s Encrypt, gratuit) puis l’option **« Forcer HTTPS »** du panneau, ou décommenter les lignes prévues dans `.htaccess`.
4. Créer l’adresse **contact@neamindustry.com** dans la partie e-mails du panneau (elle est utilisée sur le site).
5. Faire une première candidature test sur `/candidature.html`, puis cliquer sur **« Activate Form »** dans l’e-mail reçu de FormSubmit sur daki.liaison@gmail.com.
6. Déclarer le site dans Google Search Console et y envoyer `sitemap.xml`.

Fichiers ajoutés pour l’hébergement : `.htaccess` (compression, cache, pas de liste de fichiers), `robots.txt`, `sitemap.xml` (domaine `neamindustry.com` à adapter si besoin).
