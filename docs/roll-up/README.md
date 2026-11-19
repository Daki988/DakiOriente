# Roll-up Navigoal (novembre 2026)

| Fichier | Usage |
|---|---|
| `rollup-navigoal-85x200-fond-perdu-3mm.pdf` | Fichier à envoyer à l'imprimeur : 856 × 2006 mm, soit 85 × 200 cm + 3 mm de fond perdu de chaque côté, sans traits de coupe. Textes, pictogrammes et QR code vectoriels. |
| `rollup-navigoal-apercu.png` | Aperçu à l'écran (1 px = 1 mm). |

Généré par `design/maquettes/editorial.py` (variable `IMPRESSION=1`) ; PDF produit par Chromium.

## À dire à l'imprimeur
- Format fini **85 × 200 cm**, fond perdu 3 mm inclus dans le PDF, fichier en RVB (conversion en CMJN par l'imprimeur, demander une épreuve pour le bleu Navigoal #1A47F5 et le jaune #FFC21F).
- Les 15 à 20 derniers centimètres sont souvent cachés par le pied de l'enrouleur : seul le fond bleu y figure ; le bloc QR et contacts est juste au-dessus.

## Photos (version du 19/11/2026)
Grande photo : Mosquée Hassan II, Casablanca. Mosaïque : campus d'Al Akhawayn (Ifrane), recadré pour n'afficher aucun logo ni panneau d'établissement (`ecole-recadree.jpg`), résidence étudiante, hublot d'avion, Chefchaouen. Fichiers et crédits dans `assets/photos/rollup/` (`credits.json`) ; le crédit des photos sous licence CC BY-SA figure en bas du roll-up (obligatoire). Photos de 3 840 px de large (environ 115 dpi pour la grande photo à 85 cm), sauf le hublot (Unsplash, 800 px, environ 60 dpi sur sa vignette : acceptable de loin, à remplacer par une photo plus grande si l'imprimeur le demande).

## Points d'attention
- Résolution du logo Navigoal à taille réelle : environ 85 dpi. Lisible à 1–2 m, mais un imprimeur exigeant demandera 100 à 150 dpi : fournir si possible le logo en vectoriel (SVG, PDF ou AI) et la photo d'origine en haute définition, puis relancer le script.
- QR code : `https://navigoal.net/?utm_source=rollup&utm_medium=print&utm_campaign=rollup` (inscriptions comptées dans `/admin/campagne/`). Le scanner avec un téléphone sur l'épreuve avant tirage.
- Contacts affichés : navigoal.net et contact@navigoal.net. WhatsApp n'est pas annoncé sur le roll-up (décision du 19/11/2026).
- Aucun pays ni chiffre figé dans les textes (la plateforme s'ouvre à de nouvelles destinations).
