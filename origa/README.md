# Origa 1.3 — l'origine prouvée, de la ferme à l'assiette

![Logo Origa](design/logo/origa-logo-horizontal.svg)

Plateforme de suivi technico-économique et de traçabilité de la filière avicole gabonaise, conçue pour le
**Challenge national Agri-Track 241** (CGI, programme POUFA, 150 fermes, arrêt des importations au 1er janvier 2027).

Une seule base de code produit les quatre cibles :

| Cible | Comment | Sortie |
|---|---|---|
| Web (PWA hors ligne) | Vite + React | `dist/` |
| Android | Capacitor | `app-debug.apk` |
| HarmonyOS 2 | Même APK : HarmonyOS 2 exécute les applications Android. Aucune dépendance aux services Google (pas de Firebase, pas de Google Maps). Diffusion par AppGallery ou APK direct. | `app-debug.apk` |
| iOS | Capacitor | projet Xcode `ios/App` |

## Ce qui fonctionne (v1.0)

- **Éleveur, hors ligne** : accueil de la bande, fiche du jour en 3 champs avec contrôles, pesée comparée à la courbe de la souche, signalement sanitaire avec photo compressée, sortie d'animaux, cession de lot, intrants et confirmation de réception, historique des bandes.
- **Traçabilité** : identifiants non réutilisables (`GA1-0042-B07-L01`), QR code signé Ed25519, page publique sans compte, rejet des QR falsifiés, journal des scans, blocage de la cession si le délai d'attente d'un médicament n'est pas écoulé, recherche amont / aval et export pour l'AGASA.
- **Pilotage web** : vue nationale (indicateurs, production hebdomadaire et prévision à 6 semaines, fermes à accompagner, carte, provinces), registre des fermes, enrôlement avec GPS et détection des doublons, export CSV.
- **Services vétérinaires** : qualification des alertes (Nouvelle → En analyse → Confirmée / Informée → Close), seuil d'alerte réservé.
- **Paramétrage sans développement** : formules des indicateurs (évaluateur sûr, sans `eval`), seuils, fréquences, calendrier vaccinal.
- **Sécurité** : journal d'audit en ajout seul, chaîné par SHA-256 ; file d'envoi hors ligne ; accès BCEG limité aux fermes financées avec consentement.

- **Connexion** par numéro de téléphone et code à usage unique (SMS en production, code affiché en démonstration).
- **Demande d'accès** à la place d'une inscription libre : le cahier des charges confie la création des comptes à l'administrateur, et aucun compte d'opérateur n'est actif sans convention.
- **Back-office administrateur** : tableau de bord, comptes et périmètres, validation des demandes d'accès avec SMS d'activation, registre des opérateurs et conventions, journal d'audit vérifiable et exportable.
- **Opérateurs (abattoirs)** : réception des lots par scan du QR ou lien, contrôle de l'écart annoncé / reçu.
- **Identité** : logo, icônes Android et iOS, écran de démarrage, animation de chargement, photos contextuelles.
- **Serveur national** (`server/`) : connexion par code SMS, synchronisation avec contrôle des droits côté serveur, gestion des conflits, signature des QR, page publique, journal d'audit non modifiable.

## Conformité au cahier des charges (v1.1)

Les 68 fonctionnalités du cahier des charges sont couvertes, y compris celles marquées « phase ultérieure », « à arbitrer » et « évolutive » :

