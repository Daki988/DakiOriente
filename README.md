# NEAM SOFTWARES INDUSTRY — Site web

**Build a better tomorrow !**

Site vitrine statique, en plusieurs pages (HTML / CSS / JavaScript, sans outil de build).

## Pages
- `index.html` — Accueil
- `services.html` — Les 4 pôles, la méthode, les secteurs
- `produits.html` — GuruTools, Tremplin, GuruLégal
- `blog.html` et `blog-*.html` — Blog (8 articles)
- `ressources.html`, `digital-score.html`, `realisations.html`, `mentions-legales.html` — Ressources, diagnostic, réalisations, mentions légales
- `produits.html#super-app` — NEAM Super App (téléphone animé en 3D, aperçu, 9 services)
- `neam-market.html`, `neam-food.html`, `neam-express.html`, `neam-health.html`, `neam-print.html`, `neam-services.html`, `brico-deco.html`, `neam-beauty.html`, `neam-tech.html` — une page par service de la Super App
- `programme.html` — Programme NEAM × KANIE 30/30
- `a-propos.html` — Positionnement, vision, mission, valeurs
- `contact.html` — Coordonnées et formulaire
- `candidature.html` — Candidature au programme 30/30 sous forme de test de maturité numérique

L’en-tête et le pied de page sont identiques sur chaque page : pensez à modifier toutes les pages si vous les changez.

### Ajouts du cahier des charges (octobre 2026)

- Pages services détaillées : `creation-site-web-gabon.html`, `logiciels-metiers-gabon.html`, `ia-automatisation-gabon.html`, `conseil-formation-digitale-gabon.html`
- `realisations.html` (projets NEAM avec statut réel), `mentions-legales.html` (éditeur, données, cookies), `404.html`
- SEO : titres et descriptions uniques, canonical `https://www.neamindustry.com/`, données structurées (ProfessionalService, Service, FAQPage, BreadcrumbList), sitemap et robots.txt
- `.htaccess` : redirection vers `https://www.neamindustry.com`, page 404, en-têtes de sécurité
- Mesure d'audience : événements dans `window.dataLayer` (`cta_click`, `contact_form_*`, `digital_score_*`, `download_resource`) sans donnée personnelle
- Mentions légales : compléter RCCM, NIF, forme juridique et directeur de la publication dans `LEGAL` (script de génération)

### Mesure d'audience et contact (octobre 2026)

- **Google Analytics 4 et Google Ads** : renseigner les deux identifiants dans `js/analytics.js` (seul fichier à modifier). Tant qu'ils contiennent « XXXX », rien n'est chargé.
  Événements envoyés : `cta_click`, `whatsapp_click`, `contact_form_start`, `contact_form_success`, `contact_form_error`, `digital_score_start`, `digital_score_complete`, `download_resource`.
  À marquer comme événements clés dans GA4 : `contact_form_success`, `digital_score_complete`, `whatsapp_click`.
- **WhatsApp** : 077 45 31 67, lien `https://wa.me/24177453167` (si le compte est introuvable, essayer `241077453167`). **Téléphone** : 060 22 94 47 (fiche Google).
- Image de partage : `assets/og-neam.jpg` (1200×630).

### Blog, vidéos, Instagram et assistant (octobre 2026)

