# Mettre Tremplin en ligne sur un sous-domaine LWS

Ce guide vous accompagne pas à pas, sans ligne de commande. Comptez **20 à 30 minutes**, dont une partie d'attente (version PHP, certificat SSL).

Exemple utilisé : le sous-domaine **tremplin.neamindustry.com**. Remplacez-le par le vôtre.

> Les noms des menus LWS peuvent légèrement varier selon votre formule et les mises à jour du LWS Panel. En cas de doute, la recherche de l'aide LWS (aide.lws.fr) donne la procédure à jour.

---

## Ce qu'il vous faut

- Une formule d'hébergement **mutualisé Linux LWS** (Perso, Starter, Standard, Performance…) avec **PHP 8.2 ou 8.3** et **MySQL**.
- L'archive `tremplin-lws-*.zip` (tout est inclus, y compris les bibliothèques : rien à installer).
- 300 Mo d'espace libre environ (application, catalogue de formations, futurs CV et photos).

---

## Étape 1 — Créer le sous-domaine

1. LWS Panel › votre formule › **Gérer** › rubrique *Gestion du domaine* › **Sous-domaines**.
2. Saisissez `tremplin` puis **Ajout**.
3. Notez le **dossier** associé au sous-domaine (souvent un dossier du même nom dans votre espace, par exemple `/htdocs/tremplin`).

**Si le panel vous permet de choisir le dossier racine** du sous-domaine, faites-le pointer vers `…/tremplin/public` : c'est la configuration idéale.
**Sinon, aucun problème** : le fichier `.htaccess` fourni à la racine redirige automatiquement vers `public/` et bloque l'accès aux dossiers sensibles (`app`, `storage`, `vendor`, `.env`…).

## Étape 2 — Choisir PHP 8.3

