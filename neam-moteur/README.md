# NEAM Atelier — moteur de recherche virtuel

Environnement de démonstration pour la prospection : on tape le nom d'une entreprise et on obtient,
comme sur un vrai moteur, sa fiche d'établissement, son site (cliquable) et ses profils réseaux.
Rien n'est publié : pages en `noindex`, bandeau « démonstration », `robots.txt` bloquant.

## Lancer

Site 100 % statique, sans compilation :

```bash
cd neam-moteur
python3 -m http.server 8080      # puis http://localhost:8080
```

Hébergeable tel quel (Netlify, Vercel, LWS…) en publiant le dossier `neam-moteur/`.
Une connexion Internet est nécessaire pour les polices et les effets 3D (three.js).

## Pages

| Page | Rôle |
|---|---|
| `index.html` | accueil du moteur, recherche avec suggestions, « Projet au hasard » |
| `recherche.html?q=…` | résultats : site, réseaux, fiche d'établissement ; recherche par métier ou ville (« hôtel », « dentiste ») = liste + carte |
| `sites/<prospect>/index.html` | site de démonstration (83 prospects) |
| `sites/<prospect>/classique.html` | version classique des 6 sites signature |
| `reseaux/<prospect>/index.html` | profils Instagram, TikTok, Facebook, LinkedIn |
| `admin/` | back-office : projets, création de fiche et de réseaux (mêmes étapes qu'en réalité, vérifications ignorées) |
| `apercu.html` | site et réseaux des projets créés ou modifiés dans le back-office |

## Sites signature (vraies photos, sans 3D)

Photos et vidéos libres de droits (Unsplash, Pexels), produits détourés : voir `assets/sig/CREDITS.md`.

| Prospect | Expérience |
|---|---|
| Artemis Luxury Co | 4 vrais flacons : vignettes à gauche, grand nom derrière le produit, fond qui change de couleur à chaque parfum |
| Chouchou Lazare | défilé de mannequins en wax : la tenue cliquée avance, fiche et tissus à côté, galerie horizontale |
| Skin Technology by Latania | portrait et sérums qui flottent (parallaxe), rituel où le flacon pivote au défilement, photos révélées en bandes |
| Bella Mamma | Diavola / Bianca façon configurateur, tomates en parallaxe, pizza qui tourne au défilement |
| Akaé Beach | vraie vidéo de plage au coucher du soleil en fond, titre qui s'efface au défilement |
| Hôtel Le Refuge | ambiances plein écran, galerie horizontale, réservation avec calcul du prix |

## Back-office

Les saisies sont enregistrées dans le navigateur utilisé (stockage local) : préparez la démo
sur l'appareil qui servira à la présentation. « Réinitialiser mes saisies » remet à zéro.

## Régénérer les 83 sites et pages réseaux

```bash
cd docs/moteur-neam/generateur && node gen-live.js
```
(les 6 sites signature, écrits à la main, ne sont pas écrasés).

## Réseaux sociaux fidèles et sites multipages

- `social.html?slug=<slug>&net=instagram|facebook|tiktok|linkedin` : affiche le profil comme sur le vrai réseau, avec les publications prévues. Tout est interactif : stories, j'aime, commentaires, lecteur TikTok, offres d'emploi LinkedIn. Les données viennent de `data/social.js`.
- `sites/<slug>/` : chaque site contient toutes ses pages (accueil, pages métier, à propos, galerie, contact). Réservation, panier, rendez-vous et formulaires mènent à WhatsApp. Base commune : `assets/site.css` et `assets/site.js`.
- `assets/photos/` : banque de photos libres (Unsplash) classées par secteur.

## Digital score

- `score.html?slug=<slug>` : note actuelle (barème du tableau de prospection : site 40, fiche Google 25, Facebook 20, Instagram/TikTok 15), plan d'action détaillé et note après accompagnement.
- Chaque recommandation a un bouton « Voir appliqué » qui ouvre la page d'exemple et surligne l'élément exact (`?hl=<sélecteur>&ht=<texte>`, géré par `assets/reco.js`).
- `assets/digiscore.js` génère les recommandations à partir des mêmes données que les pages : leur texte correspond donc exactement à ce qui est affiché.
- `assets/reco.js` ajoute aussi le bouton WhatsApp flottant sur tous les sites.
- La fiche Google du moteur contient avis avec réponses du propriétaire, questions-réponses, publications et bouton d'action.
