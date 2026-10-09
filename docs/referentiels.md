# Référentiels Navigoal

Les référentiels sont les données de base partagées par tous les modules de Navigoal (orientation, catalogue, candidatures, recommandations, Navilease). Ils couvrent les trois pays de lancement : **Gabon (GA), Maroc (MA), Sénégal (SN)**.

Tous les fichiers sont dans `data/referentiels/`, au format JSON UTF-8, avec la même enveloppe :

```json
{
  "_meta": { "referentiel": "metiers", "version": "1.0.0", "date": "2026-10-08", "plateforme": "Navigoal", "...": "..." },
  "items": [ ... ]
}
```

## Vue d'ensemble

| Fichier | Éléments | Clé | Description |
|---|---:|---|---|
| `pays.json` | 3 | `id` (GA, MA, SN) | Examens, système supérieur, organismes, moyens de paiement, villes universitaires |
| `niveaux.json` | 9 | `niv-…` | Niveaux d'études (primaire → bac+8), classes par pays |
| `diplomes.json` | 20 | `dip-…` | Diplômes et niveau correspondant |
| `domaines.json` | 20 | `dom-…` | Domaines / secteurs professionnels |
| `profils_riasec.json` | 6 | `code` | Typologie de Holland (R, I, A, S, E, C) utilisée par les tests |
| `competences.json` | 77 | `cmp-…` | Compétences transversales, langues, scientifiques, numériques et techniques |
| `metiers.json` | 96 | `met-…` | Fiches métiers |
| `formations.json` | 93 | `frm-…` | Formations types (familles de programmes) |
| `series.json` | 42 | `<pays>-bac-…` | Séries / filières du baccalauréat + voies d'orientation après le brevet |
| `etablissements_superieurs.json` | 79 | `<pays>-…` | Établissements **privés et inter-États** accessibles aux étudiants étrangers (logos, photos) |
| `etablissements_publics_archives.json` | 76 | `<pays>-…` | Établissements publics retirés du catalogue (accès des étrangers complexe), conservés pour référence |
| `pays_details.json` | 3 | `GA`, `MA`, `SN` | Fiches pays pour la mobilité : visa, budget mensuel, frais du privé, reconnaissance des diplômes, villes, bourses, sources |
| `etablissements_secondaires.json` | ≈ 3 400 | `<pays>-…` | Lycées de référence (curés) + collèges et lycées importés de Wikidata |
| `navilease_logements.json` | 1 | `nl-…` | Résidences rattachées aux établissements du catalogue + nomenclatures Navilease (les cités universitaires publiques sont archivées dans `_meta`) |

## Graphe des relations

```
competences ◄── metiers ──► formations ──► etablissements_superieurs ──► navilease_logements
                  │  ▲          │  ▲                  ▲
                  │  └──────────┘  │                  │ (formations proposées)
                  ▼                ▼
               domaines         series (par pays) ──► etablissements_secondaires
                  ▲
            profils_riasec (métiers.riasec, series.riasec)
```

Les liens sont bidirectionnels quand c'est utile :

- `metiers[].formations` ↔ `formations[].metiers`
- `formations[].etablissements` ↔ `etablissements_superieurs[].formations`
- `series[].formations_accessibles` ↔ `formations[].series_recommandees[<pays>]`
- `navilease_logements[].etablissements_desservis`

## Schémas

### `metiers`

| Champ | Type | Description |
|---|---|---|
| `id` | string | `met-<slug>` |
| `nom` | string | Intitulé |
| `domaine` | id domaine | Domaine principal |
| `riasec` | string[] | 1 à 2 codes RIASEC dominants |
| `niveau_min` | id niveau | Niveau d'étude minimal habituel |
| `description` | string | Résumé |
| `missions` | string[] | Principales missions |
| `competences` | id[] | Compétences clés |
| `formations` | id[] | Formations recommandées |
| `secteurs` | string[] | Employeurs / secteurs types (exemples locaux) |

