# Nda — l'adresse officielle, partageable en un lien

*« Nda » : la maison (fang). Nom provisoire.*

Application d'adressage pour le Gabon. Le besoin est le même que celui de FindMe (donner une adresse fiable à chacun), mais l'approche diffère : **on s'appuie sur l'adressage officiel déjà en place**, celui du projet d'adressage de Libreville (rues nommées, numéros de porte par parcelle, découpage en 6 arrondissements, plaques posées), au lieu d'inventer un format propriétaire.

## Positionnement (différences avec FindMe)

| | FindMe | Nda |
|---|---|---|
| Base de l'adresse | Adresse générée par l'app | **Nom de voie officiel + numéro de porte** du projet d'adressage |
| Voies non nommées (quartiers sous-intégrés, Akanda, Owendo…) | Adresse générée | Code court **relatif à l'arrondissement ou à la commune** : `ES-LB1-7K4PQ` |
| Dernier mètre | Texte | **Repère + note vocale** (français, fang, punu, myènè…) pour le livreur |
| Revenus | Plaques, partenariats postaux | **API B2B** (livraison, e-commerce, banques/KYC, SEEG, assurances), tableau de bord pour les mairies, plaques QR en option |
| Fiabilité | Déclaratif | Statut « vérifiée » (GPS + confirmation par une livraison réussie ou un agent) |

## Modèle économique

- **Particuliers : gratuit** (créer, partager, retrouver une adresse).
- **Entreprises : API payante à l'appel** : géocodage d'un code, validation d'adresse, itinéraire du dernier mètre.
- **Mairies / État : licence** du tableau de bord (adresses créées, voies à nommer, couverture).
- **Plaques de porte QR** pour les voies pas encore plaquées (revenu secondaire).

## Format du code Nda

`PP-ZZZ-XXXXX`
- `PP` : province (`ES` Estuaire = GA-1, `OM` Ogooué-Maritime = GA-8…)
- `ZZZ` : zone, soit un arrondissement (`LB1` = Libreville 1er), soit une commune (`OWE` Owendo, `AKA` Akanda)
- `XXXXX` : position, sur un alphabet de 28 caractères sans ambiguïté (pas de 0/O, 1/I/L ni voyelles). Précision < 2 m à Libreville, < 5 m sur une grande commune comme Akanda.

## Contenu de ce dossier

Moteur d'adressage (sans interface), testé :

- `src/code.ts` : encodage et décodage du code Nda.
- `src/adresse.ts` : création d'une adresse (GPS + voie officielle + numéro), validation contre le référentiel, formatage postal, résolution d'un code.
- `src/partage.ts` : lien de fiche, lien WhatsApp pré-rempli, lien d'itinéraire.
- `src/referentiel.ts` : **référentiel d'exemple** (Libreville 1er arr., Owendo, Akanda ; valeurs indicatives). À remplacer par les données officielles du projet d'adressage.

```bash
cd nda
npm test        # 8 tests, Node ≥ 22.18 (TypeScript exécuté nativement)
npm run lint    # vérification TypeScript (depuis la racine : npm ci au préalable)
```

## Interface

Comme le veulent les consignes du projet, l'interface est maquettée dans Figma avant d'être codée :
<https://www.figma.com/design/GuXATD2l598OY7hYuvobPd>

- ✅ 01 · Accueil et 02 · Créer mon adresse (textes adaptés à Libreville)
- ⏳ 03 · Carte d'adresse partageable (QR, WhatsApp, SMS)
- ⏳ 04 · Mode livreur (saisie d'un code, itinéraire, écoute de la consigne)

## Application (`app/`)

Application web mobile (Vite + React + Leaflet/OpenStreetMap) qui code les écrans **01** et **02** validés :
- **Accueil** : carte « Mon adresse » (code Nda, partage natif ou WhatsApp, itinéraire), actions rapides, adresses enregistrées.
- **Créer mon adresse** : GPS ou épingle à placer sur la carte, zone détectée automatiquement, choix du quartier et de la voie officielle (ou « voie sans nom »), numéro de porte, repère, consigne vocale enregistrée au micro (30 s).

Les adresses sont stockées sur le téléphone (localStorage), sans compte ni serveur pour l'instant.
« Trouver » et « Scanner » attendent les maquettes 03–04.

```bash
cd nda/app
npm install
npm run dev      # http://localhost:5173
npm run build    # vérifie les types + produit dist/ (hébergeable sur Vercel, Netlify, LWS…)
```

## Prochaines étapes

1. Terminer les maquettes 03–04, puis faire valider l'ensemble.
2. Obtenir les données du projet d'adressage : limites des arrondissements, noms de voies, numéros de porte.
3. App mobile (application web installable d'abord : hors ligne, Android d'entrée de gamme) + API REST.
4. Pilote dans un arrondissement de Libreville avec 1 ou 2 services de livraison.
