---
name: neam-video
description: Produit les vidéos courtes d'un client de NEAM (Reels, TikTok, statuts WhatsApp, vidéo de présentation, histoire illustrative animée) : concept, script, storyboard, tutoriel de tournage, montage avec Adobe ou Canva ou rendu animé, sous-titres et déclinaisons.
argument-hint: <nom du client> <objectif de la vidéo> [inspirations]
---

# /neam-video

Suis le processus P9 de `.claude/skills/neam/processus.md`, après avoir lu `charte.md`.

1. **Concept** : `videaste` avec `expert-metier` : 3 idées (accroche en 3 secondes, déroulé, appel à l'action), à partir de l'objectif et des vidéos d'inspiration du client ; demande à l'utilisateur laquelle retenir.
2. **Script et storyboard** : `videaste`, durées plan par plan, texte à l'écran, voix éventuelle.
3. **Images** :
   - tournage chez le client : étape 🧑, tutoriel de tournage au smartphone via `/neam-tutoriel` ;
   - sans tournage : animation (personnages en pions, typographie animée, captures) produite par le `videaste` ; visuels d'appui par le `designer`.
4. **Montage** : Adobe ou Canva si les connecteurs sont là ; sinon animation HTML rendue image par image et assemblée avec ffmpeg, comme `campagne/video-starter/`.
5. **Finitions** : sous-titres, formats 9:16, 1:1 et 16:9, miniature, textes de publication par le `community-manager`.
6. **Contrôle** : images clés vérifiées, `chef-de-projet` (grille qualité). Rangement dans `clients/<slug>/livrables/video/`, `livrables.md` et `journal.md`.