- **Registres d'élevage** : vaccinations (calendrier), traitements avec délai d'attente tiré du catalogue, charges par poste, commandes d'intrants (demande → validation DGE → livraison), réservations d'abattage, grille de biosécurité notée avec actions correctives.
- **Bandes** : ouverture unique par ferme, saisie de rattrapage, clôture avec bilan technico-économique et courbe de croissance, réouverture réservée à la DGE.
- **Terrain** : visites géolocalisées de l'agent (stock d'aliment observé → écart d'intrants), diagnostics, téléconsultation vétérinaire.
- **Traçabilité avancée** : contrôle distributeur, lots dérivés (transformation), mouvements de transport, étiquette et document d'accompagnement imprimables, chronologie complète du lot.
- **Pilotage** : filtres période / cohorte / statut, taux de lots tracés (cible 95 %), classement pondéré des fermes, économie de filière, rapports hebdomadaires, mensuels et de fin de bande (PDF), notifications.
- **Diffusion** : statistiques préparées par la DGE, validées par le MAEDR, publiées sur `/statistiques` ; offres et prix de marché.
- **Gouvernance** : rôles MAEDR (validation des publications) et ANINF (audit seul), matrice des droits paramétrable appliquée par le serveur, listes de référence éditables.
- **Reprise de l'existant** : import CSV (fermes de l'AMI, fiches, intrants) avec validation ligne à ligne et rapport de rejets.
- **API** : contrôle distributeur, agrégats, statistiques publiques, export d'événements EMA-i, `GET /openapi.json`.

## Tableaux de bord par profil

Chaque profil arrive sur l'écran de son métier : l'éleveur sur sa bande, l'agent technique sur la liste de ses fermes, l'abattoir sur les lots à réceptionner, la DGE sur la vue nationale, les vétérinaires sur la situation sanitaire, la BCEG sur son portefeuille de fermes financées (avec consentement), le MAEDR sur les indicateurs consolidés et les diffusions à valider, l'ANINF sur le journal d'audit, l'administrateur sur l'administration.

## Ajouts de la version 1.3

