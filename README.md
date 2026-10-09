# Navigoal

Plateforme d'orientation, d'éducation, d'accès aux formations — et de logement étudiant avec **Navilease**.

Destination : **le Maroc** — établissements privés aux diplômes homologués par l'État, pour les étudiants de toute l'Afrique.

## Contenu du dépôt

| Chemin | Description |
|---|---|
| [`docs/cahier-des-charges-navigoal.md`](docs/cahier-des-charges-navigoal.md) | Cahier des charges fonctionnel et technique (v1.1), dont le module Navilease |
| [`docs/referentiels.md`](docs/referentiels.md) | Description des référentiels de données et de leurs schémas |
| `data/referentiels/` | Référentiels JSON : pays, niveaux, diplômes, domaines, profils RIASEC, compétences, métiers, formations, séries, établissements secondaires et supérieurs, logements Navilease |
| `assets/logos/<pays>/` | Logos des établissements |
| `scripts/validate_referentiels.py` | Contrôle d'intégrité des référentiels |
| `scripts/fetch_logos.py` | Collecte des logos (Wikidata/Commons, sites officiels, favicons) |

## Démarrage rapide

```bash
python3 scripts/validate_referentiels.py
pip install requests pillow && python3 scripts/fetch_logos.py
```
