# Secret by N. — boutique intime en ligne

Boutique au thème clair (HTML/CSS/JS sans framework) hébergée sur Netlify, avec un back-office et une petite API (Netlify Functions + Netlify Blobs, données stockées dans l'Union européenne).

## Ce que contient le site
- Vérification d'âge 18+ à l'entrée et à la commande
- Bouton « Sortie rapide » + double appui sur Échap
- Titre d'onglet neutre, `noindex`, panier stocké uniquement sur l'appareil
- Catalogue du plan de commande (voir `docs/catalogue.md`), recherche, tri, stock et produits épuisés
- Commande sans compte, enregistrée sur le serveur, récapitulatif et accusé de réception à l'écran, paiement à la livraison
- Suivi de commande (`suivi.html`) : numéro de commande + 4 derniers chiffres du téléphone ; aucune donnée personnelle affichée
- Page « Le Guide » (`guide.html`), quiz, FAQ, lettre d'information avec consentement
- Pages légales : `mentions-legales.html`, `cgv.html`, `confidentialite.html` (remplies depuis le back-office)

## Back-office : `/admin/`
- **Tableau de bord** : commandes à confirmer, encaissé du mois, liste de contrôle avant ouverture
- **Commandes** : coordonnées, panier, statut (commandée → préparée → en livraison → livrée), créneau, message au client, note interne, suppression
- **Produits** : prix, ancien prix, stock, badge, description, photo (envoi depuis le téléphone), masquer, photo discrète ; « Publier les modifications » met en ligne
- **Réglages** : téléphone, WhatsApp (facultatif), frais et seuil de livraison, heure limite, informations légales
- **Lettre d'info** : abonnés, export CSV, suppression

Les coordonnées des clients sont effacées automatiquement 30 jours après la livraison ou l'annulation (`netlify/functions/purge.mts`, chaque nuit).

## Variables d'environnement (Netlify)
| Nom | Rôle |
|---|---|
| `ADMIN_PASSWORD` | Mot de passe du back-office |
| `AUTH_SECRET` | Clé secrète qui signe les sessions (longue chaîne aléatoire) |

## Développement
```bash
npm install
npm run build        # copie le site public dans public/ (docs/ n'est jamais publié)
npx netlify dev      # site + fonctions en local
```
Sans serveur (fichier ouvert directement), le site fonctionne en mode démonstration avec `assets/js/products.js`.

## Communication et conformité
Voir `docs/communication.md` : règles issues du Code pénal (art. 313), de la loi n° 025/2021 sur le commerce électronique et de la loi sur les données personnelles, canal par canal (Meta, TikTok, WhatsApp, SMS, e-mail), et liste de contrôle avant l'ouverture au public.