- **Menu pour tous les profils** : sur téléphone et tablette (donc dans l'APK), la DGE, les vétérinaires, la BCEG, le MAEDR, l'ANINF et l'administrateur n'avaient aucun menu. Une barre supérieure ouvre désormais le menu en tiroir.
- **Corriger et supprimer selon l'habilitation** : boutons Modifier et Supprimer dans tous les registres, affichés d'après les règles du serveur (`server/src/scope.ts`, module partagé). La suppression est confirmée, journalisée et transmise aux autres appareils. Les lots, les bandes, les fermes et les alertes ne se suppriment jamais ; les saisies d'une bande clôturée sont en lecture seule. Droit « supprimer » (S) dans la matrice des droits.
- **Écrans de la version 1.2** : rouleau d'étiquettes QR à imprimer, « Mes étiquettes QR », envoi des rapports par e-mail (destinataires, journal, envoi immédiat), export EPCIS 2.0.
- **Serveur sur Vercel** : `api/index.js` fait tourner le serveur national en fonction sans serveur (même code que le conteneur). L'application démarre en démonstration autonome et bascule d'elle-même sur le serveur dès qu'il répond « prêt » (`VITE_API_OPTIONAL=1`) : il suffit de brancher une base PostgreSQL au projet Vercel (variable `DATABASE_URL` ou `POSTGRES_URL`).
- **Démonstration devant un jury** : `DEMO_OTP=241241` accepte un code fixe à la place du SMS et charge le jeu de données fictives (`server/seed/demo.json`). À retirer avant l'exploitation réelle.
- **Contrôle automatique** : 534 écrans vérifiés (9 profils, 3 largeurs) sans menu absent, débordement ni chevauchement.

## Ajouts de la version 1.2

- **Étiquettes QR pré-signées** : le serveur signe à l'avance les prochains numéros de lot d'une bande (`POST /lots/presign`). Le téléphone de l'éleveur garde une réserve de 5 étiquettes, complétée à chaque synchronisation ; une cession faite sans réseau donne tout de suite un QR valide, et le serveur appose ensuite la même signature.
- **Rapports par e-mail** : hebdomadaire (semaine écoulée), mensuel (mois écoulé) et de fin de bande (à la clôture), avec le rapport en PDF et le détail en CSV. Un rapport n'est envoyé qu'une fois par période ; un échec est consigné et réessayé (`GET /reports/runs`, `POST /reports/send`).
- **Export EPCIS 2.0 (GS1)** : `GET /interop/epcis/events` décrit chaque lot en événements normalisés (mise en lot, expédition, transport, réception, transformation, contrôle du distributeur). Les identifiants sont des URN `urn:origa:…` en attendant un préfixe GS1.
- **SMS et e-mails par Brevo** : `SMS_PROVIDER=brevo` et `MAIL_PROVIDER=brevo` avec une seule clé, en plus de la passerelle HTTP et du relais SMTP.
- **Maquettes dans Figma** : `scripts/planche-figma.cjs` produit la planche des écrans (application en service et écrans à valider).

Deux modes de fonctionnement :

| Mode | Quand | Comportement |
|---|---|---|
| Démonstration | `VITE_API_URL` absent | Données fictives locales, choix du profil dans l'onglet Profil |
| Production | `VITE_API_URL` renseigné | Connexion par SMS, données du périmètre de l'utilisateur, QR signés par le serveur |


## Démarrer

```bash
# Application (web, Android, iOS)
npm install
npm run dev          # http://localhost:5173, mode démonstration
npm test             # tests de la couche métier
npm run build        # build web + PWA
npm run cap:sync     # copie le build dans les projets Android et iOS

# Serveur national (PostgreSQL 16 requis)
cd server && npm install
cp .env.example .env # puis renseigner les valeurs
npm run seed         # comptes et données de démonstration
npm run dev          # http://localhost:8080
npm test             # tests d'intégration (base origa_test)

# Application branchée sur le serveur
VITE_API_URL=http://localhost:8080 npm run dev
```

Comptes de démonstration du serveur, avec le code SMS affiché dans le journal du serveur :

| Téléphone | Profil |
|---|---|
| +24100000001 | Éleveur, ferme GA1-0042 |
| +24100000002 | Agent technique, Estuaire |
| +24100000003 | DGE |
| +24100000004 | Services vétérinaires |
| +24100000005 | BCEG |
| +24100000007 | Opérateur, abattoir de Ntoum |
| +24100000009 | Administrateur |
| +24100000010 | MAEDR (validation des publications) |
| +24100000011 | ANINF (audit) |

## Variables d'environnement

| Variable | Où | Rôle |
|---|---|---|
| `VITE_API_URL` | application | Adresse du serveur national |
| `VITE_PUBLIC_BASE` | application | Adresse publique des pages QR, par exemple `https://origa.ga/` |
| `VITE_LOT_PUBLIC_KEY` | application | Clé publique de vérification hors ligne des QR (`GET /public/key`) |
| `DATABASE_URL` | serveur | Base PostgreSQL |
| `JWT_SECRET` | serveur | Secret des jetons de session, 32 caractères minimum |
| `LOT_SIGNING_KEY` | serveur | Clé privée Ed25519 des QR, à garder dans un coffre |
| `SMS_PROVIDER`, `SMS_HTTP_URL`, `SMS_HTTP_TOKEN` | serveur | Passerelle SMS : `console`, `http` (agrégateur Airtel, Moov) ou `brevo` |
| `BREVO_API_KEY`, `SMS_SENDER` | serveur | Clé et nom d'expéditeur Brevo (SMS et e-mails) |
| `MAIL_PROVIDER`, `SMTP_URL`, `MAIL_FROM` | serveur | Envoi des rapports : `console`, `smtp` ou `brevo` |
| `REPORT_RECIPIENTS` | serveur | Destinataires par défaut des rapports, séparés par des virgules |
| `VITE_API_OPTIONAL` | application | `1` : démonstration autonome tant que le serveur ne répond pas « prêt », puis bascule automatique |
| `DEMO_OTP` | serveur | Code fixe de démonstration (6 chiffres) et chargement des données fictives ; jamais en exploitation |
| `CRON_SECRET` | serveur (Vercel) | Protège la tâche planifiée d'envoi des rapports |
| `DATABASE_SSL` | serveur | `verify` (certificat vérifié) ou `no-verify` (chiffré sans vérification, pooler Supabase) |
| `DATABASE_SCHEMA` | serveur | Schéma de travail, pour isoler Origa dans une base partagée |
| `CORS_ORIGINS` | serveur | Origines autorisées |

## Déploiement

- **Serveur** : `docker compose up -d --build` lance PostgreSQL et le serveur (voir `docker-compose.yml`).
- **Web** : contenu de `dist/` derrière n'importe quel serveur HTTPS.
- **Android et HarmonyOS 2** : la CI produit un APK de test à chaque modification. Pour l'APK et l'AAB de publication signés, lancer une fois `scripts/creer-keystore.sh` puis enregistrer les 4 secrets `ORIGA_KEYSTORE_*` dans GitHub. HarmonyOS 2 installe le même APK, par AppGallery ou en direct.
- **iOS** : la CI compile pour le simulateur. La publication sur l'App Store exige un compte Apple Developer et ses certificats.

## Architecture

```
src/domain     règles métier pures et testées : identifiants, formules, indicateurs, alertes, QR signés
src/data       base locale IndexedDB, écriture auditée, file d'envoi, synchronisation, démonstration
src/app        session, connexion, hooks, consolidation nationale
src/pages      écrans : mobile éleveur, web de pilotage, page publique, connexion
server/src     serveur national : Fastify, PostgreSQL, droits, conflits, signature, audit
design/        maquette v1 en HTML, à importer dans Figma « Origa — Maquettes v1 »
```

## Identité visuelle

- Logo : `design/logo/` (symbole, version horizontale). L'œuf marque l'origine, la coche l'origine vérifiée, le liseré les couleurs du Gabon.
- Icônes et écrans de démarrage natifs : sources dans `resources/`, régénérés par `npx capacitor-assets generate`.
- Photos : licence Unsplash, crédits dans l'application (Profil, À propos) et ci-dessous.

| Photo | Auteur |
|---|---|
| [Éleveuse avec une poule](https://unsplash.com/photos/sDjk3DHv2dY) | Richard Nyoni |
| [Visite vétérinaire en ferme avicole](https://unsplash.com/photos/e83gkmG_yW8) | Creab ThePolymath |
| [Poulailler](https://unsplash.com/photos/8YZOdT7CsGk) | Muhammed Minhaj VP |
| [Poussin](https://unsplash.com/photos/R-1VgUb5f7U) | Darius Cotoi |
| [Poule au pré](https://unsplash.com/photos/4W8FgDVyUME) | Thomas Iversen |

## Avant la mise en production

1. Héberger le serveur au Gabon (`docker compose up -d --build`) avec de vrais secrets : `JWT_SECRET`, `LOT_SIGNING_KEY`, mot de passe PostgreSQL.
2. Brancher la passerelle SMS d'un agrégateur Airtel / Moov (`SMS_PROVIDER=http`).
3. Construire l'application avec `VITE_API_URL`, `VITE_PUBLIC_BASE` et `VITE_LOT_PUBLIC_KEY`.
4. Créer la clé de signature Android (`scripts/creer-keystore.sh`) et enregistrer les secrets GitHub.
5. Compte Apple Developer pour publier sur l'App Store.
6. Formalités auprès de l'autorité de protection des données (loi n° 025/2023).

## Reste à faire

1. Base de démonstration : projet Supabase « origa » (Paris), rôle `origa_app` propriétaire du schéma `origa`, branché sur Vercel par `DATABASE_URL` (pooler en mode session), `DATABASE_SSL=no-verify` et `DATABASE_SCHEMA=origa`. Pour l'exploitation, la base passe chez un hébergeur au Gabon et le certificat du serveur est vérifié (`DATABASE_SSL=verify`).
2. Fournir la clé de la passerelle SMS (agrégateur Airtel / Moov ou Brevo) et du relais d'e-mails ; retirer alors `DEMO_OTP`.
3. EMA-i+ (FAO) : l'export existe, le protocole d'échange reste à formaliser avec la FAO.
4. Obtenir un préfixe GS1 pour remplacer les URN `urn:origa:…` par des LGTIN et des GLN dans l'export EPCIS.
5. Héberger le serveur au Gabon (`docker compose`), ouvrir le compte Apple Developer, accomplir les formalités de protection des données.
