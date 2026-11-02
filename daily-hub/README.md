# DAILY HUB – modèle 3D, visite virtuelle et film

Projet autonome (indépendant du site Jackboy à la racine du dépôt).

## État d'avancement

| Livrable | État |
|---|---|
| Plan coté 20 × 6 m (120 m²) | fait – `src/model/plan.js` |
| Modèle 3D complet (Three.js) | v1 faite – `src/model/build.js` |
| 33 rendus de référence | v1 faite – `renders/` (1600 × 1000) |
| Maquette Figma de l'interface | non faite (exception validée par le client : code direct) |
| Visite interactive (menu, plan, hotspots, plein écran) | faite – `index.html`, `src/tour/` |
| Mise en ligne | projet Netlify `daily-hub-visite` créé, premier déploiement à lancer |
| Film 4K 90–120 s + version verticale | à faire, filmé dans le même modèle |

## Plan retenu

Repère : X = longueur (entrée à x = 0), Z = profondeur (0 = mur arrière, 6 = façade parking).

| Espace | Emprise | Surface |
|---|---|---|
| Supérette | x 0 → 5,83 | 35 m² |
| Café | x 5,83 → 10,83 | 30 m² |
| Laverie | x 10,83 → 16,67 | 35 m² |
| Réserve + local technique | x 16,67 → 20, z 0 → 3,6 | 8 + 4 = 12 m² |
| Sanitaires H / F | x 16,67 → 20, z 3,6 → 6 | 4 + 4 = 8 m² |

- Entrée principale sur le pignon ouest (vues axiales 5, 7, 9), façade longue vitrée côté parking.
- Café ouvert sur la supérette, porte vers la terrasse ; cloison vitrée avec passage de 1,4 m vers la laverie.
- Sanitaires et réserve accessibles depuis la laverie ; la circulation est intégrée à la laverie.

## Visite interactive

- Glisser : regarder à 360° (horizontal + vertical). Molette, pincement ou boutons +/− : zoom.
- Toucher un cercle vert : aller au point de vue. Toucher le sol ou un objet : y marcher (trajet calculé, sans traverser murs ni mobilier).
- Clavier : flèches / ZQSD / WASD.
- Menu bas : accès direct à chaque espace. Bouton grille : les 33 points de vue avec vignettes. Bouton plan : plan 120 m² cliquable avec position actuelle. Mini-plan avec position et direction du regard.
- « Maquette 3D » : vue en coupe orbitale, toucher un espace pour y entrer.
- Lien direct vers une vue : `/#vue-16`.
- Poids : ~165 Ko de JS compressé + vignettes, aucune image de texture (procédurales). Ombres calculées une seule fois, rendu seulement quand la vue change (économie de batterie).

## Commandes

```bash
npm install
npm run dev                         # visite : http://localhost:5173/  · rendu brut : /preview.html?view=7
npm run build                       # site statique dans dist/ (Netlify : voir netlify.toml)
npm run render:views                # régénère les 33 vues dans renders/
npm run render:views -- --only 1,16 --w 3840 --h 2160
```

## Organisation du code

- `src/model/plan.js` : cotes, zones, ouvertures, cloisons. **Seul endroit où modifier l'architecture.**
- `src/model/build.js` : murs, mobilier, équipements, signalétique, extérieur. Les objets répétés (produits, feuillages) sont instanciés et le statique est fusionné par matériau pour rester fluide sur mobile.
- `src/model/textures.js` : textures procédurales (aucune image à télécharger).
- `src/model/views.js` : les 33 caméras de référence.
- `src/model/stage.js` : moteur de rendu, ciel, soleil, jour/nuit, vue en coupe.

## Limites connues (v1)

- Rendu stylisé temps réel, pas photoréaliste (pas de Blender/GPU dans l'environnement).
- Petites pièces (WC, local technique) encore sommaires ; on y entre par fondu (trop étroites pour un trajet animé).
