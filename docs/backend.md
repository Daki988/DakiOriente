# Backend Navigoal V1

Application **Next.js full-stack** (dossier `web/`) : pages, API REST et back-office dans un même projet TypeScript, déployé sur Netlify avec **Netlify DB** (PostgreSQL Neon).

## Architecture

| Couche | Emplacement | Rôle |
|---|---|---|
| Schéma | `web/src/server/db/schema.ts` | 39 tables PostgreSQL (Drizzle ORM), migrations SQL dans `web/drizzle/` |
| Services | `web/src/server/services/*.ts` | Règles métier testées : comptes, tuteurs, documents, candidatures, établissements, paiements, Navilease, messagerie, notifications, conseiller, orientation, recherche, back-office, statistiques |
| API REST | `web/src/server/api/router.ts` → `/api/...` | 120 routes, contrôle des rôles, erreurs `{ error: { code, message } }`, description OpenAPI sur `/api/openapi.json` |
| Auth | `web/src/server/auth/` | Mots de passe bcrypt, sessions en base (cookie httpOnly ou `Authorization: Bearer`), codes OTP SMS/e-mail |
| Fichiers | `web/src/server/lib/storage.ts` | Netlify Blobs en production, `.data/uploads` en local ; contrôle de la signature des fichiers (PDF, JPG, PNG, WebP, 8 Mo) |
| PDF | `web/src/server/services/pdf.ts` | Reçu, bordereau de candidature, attestation d'admission, contrat de location, quittance |
| Paiements | `web/src/server/payments/providers.ts` | Bac à sable (recette) et CinetPay ; moyens par pays (Airtel/Moov Money, Wave, Orange Money, CMI, carte, virement) |

## Règles métier implémentées

- **Comptes** : élève, étudiant, parent, établissement, bailleur (inscription publique) ; conseiller et administrateur (créés au back-office). Les comptes établissement sont activés après vérification.
- **Mineurs** : consentement parental requis avant candidature, paiement et réservation ; un mineur ne voit ni ne réserve les annonces non vérifiées ; le parent se porte garant.
- **Candidatures** : brouillon → soumise → paiement confirmé → en vérification → (pièce demandée) → complet → en traitement → acceptée / refusée / liste d'attente. Transitions contrôlées, pièces obligatoires vérifiées, historique, notifications (élève et parents), export CSV, bordereau et attestation PDF.
- **Navilease** : annonces modérées (3 photos minimum, alerte prix atypique), KYC bailleur, réservation → acceptation → garant → paiement en **séquestre** → contrat signé par les deux parties → entrée (versement au bailleur, caution conservée) → loyers et quittances → préavis → sortie et restitution de caution ; litiges avec gel du séquestre et médiation ; avis réservés aux locataires ; coordonnées et adresse masquées avant paiement (y compris dans la messagerie).
- **Paiements** : référence unique, règlement idempotent (webhook + retour), statut revérifié auprès de l'agrégateur, reçus PDF, paiement par un parent pour son enfant.
- **Back-office** : utilisateurs, établissements (vérification, mise en avant), référentiels éditables et **versionnés** (import/export JSON et CSV), modération, KYC, litiges, paiements et séquestre, articles, témoignages, partenaires, journal d'audit, statistiques (§37) avec entonnoir de conversion.

## Commandes (dans `web/`)

```bash
npm run db:migrate   # applique les migrations (DATABASE_URL ou NETLIFY_DB_URL)
npm run db:seed      # référentiels, 79 établissements, 327 formations, articles, admin (ADMIN_EMAIL/ADMIN_PASSWORD) ; SEED_DEMO=1 pour les comptes de démonstration
npm test             # tests d'intégration (base PostgreSQL de test : TEST_DATABASE_URL)
npm run db:generate  # nouvelle migration après modification du schéma
```

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `NETLIFY_DB_URL` | Fournie automatiquement par Netlify DB (sinon `DATABASE_URL`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Premier compte administrateur créé au seed |
| `APP_URL` | URL publique (liens des e-mails, retours de paiement) |
| `RESEND_API_KEY`, `MAIL_FROM` | Envoi des e-mails (sinon journalisés) |
| `SMS_WEBHOOK_URL` | Passerelle SMS/WhatsApp (sinon journalisés) |
| `CINETPAY_API_KEY`, `CINETPAY_SITE_ID` | Paiements réels (zone CFA) ; sans eux, mode bac à sable |
| `PAYMENTS_MODE=sandbox` | Force le bac à sable (recette) |
| `SEED_DEMO=1`, `DEMO_PASSWORD` | Comptes de démonstration |
