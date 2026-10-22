---
name: neam-contenus
description: Produit les contenus visuels et rédactionnels d'un client de NEAM (identité visuelle, publications et stories, calendrier du mois, affiches, visuels Google Business, supports) dans le style attendu, à partir de contenus d'inspiration et du ton donnés, avec le designer et le community manager, et les connecteurs Canva ou Adobe.
argument-hint: <nom du client> <contenus à produire> [inspirations, ton]
---

# /neam-contenus

1. Lis `.claude/skills/neam/charte.md` et `.claude/skills/neam/modeles.md`, puis `clients/<slug>/dossier.md`, l'identité visuelle et l'identité éditoriale du client s'ils existent.
2. **Style attendu** : rassemble les contenus d'inspiration (liens, captures, comptes cités), le ton, les couleurs et ce que le client refuse. S'il n'y en a pas, demande-les en une question avec des exemples de styles, ou propose 2 pistes.
3. **Brief créatif** (modèle) : fais-le écrire par le `designer` avec l'avis du `community-manager` et, pour les messages qui engagent le métier, de l'`expert-metier`.
4. **Production, en parallèle quand c'est possible** :
   - `community-manager` : calendrier, accroches, textes, légendes, hashtags ;
   - `designer` : visuels dans Canva (génération, modèles, déclinaisons) ou Adobe (Express, Firefly, retouche) ; sinon HTML/CSS rendu en image. Un visuel = un message, lisible en une seconde sur mobile.
5. **Contrôle** : `chef-de-projet` (grille qualité) et relecture de l'orthographe et des coordonnées. Montre un aperçu des visuels à l'utilisateur.
6. **Rangement** : fichiers dans `clients/<slug>/livrables/visuels/` et `reseaux/`, liens Canva ou Adobe dans `livrables.md`, entrée dans `journal.md`. Enregistrement dans Google Drive avec l'accord de l'utilisateur.
7. La publication reste une étape 🧑 : génère le tutoriel de programmation avec `/neam-tutoriel` si l'équipe ne l'a pas déjà.