### `formations`

| Champ | Type | Description |
|---|---|---|
| `id` | string | `frm-<slug>` |
| `intitule` | string | Intitulé générique |
| `diplome` | string | BTS, DUT, Licence, Master, Diplôme d'ingénieur… |
| `niveau` | id niveau | Niveau de sortie |
| `duree_annees` | int | Durée après le bac |
| `domaine` | id domaine | |
| `competences` | id[] | Compétences visées |
| `mode_admission` | enum | `bac`, `dossier`, `concours`, `dossier+entretien` |
| `metiers` | id[] | Métiers visés (calculé) |
| `series_recommandees` | {pays: id[]} | Séries d'accès conseillées par pays (calculé à partir des domaines ouverts par chaque série) |
| `etablissements` | id[] | Établissements qui la proposent (calculé) |

Une **formation type** n'est pas une offre : chaque établissement publie ses offres concrètes (intitulé exact, frais, dates, places) en les rattachant à une formation type.

### `series`

| Champ | Type | Description |
|---|---|---|
| `id` | string | ex. `ga-bac-c`, `ma-bac-pc`, `sn-bac-s1` |
| `pays` | id pays | |
| `code` | string | Code officiel (C, PC, S1…) |
| `intitule` | string | |
| `filiere` | string | générale, technique, sciences, économie et gestion… |
| `matieres_dominantes` | string[] | |
| `riasec` | string[] | Profils d'intérêts associés |
| `domaines_ouverts` | id[] | Domaines d'études accessibles |
| `formations_accessibles` | id[] | Calculé |
| `metiers_exemples` | id[] | Calculé (15 max) |
| `remarque` | string? | Réforme, conseils |

`_meta.orientation_fin_college` décrit, par pays, l'examen de fin de collège et les voies d'orientation en seconde / tronc commun.

### `etablissements_superieurs`

| Champ | Type | Description |
|---|---|---|
| `id` | string | `<pays>-<sigle>` |
| `nom`, `sigle` | string | |
| `pays`, `ville` | | |
| `type` | enum | `universite`, `grande_ecole`, `ecole_ingenieurs`, `ecole_commerce`, `institut`, `ecole_normale`, `ecole_sante`, `formation_professionnelle`, `cpge` |
| `statut` | enum | `public`, `public_autonome`, `prive`, `prive_reconnu`, `prive_non_lucratif`, `inter_etats` |
| `site_web` | url? | Site officiel (`site_web_signale` conserve un ancien domaine détourné) |
| `annee_creation` | int? | Wikidata |
| `coordonnees` | {lat, lng}? | Wikidata |
| `wikidata` | QID? | |
| `formations` | id[] | Offre **indicative** à valider par l'établissement |
| `logo` | objet? | voir ci-dessous |
| `sources` | string[] | |

### `etablissements_secondaires`

Mêmes principes, avec `type` (`lycee`, `lycee_technique`, `lycee_militaire`, `lycee_cpge`, `college`), `series_proposees` (pour les établissements curés) et `source` (`curation` ou `wikidata`). L'import Wikidata couvre surtout le Maroc (≈ 3 350 collèges et lycées) ; il doit être complété par les annuaires officiels des ministères pour le Gabon et le Sénégal.

### `navilease_logements`

Résidences universitaires publiques (`type = log-residence-publique`) avec `gestionnaire` (CNOU, ONOUSC, COUD, CROUS) et `etablissements_desservis`. Le bloc `_meta` contient les nomenclatures Navilease : `types_logement`, `equipements`, `statuts_verification`.

### Objet `logo`

```json
{
  "fichier": "assets/logos/sn/sn-ucad.png",
  "source_url": "https://…/logo.png",
  "page_source": "https://www.ucad.sn/",
  "methode": "wikidata_p154 | source_manuelle | site_officiel | favicon",
  "date_collecte": "2026-10-08",
  "a_verifier": false
}
```

