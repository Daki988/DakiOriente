# Référencement naturel — Jackboy Bar-Resto 241

## Ce qui est en place sur le site

| Levier | Détail |
|---|---|
| Pages ciblées | Une page par catégorie (`/menu/burgers`, `/menu/chicha`, `/menu/spiritueux`…) avec titre, H1, description et texte uniques orientés « [produit] à Libreville » + prix réels |
| Mots-clés principaux | bar Libreville · restaurant Libreville · fast food Libreville · burger Libreville · panini Libreville · chicha Libreville · cocktails Libreville · whisky prix Libreville · bières Regab/Booster prix · bar quartier Louis · sortir à Libreville · amapiano Libreville · livraison burger Libreville |
| Données structurées | `Restaurant` + `BarOrPub` + `FastFoodRestaurant` (adresse, horaires, téléphones, gamme de prix, zone servie), `Menu` complet (sections, plats, prix en XAF), `FAQPage`, `BreadcrumbList`, `WebSite` |
| FAQ | `/faq` : 9 questions réellement posées (où, horaires, livraison, prix, chicha, musique, contact, menu PDF) |
| Maillage interne | Accueil → catégories, catégories ↔ catégories, pied de page « À la carte à Libreville » |
| Technique | `sitemap.xml` (avec images et PDF), `robots.txt`, URL canoniques sur www.jackboy241.com, balises `geo.region`/`geo.placename`, image de partage 1200×630 avec le logo, pages statiques |
| Performance (Lighthouse mobile) | Perf. 96–98 · Accessibilité 100 · Bonnes pratiques 100 · SEO 100 · CLS 0 |
| Menu PDF | `/menu/carte-jackboy-241-libreville.pdf` (nom de fichier descriptif, indexable) + aperçus image `alt` descriptifs |

## Actions hors site (indispensables, à faire par Jackboy / NEAM)

1. **Google Business Profile** (priorité n°1 pour « bar / restaurant Libreville » et Google Maps)
   - Nom : *Jackboy Bar-Resto 241* · Catégories : Bar, Restaurant de fast-food, Bar à chicha
   - Adresse et **épingle exacte** sur la carte, mêmes téléphones et horaires que le site, lien vers www.jackboy241.com et vers /menu
   - Photos réelles (façade, salle, plats, soirées) chaque semaine ; publier les soirées en « Posts »
   - Demander des avis Google aux clients (QR code sur les tables / l'addition) et y répondre
2. **Search Console** : ajouter le domaine, envoyer `https://www.jackboy241.com/sitemap.xml`.
3. **Cohérence NAP** (Nom, Adresse, Téléphone identiques) sur Facebook, Instagram, TikTok, WhatsApp Business, annuaires gabonais (ex. Le Pratique du Gabon, Gabonclic…).
4. **Réseaux sociaux** : renseigner les liens dans `content/settings.json` (ils alimentent le balisage `sameAs`).
5. **Contenu frais** : publier les événements dans `content/events.json` (pages et sitemap mis à jour automatiquement).
6. **Coordonnées GPS** exactes dans `content/settings.json` → balisage `geo` et itinéraire précis.

## Suivi
Mesurer les positions sur : « bar Libreville », « chicha Libreville », « burger Libreville », « restaurant Louis Libreville », « Jackboy Libreville ».
