# Roll-up Navigoal (novembre 2026)

| Fichier | Usage |
|---|---|
| `rollup-navigoal-85x200-fond-perdu-3mm.pdf` | Fichier à envoyer à l'imprimeur : 856 × 2006 mm, soit 85 × 200 cm + 3 mm de fond perdu de chaque côté, sans traits de coupe. Textes, pictogrammes et QR code vectoriels. |
| `rollup-navigoal-apercu.png` | Aperçu à l'écran (1 px = 1 mm). |
| `rollup-navigoal-modele-B-85x200-fond-perdu-3mm.pdf` | **Modèle B** (fond clair, arche marocaine, parcours en 5 étapes, QR rond) : même format et mêmes réglages d'impression. |
| `rollup-navigoal-modele-B-apercu.png` | Aperçu du modèle B. |
| `rollup-comparaison-A-B.png` | Les deux modèles côte à côte. |
| `rollup-situation-studio-B.jpg`, `rollup-situation-campus-B.jpg` | Mises en situation du modèle B (studio et campus marocain), pour les réseaux sociaux ou la validation. Générées par `design/maquettes/rollup_situation.py <aperçu.png> <sortie.html>`, puis capture Playwright. |

Généré par `design/maquettes/editorial.py` (variable `IMPRESSION=1`) ; PDF produit par Chromium.

## À dire à l'imprimeur
- Format fini **85 × 200 cm**, fond perdu 3 mm inclus dans le PDF, fichier en RVB (conversion en CMJN par l'imprimeur, demander une épreuve pour le bleu Navigoal #1A47F5 et le jaune #FFC21F).
- Les 15 à 20 derniers centimètres sont souvent cachés par le pied de l'enrouleur : seul le fond bleu y figure ; le bloc des contacts est juste au-dessus.

## Photos (version du 19/11/2026)
Grande photo : Mosquée Hassan II, Casablanca. Mosaïque : campus d'Al Akhawayn (Ifrane), recadré pour n'afficher aucun logo ni panneau d'établissement (`ecole-recadree.jpg`), résidence étudiante, hublot d'avion, Chefchaouen. Fichiers et crédits dans `assets/photos/rollup/` (`credits.json`) ; le crédit des photos sous licence CC BY-SA figure en bas du roll-up (obligatoire). Photos de 3 840 px de large (environ 115 dpi pour la grande photo à 85 cm), sauf le hublot (Unsplash, 800 px, environ 60 dpi sur sa vignette : acceptable de loin, à remplacer par une photo plus grande si l'imprimeur le demande).

Duo d'étudiants au premier plan : l'étudiant vient d'une photo Pexels (licence libre, usage commercial autorisé), détouré et recadré à mi-corps (`assets/photos/rollup/etudiant.png`) ; l'étudiante est la photo de l'accueil du site (`web/public/images/etudiante.webp`, arrivée avec le socle du site le 08/10/2026, source et licence non documentées : à confirmer avant l'impression).

Logo : version ronde fournie le 19/11/2026 (`assets/photos/rollup/logo-navigoal-cercle.png`, 1 254 px, environ 115 dpi à 27 cm). QR code placé à hauteur de poitrine (environ 110 à 140 cm du sol), 20 cm de côté, dans un cadre « Scanne-moi » ; le bloc du bas ne garde que navigoal.net, contact@navigoal.net et « BY OAPS ».

## Points d'attention
- Résolution du logo Navigoal à taille réelle : environ 85 dpi. Lisible à 1–2 m, mais un imprimeur exigeant demandera 100 à 150 dpi : fournir si possible le logo en vectoriel (SVG, PDF ou AI) et la photo d'origine en haute définition, puis relancer le script.
- QR code : `https://navigoal.net/?utm_source=rollup&utm_medium=print&utm_campaign=rollup` (inscriptions comptées dans `/admin/campagne/`). Le scanner avec un téléphone sur l'épreuve avant tirage.
- Contacts affichés : navigoal.net, WhatsApp +241 077 45 31 67 (ajouté à la demande de l'utilisateur, 19/11/2026) et contact@navigoal.net.
- Aucun pays ni chiffre figé dans les textes (la plateforme s'ouvre à de nouvelles destinations).


Personnages (19/11/2026) : la photo de famille fournie par l'utilisateur (mère, diplômé en toge, père) est utilisée telle quelle, avec son décor d'origine, cadrée dans l'arche (`assets/photos/rollup/famille-scene.jpg`) : un détourage collé sur la Mosquée Hassan II faisait trop artificiel. **Droits d'utilisation à confirmer** et **définition insuffisante pour le roll-up** (environ 35 dpi à taille réelle) : fournir l'original en haute définition (au moins 2 500 px de haut) avant le tirage ; pour l'affiche A4 et les flyers, la définition suffit. Modèle B du roll-up : QR « Scanne-moi » en haut à droite de l'arche.


Variante « étudiants » (19/11/2026) : même mise en page avec la photo de groupe d'étudiants fournie (`assets/photos/rollup/etudiants-scene.jpg`), fichiers suffixés `-etudiants` (roll-up B, affiche A4, flyers A5 et DL visuels) ; QR placé sur les vêtements, aucun visage caché. Générer avec `VARIANTE=etudiants`. Mêmes réserves : droits d'utilisation à confirmer, et 1 024 px de haut seulement, insuffisant pour le roll-up (environ 45 dpi), suffisant pour l'A4 et les flyers.
