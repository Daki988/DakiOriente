# Dëkk — l'adresse officielle, partageable en un lien

*« Dëkk » : le lieu où l'on habite (wolof).*

Application d'adressage pour le Sénégal. Le même besoin que FindMe (donner une adresse fiable à chacun), mais une approche différente : **on part de l'adressage officiel existant** au lieu d'inventer un format propriétaire.

## Positionnement (différences avec FindMe)

| | FindMe | Dëkk |
|---|---|---|
| Base de l'adresse | Adresse générée par l'app | **Rue officielle codifiée + n° de porte** issus du référentiel communal |
| Rues sans nom | Adresse générée | Code court **relatif à la commune** (`DK-SLB-7K4PQ`), basé sur le code région ISO 3166-2:SN |
| Dernier mètre | Texte | **Repère + note vocale** (wolof, pulaar, français…) pour le livreur |
| Revenus | Plaques, partenariats postaux | **API B2B** (livraison, e-commerce, banques/KYC, énergie), tableau de bord pour les communes, plaques QR en option |
| Fiabilité | Déclaratif | Statut « vérifiée » (géoloc + confirmation par une livraison réussie ou un agent) |

## Modèle économique

- **Particuliers : gratuit** (créer, partager, retrouver une adresse).
- **Entreprises : API payante à l'appel** — géocodage d'un code, validation d'adresse, itinéraire du dernier mètre.
- **Communes / État : licence** du tableau de bord (adresses créées, rues sans nom à codifier, couverture).
- **Plaques de porte QR** vendues via des artisans partenaires (revenu secondaire, pas le cœur).

## Contenu de ce dossier

Moteur d'adressage (sans interface), testé :

- `src/code.ts` — code Dëkk `RR-CCC-XXXXX` : alphabet de 28 caractères sans ambiguïté (pas de 0/O, 1/I/L ni voyelles), précision < 1 m sur une commune urbaine.
- `src/adresse.ts` — création d'une adresse à partir du GPS + rue officielle + numéro, validation contre le référentiel, formatage postal, résolution d'un code.
- `src/partage.ts` — lien de fiche, lien WhatsApp pré-rempli, lien d'itinéraire.
- `src/referentiel.ts` — **référentiel d'exemple** (3 communes de Dakar, valeurs indicatives). À remplacer par les données officielles (limites communales, référentiel des voies).

```bash
cd dekk
npm test        # 8 tests, Node ≥ 22.18 (TypeScript exécuté nativement)
npm run lint    # vérification TypeScript (depuis la racine : npm ci au préalable)
```

## Interface

Selon les consignes du projet, l'interface est d'abord maquettée dans Figma :
<https://www.figma.com/design/GuXATD2l598OY7hYuvobPd>

- ✅ 01 · Accueil (« Mon adresse », actions rapides, adresses enregistrées)
- ✅ 02 · Créer mon adresse (carte + GPS, commune auto, rue officielle, n° de porte, repère, note vocale)
- ⏳ 03 · Carte d'adresse partageable (QR, WhatsApp, SMS)
- ⏳ 04 · Mode livreur (saisie d'un code, itinéraire, écoute de la consigne)

Le code des écrans sera écrit après validation des maquettes.

## Prochaines étapes

1. Terminer et valider les maquettes 03–04.
2. Obtenir les données officielles : limites des communes et référentiel des voies.
3. App mobile (PWA d'abord, fonctionne hors ligne et sur Android d'entrée de gamme) + API REST.
4. Pilote sur une commune de Dakar avec 1–2 sociétés de livraison.
