# Affiches A4 et flyers A5 / DL (novembre 2026)

Deux modèles, déclinés en trois formats. Chaque PDF est au format fini **plus 3 mm de fond perdu** de chaque côté, sans traits de coupe (à demander à l'imprimeur si besoin), en RVB.

| Modèle | Affiche A4 (210 × 297) | Flyer A5 (148 × 210) | Flyer DL (99 × 210) |
|---|---|---|---|
| **Visuel** : arche marocaine, duo d'étudiants, QR « Scanne-moi », 4 atouts | `affiche-a4-visuel-…pdf` | `flyer-a5-visuel-…pdf` | `flyer-dl-visuel-…pdf` |
| **Parcours** : le parcours de l'élève sur la plateforme en 9 étapes, Navi | `affiche-a4-parcours-…pdf` | `flyer-a5-parcours-…pdf` | `flyer-dl-parcours-…pdf` |

Aperçus : `*-apercu.png` ; vue d'ensemble à l'échelle : `planche-affiches-flyers.png`.

## Parcours de l'élève (modèle « parcours »)
1. Crée ton compte · 2. Fais le test d'orientation · 3. Explore les métiers · 4. Compare les écoles · 5. Calcule ton budget ·
6. Candidate en ligne · 7. Échange avec l'école · 8. Trouve ton logement (Navilease) · 9. Prépare ton départ (NaviTravel).

## QR codes : un par support, pour mesurer ce qui fait venir des inscrits
`https://navigoal.net/?utm_source=<affiche|flyer>&utm_medium=print&utm_campaign=<affiche-a4|flyer-a5|flyer-dl>&utm_content=<visuel|parcours>`
— les inscriptions sont comptées par source dans `/admin/campagne/`. Scanner chaque QR sur l'épreuve avant le tirage.

## Impression conseillée
- Affiches A4 à coller : papier couché brillant 135 à 170 g (ou satiné, moins de reflets sous les néons).
- Flyers A5 et DL : couché 135 à 170 g, recto seul (un verso peut être ajouté : horaires, salons, liste des écoles…).
- Contacts : navigoal.net, WhatsApp +241 077 45 31 67, contact@navigoal.net, « BY OAPS ». Aucun logo d'établissement.
- Photos : mêmes sources et crédits que le roll-up (`assets/photos/rollup/credits.json`) ; photo de l'étudiante à confirmer (voir `docs/roll-up/README.md`).

## Régénérer
`python3 design/maquettes/print_affiches.py <icônes lucide-static> <dossier des QR> design/maquettes/out/affiches`, puis capture Playwright (PDF à `zoom: 0.94488`, 4 px = 1 mm). Les A5 reprennent la mise en page A4 réduite (même proportion) ; les DL ont leur propre mise en page.


Personnages (19/11/2026) : un parent (photo Pexels 6172586, détourée : `assets/photos/rollup/parent.png`), l'étudiant (Pexels 9158712) et l'étudiante (photo de l'accueil du site, licence à confirmer), centrés dans l'arche, visages entièrement visibles. Modèle B du roll-up : QR « Scanne-moi » en haut à droite de l'arche (environ 130 à 155 cm du sol).
