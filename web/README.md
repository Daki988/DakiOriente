# Navigoal — site web

Next.js 14 (export statique), Tailwind CSS, Framer Motion. Les données viennent des référentiels du dépôt (`../data/referentiels`, `../assets/logos`), copiées automatiquement par `scripts/sync-data.mjs` avant `dev` et `build`.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # site statique dans out/ (321 pages)
```

Maquettes de référence (à valider avant tout changement visuel) : https://www.figma.com/design/NzAcfIbAFK6tTliGnuE5xq

## Pages

| Route | Contenu |
|---|---|
| `/` | Accueil : hero animé, recherche, logos, parcours, pays, domaines, métiers, Navilease, actualités |
| `/orientation` | Test RIASEC interactif, résultat (radar, domaines, métiers, formations), « Ma série au lycée » |
| `/formations`, `/formations/[id]` | Recherche filtrable des offres, fiche formation (compatibilité, admission, débouchés, logement) |
| `/metiers`, `/metiers/[id]` | 96 fiches métiers filtrables par domaine et profil |
| `/etablissements`, `/etablissements/[id]` | 120 établissements, fiche avec offre de formation |
| `/pays`, `/navilease`, `/actualites`, `/espace` | Pays, logement étudiant, actualités, tableau de bord étudiant |

## Animations

Titres mot par mot, parallaxe du hero, compteurs, révélations au scroll (stagger), marquee des logos, ligne de parcours liée au scroll, cartes inclinables, reflet sur les boutons, transitions de questions, radar tracé, pins de carte en ressort, header qui se rétracte, barre de progression de lecture, transitions de page. Toutes respectent `prefers-reduced-motion`.

Le profil d'orientation est conservé dans le navigateur (`localStorage`) en attendant le backend.
