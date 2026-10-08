# NEAM — Super App

> **Plus proche de votre quotidien.**
> Courses, repas, livraison, santé, beauté, impression, bricolage et services, dans une seule application, partout au Gabon.

Application **hybride** : une seule base de code web (React + TypeScript), qui tourne :

- 🌐 **sur le Web**, installable en PWA (fonctionne hors-ligne)
- 🤖 **sur Android**, en APK / AAB via Capacitor
- 🍏 **sur iOS**, en IPA via Capacitor

## Les services

| Service | Contenu |
| --- | --- |
| **NEAM Market** | Courses et produits du quotidien |
| **NEAM Food** | Repas et livraison de repas |
| **NEAM Express** | Envoi de colis et documents : estimation du prix, course prioritaire |
| **NEAM Health** | Santé, parapharmacie, téléconsultation |
| **NEAM Print** | Impression et supports marketing |
| **NEAM Services** | Assistance, conciergerie, réservation |
| **Brico&Deco by NEAM** | Bricolage, décoration, artisans |
| **NEAM Beauty** | Beauté, soins, prestations à domicile |
| **NEAM Tech** | High-tech, informatique, solutions digitales |

## Fonctionnalités

- Accueil fidèle à la maquette : carrousel, grille des services, atouts NEAM, bannière livraison, « Nos services phares »
- Mise en page **mobile** (navigation en bas avec bouton Scanner central) et **desktop** (barre de navigation en haut, deux colonnes)
- Choix de la ville (Libreville, Port-Gentil, Franceville, Oyem…)
- Recherche globale (services et produits), recherches récentes
- Fiche produit, favoris, panier regroupé par service, livraison offerte dès 15 000 FCFA
- Paiement : **NEAM Pay** (portefeuille), **Airtel Money**, **Moov Money**, carte bancaire, espèces à la livraison
- Codes promo (`NEAM20`, `BIENVENUE`)
- Suivi de commande en temps réel (carte, étapes, coursier, notation)
- Scanner de QR codes avec la caméra (`neam://service/<id>`, `neam://produit/<id>`)
- Notifications, profil, portefeuille
- Côté natif : vibrations au toucher, barre d’état, écran de lancement, bouton retour Android

> ℹ️ Pour l’instant, les données (catalogue, commandes, paiements) sont **simulées** et enregistrées sur l’appareil (`localStorage`). Le suivi de commande avance 10× plus vite que le temps réel, pour les démos. Il faudra brancher une API backend pour passer en production.

## Démarrage

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de production dans dist/
npm run preview    # prévisualiser le build
```

## Générer l’APK Android

**Automatiquement :** le workflow GitHub Actions `Android APK` compile un APK de debug à chaque push. Vous le trouverez dans l’onglet **Actions** → dernier run → artefact `neam-debug-apk`.

**En local** (il faut Android Studio, ou JDK 21 + SDK Android) :

```bash
npm run apk        # → android/app/build/outputs/apk/debug/app-debug.apk
npm run android    # ouvre le projet dans Android Studio (build signé / Play Store)
```

## Générer l’app iOS

Il faut un Mac avec Xcode.

```bash
npm run ios        # build + sync + ouverture dans Xcode
```

Ensuite, dans Xcode : choisir l’équipe de signature, puis *Product → Archive* pour publier sur l’App Store ou TestFlight.

## Structure

```
src/
  components/   Logo NEAM, tuiles de service, navigation, cartes produit, sections de l'accueil
  pages/        Accueil, Service, Express, Panier, Validation, Commandes, Scanner, Profil…
  data/         Services, catalogue produits, villes
  store/        État global (panier, favoris, commandes) persisté sur l'appareil
  lib/          Formatage FCFA, pont natif Capacitor
assets/         Sources des icônes et de l'écran de lancement (npx @capacitor/assets generate)
android/ ios/   Projets natifs Capacitor
```

Identifiant de l’application : `com.neam.superapp` (modifiable dans `capacitor.config.ts`).