1. LWS Panel › votre formule › **Configuration PHP**.
2. Sélectionnez **PHP 8.3** (ou 8.2 au minimum) et validez.
3. Vérifiez que ces extensions sont actives (c'est le cas par défaut en général) : **pdo_mysql, mbstring, fileinfo, gd, curl, zip**.
4. LWS indique un délai de **15 à 20 minutes** pour que la nouvelle version s'applique : passez à l'étape 3 en attendant.

## Étape 3 — Créer la base de données

1. LWS Panel › **MySQL & phpMyAdmin** › « Créer une base MySQL ».
2. Notez soigneusement les quatre informations affichées : **serveur (hôte)**, **nom de la base**, **utilisateur**, **mot de passe**.

Pour des raisons de sécurité, LWS n'autorise l'accès à la base que depuis l'hébergement lui-même : c'est normal, Tremplin s'y connecte de l'intérieur.

## Étape 4 — Envoyer les fichiers

**Méthode simple : le gestionnaire de fichiers LWS**

1. LWS Panel › **Gestionnaire de fichiers** › ouvrez le dossier du sous-domaine (étape 1).
2. **Téléversez** `tremplin-lws-*.zip`, puis utilisez **Extraire** sur l'archive.
3. Vérifiez que vous voyez directement dans le dossier : `app/`, `public/`, `storage/`, `vendor/`, `.htaccess`… (et pas un sous-dossier supplémentaire). Si un sous-dossier a été créé, déplacez son contenu d'un niveau.
4. Supprimez l'archive `.zip` une fois l'extraction terminée.

**Méthode alternative : FTP (FileZilla)**. Décompressez l'archive sur votre ordinateur, puis envoyez tout le contenu dans le dossier du sous-domaine. Pensez à afficher les fichiers cachés pour que `.htaccess` soit bien envoyé.

**Droits d'accès** : les valeurs par défaut conviennent en général (755 pour les dossiers, 644 pour les fichiers). Le dossier `storage/` et ses sous-dossiers doivent être accessibles en écriture.

## Étape 5 — Lancer l'assistant d'installation

1. Ouvrez **http://tremplin.neamindustry.com/install.php** (en `https://` si le certificat est déjà actif).
2. L'assistant vérifie le serveur. Si une ligne est en rouge, il vous dit quoi corriger (le plus souvent : version PHP pas encore appliquée, patientez quelques minutes).
3. **Code de propriété** : dans le gestionnaire de fichiers, ouvrez `storage/install-code.txt` et recopiez le code. Il prouve que c'est bien vous qui installez.
4. Renseignez :
   - l'**adresse du site** (ex. `https://tremplin.neamindustry.com`) ;
   - la **base de données** (étape 3) ;
   - votre **compte administrateur** (e-mail et mot de passe d'au moins 10 caractères) ;
   - en option : la **clé Claude**, le **SMTP** de contact@neamindustry.com, les **données de démonstration**.
5. Cliquez sur **Installer Tremplin**. En quelques secondes, la base est créée avec les référentiels (villes, secteurs, 59 compétences), le **catalogue réel de 311 formations** et **60 certifications**.

L'assistant se verrouille ensuite et tente de se supprimer. S'il vous le demande, supprimez `public/install.php` à la main.

> **Données de démonstration** : utiles pour une présentation (entreprises, offres et candidats fictifs ; comptes candidat, recruteur et école avec le mot de passe `Tremplin2026!`). Le compte administrateur de démonstration est désactivé automatiquement. **Ne les cochez pas pour le lancement public.**

## Étape 6 — Activer HTTPS

1. LWS Panel › **SSL** (certificat Let's Encrypt gratuit) › activez-le pour `tremplin.neamindustry.com`.
2. Une fois le certificat actif, forcez HTTPS : dans le fichier `.htaccess` à la racine du dossier, retirez les `#` devant les trois lignes de la rubrique « Redirection vers HTTPS ».
3. Vérifiez que `APP_URL` commence bien par `https://` dans le fichier `.env` (racine du dossier).

## Étape 7 — Tâche planifiée hebdomadaire (formations)

Le catalogue est déjà chargé. Pour le tenir à jour (nouveaux cours Coursera et sessions FUN MOOC) :

1. LWS Panel › **Tâches Cron**.
2. Méthode d'appel : **PHP**.
3. Script : `bin/sync-trainings.php` (chemin depuis le dossier du sous-domaine, ou chemin complet indiqué par le panel).
4. Fréquence : **une fois par semaine**, la nuit (ex. lundi à 3 h).

La synchronisation dure quelques minutes. Elle peut aussi être lancée à la main depuis **Admin › Formations & certificats**.

## Étape 8 — Réglages à faire dans le fichier `.env`

Le fichier `.env` (racine du dossier) contient la configuration. Modifiez-le avec le gestionnaire de fichiers si besoin :

| Réglage | Rôle |
|---|---|
| `ANTHROPIC_API_KEY` | Clé Claude pour les CV, lettres, relecture et entretiens. Vide = moteur NEAM intégré. |
| `MAIL_DRIVER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | Envoi réel des e-mails depuis contact@neamindustry.com. Avec `MAIL_DRIVER=log`, les messages sont visibles dans Admin › Communications. Les paramètres SMTP sont fournis par l'hébergeur de la boîte mail. |
| `APP_DEMO` | `true` affiche les comptes de démonstration sur la page de connexion. Mettez `false` en production. |
| `APP_DEBUG` | Laissez `false` en ligne (affiche les erreurs détaillées si `true`, à n'utiliser que le temps d'un dépannage). |

**Ne communiquez jamais ce fichier** : il contient vos mots de passe et la clé Claude.

---

## Mettre à jour la plateforme

1. Faites une **sauvegarde** (voir plus bas).
2. Envoyez les fichiers de la nouvelle archive **en remplaçant** les anciens, **sauf** le fichier `.env` et le dossier `storage/` (qui contient vos données, CV et photos).
3. Ouvrez le site : la base est **mise à jour automatiquement** au premier chargement (nouvelles tables et colonnes), sans perte de données.

## Sauvegardes

- **Base de données** : LWS Panel › MySQL & phpMyAdmin › phpMyAdmin › onglet *Exporter*. LWS propose aussi des sauvegardes automatiques selon la formule.
- **Fichiers des utilisateurs** : le dossier `storage/uploads/` (CV importés, photos, certificats).
- **Configuration** : le fichier `.env`.

## Dépannage

| Symptôme | Solution |
|---|---|
| Page blanche ou erreur 500 | Vérifiez la version PHP (8.2+). Consultez `storage/logs/php-error.log`. |
| « Forbidden » / 403 partout | Le contenu de l'archive est peut-être dans un sous-dossier : voir étape 4. |
| L'installation demande un code | Ouvrez `storage/install-code.txt` dans le gestionnaire de fichiers. |
| « Connexion à la base impossible » | Recopiez exactement l'hôte, le nom, l'utilisateur et le mot de passe de l'étape 3. |
| Les styles ne s'affichent pas | Vérifiez que le fichier `.htaccess` (fichier caché) a bien été envoyé, à la racine et dans `public/`. |
| Les e-mails ne partent pas | Vérifiez les paramètres SMTP dans `.env`, ou passez `MAIL_DRIVER=log` pour les consulter dans l'administration. |
| Réinstaller de zéro | Supprimez `storage/installed.lock` et `.env`, videz la base dans phpMyAdmin, rouvrez `/install.php` (à renvoyer s'il a été supprimé). |

## Sécurité, en bref

- Dossiers sensibles bloqués par `.htaccess`, fichier `.env` jamais servi.
- Mots de passe hachés (jamais stockés en clair), protection CSRF, limitation des tentatives de connexion, en-têtes de sécurité.
- Photos de CV nettoyées de leurs métadonnées (dont la localisation) et servies par des liens signés.
- CV en ligne non référencés par les moteurs de recherche, désactivables à tout moment par le candidat.
