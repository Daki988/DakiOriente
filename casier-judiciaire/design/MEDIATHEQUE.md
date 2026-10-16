# Médiathèque — éléments visuels officiels (registre des sources et des droits)

Registre tenu selon VIS-05 et ADM-08 : chaque visuel indique sa source, son auteur, sa licence et son statut d'usage.
Recherche faite le 16/10/2026. Aucun visuel n'est généré par IA.

## 1. Symboles de l'État

| Élément | Fichier | Source | Licence / droits | Statut d'usage |
|---|---|---|---|---|
| Armoiries de la République gabonaise | `assets/emblemes/armoiries-republique-gabonaise.svg` ; composant Figma `Emblème/Armoiries officielles` | Wikimedia Commons, *File:Coat_of_arms_of_Gabon.svg* (dessin Louis Mühlemann, 1963 ; vectorisation Fenn-O-maniC). Copie identique (850 × 820, 160 Ko) récupérée via le paquet npm `coat-of-arms` 6.4.0, Wikimedia étant bloqué par le réseau de l'environnement. | Domaine public. Emblème national : usage restreint, indépendamment du droit d'auteur. | **Production uniquement**, après autorisation écrite du Ministère (VIS-02). Démonstration : emblème neutre. |
| Drapeau | `assets/emblemes/drapeau-gabon.svg` | Wikimedia Commons, *File:Flag_of_Gabon.svg* (code source publié sur la page) | Domaine public (géométrie simple). Usage restreint (emblème). | Couleurs utilisées dans les jetons ; drapeau affiché seulement si le Ministère l'autorise. |
| Couleurs nationales | `design/tokens.json` | Valeurs de rendu de Commons : vert RGB 0 158 96 (#009E60), jaune RGB 252 209 22 (#FCD116), bleu RGB 58 117 196 (#3A75C4) | — | À confirmer avec la charte officielle (section 16). |
| Devise | Texte du bloc-marque | Devise nationale : « Union – Travail – Justice » | — | Usage soumis à autorisation (VIS-02). |
| Sceau de l'État (1961) | Non importé | Wikimedia Commons, *File:Seal_of_Gabon.svg* | Domaine public | Disponible si le Ministère le préfère aux armoiries. |

## 2. Typographies et pictogrammes

| Élément | Source | Licence | Remarque |
|---|---|---|---|
| Source Serif 4 (titres) | Adobe Fonts, dépôt officiel `adobe-fonts/source-serif` | SIL Open Font License 1.1 | Disponible dans Figma. À héberger sur la plateforme en production (DON-07). |
| Source Sans 3 (texte, interfaces) | Adobe Fonts, dépôt officiel `adobe-fonts/source-sans` | SIL Open Font License 1.1 | Idem. |
| 62 pictogrammes | Lucide 1.58.0 (paquet npm `lucide-static`), `assets/pictogrammes/` | ISC (`LICENSE-lucide.txt`) | Composants Figma `Icône/…`, 24 px, trait 2 px, couleur liée à `texte/principal`. |

## 3. Cartographie

| Élément | Fichier | Source | Licence | Remarque |
|---|---|---|---|---|
| Carte des 9 provinces (codes ISO 3166-2:GA) | `assets/cartes/gabon-provinces.svg` | geoBoundaries, GAB ADM1, édition 2023 (dérivé de Wikipédia, utilisateur ChrL) | CC BY-SA 3.0 : attribution obligatoire | Projection équirectangulaire simplifiée. Les limites officielles et le ressort des juridictions sont à confirmer avec le Ministère (ADM-01). |

## 4. Photographies officielles

Source : **AGP – Agence Gabonaise de Presse** (agence de presse de l'État).
Ces photos ne sont **pas versées dans le dépôt** : le dépôt est public et les droits de reproduction n'ont pas encore été accordés.

| Sujet | Image d'origine | Article | Crédit | Statut |
|---|---|---|---|---|
| Tribunal de première instance de Libreville (façade, drapeau national) | https://agpgabon.ga/wp-content/uploads/2026/09/Tribunal-de-LBV.jpg | AGP, 11/09/2026, « Clôture session criminelle pour enfants » | © AGP | Pressentie pour la photo d'ouverture de l'accueil. Autorisation AGP à demander. |
| Palais de justice de Libreville | https://agpgabon.ga/wp-content/uploads/2026/09/Le-palais-de-justice-de-Libreville.jpg | AGP, 10/09/2026, « Session du Conseil supérieur de la Magistrature » | © AGP | Pressentie pour les actualités. Autorisation AGP à demander. |

Règles appliquées : pas de visage identifiable sans autorisation, pas d'imagerie de sanction (VIS-06).
Les photos définitives seront commandées à un photographe local ou acquises sous licence (VIS-05).

## 5. À demander au Ministère

- Logo officiel du Ministère de la Justice en vectoriel (visible sur sa page Facebook ; justice.gouv.ga inaccessible le 16/10/2026).
- Charte graphique officielle, si elle existe (valeurs exactes des couleurs).
- Autorisation écrite d'usage des armoiries, du drapeau et de la devise (VIS-02).
- Photothèque du Ministère (juridictions, greffes, agents) avec droits d'usage.

## 6. Référence consultée, non réutilisée

- Prototype « Système Judiciaire Numérique National » (mj.gurutools.pro/ejustice) : bleu nuit #0F1D36 repris comme couleur institutionnelle. Son logo et sa photo d'ouverture sont d'origine non documentée : non réutilisés.
