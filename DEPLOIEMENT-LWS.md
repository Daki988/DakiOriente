# Mettre Tremplin en ligne sur un sous-domaine LWS

**Installation en une seule fois, prête à l'emploi** : vous déposez l'archive, vous cliquez sur le lien d'installation, vous créez votre compte. Aucune base de données à créer, aucun fichier à modifier.

Exemple utilisé : le sous-domaine **tremplin.neamindustry.com**. Remplacez-le par le vôtre.

> Les intitulés des menus LWS peuvent légèrement varier selon votre formule. En cas de doute, l'aide LWS (aide.lws.fr) donne la procédure à jour.

---

## Avant de commencer (une seule fois)

1. **Sous-domaine** : LWS Panel › votre formule › **Sous-domaines** › saisissez `tremplin` › **Ajout**. Notez le dossier associé (souvent `/htdocs/tremplin`).
2. **PHP 8.3** : LWS Panel › votre formule › **Configuration PHP** › PHP 8.3 (8.2 au minimum). LWS indique 15 à 20 minutes pour l'application du changement.

Vous n'avez **pas** besoin de créer de base MySQL : Tremplin utilise par défaut une base intégrée, créée automatiquement. MySQL reste disponible dans les options avancées de l'installation.

---

## Installation en 3 étapes

### 1. Déposer l'archive

LWS Panel › **Gestionnaire de fichiers** › dossier du sous-domaine › **Téléverser** `tremplin-lws.zip` › **Extraire**.
Vérifiez que vous voyez directement `app/`, `public/`, `storage/`, `vendor/`… (pas un sous-dossier en plus), puis supprimez le `.zip`.

### 2. Ouvrir le lien d'installation

Le lien vous a été transmis avec l'archive. Il figure aussi dans le fichier `LISEZ-MOI-INSTALLATION.txt` de l'archive. Il a cette forme :

`https://tremplin.neamindustry.com/install.php?cle=VOTRE-CLÉ`

La clé prouve que c'est bien vous qui installez. Elle est détruite après l'installation.

### 3. Créer votre compte

Saisissez **prénom, nom, e-mail et mot de passe** (10 caractères minimum), puis **Installer et ouvrir la plateforme**.

En quelques secondes :
- la base est créée avec les **311 formations**, les **60 certifications**, les compétences, les villes, les conseils carrière et les **17 modèles de CV** ;
- votre compte administrateur est créé et **vous êtes connecté·e** ;
- si vous installez en `https://`, la redirection HTTPS est activée automatiquement ;
- l'assistant d'installation se verrouille et se supprime.

**C'est prêt.** Les candidats peuvent s'inscrire, créer leur CV et télécharger leur PDF ; les entreprises peuvent publier leurs offres.

> **Options avancées** (facultatives, dans l'écran d'installation) : base MySQL, clé Claude, serveur e-mail SMTP, données de démonstration pour une présentation.

---

## Recommandé ensuite

### Certificat SSL (HTTPS)

LWS Panel › **SSL** › activez le certificat Let's Encrypt gratuit pour le sous-domaine. Si vous avez installé en `http://`, retirez ensuite les `#` devant les trois lignes « Redirection vers HTTPS » du fichier `.htaccess` (racine du site) et mettez `APP_URL` en `https://` dans le fichier `.env`.

### Tâche planifiée hebdomadaire (formations)

Le catalogue est déjà chargé. Pour le tenir à jour (nouveaux cours Coursera et sessions FUN MOOC) :

1. LWS Panel › **Tâches Cron**.
2. Méthode d'appel : **PHP**.
3. Script : `bin/sync-trainings.php` (chemin depuis le dossier du sous-domaine, ou chemin complet indiqué par le panel).
4. Fréquence : **une fois par semaine**, la nuit (ex. lundi à 3 h).

La synchronisation dure quelques minutes. Elle peut aussi être lancée à la main depuis **Admin › Formations & certificats**.

Ajoutez une seconde tâche, même méthode, pour **vérifier les liens des formations** (une formation dont le lien ne répond plus est masquée et envoyée dans la file de curation) :

- Script : `bin/verifier-formations.php`, fréquence : **une fois par semaine** (ex. mardi à 3 h).

