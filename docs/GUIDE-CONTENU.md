# Guide de mise à jour du contenu — Jackboy

Le site n'a pas d'interface d'administration : le contenu se modifie dans les fichiers du dossier `content/` sur GitHub.

## Changer un prix
1. Ouvrir `content/menu.json` sur GitHub, cliquer sur ✏️ (Edit).
2. Chercher le produit (Ctrl+F), modifier `"price": 2500` (chiffres seulement).
3. Pour un spiritueux, modifier la valeur dans `variants` (Shoot / Verre / Bouteille).
4. Cliquer **Commit changes**. Le site est à jour en ~1 minute.

## Rendre un produit indisponible
Remplacer `"available": true` par `"available": false`.

## Mettre un produit en avant sur l'accueil
`"featured": true`.

## Ajouter un événement
Dans `content/events.json` :
```json
{ "title": "Amapiano Night", "date": "2026-11-07", "time": "22:00", "dj": "DJ Hamed",
  "description": "…", "poster": null, "visible": true }
```

## Téléphones, horaires, WhatsApp
`content/settings.json`. Le premier téléphone est le contact principal. Le numéro `whatsapp` reçoit les commandes.

## Photos
Déposer l'image dans `public/images/…` puis indiquer son chemin (`"/images/gallery/soiree.webp"`).
