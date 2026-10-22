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
- Déploiement cPanel (LWS, Node.js + PostgreSQL) : `cd web && node scripts/package-cpanel.mjs` → `livraison/navigoal-cpanel-AAAA-MM-JJ.zip` (guide : `web/deploiement/LISEZMOI-DEPLOIEMENT.md`). E-mails : SMTP `contact@navigoal.net` (gabarit `web/src/server/lib/email-template.ts`). Audit responsive : `web/scripts/audit-responsive.mjs`.
- Campagne « Trouve ta voie » (Gabon, déc. 2026 – févr. 2027) : réglages `web/src/lib/campagne.ts` (dates, jeu, objectif), page `/trouve-ta-voie/` + règlement, suivi des sources (cookie `ng_acq` posé par `AcquisitionTracker`, enregistré à l'inscription : `utm_source`, `utm_content`, `?ref=`), parrainage (`/api/moi/parrainage`, encart de l'espace élève) et tableau `/admin/campagne/` (export CSV). Service : `web/src/server/services/campaign.ts`. Maquettes : `design/maquettes/campagne.py`.
- Page Parents `/parents/` (coûts en F CFA depuis `couts_etudes`, rôle de garant, FAQ). Bouton « Une question ? » (WhatsApp conseiller) : `components/ui/QuestionWhatsApp.tsx`, numéro `WHATSAPP_CONSEILLER` lu à l'exécution via `/api/contact` (caché si vide).
- Paiement : moyens par pays du payeur (`lib/paiement.ts`, champ `pays` de `METHODS`) : Airtel Money et Moov Money pour le Gabon ; agrégateur Gabon à brancher (CinetPay ne couvre pas le Gabon).
- Exploitation : `npm run db:sauvegarde` / `db:restauration`, `/api/sante`, alertes `ALERTE_EMAIL`, CI GitHub Actions (`.github/workflows/ci.yml`). Liens internes : `@/components/ui/Link` (sans préchargement), jamais `next/link`.
- Audits : `scripts/audit-fonctionnel.mjs` (pages), `audit-actions.mjs` (actions, droits, robustesse), `audit-ui.mjs` (parcours navigateur) ; rapport `docs/audit-fonctionnel.md`.
