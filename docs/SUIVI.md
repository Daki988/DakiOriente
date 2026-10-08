# Mettre à jour le suivi des commandes

Le site est statique : il n'a pas de serveur pour enregistrer l'avancement des livraisons.
Le suivi se pilote donc depuis une simple feuille Google Sheets que vous (ou votre livreur)
mettez à jour depuis un téléphone. Le site la lit à chaque recherche du client.

## Mise en place (10 minutes, une seule fois)

1. Créez une feuille Google Sheets et importez `suivi-modele.csv` (Fichier > Importer).
2. Fichier > Partager > **Publier sur le Web** > choisissez la feuille, format **CSV** > Publier.
3. Copiez le lien obtenu dans `assets/js/tracking.js`, champ `csvUrl`.
4. Mettez votre numéro WhatsApp dans le champ `whatsapp` du même fichier.

## Une ligne par commande

| Colonne | Contenu |
|---|---|
| `ref` | Numéro de commande affiché au client (ex. `DO-K3F9QZ`) |
| `code` | 4 derniers chiffres du téléphone du client (protège le suivi) |
| `statut` | `commandee`, `preparee`, `en_route`, `tentative` ou `livree` |
| `date_livraison` | Jour prévu, au format `2026-10-08` |
| `creneau_debut` / `creneau_fin` | Créneau annoncé, ex. `15:15` et `17:15` |
| `arrets_avant` | Nombre de livraisons avant celle du client (fait avancer le livreur sur le plan) |
| `livree_a` | Date et heure de remise, ex. `2026-10-08 16:02` |
| `message` | Message libre affiché au client (facultatif) |
| `events` | Historique : `date heure;texte;lieu`, séparés par `|` |

Le numéro de commande et le code sont générés automatiquement quand le client commande ;
ils arrivent avec le récapitulatif WhatsApp. Ajoutez simplement la ligne dans la feuille.

Tant que `csvUrl` est vide, le suivi montre les commandes passées sur l'appareil du client
et la commande d'exemple `DO-DEMO24` (code `0000`), avec un bouton pour simuler chaque étape.
