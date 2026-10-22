# NEAM Softwares Industry

Site web de NEAM (agence de transformation digitale, Libreville, Gabon) et outils internes.

- Site statique à la racine (HTML/CSS/JS), formulaires et API en PHP dans `api/` (hébergement mutualisé LWS, sans Composer). Le site se déploie en envoyant un ZIP sur LWS.
- `atelier/` : back-office de l'équipe (dossiers clients, propositions et ROI, livrables produits par l'API Claude).
- `campagne/` et `print/` : supports marketing (vidéos, carrousels, catalogue).

## Agence IA

L'agence de NEAM travaille dans Claude Code : `/neam <client>` à partir d'un NEAM Digital Score, d'un dossier exporté de l'Atelier ou d'un brief.
- Règles communes : `.claude/skills/neam/charte.md` ; carte des processus (P1 à P16, étapes 🤖 agent / 🧑 tutoriel) : `.claude/skills/neam/processus.md`.
- Agents : `.claude/agents/` (chef de projet, business analyste, expert métier, designer, expert SEO, community manager, vidéaste, développeur web, expert IA).
- Skills : `/neam`, `/neam-tutoriel`, `/neam-contenus`, `/neam-site`, `/neam-video`, `/neam-suivi`.

## À ne jamais faire

- Mettre des données de clients dans le dépôt (il est public) : elles vont dans `clients/` (ignoré par Git) et dans Google Drive.
- Écrire une clé d'API ou un mot de passe dans le dépôt (`api/config.php` sur le serveur, ou Réglages de l'Atelier).
- Inventer des chiffres, des avis ou des témoignages ; envoyer, publier ou partager quoi que ce soit sans accord explicite.
