# Maquettes Navigoal (Figma)

Fichier Figma : https://www.figma.com/design/NzAcfIbAFK6tTliGnuE5xq

`build.py` génère des maquettes HTML auto-contenues (données réelles des référentiels, logos, photo, police Plus Jakarta Sans embarquée) importées dans Figma en calques éditables via `html_to_figma`.

```bash
npm i --prefix /tmp/icons lucide-static@0.453.0
python3 design/maquettes/build.py /tmp/icons/node_modules/lucide-static/icons   # → design/maquettes/out/*.html
```

Campagne « Trouve ta voie » (Gabon) : `python3 design/maquettes/campagne.py <polices> <photo détourée>` → `out/campagne.html` (page de campagne ordinateur et mobile, règlement du jeu, parrainage et sources d'inscription).

Écrans : design system & motion, accueil (desktop + mobile), test et résultat d'orientation, recherche de formations, fiche formation, Navilease, tableau de bord étudiant.
Les étiquettes roses sur les maquettes décrivent les animations prévues.
