# Atelier

Suite de design légère et simple, dans le navigateur, pour un usage personnel.

## Ce que fait la version 1
- **Affiches et visuels** : modèles prêts (affiche, post Instagram, flyer, carte de visite, miniature YouTube) ou page blanche à la bonne taille.
- **Outils** : texte, rectangle, cercle, image, pinceau. Déplacer, redimensionner, tourner, calques, devant/derrière.
- **Retouche photo** : luminosité, contraste, saturation, flou, noir et blanc, effets prêts en un clic.
- **Annuler / Rétablir**, sauvegarde automatique dans le navigateur, projets récents.
- **Export** PNG ou JPG en taille réelle, et fichier projet `.atelier` pour reprendre plus tard.

À venir : dessin de logos (export SVG), montage vidéo simple.

## Raccourcis
`V` choisir · `T` texte · `R` rectangle · `O` cercle · `I` image · `B` pinceau ·
`Ctrl+Z` annuler · `Ctrl+Y` rétablir · `Ctrl+D` dupliquer · `Suppr` supprimer · flèches pour déplacer (`Maj` = ×10).
On peut aussi glisser une photo sur la page ou la coller (`Ctrl+V`).

## Lancer
```bash
npm install
npm run dev      # version de travail : http://localhost:5173
npm run build    # version finale dans dist/ (hébergeable n'importe où)
```

Les projets restent dans votre navigateur : rien n'est envoyé en ligne.
