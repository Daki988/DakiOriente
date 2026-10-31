# Moteur de recherche virtuel NEAM — maquettes prospects

Aperçus de démonstration pour les 83 prospects du tableau « Prospects NEAM Softwares Industry » (octobre 2026).
Rien n'est publié : tout est marqué « Maquette NEAM — aperçu non publié ».

## Contenu

| Dossier | Rôle |
|---|---|
| `maquettes.html` | 7 écrans du moteur (accueil, résultats, site, réseaux, back-office) |
| `data/prospects.json` | les 83 prospects (secteur, ville, contacts, site, fiche, réseaux, angle de vente) |
| `logos-reels/` | 8 logos existants récupérés sur les sites des prospects |
| `generateur/` | générateur des visuels (logos, sites, fiche, réseaux, posts) |
| `rendus/<prospect>/` | visuels générés pour chaque prospect |

Pour chaque prospect, `rendus/<prospect>/` contient :

- `logo.jpg` : planche logo (logo, version fond sombre, photo de profil, couleurs, polices) ;
- `logo-seul.png` : logo sur fond transparent ;
- `site.jpg` : maquette du site complet (page entière) ;
- `fiche.jpg` : résultats du moteur Neam avec la fiche d'établissement ;
- `reseaux.jpg` : profils Instagram, TikTok, Facebook et LinkedIn ;
- `posts.jpg` : 3 publications d'exemple (offre, avis client, infos pratiques).

## Logos

- **Récupérés** (8) : AB Location, AFRAM, Biolab, Gabon Management Services, Home & Co, Hôtel Hibiscus, Wanted Immobilier, Yeshua Real Estate.
- **Créés** (75) : les autres prospects. Les logos des comptes Instagram/Facebook n'ont pas pu être récupérés automatiquement (ces sites bloquent l'accès aux robots). Pour utiliser un vrai logo, déposer le fichier dans `logos-reels/` et l'ajouter à `REAL_LOGOS` dans `generateur/lib.js`.

## Sites

11 gabarits (hôtel, restaurant, beauté, immobilier, santé, voyage, auto, école, luxe, boutique, services), chacun avec 3 mises en page de haut de page, 2 à 6 palettes et plusieurs couples de polices. Chaque prospect reçoit une combinaison différente.
Les contenus (prix, menus, chambres, biens) sont des exemples réalistes à faire valider par le client. Photos : Unsplash (usage commercial libre), à remplacer par les photos du client.

## Données affichées

- Notes et nombres d'avis Google : **réels** quand ils figurent dans le tableau, sinon « Aucun avis pour l'instant ».
- Abonnés : réels quand ils sont connus (Even'Jet, Boko's Café, Beach Club, Wanted, Dr Abbas, Fattal, Bella Mamma, Eva Spa, Ozenga), **illustratifs** pour les autres comptes existants, 0 pour les comptes à créer.

## Régénérer

```bash
cd docs/moteur-neam/generateur
PHOTOS_DIR=/chemin/vers/photos node gen.js /tmp/html          # pages HTML
node render.js /tmp/html ../rendus                             # images
```
`PHOTOS_DIR` contient les photos Unsplash nommées `<secteur>-<id>.jpg`.

## Générateurs (mise à jour)

- `generateur/site2.js` : génère les sites multipages selon le secteur (hôtel, restaurant, beauté, immobilier, santé, voyage, auto, école, luxe, boutique, services).
- `generateur/social-data.js` : génère les publications, stories et offres d'emploi de chaque réseau.
- `node generateur/gen-live.js` régénère tout (`data/prospects.js`, `data/social.js`, `sites/`).
