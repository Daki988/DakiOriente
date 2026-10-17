# Neam Print

Imprimerie en ligne à Libreville : catalogue avec prix en FCFA, commande sans compte avec envoi de fichier,
suivi par lien, messages WhatsApp préparés pour l'atelier, back-office commandes / prix / équipe.

- **Front + back** : Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4
- **Base, connexion, fichiers** : Supabase (PostgreSQL + règles de sécurité RLS, Auth, Storage privé)
- **Hébergement** : Vercel

## Démarrer

```bash
npm install
cp .env.example .env.local   # sans clés Supabase : mode démonstration
npm run dev                  # http://localhost:3000
npm test                     # calcul des prix, options
npm run lint                 # vérification TypeScript
```

Brancher la base : **[docs/SUPABASE.md](docs/SUPABASE.md)**.

## Organisation

| Dossier | Rôle |
|---|---|
| `app/(site)/` | pages publiques : accueil, produits, fiche produit + commande, suivi |
| `app/api/commandes/` | création de commande (prix recalculé côté serveur, lien d'envoi du fichier) |
| `app/admin/` | back-office : connexion, commandes, catalogue et prix, équipe ; `actions.ts` = toutes les modifications |
| `lib/pricing.ts` | calcul des prix (lots, unité, m², options en %, graphiste) — partagé navigateur/serveur |
| `lib/orders.ts` | validation et enregistrement des commandes |
| `supabase/schema.sql` | tables, sécurité RLS, stockage, super administrateur |
| `supabase/seed.sql` | catalogue de départ (généré par `scripts/seed-sql.mjs` depuis `content/catalogue.json`) |
| `content/settings.json` | WhatsApp, adresse, horaires, frais de livraison, forfait graphiste |

## Parcours d'une commande

1. Le client configure le produit ; le prix s'affiche (`lib/pricing.ts`).
2. `POST /api/commandes` revalide tout et recalcule le prix, enregistre la commande `NP-1001…`
   et renvoie une URL d'envoi signée : le fichier va directement du navigateur au stockage privé.
3. Le client reçoit un lien de suivi `/suivi/<jeton>` et un message WhatsApp prêt pour Neam Print.
4. L'atelier fait avancer la commande (Reçue → BAT validé → En impression → Prête → Livrée),
   enregistre le paiement (Airtel Money, Moov Money, espèces) et envoie au client le message WhatsApp préparé.

## Rôles

| Rôle | Commandes | Catalogue et prix | Équipe |
|---|---|---|---|
| Super administrateur | ✓ | ✓ | ✓ |
| Administrateur | ✓ | ✓ | — |
| Atelier | ✓ | lecture | — |
