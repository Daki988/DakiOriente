# NEAM SOFTWARES INDUSTRY — Site web

**Build a better tomorrow !**

Site vitrine statique, en plusieurs pages (HTML / CSS / JavaScript, sans outil de build).

## Pages
- `index.html` — Accueil
- `services.html` — Les 4 pôles, la méthode, les secteurs
- `produits.html` — GuruTools et Tremplin
- `produits.html#super-app` — NEAM Super App (téléphone animé en 3D, aperçu, 9 services)
- `neam-market.html`, `neam-food.html`, `neam-express.html`, `neam-health.html`, `neam-print.html`, `neam-services.html`, `brico-deco.html`, `neam-beauty.html`, `neam-tech.html` — une page par service de la Super App
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

## Formulaires et e-mails (dossier `api/`)
Les formulaires envoient leurs e-mails depuis **contact@neamindustry.com**, grâce à de petits scripts PHP hébergés avec le site (PHPMailer 6.9.3).

- `api/contact.php` : formulaire de contact → message envoyé à contact@neamindustry.com (on peut répondre directement au visiteur).
- `api/candidature.php` : candidature au programme 30/30 →
  1. rapport complet (coordonnées, motivation, score, 14 réponses, PDF joint) envoyé à l’équipe ;
  2. résultats du test + PDF joint envoyés au candidat.
- `api/config.php` : **le seul fichier à modifier** (destinataires, mot de passe SMTP).

### Réglages (`api/config.php`)
- `contact_to` : destinataires du formulaire de contact (par défaut contact@neamindustry.com).
- `candidature_to` : destinataires des candidatures (par défaut daki.liaison@gmail.com).
- `smtp.password` : **recommandé**. Saisissez le mot de passe de la boîte contact@neamindustry.com pour envoyer par SMTP et éviter que les e-mails arrivent en spam. Laissé vide, le site utilise l’envoi intégré de l’hébergement. Vérifiez le serveur et le port dans le panneau LWS (rubrique E-mails) ; par défaut : `mail.neamindustry.com`, port 465, SSL.

### Protections
Champ invisible anti-robots, refus des envois venant d’autres sites, limite de 5 envois par adresse IP toutes les 10 minutes, contrôle des champs et de la taille des envois. `config.php` et la bibliothèque ne sont pas accessibles depuis le web (`api/.htaccess`).

### Test de maturité numérique
14 questions sur 5 axes (visibilité, image et communication, outils, données et stratégie, engagement digital), score sur 100 et priorités. Le PDF des résultats est généré dans le navigateur avec jsPDF (`js/vendor/jspdf.umd.min.js`, version 2.5.1) puis joint aux e-mails.

## Outil NEAM Digital Score™ (`digital-score.html`)

Le prospect saisit son entreprise, sa ville et son secteur (son site et ses concurrents en option).
`api/audit.php` enchaîne les 7 moteurs :

1. **Discovery** : site saisi ou trouvé sur Google, fiche Google Business, réseaux sociaux, concurrents ;
2. **Collecte** et 3. **Audit** : lecture du site (accueil, contact, robots.txt, sitemap.xml) et 50+ critères (`api/lib/audit/framework.php`) ;
4. **Concurrents** : mêmes critères appliqués aux concurrents (score de pertinence avec Google) ;
5. **Score** : NEAM Digital Score™ sur 7 axes et classement ;
6. **Analyste IA** : synthèse rédigée par Claude à partir des résultats calculés (sinon synthèse automatique) ;
7. **Recommandations** : actions priorisées (impact × difficulté × urgence), opportunités et plan 30 / 90 / 180 jours.

Aperçu gratuit à l'écran, puis audit complet (écran + PDF + e-mail) contre nom et e-mail.
Le prospect reçoit le PDF depuis contact@neamindustry.com et l'équipe est prévenue (`audit.notify_to`).

Clés facultatives dans `api/config.php` → `audit` : sans clé, l'audit du site fonctionne déjà.

- `google_places_key` : Google Places API (New) — fiche Google, avis, concurrents automatiques ;
- `pagespeed_key` : Google PageSpeed Insights — performance mobile ;
- `anthropic_api_key` : API Claude — synthèse rédigée par l'IA.

Les audits sont conservés 30 jours dans `api/data/audits/` (dossier protégé, créé automatiquement).

## Mise en ligne (LWS)
1. Hébergement web mutualisé LWS (l’offre **LWS Perso** suffit : site statique, 5 adresses e-mail, nom de domaine et SSL inclus).
2. Dans le panneau LWS, ouvrir le **Gestionnaire de fichiers** (ou un client FTP comme FileZilla) et envoyer **le contenu** de l’archive dans le dossier `htdocs` (pas le dossier lui-même) : les fichiers `.html`, les dossiers `css/`, `js/`, `assets/`, `api/`, ainsi que `.htaccess`, `robots.txt` et `sitemap.xml`.
3. Activer le **certificat SSL** (Let’s Encrypt, gratuit) puis l’option **« Forcer HTTPS »** du panneau, ou décommenter les lignes prévues dans `.htaccess`.
4. Créer l’adresse **contact@neamindustry.com** dans la partie e-mails du panneau (elle est utilisée sur le site).
5. Renseigner le mot de passe de contact@neamindustry.com dans `api/config.php` (recommandé), puis faire un essai depuis `/contact.html` et `/candidature.html`.
6. Déclarer le site dans Google Search Console et y envoyer `sitemap.xml`.

Fichiers ajoutés pour l’hébergement : `.htaccess` (compression, cache, pas de liste de fichiers), `robots.txt`, `sitemap.xml` (domaine `neamindustry.com` à adapter si besoin).
