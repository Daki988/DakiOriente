# Moteur de recherche virtuel NEAM

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

## Sites signature (expériences immersives)

| Prospect | Effet |
|---|---|
| Chouchou Lazare | portant de vêtements : la pièce avance au clic, motifs wax interchangeables |
| Artemis Luxury Co | flacon de parfum 3D à faire tourner, 4 fragrances qui changent couleur et ambiance |
| Skin Technology by Latania | 14 000 particules qui se transforment au défilement (cellule → ADN → nom → goutte) |
| Hôtel Le Refuge | ambiances plein écran (matin, piscine, suite, dîner), galerie horizontale, réservation avec calcul du prix |
| Akaé Beach | océan de particules 3D au coucher du soleil, caméra qui avance au défilement |
| Bella Mamma | la pizza se compose au défilement : pâte, sauce, mozzarella, basilic, cuisson |

## Back-office

Les saisies sont enregistrées dans le navigateur utilisé (stockage local) : préparez la démo
sur l'appareil qui servira à la présentation. « Réinitialiser mes saisies » remet à zéro.

## Régénérer les 83 sites et pages réseaux

```bash
cd docs/moteur-neam/generateur && node gen-live.js
```
(les 6 sites signature, écrits à la main, ne sont pas écrasés).
