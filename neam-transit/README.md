# Neam Transit

Plateforme de **comparaison et de mise en relation** avec des transitaires **vérifiés**, de la **Chine** et de la **Corée du Sud** vers **tout le Gabon**.
Aucun paiement ne transite par la plateforme. Cahier des charges : [`../docs/cahier-des-charges-plateforme-transitaires.md`](../docs/cahier-des-charges-plateforme-transitaires.md).

- **Stack** : Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4
- **Base de données** : SQLite embarquée (`node:sqlite`, **Node ≥ 22.13**), un seul fichier dans `data/`
- **Aucune dépendance externe obligatoire** : WhatsApp par liens `wa.me`, codes de connexion par webhook SMS/WhatsApp à brancher

## Démarrer

```bash
cd neam-transit
npm install
cp .env.example .env.local     # puis renseigner les valeurs
NEAM_DEMO=1 npm run dev        # http://localhost:3100 avec transitaires fictifs de démonstration
```

En développement, l'admin se connecte avec le mot de passe `admin` (si `ADMIN_PASSWORD` est vide) et le code de connexion des transitaires s'affiche à l'écran.

## Fonctionnalités

| Public (importateurs) | Transitaires (`/pro`) | Administration (`/admin`) |
|---|---|---|
| Comparateur : Chine / Corée → 40 villes des 9 provinces, avion / bateau / conteneur / véhicule | Inscription avec justificatifs (RCCM, identité, agrément, entrepôt) | Vérification des dossiers et attribution des badges |
| **Coût total estimé** (poids réel / volumétrique, minimum, frais fixes), inclus / non inclus | Connexion par téléphone + code à usage unique | Validation de chaque tarif (et de chaque modification) |
| Délai annoncé **et délai réel** (médiane et 80e percentile, à partir de 10 envois) | Gestion des tarifs, prochains départs, villes desservies | Validation des modifications de profil |
| Tri par coût, délai ou note — aucune offre sponsorisée | Demandes reçues + réponse WhatsApp | Modération des avis et des réponses |
| Fiches transitaires, avis vérifiés, badges | Statistiques (devis, clics WhatsApp, appels) | Suivi des demandes et mises en relation |
| Demande de devis à 5 transitaires max, contact WhatsApp / appel tracé | Réponse publique aux avis (modérée) | Chargement / suppression des données de démo |
| Avis uniquement via lien reçu après une demande | | Documents justificatifs privés (admin seulement) |
| Calculateur CBM / poids volumétrique, guide de l'importateur | | |

### Règle « informations vérifiées uniquement »
- Un transitaire n'est visible qu'au statut **vérifié** ; ses badges ne sont cochés que pour les éléments contrôlés.
- Un tarif n'est visible qu'après validation ; une modification reste en attente pendant que l'ancienne version reste en ligne.
- Un avis n'est possible qu'avec le lien unique d'une demande, et n'est publié qu'après modération.

## Mise en production

1. Serveur Node ≥ 22.13 avec **disque persistant** (VPS) — SQLite n'est pas compatible avec un hébergement « serverless » sans disque (Vercel, Netlify).
2. Variables : `SESSION_SECRET` (32+ caractères), `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, `NEAM_DATA_DIR` (ex. `/var/lib/neam-transit`), `OTP_WEBHOOK_URL` (+ `OTP_WEBHOOK_TOKEN`) vers le fournisseur SMS/WhatsApp, qui reçoit `{"to": "241…", "message": "…"}`.
3. `npm ci && npm run build && npm start` (derrière Nginx + HTTPS), avec un gestionnaire de processus (pm2/systemd).
4. Sauvegarde quotidienne du dossier `NEAM_DATA_DIR` (base + documents).
5. **Avant l'ouverture au public** : supprimer les données de démo (`/admin` → « Supprimer la démo ») et faire valider les conditions d'utilisation par un juriste.

## Structure

```
app/            pages (public, /pro, /admin) et routes (/go/[id] = contact tracé, /admin/documents/[id])
components/     interface (formulaire de recherche, cartes résultats, calculateur…)
lib/db.ts       schéma SQLite et connexion
lib/queries.ts  toutes les requêtes (point unique pour une future migration PostgreSQL)
lib/calcul.ts   estimation du coût, poids volumétrique, médiane/percentile
lib/auth.ts     sessions signées, mot de passe admin, codes de connexion
lib/actions/    Server Actions (public, pro, admin)
lib/demo.ts     données de démonstration FICTIVES
```
