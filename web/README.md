# Navigoal — site web

Next.js 14 (export statique), Tailwind CSS, Framer Motion. Les données viennent des référentiels du dépôt (`../data/referentiels`, `../assets/logos`, `../assets/photos`), copiées automatiquement par `scripts/sync-data.mjs` avant `dev` et `build`.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # site statique dans out/ (287 pages)
```

Maquettes de référence (à valider avant tout changement visuel) : https://www.figma.com/design/NzAcfIbAFK6tTliGnuE5xq

## Pages

| Route | Contenu |
|---|---|
| `/` | Accueil : hero animé, recherche, logos, parcours, pays, domaines, métiers, Navilease, actualités |
| `/orientation` | Test RIASEC interactif, résultat (radar, domaines, métiers, formations), « Ma série au lycée » |
| `/formations`, `/formations/[id]` | Recherche filtrable des offres, fiche formation (compatibilité, admission, débouchés, logement) |
| `/metiers`, `/metiers/[id]` | 96 fiches métiers ; parcours série → formations → écoles → métier |
| `/etablissements`, `/etablissements/[id]` | 79 écoles privées et inter-États ; fiche avec galerie photos, formations reliées aux métiers, budget, écoles comparables |
| `/pays`, `/pays/[code]` (ga, ma, sn) | Fiches pays (Gabon, Maroc, Sénégal) : système d'études, visa, budget, villes, écoles |
| `/comparateur` | Comparaison d'écoles par formation ou par métier visé (coût total, admission, visa, logement) ; paramètres `f`, `m`, `e`, `pays` |
| `/devis` | Devis parents sur toute la durée des études (moteur `src/lib/devis.ts`), export PDF par impression ; paramètres `etab`, `f`, `o`, `l`, `d` |
| `/pourquoi` | Valeur ajoutée par type d'utilisateur |
| `/navilease`, `/actualites` | Logement étudiant, actualités |
| `/espace`, `/espace/parent` | Tableau de bord étudiant, espace parent (démonstration) |

## Animations

Titres mot par mot, parallaxe du hero, compteurs, révélations au scroll (stagger), marquee des logos, ligne de parcours liée au scroll, cartes inclinables, reflet sur les boutons, transitions de questions, radar tracé, pins de carte en ressort, header qui se rétracte, barre de progression de lecture, transitions de page. Toutes respectent `prefers-reduced-motion`.

Le profil d'orientation est conservé dans le navigateur (`localStorage`) en attendant le backend.

## Mise en ligne

Production : https://navigoal.netlify.app (projet Netlify `navigoal`, équipe DakiOriente).

Le fichier `netlify.toml` à la racine du dépôt permet aussi un déploiement continu depuis GitHub (base `web`, build `npm ci && npm run build`, publication `out`) si le dépôt est relié au projet dans Netlify.
