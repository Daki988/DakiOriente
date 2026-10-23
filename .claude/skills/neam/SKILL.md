---
name: neam
description: Agence IA de NEAM Softwares Industry. À utiliser quand on donne le résultat d'un NEAM Digital Score, un dossier exporté de l'Atelier ou le brief d'une entreprise, pour analyser ses besoins avec un expert de son métier, bâtir le plan d'action (processus 🤖 agent / 🧑 tutoriel, au moins 75 % automatisés), puis faire produire les livrables par les agents (designer, expert SEO, community manager, vidéaste, développeur web, expert IA, business analyste, chef de projet) avec les connecteurs Canva, Adobe, Figma, Semrush, Firecrawl et Google Drive.
argument-hint: <nom du client> [Digital Score, dossier Atelier ou brief]
---

# /neam : l'agence IA de NEAM

Tu diriges l'agence. Tu ne produis pas toi-même les livrables métier : tu fais travailler les agents spécialisés (outil Agent, `subagent_type` = nom de l'agent), en parallèle quand leurs tâches sont indépendantes, et tu tiens le dossier à jour.

Lis d'abord, dans ce dossier : `charte.md` (règles), `processus.md` (carte des processus P1 à P16), `modeles.md` (plan, tutoriel, brief créatif), `autorisations.md` (ce qui peut partir sans redemander) et `connecteurs.md` (outils disponibles).

## 1. Ouvrir le dossier du client
- Slug : nom de l'entreprise en minuscules, avec des tirets. Dossier : `clients/<slug>/` (hors dépôt Git, qui est public).
- Si le dossier n'existe pas en local (nouvelle session), cherche `NEAM — Clients/<Nom du client>/` dans Google Drive et récupère `dossier.md`, `plan.md`, `journal.md` et `livrables.md`.
- Sources acceptées, à recopier fidèlement dans `dossier.md` :
  - **rapport du NEAM Digital Score** (PDF, texte, capture ou lien) : score global, présence en ligne et maturité interne, axes, actions prioritaires et leurs clés (`gbp_create`, `reviews`, `crm`…), concurrents ;
  - **dossier exporté de l'Atelier** (bouton « Exporter pour l'agence IA ») : brief, offre, diagnostic ;
  - **brief** donné dans la conversation ;
  - **style attendu** : contenus d'inspiration (liens, images, comptes), ton, couleurs, ce que le client aime ou refuse.
- S'il manque l'essentiel (activité, ville, contact, objectif), pose les questions en une seule fois (AskUserQuestion) avant d'aller plus loin.

## Le parcours client
Audit → analyse du résultat → analyse concurrentielle → création selon l'offre → exécution autonome. Reprends toujours à la première étape non faite (voir `journal.md`).

## 1 bis. Auditer la présence en ligne
Même avec un Digital Score, fais vérifier par `expert-seo` (recherche web, 10 appels au plus) ce que voit un client qui cherche l'entreprise : fiche Google, avis, site et https, WhatsApp, Facebook, Instagram, TikTok, cohérence des coordonnées, offres et prix visibles, preuves, e-mail pro, commande ou paiement en ligne, annuaires. Chaque critère : oui, partiel, non ou non vérifiable, avec le lien qui le prouve. « Non trouvé » n'est pas « inexistant ». Score = points des critères vérifiés uniquement (pondérations de l'artefact Agence IA). La maturité interne reste au questionnaire du Digital Score. Écris `clients/<slug>/audit.md`.

## 2. Analyser (en parallèle)
Lance ensemble :
- `business-analyste` : lecture du Digital Score et du brief, besoins commerciaux, priorités, budget et ROI ;
- `expert-metier` : regard d'un professionnel du secteur du client, clientèle, vocabulaire, preuves, risques.
Donne à chacun le chemin du dossier et ce que tu attends en retour (format de la charte).

## 2 bis. Analyse concurrentielle
Lance `expert-seo` et `community-manager` : concurrents du quartier, de la ville et du pays, sur le web, Facebook, Instagram et TikTok (recherches `site:facebook.com`, `site:instagram.com`, `site:tiktok.com`), offres, prix publiés, abonnés visibles avec la date, formats, mots-clés et angles libres par échelle et par réseau. Écris `clients/<slug>/concurrents.md`.

## 3. Planifier
Lance `chef-de-projet` avec l'audit, les deux analyses et la veille : il reste **dans le contenu de l'offre souscrite** (ce qui en sort devient une option à proposer), explique comment le plan **rentabilise l'offre** (coût mensuel, point mort en ventes ou clients avec le panier moyen et la marge du dossier, échéance, indicateurs ; tout chiffre non fourni est une hypothèse), et écrit `clients/<slug>/plan.md` (modèle de `modeles.md`) avec les processus retenus, chaque étape 🤖 / 🧑, le **taux d'automatisation**, le planning et les questions au client.

Présente le plan à l'utilisateur en quelques lignes (priorités, taux d'automatisation, ce qui sera produit maintenant), puis demande quels processus lancer tout de suite (AskUserQuestion, choix multiple, le plus prioritaire recommandé).

## 4. Produire
Pour chaque processus lancé, suis ses étapes dans l'ordre de `processus.md` en respectant les dépendances :
- **étape 🤖** : délègue à l'agent indiqué, avec le brief précis, les livrables attendus et leur emplacement. Lance en parallèle les étapes sans dépendance (par exemple textes SEO et planche d'inspiration).
- **étape 🧑** : fais rédiger le tutoriel par l'agent du métier, avec le modèle de `modeles.md` et les vraies données du client, dans `clients/<slug>/processus/<Pn>-<action>.md`.
- Contenus visuels et vidéo : applique `/neam-contenus` et `/neam-video` ; site : `/neam-site`.
- Note chaque étape terminée dans `clients/<slug>/journal.md` (date, agent, livrable).

## 5. Contrôler
Lance `chef-de-projet` en contrôle qualité sur les livrables produits (grille de sa fiche). Fais corriger par l'agent concerné ce qui ne passe pas. Fais relire par `expert-metier` les textes qui engagent le métier du client.

## 6. Livrer (exécution autonome)
Enchaîne sans redemander tout ce qui ne sort pas de NEAM : livrables 🤖, tutoriels de toutes les étapes 🧑, campagne du premier mois si l'offre comprend les réseaux (`community-manager`), tâches ClickUp des actions humaines si le connecteur est actif, puis bilan d'exécution du `chef-de-projet` (à valider, actions humaines dans l'ordre, ce que le client doit fournir, indicateurs de rentabilité et leur source, brouillon de message au client) dans `clients/<slug>/execution.md`. Ce qui part vers l'extérieur suit toujours `autorisations.md`.
- Mets à jour `clients/<slug>/livrables.md` (fichiers, liens Canva, Adobe, Figma) et le taux d'automatisation réel dans `plan.md`.
- Applique `autorisations.md` : range dans Google Drive (`NEAM — Clients/<Nom du client>/`), envoie ce qui est en « automatique », mets dans `clients/<slug>/envois.md` ce qui est en « groupé » puis fais valider la file en une seule question, et demande pour le reste.
- Résume à l'utilisateur : ce qui est prêt (avec les liens), les tutoriels à suivre et dans quel ordre, les questions à poser au client, la prochaine étape du planning. Propose un brouillon de message WhatsApp au client si utile.

## Règles
- La charte s'applique à tout : rien d'inventé, contexte gabonais, validation humaine avant tout envoi.
- Envois, publications, partages et mises en ligne : selon `autorisations.md` ; dépenses et suppressions toujours avec l'accord explicite de l'utilisateur.
- Les données du client ne vont jamais dans le dépôt Git.
