# JACKBOY — Feel the night

Site web de **Jackboy Bar-Restaurant 241** (Libreville, Gabon) — réalisé par NEAM.

- **Front** : Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4
- **Animations** : CSS natif uniquement (0 Ko de JS d'animation), `prefers-reduced-motion` respecté
- **Back-office** : [Keystatic](https://keystatic.com) sur `/keystatic` — le contenu vit dans `content/*.json`
- **Hébergement recommandé** : Vercel (HTTPS, CDN mondial, aperçus automatiques par branche)

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000  — admin : http://localhost:3000/keystatic
npm run build && npm start
npm run lint       # vérification TypeScript
```

En local, l'administration écrit directement dans `content/` (mode `local`).

## Arborescence

```
app/(site)/          pages publiques (accueil 5 actes, menu, ambiance, accès, événements, loft, légales)
app/keystatic/       interface d'administration
app/api/keystatic/   API de l'administration
components/          composants réutilisables (Hero, BottomNav, ProductCard, EventCard, Gallery, MapEmbed…)
content/             ★ TOUT le contenu éditable (JSON) — modifié via /keystatic
lib/content.ts       accès typé au contenu + formatage FCFA
lib/hours.ts         calcul ouvert/fermé (fuseau Africa/Libreville, créneaux après minuit)
keystatic.config.tsx schéma du back-office
public/images/       photos téléversées depuis l'administration
docs/                guide d'utilisation, contenus manquants
```

## Variables d'environnement (production)

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL publique (canonical, sitemap, Open Graph) |
| `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | Active le mode GitHub de l'administration |
| `KEYSTATIC_GITHUB_CLIENT_ID` / `KEYSTATIC_GITHUB_CLIENT_SECRET` | App GitHub (créée par l'assistant Keystatic) |
| `KEYSTATIC_SECRET` | Secret de session (chaîne aléatoire longue) |
| `NEXT_PUBLIC_KEYSTATIC_REPO` | `propriétaire/dépôt` (défaut : `daki988/dakioriente`) |

Aucun secret n'est versionné (`.env*` est ignoré).

## Mise en production de l'administration

1. Déployer le dépôt sur Vercel (import GitHub).
2. Lancer `npm run dev`, ouvrir `/keystatic` avec `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` défini : l'assistant crée l'App GitHub et fournit les variables.
3. Renseigner les variables dans Vercel → Settings → Environment Variables, redéployer.
4. Inviter les membres de l'équipe comme collaborateurs du dépôt :
   **Write** = éditeur, **Admin/Maintain** = administrateur.
5. Chaque « Enregistrer » dans l'admin crée un commit → Vercel republie le site automatiquement (~1 min).

## Avant la mise en ligne

- Remplacer toutes les données marquées démo (voir `docs/CONTENUS-MANQUANTS.md`).
- Décocher **Mode démonstration** dans *Infos pratiques* (retire le bandeau et autorise l'indexation).
- Remplacer le logo provisoire (`components/Logo.tsx`, `app/icon.svg`) par le logo officiel.
