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

Données de démonstration fictives. Profils de démonstration dans l'onglet **Profil** (éleveur, agent technique, DGE, services vétérinaires).

## Démarrer

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # tests de la couche métier
npm run build        # build web + PWA
npm run cap:sync     # copie le build dans les projets Android et iOS
npm run android:apk  # nécessite le SDK Android (JDK 17)
```

Variables optionnelles : `VITE_API_URL` (serveur de synchronisation), `VITE_PUBLIC_BASE` (adresse publique des pages QR).

La CI GitHub Actions (`.github/workflows/origa.yml`) teste, construit le web, l'APK et l'app iOS simulateur, et publie les trois en artefacts.

## Architecture

```
src/domain   règles métier pures et testées : identifiants, formules, indicateurs, alertes, QR signés
src/data     base locale IndexedDB (Dexie), écriture auditée, file d'envoi, données de démonstration
src/app      session, hooks, consolidation nationale
src/pages    écrans (mobile éleveur / web pilotage / page publique)
design/      maquette v1 (HTML), à importer dans Figma « Origa — Maquettes v1 »
```

## Prochaines étapes

1. Validation de la maquette par le client, puis import dans Figma et ajustements.
2. Serveur national de synchronisation (API REST OpenAPI, PostgreSQL / PostGIS) hébergé au Gabon ; clé de signature des QR côté serveur.
3. Connexion par téléphone et code à usage unique ; double facteur pour les profils de pilotage.
4. Échange EMA-i+ (FAO), export EPCIS 2.0, SMS de secours, rapports PDF automatiques.
