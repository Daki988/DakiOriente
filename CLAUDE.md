# Navigoal — consignes projet

## Règle de conception (obligatoire)

**Toute interface (site web, application mobile, back-office, espace établissement, espace bailleur Navilease…) est d'abord maquettée dans Figma, puis codée.**

1. Produire ou mettre à jour les écrans dans le fichier Figma du projet :
   https://www.figma.com/design/NzAcfIbAFK6tTliGnuE5xq (générateur : `design/maquettes/build.py`, import via `html_to_figma`).
2. Partager le lien et attendre la validation de l'utilisateur.
3. Seulement ensuite, coder en suivant les maquettes validées.

Toute modification visuelle importante d'un écran existant repasse aussi par Figma.

## Repères

- Cahier des charges : `docs/cahier-des-charges-navigoal.md`
- Référentiels de données : `data/referentiels/` (contrôle : `python3 scripts/validate_referentiels.py`)
- Logos : `assets/logos/` (collecte : `scripts/fetch_logos.py`)
- Site web : `web/` (Next.js 14, Tailwind, Framer Motion ; `npm run dev`, `npm run build`)
- Destination unique : le Maroc (établissements privés aux diplômes homologués par l'État, labels « Reconnu par l'État », « Diplômes homologués », « Établissement professionnel », « Établissement autorisé » (diplômes d'établissement)) ; étudiants de toute l'Afrique et d'ailleurs (`data/referentiels/pays_origine.json`). Langue : français.
- Référentiel des établissements : `python3 scripts/build_etablissements_maroc.py` (sources officielles dans `data/sources/maroc/` ; réseaux multi-campus regroupés via `GROUPES`). Quartier et mobilité : `python3 scripts/fetch_geo.py [--retry]` ; photos : `scripts/fetch_photos.py`.
- SEO : `web/src/app/sitemap.ts`, `robots.ts`, métadonnées et JSON-LD (schema.org) par fiche établissement ; logo : `web/public/brand/` (logo complet, symbole, mot-symbole, icônes).
- Déploiement cPanel (LWS cPanel L, Node.js ; PostgreSQL chez Neon car absent des offres mutualisées LWS, inclus sur Cloud cPanel ; contrôle sur le serveur : `npm run verifier`) : `cd web && node scripts/package-cpanel.mjs` → `livraison/navigoal-cpanel-AAAA-MM-JJ.zip` (guide : `web/deploiement/LISEZMOI-DEPLOIEMENT.md`). E-mails : SMTP `contact@navigoal.net` (gabarit `web/src/server/lib/email-template.ts`). Audit responsive : `web/scripts/audit-responsive.mjs`.
- En ligne : https://navigoal.net (LWS cPanel L, compte c2896293c ; application Node.js 22 « navigoal » via Setup Node.js App, serveur dans `navigoal/serveur/` ; base Neon par WebSocket port 443 ; sauvegarde quotidienne 3 h 23 dans `navigoal/sauvegardes/` ; redirection HTTPS et sans www dans `public_html/.htaccess` ; tâche planifiée toutes les 4 min sur `/robots.txt` pour éviter la mise en veille de l'application par Passenger, sans réveiller Neon). Mise à jour : envoyer le ZIP, remplacer `serveur/`, `outils/`, `data/`, `drizzle/`, `app.js`, `package.json` en gardant `.env`, `stockage/`, `sauvegardes/`, puis migrations et redémarrage.
- Campagne « Trouve ta voie » (Gabon, déc. 2026 – févr. 2027) : réglages `web/src/lib/campagne.ts` (dates, jeu, objectif), page `/trouve-ta-voie/` + règlement, suivi des sources (cookie `ng_acq` posé par `AcquisitionTracker`, enregistré à l'inscription : `utm_source`, `utm_content`, `?ref=`), parrainage (`/api/moi/parrainage`, encart de l'espace élève) et tableau `/admin/campagne/` (export CSV). Service : `web/src/server/services/campaign.ts`. Maquettes : `design/maquettes/campagne.py`.
- Page Parents `/parents/` (coûts en F CFA depuis `couts_etudes`, rôle de garant, FAQ). Bouton « Une question ? » (WhatsApp conseiller) : `components/ui/QuestionWhatsApp.tsx`, numéro `WHATSAPP_CONSEILLER` lu à l'exécution via `/api/contact` (caché si vide).
- Paiement : moyens par pays du payeur (`lib/paiement.ts`, champ `pays` de `METHODS`) : Airtel Money et Moov Money pour le Gabon ; agrégateur Gabon à brancher (CinetPay ne couvre pas le Gabon).
- Navi (assistant IA, Claude via `@anthropic-ai/sdk`) : service `web/src/server/services/navi.ts` (outils de lecture de la base, cartes, quotas journaliers), route `POST /api/navi` (flux NDJSON), widget `web/src/components/ui/Navi.tsx` monté dans `app/layout.tsx` ; actif seulement si `ANTHROPIC_API_KEY` est dans `.env` (options `NAVI_MODEL`, `NAVI_EFFORT`, `NAVI_LIMITE_*`). Maquettes : `design/maquettes/chatbot.py`.
- Exploitation : `npm run db:sauvegarde` / `db:restauration`, `/api/sante`, alertes `ALERTE_EMAIL`, CI GitHub Actions (`.github/workflows/ci.yml`). Liens internes : `@/components/ui/Link` (sans préchargement), jamais `next/link`.
- Audits : `scripts/audit-fonctionnel.mjs` (pages), `audit-actions.mjs` (actions, droits, robustesse), `audit-ui.mjs` (parcours navigateur) ; rapport `docs/audit-fonctionnel.md`.
