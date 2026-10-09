# Navigoal — site web

Next.js 14 (export statique), Tailwind CSS, Framer Motion. Les données viennent des référentiels du dépôt (`../data/referentiels`, `../assets/logos`, `../assets/photos`), copiées automatiquement par `scripts/sync-data.mjs` avant `dev` et `build`.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # application Next.js (rendu statique + serveur)
```

Maquettes de référence (à valider avant tout changement visuel) : https://www.figma.com/design/NzAcfIbAFK6tTliGnuE5xq

## Application (V1)

Next.js full-stack : site public, espaces connectés, back-office et API REST (`/api`, voir [docs/backend.md](../docs/backend.md)). Base PostgreSQL (Netlify DB en production).

| Espace | Routes |
|---|---|
| Public | `/`, `/orientation`, `/metiers[/id]`, `/formations[/id]`, `/etablissements[/id]`, `/pays[/code]`, `/comparateur`, `/devis`, `/pourquoi`, `/navilease`, `/navilease/logements[/id]`, `/recherche`, `/actualites[/slug]`, `/cgu`, `/confidentialite`, `/mentions-legales`, `/cookies` |
| Compte | `/connexion`, `/inscription`, `/verification`, `/mot-de-passe-oublie`, `/compte`, `/paiement/[ref]` |
| Élève / étudiant | `/espace`, `/espace/profil`, `/espace/candidatures` (+ `/nouvelle`, `/[id]`), `/espace/documents`, `/espace/paiements`, `/espace/logement`, `/espace/conseiller` |
| Parent | `/parent`, `/parent/enfants`, `/parent/candidatures/[id]`, `/parent/paiements`, `/parent/logement`, `/parent/conseiller` |
| Établissement | `/etablissement`, `/etablissement/candidatures[/id]`, `/etablissement/formations`, `/etablissement/campagnes`, `/etablissement/fiche` |
| Bailleur | `/bailleur`, `/bailleur/annonces` (+ `/nouvelle`, `/[id]`), `/bailleur/reservations`, `/bailleur/profil` |
| Navilease | `/navilease/reservations/[id]` (locataire, parent garant, bailleur) |
| Conseiller | `/conseiller` |
| Back-office | `/admin`, `/admin/utilisateurs`, `/admin/etablissements`, `/admin/referentiels`, `/admin/navilease`, `/admin/paiements`, `/admin/contenus`, `/admin/journal` |
| Commun | `/messages[/id]`, `/notifications` |

### Développement local

```bash
# PostgreSQL local puis :
echo 'DATABASE_URL=postgres://…' > .env.local
npm run db:migrate && SEED_DEMO=1 ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run db:seed
npm run dev
npm test   # tests d'intégration (TEST_DATABASE_URL)
```

Comptes de démonstration (`SEED_DEMO=1`, mot de passe `DEMO_PASSWORD`, par défaut Navigoal2026) : amina.demo@ (étudiante), parent.demo@, ecole.demo@ (ESA Casablanca), bailleur.demo@, conseiller.demo@ — domaine navigoal.com.

### Mise en production (checklist)

- Variables Netlify : `ADMIN_EMAIL`, `ADMIN_PASSWORD` (premier administrateur), `APP_URL`.
- E-mails : `RESEND_API_KEY` + `MAIL_FROM` ; SMS/WhatsApp : `SMS_WEBHOOK_URL`. Sans eux, les codes de vérification et notifications ne partent pas (journalisés seulement).
- Paiements : `CINETPAY_API_KEY` + `CINETPAY_SITE_ID` ; en recette, `PAYMENTS_MODE=sandbox` active la confirmation simulée.
- Relecture juridique des pages `/cgu`, `/confidentialite`, `/mentions-legales` (raison sociale, siège, directeur de la publication).

## Animations

Titres mot par mot, parallaxe du hero, compteurs, révélations au scroll (stagger), marquee des logos, ligne de parcours liée au scroll, cartes inclinables, reflet sur les boutons, transitions de questions, radar tracé, pins de carte en ressort, header qui se rétracte, barre de progression de lecture, transitions de page. Toutes respectent `prefers-reduced-motion`.

Le profil d'orientation est conservé dans le navigateur (`localStorage`) en attendant le backend.

## Mise en ligne

Production : https://navigoal.netlify.app (projet Netlify `navigoal`, équipe DakiOriente).

Le fichier `netlify.toml` à la racine du dépôt permet aussi un déploiement continu depuis GitHub (base `web`, build `npm ci && npm run build`, publication `out`) si le dépôt est relié au projet dans Netlify.