Elle peut aussi être lancée par lots de 25 depuis **Admin › Qualité & calibrage** ou **Admin › Formations & certificats**.

### Réglages du fichier `.env`

Le fichier `.env` (racine du dossier) contient la configuration. Modifiez-le avec le gestionnaire de fichiers si besoin :

| Réglage | Rôle |
|---|---|
| `ANTHROPIC_API_KEY` | Clé Claude pour les CV, lettres, relecture et entretiens, ainsi que pour la recherche d'offres réelles de stage et d'emploi (préparation sur offres réelles). Vide = moteur NEAM intégré, et offres saisies à la main par l'équipe. La recherche web doit être autorisée pour l'organisation dans la console Anthropic (paramètres de l’organisation). |
| `MAIL_DRIVER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | Envoi réel des e-mails depuis contact@neamindustry.com. Avec `MAIL_DRIVER=log`, les messages sont visibles dans Admin › Communications. Les paramètres SMTP sont fournis par l'hébergeur de la boîte mail. |
| `APP_DEMO` | `true` affiche les comptes de démonstration sur la page de connexion. Mettez `false` en production. |
| `APP_DEBUG` | Laissez `false` en ligne (affiche les erreurs détaillées si `true`, à n'utiliser que le temps d'un dépannage). |

**Ne communiquez jamais ce fichier** : il contient vos mots de passe et la clé Claude.

---

## Mettre à jour la plateforme

1. Faites une **sauvegarde** (voir plus bas).
2. Envoyez les fichiers de la nouvelle archive **en remplaçant** les anciens, **sauf** le fichier `.env` et le dossier `storage/` (qui contient vos données, CV, photos et versions publiées des référentiels).
3. Ouvrez le site : la base est **mise à jour automatiquement** au premier chargement (nouvelles tables et colonnes), sans perte de données. Lors du passage à la version 1.6, ce premier chargement installe aussi les référentiels (fiches métier, compétences, diplômes, index ROME) et publie la version 1 : il peut prendre quelques secondes.

## Sauvegardes

- **Base de données** : avec la base intégrée, copiez le fichier `storage/database.sqlite` ; avec MySQL, LWS Panel › MySQL & phpMyAdmin › onglet *Exporter*. LWS propose aussi des sauvegardes automatiques selon la formule.
- **Fichiers des utilisateurs** : le dossier `storage/uploads/` (CV importés, photos, certificats).
- **Versions des référentiels** : le dossier `storage/referentiels/` (une version figée par publication).
- **Configuration** : le fichier `.env`.

## Dépannage

| Symptôme | Solution |
|---|---|
| Page blanche ou erreur 500 | Vérifiez la version PHP (8.2+). Consultez `storage/logs/php-error.log`. |
| « Forbidden » / 403 partout | Le contenu de l'archive est peut-être dans un sous-dossier : voir étape 4. |
| L'installation demande une clé | Utilisez le lien d'installation complet (avec `?cle=…`), ou ouvrez `storage/install-code.txt` dans le gestionnaire de fichiers. |
| « Connexion MySQL impossible » (option avancée) | Recopiez l'hôte, le nom, l'utilisateur et le mot de passe du Panel LWS, ou laissez la base intégrée. |
| Les styles ne s'affichent pas | Vérifiez que le fichier `.htaccess` (fichier caché) a bien été envoyé, à la racine et dans `public/`. |
| Les e-mails ne partent pas | Vérifiez les paramètres SMTP dans `.env`, ou passez `MAIL_DRIVER=log` pour les consulter dans l'administration. |
| Réinstaller de zéro | Supprimez `storage/installed.lock`, `storage/database.sqlite` et `.env`, renvoyez `public/install.php` depuis l'archive, puis rouvrez `/install.php`. |

## Sécurité, en bref

- Dossiers sensibles bloqués par `.htaccess`, fichier `.env` jamais servi.
- Mots de passe hachés (jamais stockés en clair), protection CSRF, limitation des tentatives de connexion, en-têtes de sécurité.
- Photos de CV nettoyées de leurs métadonnées (dont la localisation) et servies par des liens signés.
- CV en ligne non référencés par les moteurs de recherche, désactivables à tout moment par le candidat.
