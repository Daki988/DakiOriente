# JACKBOY — Feel the night

Site web de **Jackboy Bar-Restaurant 241** (Louis, Libreville, Gabon) — réalisé par NEAM.
Domaine : **www.jackboy241.com**

- **Front** : Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4
- **Animations** : CSS natif uniquement, `prefers-reduced-motion` respecté
- **Contenu** : fichiers JSON dans `content/` (pas de CMS — décision client)
- **Commande en ligne** : panier → message WhatsApp pré-rempli au +241 77 93 27 44 (aucun paiement en ligne, aucune donnée stockée)
- **Hébergement** : Vercel (HTTPS, CDN, aperçus automatiques)

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint       # vérification TypeScript
```

## Modifier le contenu

| Fichier | Contenu |
|---|---|
| `content/settings.json` | téléphones, WhatsApp, adresse, horaires, DJ résident, options de commande, réseaux sociaux |
| `content/menu.json` | catégories, produits, prix FCFA, variantes (Shoot / Verre / Bouteille…), disponibilité, signatures |
| `content/events.json` | événements (les dates passées sont masquées automatiquement) |
| `content/gallery.json` | photos de la galerie et équipe |
| `content/loft.json` | présentation du Loft (`"visible": false` tant qu'elle n'est pas fournie) |

Modifier le JSON (directement sur GitHub, bouton ✏️) → commit → Vercel republie le site en ~1 minute.
Voir `docs/GUIDE-CONTENU.md`.

Règles :
- `price` en FCFA, nombre entier sans espace (`2500`). `0` affiche « Prix sur place » et ne peut pas être commandé.
- `variants` : `[{ "label": "Verre", "price": 5000 }, …]` → un bouton d'ajout par variante.
- `"available": false` grise le produit et retire le bouton d'ajout.
- Horaires : `close` vide = heure de fermeture non communiquée (le site affiche « à partir de 15 h »).
- Coordonnées GPS (`lat`/`lng`) : si renseignées, l'itinéraire pointe exactement sur Jackboy ; sinon il pointe sur le repère (ambassade de Côte d'Ivoire).

## Arborescence

```
app/(site)/        pages (accueil 5 actes, menu, ambiance, accès, événements, loft, légales)
components/        composants (Header, BottomNav, ProductCard, AddToCart, CartDrawer, Gallery, MapEmbed…)
content/           ★ tout le contenu éditable (JSON)
lib/content.ts     accès typé au contenu, FCFA, liens itinéraire / WhatsApp
lib/hours.ts       ouvert/fermé (fuseau Africa/Libreville)
public/brand/      logo officiel (version fond sombre + cactus)
public/images/     visuels produits (extraits de la carte officielle)
docs/              guide de contenu, contenus manquants
```

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL publique (défaut : `https://www.jackboy241.com`) |
