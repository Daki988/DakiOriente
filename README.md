# NEAM — Super App

> **Plus proche de votre quotidien.**
> Courses, repas, livraison, santé, beauté, impression, bricolage et services, dans une seule application, partout au Gabon.

Application **hybride** : une seule base de code web (React + TypeScript), qui tourne :

- 🌐 **sur le Web**, installable en PWA (fonctionne hors-ligne)
- 🤖 **sur Android**, en APK / AAB via Capacitor
- 🍏 **sur iOS**, en IPA via Capacitor

## Phase 1 — serveur et espaces professionnels

NEAM Market et NEAM Express fonctionnent avec un **vrai serveur (Supabase)** : connexion par SMS, commandes réelles,
suivi en direct, paiement à la livraison. Trois espaces professionnels s'ajoutent à l'app client :

- **NEAM Partenaire** (`/marchand`, APK) : commandes en direct avec alerte sonore, catalogue et stock, boutique, finances
- **NEAM Livreur** (APK) : en ligne / hors ligne, position GPS, courses, validation par code, espèces à reverser
- **NEAM Admin** (`/admin`) : tableau de bord, affectation des livreurs, commandes, livreurs, boutiques, candidatures, comptes, tarifs

👉 Mise en production pas à pas : [`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md)

## Les services

Chaque service est une « mini-app » avec son logo officiel, son accueil, ses catégories et sa propre barre de navigation, d’après les interfaces de la charte NEAM.

| Service | Contenu |
| --- | --- |
| **NEAM Market** | Courses : catégories, promotions du jour, pages catégories avec filtres (fruits, légumes, tubercules) |
| **NEAM Food** | Restaurants populaires, menus par restaurant, promotions |
| **NEAM Express** | Envoi de colis ou « Commander pour moi », Standard / Express / Same day, suivi du colis, tarifs |
| **NEAM Health** | Téléconsultation, pharmacie, analyses, 8 spécialités avec prise de rendez-vous |
| **NEAM Print** | Impressions, goodies, supports pub : personnalisation avec envoi du visuel |
| **NEAM Services** | Ménage, plomberie, électricité, informatique… : réservation de créneau |
| **Brico&Deco by NEAM** | Bricolage, déco, peinture, artisans |
| **NEAM Beauty** | Maquillage, soins, parfums, prestations à domicile |
| **NEAM Tech** | Smartphones, informatique, réparation, solutions digitales |
| **Tremplin by NEAM** 🆕 | Stages, emplois, alternances : recherche, CV avec assistant de rédaction, candidature en un clic, formations, entreprises |
| **GuruTools by NEAM** 🆕 | Recrutement pour TPE/PME : annonces, tableau de bord, candidats classés par score, fiche « Analyse IA » |
| **Guru Légal by NEAM** 🆕 | Consultation juridique, documents (contrats, bail, statuts), création d’entreprise |

Les logos officiels (fond détouré) sont dans `public/brand/` : `<service>-logo.webp` (logo complet), `<service>-mark.webp` (symbole) et `<service>-mark-white.webp` (symbole blanc pour les tuiles).

## Fonctionnalités

- Accueil fidèle à la maquette : carrousel, grille des services, atouts NEAM, bannière livraison, « Nos services phares »
- Mise en page **mobile** (navigation en bas avec bouton Scanner central) et **desktop** (barre de navigation en haut, deux colonnes)
- Choix de la ville (Libreville, Port-Gentil, Franceville, Oyem…)
- Recherche globale (services et produits), recherches récentes
- Fiche produit, favoris, **un panier par service** (quitter un service avec un panier demande confirmation puis l’annule), livraison offerte dès 15 000 FCFA
- Paiement **à la livraison** ; Mobile Money, carte bancaire et NEAM Pay affichés « À venir »
- Codes promo de démonstration (`NEAM20`, `BIENVENUE`) en mode démo
- Suivi de commande en temps réel (carte, étapes, coursier, notation)
- Scanner de QR codes avec la caméra (`neam://service/<id>`, `neam://produit/<id>`)
- Notifications, profil, portefeuille
- Côté natif : vibrations au toucher, barre d’état, écran de lancement, bouton retour Android

> ℹ️ **Deux modes.** Avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` : mode production (Market + Express réels, autres services en aperçu). Sans : **mode démonstration**, toutes les données sont simulées sur l’appareil et le suivi avance 10× plus vite.

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
  pages/        Accueil, Panier, Validation, Commandes, Scanner, Profil…
  pages/service Mini-apps des services (boutique, Express, Tremplin, GuruTools, Guru Légal)
  data/         Services, catalogue produits, offres d'emploi et candidats, villes
  apps/         Espaces professionnels : marchand, livreur, admin
  live/         Connexion Supabase, authentification SMS, temps réel, suivi des commandes
  store/        État global (panier, favoris, commandes) persisté sur l'appareil
  lib/          Formatage FCFA, pont natif Capacitor
assets/         Sources des icônes et de l'écran de lancement (npx @capacitor/assets generate)
android/ ios/   Projets natifs Capacitor de l'app client
native/         Projets natifs NEAM Partenaire et NEAM Livreur
supabase/       Schéma, règles d'accès et fonctions du serveur (migrations), données de départ, deploy.sql
scripts/        test-backend.mjs : vérifications automatisées du serveur
```

Identifiant de l’application : `com.neam.superapp` (modifiable dans `capacitor.config.ts`).
