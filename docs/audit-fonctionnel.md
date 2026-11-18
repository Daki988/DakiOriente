# Audit fonctionnel de la plateforme Navigoal

## Audit du 17 novembre 2026

Mené sur une instance de recette (base de démonstration neuve, version de production compilée, paiements en bac à sable), avec les comptes de démonstration de chaque profil.

| Volet | Ce qui est testé | Résultat |
|---|---|---|
| Actions | 170 actions enchaînées comme de vrais parcours, profil par profil | 167 / 170 ; les 3 échecs sont Navi, désactivé sans clé d'IA sur la recette (réponse 503 attendue) |
| Droits | Chaque route de lecture appelée avec chaque profil | 385 appels, 0 anomalie |
| Robustesse | Chaque route appelée avec des identifiants et des corps invalides | 821 appels, aucune erreur serveur hors Navi désactivé |
| Sécurité | Accès croisés entre comptes d'un même profil (élève, parent, école, bailleur), privilèges, paiements, injections, XSS, fichiers piégés, authentification, sessions, CSRF, redirections, en-têtes, cache | 181 contrôles, 0 échec |
| Pages | Exploration de toutes les pages accessibles à chaque profil | 547 pages ; 3 anomalies, corrigées |
| Navigateur | Parcours clés joués dans Chromium, sur mobile et ordinateur | 43 / 43 étapes |
| Affichage | 22 pages publiques et espaces connectés sur iPhone SE, téléphone, tablette, ordinateur | 162 vérifications ; 3 débordements sur 320 px, corrigés (36 / 36 au contrôle) |

### Anomalies trouvées et corrigées

1. **Espace bailleur ouvert à l'administrateur, mais vide.** `/bailleur/` laissait entrer l'admin alors que ses API le refusent : « Chargement impossible » sur trois pages. L'espace est désormais réservé aux bailleurs ; l'admin est renvoyé vers son back-office (la modération Navilease est dans `/admin/navilease`).
2. **Débordement horizontal sur iPhone SE (320 px)** : pied de page de Navilease et NaviTravel (adresse e-mail trop longue pour sa colonne) et liste des résidences (colonne des filtres qui ne rétrécissait pas).
3. **Script d'audit périmé** : il candidatait à une filière retirée par la règle des accréditations (hôtellerie à l'ESA) ; la plateforme la refusait à juste titre. Le script vise maintenant une filière ouverte.

### Réglages de recette

- `ALLOW_SANDBOX_PAYMENTS=1` : en production, un client ne peut pas valider lui-même un paiement simulé ; à autoriser pour rejouer les parcours de paiement en recette.
- `LIMITE_INSCRIPTIONS=200` : l'anti-abus limite les inscriptions à 5 par heure et par connexion (valeur de production) ; l'audit part d'une seule machine.

Tests de non-régression : 67 / 67, lint et typage sans erreur.

---

## Audit du 21 octobre 2026

21 octobre 2026. Audit mené sur une instance de recette (base de démonstration jetable, paiements en bac à sable) avec les comptes de démonstration de chaque profil.

## Résultat

| Volet | Ce qui est testé | Résultat final |
|---|---|---|
| Pages | Exploration automatique de toutes les pages accessibles à chaque profil (visiteur, élève/étudiant, parent, établissement, bailleur, conseiller, admin) : statut HTTP, erreurs JavaScript, appels API en échec, messages d'erreur affichés | 405 pages, 0 anomalie (voir la note plus bas) |
| Actions | 170 actions enchaînées comme de vrais parcours, profil par profil | 170 / 170 réussies |
| Droits | Chaque route de lecture appelée avec chaque profil : accès autorisé ou refus 401/403, jamais d'erreur serveur | 245 appels, 0 anomalie |
| Robustesse | Chaque route appelée avec des identifiants et des corps invalides (vides, mauvais types, JSON illisible) | 532 appels, 0 erreur serveur (46 avant correction) |
| Navigateur | Les parcours clés joués dans Chromium, sur mobile et sur ordinateur (formulaires, boutons, redirections) | 43 / 43 étapes réussies |

## Parcours couverts

- **Visiteur** : catalogue, recherche, établissements, campagnes, articles, logements, refus d'accès à l'espace privé, mauvais mot de passe refusé.
- **Nouvel élève** (navigateur, sur mobile) :
  1. inscription avec code de parrainage, puis vérification de l'e-mail par code ;
  2. tableau de bord ;
  3. test d'orientation complet et profil RIASEC ;
  4. modification du profil ;
  5. dépôt de document ;
  6. déconnexion ;
  7. changement de mot de passe et reconnexion.
  - Contrôle : le filleul est bien compté chez la marraine.
