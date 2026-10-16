# Plateforme Casier Judiciaire Numérique — République gabonaise

Produit clé en main pour le Ministère de la Justice (cahier des charges v1.0 du 16/10/2026).
Démonstration prévue sur `casier-judiciaire.neamindustry.com`.

## État : lot L0 (cadrage et design)

Méthode : Figma d'abord, code ensuite (voir `docs/developpement.md`).

Fichier Figma : https://www.figma.com/design/TQ5e117rgYHlDjOWnvTTZn

| Élément | État |
|---|---|
| Jetons : 47 couleurs primitives, 30 couleurs sémantiques, 17 espacements et rayons (VIS-09) | Fait dans Figma, copie dans `design/tokens.json` |
| 14 styles de texte (Source Serif 4 / Source Sans 3), 3 ombres | Fait dans Figma |
| 62 pictogrammes en composants | Fait dans Figma |
| Armoiries officielles en composant vectoriel | Fait dans Figma |
| Bloc-marque, drapeau, filet tricolore, emblème neutre, carte des provinces | À faire dans Figma (quota MCP atteint) |
| Composants VIS-10 et maquettes VIS-11 (accueil, demande, vérification, tableau de bord, back-office) | À faire |

## Arborescence

```
assets/emblemes/      armoiries et drapeau (domaine public, usage soumis à autorisation)
assets/cartes/        carte des 9 provinces (CC BY-SA 3.0)
assets/pictogrammes/  pictogrammes Lucide (ISC)
design/tokens.json    jetons de design
design/MEDIATHEQUE.md registre des sources, licences et droits
```
