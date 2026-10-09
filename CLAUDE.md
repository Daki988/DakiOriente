# Navigoal — consignes projet

## Règle de conception (obligatoire)

**Toute interface (site web, application mobile, back-office, espace établissement, espace bailleur Navilease…) est d'abord maquettée dans Figma, puis codée.**

1. Produire ou mettre à jour les écrans dans le fichier Figma du projet :
   https://www.figma.com/design/NzAcfIbAFK6tTliGnuE5xq (générateur : `design/maquettes/build.py`, import via `html_to_figma`).
2. Partager le lien et attendre la validation de l'utilisateur.
3. Seulement ensuite, coder en suivant les maquettes validées.

Toute modification visuelle importante d'un écran existant repasse aussi par Figma.

## Repères

- Cahier des charges : `docs/cahier-des-charges-navigoal.md`
- Référentiels de données : `data/referentiels/` (contrôle : `python3 scripts/validate_referentiels.py`)
- Logos : `assets/logos/` (collecte : `scripts/fetch_logos.py`)
- Site web : `web/` (Next.js 14, Tailwind, Framer Motion ; `npm run dev`, `npm run build`)
- Destination unique : le Maroc (établissements privés aux diplômes homologués par l'État, labels « Reconnu par l'État », « Diplômes homologués », « Établissement professionnel ») ; étudiants de toute l'Afrique et d'ailleurs (`data/referentiels/pays_origine.json`). Langue : français.
- Référentiel des établissements : `python3 scripts/build_etablissements_maroc.py` (sources officielles dans `data/sources/maroc/`).
