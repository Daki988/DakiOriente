---
name: neam-site
description: Crée ou corrige le site web d'un client de NEAM (page de présentation, site vitrine, boutique avec Mobile Money, corrections techniques après un Digital Score) avec le business analyste, l'expert SEO, le designer, le community manager et le développeur web, jusqu'au ZIP prêt à mettre en ligne et au tutoriel de mise en ligne.
argument-hint: <nom du client> [page | vitrine | boutique | corrections]
---

# /neam-site

Suis le processus P4 (création) ou P5 (corrections) de `.claude/skills/neam/processus.md`, après avoir lu `charte.md`.

1. **Cadrage** (en parallèle) : `business-analyste` et `expert-metier` (objectifs, cibles, parcours, arborescence) ; `expert-seo` (requêtes visées par page, titres, descriptions). Pour des corrections : audit du site actuel par `developpeur-web` et `expert-seo` (Firecrawl).
2. **Contenu et maquette** (en parallèle) : textes par le `community-manager` ; direction artistique et maquette par le `designer` (Figma ou Canva), à partir des inspirations du client.
3. **Validation** : montre la maquette à l'utilisateur ; la présentation au client est une étape 🧑 (tutoriel de réunion avec `/neam-tutoriel`).
4. **Intégration et recette** : `developpeur-web` code le site dans `clients/<slug>/livrables/site/`, puis le teste (390 px et 1280 px, vitesse, formulaires, liens, accessibilité) et joint les captures.
5. **Contrôle** : `chef-de-projet` (grille qualité) et `expert-seo` (balises, données structurées, cohérence des coordonnées).
6. **Livraison** : ZIP du site, tutoriels 🧑 de mise en ligne LWS et de déclaration à Google Search Console, mise à jour de `livrables.md` et `journal.md`. Une démo en ligne (Netlify ou Vercel) seulement avec l'accord de l'utilisateur.