- `wikidata_p154` et `source_manuelle` : logo officiel identifié (Wikimedia Commons ou URL vérifiée à la main) ;
- `site_officiel` : image « logo » détectée sur le site de l'établissement, revue visuellement ;
- `favicon` : icône du site, qualité moindre ;
- `a_verifier = true` : à confirmer par l'établissement lors de l'onboarding.

Les logos sont des marques appartenant à leurs établissements ; ils sont utilisés uniquement pour identifier les établissements sur Navigoal. Les images sont normalisées (512 px max) pour limiter la consommation de données.

**Couverture au 2026-10-08** (chaque logo a été revu visuellement ; les erreurs détectées sont listées dans `assets/logos/rejets.json`) :

| | Gabon | Maroc | Sénégal | Total |
|---|---:|---:|---:|---:|
| Établissements supérieurs avec logo | 6 / 25 | 53 / 61 | 25 / 34 | **84 / 120** |
| Lycées curés avec logo | 0 / 15 | 4 / 15 | 1 / 18 | 5 / 48 |

La couverture du Gabon est faible car la plupart des établissements n'ont pas de site joignable ni de logo sur Wikimedia Commons. Les logos manquants seront collectés auprès des établissements lors de l'onboarding ; l'interface affiche en attendant un badge avec le sigle.

## Choix éditorial (v1.1) : établissements privés et inter-États

Les établissements publics sont retirés du catalogue : leur accès est souvent complexe pour les étudiants étrangers (quotas, conventions bilatérales, priorité aux nationaux), en particulier au Maroc. Ils sont conservés dans `etablissements_publics_archives.json` avec le motif. Les écoles **inter-États** (ESMT, EISMV, CESAG, ISTA-CEMAC) restent au catalogue car elles ont une vocation internationale.

## Photos des établissements

`scripts/fetch_photos.py` collecte jusqu'à 3 photos par établissement dans `assets/photos/<pays>/` :
Wikimedia Commons via Wikidata (auteur et licence conservés, attribution obligatoire), puis images de partage et bandeaux des sites officiels (propriété de l'établissement, `a_verifier: true`, à confirmer lors de l'onboarding). Chaque photo est revue visuellement ; les rejets sont listés dans `assets/photos/rejets.json`.

## Outils

```bash
# Contrôle d'intégrité (identifiants uniques, références croisées, fichiers logos)
python3 scripts/validate_referentiels.py

# (Re)collecte des logos manquants — Wikidata, puis site officiel, puis favicon
python3 scripts/fetch_logos.py            # complète les logos manquants
python3 scripts/fetch_logos.py --force    # recollecte tout
python3 scripts/fetch_logos.py --only sn-ucad ma-um5
```

- `assets/logos/rejets.json` : images écartées après revue (logos de partenaires, domaines détournés, favicons génériques) — jamais réutilisées ;
- `assets/logos/sources_manuelles.json` : URL de logo fixées à la main, prioritaires.

## Sources et limites

- Curation Navigoal (connaissance des systèmes éducatifs des trois pays) ;
- [Wikidata](https://www.wikidata.org) (identifiants, sites web, coordonnées, dates, logos P154) et Wikimedia Commons ;
- sites officiels des établissements ;
- [Office du Baccalauréat du Sénégal](https://officedubac.sn), [Sencampus](https://www.sencampus.com) (séries et réforme STEG / STIDD).

Limites connues :

- les séries du Gabon (A1…G3) et du Sénégal (réforme 2026 en discussion) doivent être confirmées chaque année auprès des ministères ;
- l'offre de formation des établissements est indicative ;
- la couverture des établissements secondaires du Gabon et du Sénégal est partielle ;
- certains sites officiels ne sont pas joignables ou ont changé de domaine (ex. `insggabon.com`, `lyceelbv.org`, détournés : site retiré et conservé dans `site_web_signale`).