- **Étudiant** :
  - candidature : documents, brouillon, envoi avec frais, paiement simulé, reçu PDF ;
  - suite donnée à la candidature : pièce demandée par l'école, ajout, renvoi, admission, attestation PDF ;
  - échanges : messagerie avec l'école, rendez-vous conseiller ;
  - logement : alertes ;
  - tuteur : invitation ;
  - réservation Navilease de bout en bout : demande, garant, séquestre, contrat, entrée, loyer et quittance, avis, litige, préavis, sortie, annulation.
- **Parent** : enfants suivis, candidatures de l'enfant, consentement, garantie et paiement de la réservation, contrat PDF, rendez-vous ; candidature refusée pour un parent.
- **Établissement** :
  - candidatures : tableau de bord, liste, export CSV, ouverture d'un dossier, tous les changements de statut ;
  - contenus : fiche, formations (création, modification), campagnes ;
  - messagerie ;
  - refus du back-office.
- **Bailleur** : annonce (création, photos, modification, modération, archivage), vérification d'identité, acceptation de réservation, signature, état des lieux de sortie, quittance.
- **Conseiller** : demandes de rendez-vous, planification, clôture.
- **Admin** :
  - pilotage : statistiques, campagne (filtre et export CSV), journal ;
  - comptes : utilisateurs (recherche, création d'un conseiller, suspension avec connexion refusée, réactivation) ;
  - établissements et homologations ;
  - référentiels : ajout, suppression, import CSV ;
  - Navilease : modération des annonces, validation KYC, résolution de litige ;
  - contenus : articles (création, publication), témoignages, partenaires.

## Anomalies trouvées et corrigées

1. **Erreurs serveur sur des saisies invalides (46 cas).** Une valeur inattendue renvoyait « Une erreur est survenue » (500) au lieu d'un message clair. Corrections :
   - Toute valeur refusée par la base (énumération, type, contrainte) renvoie maintenant une erreur 400 « Données invalides ».
   - Un fichier envoyé sans formulaire multipart renvoie une erreur 400.
   - Un doublon renvoie une erreur 409.
   - Contrôles ajoutés dans les services : niveau de vérification d'une annonce, rendez-vous sans date valide, référentiel inconnu (404), bailleur inconnu lors d'un KYC, témoignages et partenaires incomplets.
2. **Test d'orientation : résultats enregistrés sans contrôle.** Des réponses mal formées pouvaient être sauvegardées dans le profil et casser les recommandations et le rapport PDF. Les réponses, les scores et les codes RIASEC sont maintenant validés.
3. **Profil : un enregistrement sans modification provoquait une erreur serveur.** C'est corrigé.
4. **Back-office : la modification d'un établissement acceptait n'importe quel champ.** Seuls le statut, la mise en avant, le plan, le label et la référence de reconnaissance sont désormais modifiables, et chaque valeur est vérifiée.
5. **Formulaires d'inscription et de connexion : les onglets « E-mail / Téléphone » soumettaient le formulaire.** La touche Entrée, dans un champ, déclenchait aussi le premier onglet : une personne qui s'inscrivait par téléphone se retrouvait basculée sur l'e-mail. Les onglets ne soumettent plus le formulaire. La correction vaut pour tous les écrans à onglets.
6. **Notification « Litige ouvert » vers une page inexistante (404).** Elle renvoie maintenant vers la section Litiges de la modération Navilease. La migration `0004_liens_litiges` corrige les notifications déjà envoyées.

Tests de non-régression ajoutés : 26 / 26 tests passent, lint et typage sans erreur.

## Note

L'explorateur signale encore deux fiches logement « introuvables » : ce sont des annonces archivées pendant l'audit, toujours liées depuis les réservations de l'étudiante de test. La page affiche alors « Cette annonce n'existe pas ou n'est plus publiée ». C'est le comportement attendu.

## Rejouer l'audit

Sur une base de recette uniquement : les scripts créent des comptes, des annonces et des paiements simulés.

```bash
cd web
# serveur : PAYMENTS_MODE=sandbox ; OTP_DEBUG=1 pour que le parcours d'inscription lise le code de vérification
BASE=http://localhost:3000 OUT=audit COMPTES='[…]' node scripts/audit-fonctionnel.mjs   # pages
BASE=http://localhost:3000 OUT=audit node scripts/audit-actions.mjs                     # actions, droits, robustesse
BASE=http://localhost:3000 OUT=audit node scripts/audit-ui.mjs                          # parcours dans le navigateur
BASE=http://localhost:3000 OUT=audit node scripts/audit-securite.mjs                    # après audit-actions
BASE=http://localhost:3000 OUT=audit node scripts/audit-responsive.mjs                  # affichage mobile
```

## Contrôle de sécurité du 18 novembre 2026 (liste « 27 points avant mise en ligne »)

Vérifié sur le code, sur une instance de recette et sur navigoal.net :

| Point | État |
|---|---|
| Authentification, mots de passe hachés (bcrypt), sessions `httpOnly`/`SameSite=Lax` | conforme |
| Chacun ne voit que ses données (IDOR élève, parent, école, bailleur) | 77 contrôles, 0 échec |
| Requêtes paramétrées (Drizzle, aucune requête SQL brute), injections | 31 contrôles, 0 échec |
| XSS (avis, messages, JSON-LD échappé) | 3 contrôles, 0 échec |
| Limites de fréquence (connexion, codes, inscriptions, Navi, appels, avis) | conforme |
| En-têtes (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) | conforme ; `X-Powered-By: Phusion Passenger` ajouté par l'hébergeur (à masquer dans `public_html/.htaccess`) |
| CSRF (origine vérifiée sur toute écriture avec cookie) | 4 contrôles, 0 échec |
| Codes de réinitialisation (10 min, usage unique, essais limités) | conforme |
| Fichiers envoyés (type réel, taille 8 Mo, contenu) | 8 contrôles, 0 échec |
| Mode debug coupé, erreurs génériques sans trace | conforme |
| Dépendances (`npm audit --omit=dev`) | 0 faille ; contrôlé à chaque CI |
| Fichiers exposés (`.env`, `.git`, `.sql`, sauvegardes) sur navigoal.net | tous refusés (403/404) |
| Secrets dans le dépôt et l'historique Git | aucun (clé de test RFC 8032 et exemples seulement) ; `scripts/verifier-secrets.mjs` en CI et avant chaque mise en ligne |
| Prix calculés par le serveur, webhooks vérifiés (Stripe signé, E-Billing revérifié) | conforme |
| Journal d'activité (connexions, échecs, actions sensibles) | conforme (table `audit_logs`) |
| Appels, échanges directs de l'équipe, Navi (ajouts de novembre) | 9 contrôles ajoutés à `audit-securite.mjs`, 0 échec |

Robustesse : 852 appels malformés, 0 erreur 500. Audit de sécurité : 187 contrôles, 0 échec ; il tourne désormais dans la CI et la fait échouer en cas de problème.

Compléments du 18/11/2026 : caractère nul (`%00`, `\u0000`) refusé en 400 au lieu d'une erreur de base ; nettoyage des compteurs de limites corrigé (clés contenant « : ») ; scénario Navilease de l'audit des actions mis à jour (espèces validées par l'équipe dans le back-office). Résultat : 167 parcours sur 167, 190 contrôles de sécurité sans échec, 852 appels malformés sans erreur 500 ; la CI repasse au vert.

## Audit complet du 18 novembre 2026 (et latence)

| Contrôle | Résultat |
|---|---|
| Pages, 6 profils + visiteur (`audit-fonctionnel.mjs`) | 516 pages, 0 problème |
| Actions (`audit-actions.mjs`) | 167/167 ; robustesse 852 appels, 0 erreur 500 ; matrice des droits 406 appels, 0 anomalie |
| Sécurité (`audit-securite.mjs`) | 200 contrôles, 0 échec |
| Publication / SEO (`audit-publication.mjs`) | 327 pages, 2 604 liens internes, 0 problème |
| Parcours navigateur (`audit-ui.mjs`) | 43 étapes, 0 échec |
| Mobile (`audit-responsive.mjs`) | 96 vérifications, 0 problème |
| Accessibilité (axe-core, 16 pages) | 0 problème |
| Tests unitaires, types, `npm audit`, secrets, référentiels, variantes d'images | 79/79, 0 erreur, 0 vulnérabilité, aucun secret, cohérents, complètes |
| Site en ligne | en-têtes de sécurité présents, fichiers sensibles en 403/404, robots filtrés (403), 404 personnalisée, webhook WhatsApp 400/401 |

Corrections : CSP `form-action` sans CinetPay (inutilisé) ; `/api/sante` affiche la version déployée.

Latence : premier visiteur après une période calme à 10,8 s sur l'accueil. Cause : le signal de maintien en éveil (`/robots.txt`, toutes les 4 min) était servi par Varnish sans atteindre l'application, que Passenger arrêtait. `robots.txt` passe en `CDN-Cache-Control: no-store`. Pool Neon gardé 60 s au lieu de 10 s (nouvelle connexion ≈ 70 à 100 ms évitée). Accueil : 245 → 165 Ko de JavaScript (le référentiel complet n'est plus envoyé au navigateur). Côté serveur, 2 requêtes SQL par page connectée, 10 à 70 ms de calcul : pas de goulot. Reste : réveil de Neon après 5 min d'inactivité (≈ 0,5 s, offre gratuite) et pages de listes (métiers, formations, écoles) à 250-280 Ko, qui filtrent le référentiel dans le navigateur.

## SEO et vitesse (18 novembre 2026)

Lighthouse mobile sur le site en ligne avant correction : performance 65 à 72, accessibilité, bonnes pratiques et SEO 100. Causes relevées et corrigées :

- 12 pages (Navilease, NaviTravel, Pourquoi, actualités) déclaraient l'accueil comme page canonique (héritée du gabarit racine) : Google les traitait comme des copies de l'accueil. Chaque page déclare maintenant la sienne ; contrôle ajouté à `audit-publication.mjs`.
- Test d'orientation interdit aux robots alors que « test d'orientation gratuit » est l'une des recherches les plus fréquentes : ouvert, ajouté au plan du site.
- Titres alignés sur 226 recherches réelles (suggestions Google depuis 5 pays d'Afrique) : frais de scolarité, prix, écoles privées, logement étudiant, pour les étrangers, diplôme reconnu par l'État.
- Données structurées : fil d'Ariane, site (nom affiché par Google), description des formations (champ exigé pour les résultats enrichis « cours »).
- Haut de page invisible tant que le JavaScript n'avait pas tourné (animations d'apparition partant d'une opacité 0) : rendu visible immédiatement.
- Photos des écoles et des villes en JPEG jusqu'à 330 Ko, et photo du haut des fiches écoles chargée « plus tard » : variantes WebP 400/840 px (‑55 %) et chargement prioritaire.
- Photo de l'accueil sur fond noir (variantes sans transparence) : corrigé.

Mesure locale après correction (Lighthouse mobile simulé) : accueil 68 → 83 à 87 ; l'élément principal des fiches écoles est peint à 0,85 s dans le navigateur (au lieu d'attendre le JavaScript). Reste : le poids du JavaScript des pages de listes (métiers, formations, écoles), qui embarquent le référentiel pour filtrer dans le navigateur.

## Lecture « comme Google » (18 novembre 2026)

Site en ligne lu en HTML brut (première passe de Google) puis rendu par Chrome (seconde passe) :

- Toute page publique était enveloppée dans une transition à opacité 0 (`(site)/template.tsx`) : texte présent mais caché jusqu'à l'exécution du JavaScript (et principale cause du LCP lent). Remplacée par une transition CSS sans opacité.
- `/metiers/`, `/formations/`, `/etablissements/`, `/devis/`, `/comparateur/`, `/ressources/`, résidences, fiches formations : contenu rendu par le serveur mais placé dans un bloc caché en fin de page (`<div hidden id="S:0">`, Suspense superflu) ; `/metiers/` n'offrait qu'un mot lisible. Corrigé : 328 pages, 762 mots en moyenne lisibles sans JavaScript, un titre h1 visible partout.
- Pages dynamiques (`/orientation/`, certaines actualités) : titre, description et canonique envoyés en fin de page à Googlebot (« streaming metadata » de Next.js, Googlebot absent de la liste par défaut). Corrigé par `htmlLimitedBots`.
- Hébergeur : navigateur automatisé sans JavaScript bloqué sur « Vérification en cours », faux Googlebot refusé (403). Le vrai Googlebot n'a pas pu être simulé : à contrôler dans la Search Console (inspection d'URL, test en direct).

Après correction (local, Lighthouse mobile) : accueil 92 (68 en ligne avant), fiche HEM 88 (72), fiche formation 88 ; accessibilité et SEO 100 ; audits publication, accessibilité, parcours, mobile et tests au vert.
