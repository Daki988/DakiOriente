# Origa — l'origine prouvée, de la ferme à l'assiette

Plateforme de suivi technico-économique et de traçabilité de la filière avicole gabonaise, conçue pour le
**Challenge national Agri-Track 241** (CGI, programme POUFA, 150 fermes, arrêt des importations au 1er janvier 2027).

Une seule base de code produit les quatre cibles :

| Cible | Comment | Sortie |
|---|---|---|
| Web (PWA hors ligne) | Vite + React | `dist/` |
| Android | Capacitor | `app-debug.apk` |
| HarmonyOS 2 | Même APK : HarmonyOS 2 exécute les applications Android. Aucune dépendance aux services Google (pas de Firebase, pas de Google Maps). Diffusion par AppGallery ou APK direct. | `app-debug.apk` |
| iOS | Capacitor | projet Xcode `ios/App` |

## Ce qui fonctionne (v0.1)

- **Éleveur, hors ligne** : accueil de la bande, fiche du jour en 3 champs avec contrôles, pesée comparée à la courbe de la souche, signalement sanitaire avec photo compressée, sortie d'animaux, cession de lot, intrants et confirmation de réception, historique des bandes.
- **Traçabilité** : identifiants non réutilisables (`GA1-0042-B07-L01`), QR code signé Ed25519, page publique sans compte, rejet des QR falsifiés, journal des scans, blocage de la cession si le délai d'attente d'un médicament n'est pas écoulé, recherche amont / aval et export pour l'AGASA.
- **Pilotage web** : vue nationale (indicateurs, production hebdomadaire et prévision à 6 semaines, fermes à accompagner, carte, provinces), registre des fermes, enrôlement avec GPS et détection des doublons, export CSV.
- **Services vétérinaires** : qualification des alertes (Nouvelle → En analyse → Confirmée / Informée → Close), seuil d'alerte réservé.
- **Paramétrage sans développement** : formules des indicateurs (évaluateur sûr, sans `eval`), seuils, fréquences, calendrier vaccinal.
- **Sécurité** : journal d'audit en ajout seul, chaîné par SHA-256 ; file d'envoi hors ligne ; accès BCEG limité aux fermes financées avec consentement.

- **Serveur national** (`server/`) : connexion par code SMS, synchronisation avec contrôle des droits côté serveur, gestion des conflits, signature des QR, page publique, journal d'audit non modifiable.

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

## Variables d'environnement

| Variable | Où | Rôle |
|---|---|---|
| `VITE_API_URL` | application | Adresse du serveur national |
| `VITE_PUBLIC_BASE` | application | Adresse publique des pages QR, par exemple `https://origa.ga/` |
| `VITE_LOT_PUBLIC_KEY` | application | Clé publique de vérification hors ligne des QR (`GET /public/key`) |
| `DATABASE_URL` | serveur | Base PostgreSQL |
| `JWT_SECRET` | serveur | Secret des jetons de session, 32 caractères minimum |
| `LOT_SIGNING_KEY` | serveur | Clé privée Ed25519 des QR, à garder dans un coffre |
| `SMS_PROVIDER`, `SMS_HTTP_URL`, `SMS_HTTP_TOKEN` | serveur | Passerelle SMS (Airtel, Moov) |
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

## Reste à faire

1. Validation de la maquette par le client, import dans Figma, ajustements des écrans.
2. Branchement de la passerelle SMS d'un agrégateur Airtel / Moov.
3. Échange EMA-i+ (FAO), export EPCIS 2.0, rapports PDF automatiques.
4. Rouleaux d'étiquettes QR pré-signées, pour imprimer un QR valide sans réseau.
