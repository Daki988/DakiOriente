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