- **Blog** : `blog.html` + 8 articles (`blog-*.html`) écrits pour le référencement local (Libreville, Gabon) : données structurées BlogPosting et FAQPage, fil d'Ariane, sommaire, liens vers les pages services, flux `rss.xml`. Les articles sont dans le script de génération (`BLOG`) ; aucun chiffre n'y figure sans sa source (livre blanc, ARCEP, DataReportal, Global Findex, ANPI).
- **Vidéos** (`assets/video/`) : `neam-manifeste.mp4` (vidéo institutionnelle, 58 s, format vertical) sur l'accueil et la page À propos ; `neam-histoire-denise.mp4` (cas d'exemple, 1 min 54, histoire illustrative signalée comme telle) dans « Le chemin de la croissance » et dans l'article sur le référencement. Lecture uniquement au clic (`preload="none"`), données structurées VideoObject.
- **Affiches** (`assets/affiches/`) : campagne #EtÇaRapporteCombien (6 affiches) sur l'accueil et le blog, visionneuse plein écran, chaque affiche renvoie à l'article qui lui répond. Lien Instagram @neam.industry dans le pied de page, la page contact et les sections dédiées.
- **Assistant NEAM (chatbot)** : `js/chat.js` (fenêtre de discussion, toutes les pages) + `api/chat.php`.
  - Sans clé : réponses préparées (services, prix, délais, diagnostic, produits, contact…).
  - Avec la clé Claude renseignée dans `api/config.php` (`audit → anthropic_api_key` suffit, ou `chat → anthropic_api_key`) : réponses rédigées par l'IA, uniquement à partir de `api/lib/chat/knowledge.md` (généré avec le site). La clé reste sur le serveur.
  - Garde-fous : pas de prix ni de chiffres inventés, pas de collecte de données personnelles, boutons limités à une liste d'adresses autorisées (`api/lib/chat/actions.json`), 30 messages par adresse IP sur 10 minutes. Les conversations ne sont pas enregistrées.
- **Accusé de réception et réponse sous 48 h ouvrées** : le formulaire de contact envoie automatiquement un e-mail de confirmation au visiteur, avec la date limite de réponse (2 jours ouvrés, jours fériés fixes du Gabon exclus). Pour les e-mails écrits **directement** à contact@neamindustry.com, activez le répondeur de la boîte (voir « Mise en ligne », étape 7).

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
- `api/chat.php` : assistant du site (voir plus haut).
- `api/config.php` : **le seul fichier à modifier** (destinataires, mot de passe SMTP, clés). L'archive de mise à jour ne contient **pas** `config.php` : vos réglages déjà en ligne ne sont jamais écrasés. Pour une première installation, copiez `api/config.sample.php` sous le nom `config.php` (à défaut, le site utilise le modèle sans mot de passe ni clé).

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
2. **Collecte** et 3. **Audit** : lecture du site (accueil, contact, robots.txt, sitemap.xml, en-têtes, redirection https, page 404, liens internes) et 150 critères (`api/lib/audit/framework.php`) ;
4. **Concurrents** : mêmes critères appliqués aux concurrents (score de pertinence avec Google) ;
5. **Score** : NEAM Digital Score™ sur 7 axes et classement ;
6. **Analyste IA** : synthèse rédigée par Claude à partir des résultats calculés (sinon synthèse automatique) ;
7. **Recommandations** : actions priorisées (impact × difficulté × urgence), opportunités, plan 30 / 90 / 180 jours et ROI estimé.

Le barème du ROI (hausse de chiffre d'affaires, coût en FCFA, délai) se règle action par action dans `action_roi()` (`api/lib/audit/framework.php`).

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
6. Déclarer le site dans Google Search Console et y envoyer `sitemap.xml` (33 pages, blog compris). Le flux `rss.xml` peut aussi y être déclaré comme sitemap.
7. **Répondeur de la boîte contact@neamindustry.com** (pour les e-mails écrits directement à cette adresse, hors formulaire) : panneau LWS → E-mails → choisir l'adresse → « Répondeur » (ou Webmail Roundcube → Paramètres → Réponses automatiques / Vacances). Activer sans date de fin, une réponse par expéditeur et par jour, avec ce texte :

   > Objet : Nous avons bien reçu votre message — NEAM
   >
   > Bonjour,
   >
   > Merci pour votre message : il est bien arrivé chez NEAM Softwares Industry. Un membre de l'équipe l'étudie et vous répond sous 48 heures ouvrées maximum (du lundi au vendredi).
   >
   > Besoin urgent ? Écrivez-nous sur WhatsApp au 077 45 31 67 ou appelez le 060 22 94 47 (du lundi au samedi, 8 h 30 – 17 h 30).
   >
   > En attendant, faites le point sur votre présence en ligne avec notre diagnostic gratuit : https://www.neamindustry.com/digital-score.html
   >
   > L'équipe NEAM — Build a better tomorrow !

Fichiers ajoutés pour l’hébergement : `.htaccess` (compression, cache, pas de liste de fichiers), `robots.txt`, `sitemap.xml` (domaine `neamindustry.com` à adapter si besoin).
