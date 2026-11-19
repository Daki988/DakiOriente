# Spécification fonctionnelle — quatre chantiers (novembre 2026)

Avis étudiants vérifiés · Paiement de la scolarité · Écoles actives · Financement et bourses.

Chaque chantier suit le même plan : objectif, ce qui existe déjà, parcours, règles, écrans à maquetter dans Figma
(règle du projet : maquettes validées avant tout code), données, notifications, indicateurs, décisions à prendre.
Ordre de réalisation proposé à la fin.

---

## 1. Avis étudiants vérifiés

### Objectif
Donner aux familles l'avis d'étudiants **réellement inscrits** dans chaque école, impossible à truquer, et faire de
Navigoal la référence de confiance (là où les avis Google des écoles sont invérifiables).

### Existant
- Table `reviews` réservée aux logements Navilease (pas aux écoles).
- Candidatures suivies jusqu'au statut `acceptee` ; pas encore de notion d'inscription définitive.

### Qui peut donner un avis
| Profil | Condition | Mention affichée |
|---|---|---|
| Étudiant admis par Navigoal | candidature `acceptee` **et** inscription confirmée (par l'école ou par pièce justificative) | « Inscrit via Navigoal » |
| Étudiant inscrit hors Navigoal | compte vérifié + certificat de scolarité de l'année validé par l'équipe | « Inscription vérifiée » |
| Ancien étudiant | diplôme ou attestation de réussite validé | « Diplômé vérifié » |
| Parent | un avis par enfant inscrit, sur l'accompagnement et les frais | « Parent d'étudiant » |

Un avis par personne, par école et par année universitaire ; modifiable pendant 30 jours, puis figé (mise à jour possible l'année suivante).

### Contenu d'un avis
- Notes de 1 à 5 : qualité de l'enseignement, encadrement et disponibilité, accueil des étudiants étrangers, vie de campus et locaux, insertion et stages, rapport qualité-prix.
- Recommanderiez-vous cette école ? (oui / non)
- Formation suivie, année, campus (repris du dossier, non modifiables).
- Texte : « Points forts », « Points à améliorer » (50 à 1 500 caractères chacun).
- Optionnel : frais réellement payés (pour fiabiliser les devis), délai d'obtention de la carte de séjour.

### Règles
- **Vérification avant publication** : statut vérifié requis ; modération par l'équipe sous 72 h (insultes, données personnelles, accusations nominatives, publicité, hors sujet). Motif de refus envoyé à l'auteur, qui peut corriger.
- **Seuil d'affichage** : la note moyenne n'apparaît qu'à partir de 3 avis publiés ; en dessous, « Avis en cours de collecte ».
- **Droit de réponse de l'école** : une réponse publique par avis, modérée aussi ; l'école ne peut ni supprimer ni masquer un avis.
- **Signalement** : par l'école ou un visiteur, avec motif ; l'avis reste en ligne pendant l'examen sauf contenu manifestement illicite.
- **Anonymat** : prénom + initiale, ou « Étudiant·e en [formation] » au choix de l'auteur ; jamais d'e-mail ni de numéro.
- **Neutralité** : aucune école, même partenaire ou Premium, ne peut payer pour retirer ou trier les avis ; les avis ne sont pas influencés par l'offre souscrite (mention explicite sur la page).
- **Collecte** : invitation automatique en fin de premier semestre (mars) et en fin d'année (juillet), relance une fois.

### Écrans à maquetter
1. Fiche école : bloc « Avis d'étudiants » (note globale, répartition, 6 critères, avis triables par formation et année, réponse de l'école).
2. Formulaire d'avis (espace élève/étudiant, accessible depuis la candidature acceptée).
3. Dépôt de justificatif d'inscription (pour les inscrits hors Navigoal).
4. Espace école : liste des avis, réponse, signalement.
5. Back-office `/admin/avis` : file de modération, historique, signalements.
6. Comparateur et cartes d'écoles : note et nombre d'avis.

### Données
- `avis_etablissements` : id, auteur, établissement, formation, campus, année, statut (en_attente, publié, refusé, retiré), notes (jsonb), recommande, textes, frais déclarés, vérification (type, pièce, validé par, le), réponse école (texte, auteur, date, statut), créé/modifié/publié le.
- `avis_signalements` : avis, auteur, motif, statut, traité par.
- Données structurées schema.org `AggregateRating` sur la fiche (étoiles dans Google) à partir de 3 avis.

### Notifications
Avis publié ou refusé (auteur) ; nouvel avis (école) ; réponse de l'école (auteur) ; signalement (équipe).

### Indicateurs
Nombre d'avis publiés par école, taux de réponse des écoles, part des écoles ayant ≥ 3 avis, délai de modération.

### Décisions à prendre
- Avis des parents : oui ou non ?
- Inscrits hors Navigoal acceptés dès le lancement (plus d'avis vite, mais plus de vérifications manuelles) ?

---

## 2. Paiement de la scolarité

### Objectif
Permettre aux familles de payer les frais d'inscription et de scolarité de l'école depuis leur pays (mobile money,
carte, virement), avec un reçu officiel, un échéancier clair et un suivi par les parents.

### Existant
- Paiements Navilease : E-Billing (Airtel Money, Moov Money, Gabon, F CFA), Stripe (carte), espèces validées par l'admin ; séquestre ; webhooks signés ; table `payments` (type `frais_candidature` inutilisé depuis la gratuité).
- Devis : rubriques, échéancier, « Quand payer quoi ».

### Point de vigilance (à trancher avant toute maquette)
Encaisser des frais de scolarité **pour le compte d'une école étrangère** et les transférer hors de la zone CEMAC est
une activité réglementée (intermédiation de paiement, réglementation des changes BEAC, obligations de lutte contre le
blanchiment). Trois montages possibles :

| Montage | Principe | Avantages | Contraintes |
|---|---|---|---|
| A. Paiement direct à l'école | Navigoal affiche le RIB / lien de paiement officiel de l'école, la famille paie l'école, dépose la preuve, l'école confirme | aucun encaissement par Navigoal, lancement rapide | pas de mobile money ; transfert international à la charge de la famille |
| B. Partenaire de paiement agréé | un établissement agréé (banque ou prestataire de transfert) encaisse en F CFA et verse l'école en dirhams ; Navigoal orchestre et suit | mobile money possible, reçu immédiat | contrat et commission du partenaire, intégration technique |
| C. Navigoal encaisse | comme Navilease aujourd'hui | maîtrise totale | agrément et conformité à obtenir : déconseillé au départ |

**Recommandation** : lancer avec A (suivi + preuves + confirmations), et préparer B avec un partenaire agréé.

### Parcours (montage A, puis B)
1. Candidature `acceptee` → l'école renseigne le montant à payer (frais d'inscription, 1re tranche), l'échéance et ses moyens de paiement officiels (vérifiés par l'équipe une fois).
2. La famille voit « Payer ma scolarité » : montant dans sa monnaie (taux du jour indicatif), échéance, moyens ; en B, paiement direct sur Navigoal.
3. Preuve de paiement déposée (A) ou paiement confirmé par le partenaire (B).
4. L'école confirme la réception ; reçu Navigoal téléchargeable + reçu officiel de l'école déposé ; statut `inscrite` sur la candidature.
5. Échéancier suivant : rappels J-15, J-7, J-1 à l'étudiant **et** aux parents liés.

### Règles
- Seuls les moyens de paiement vérifiés par l'équipe sont affichés (lutte contre les faux RIB) ; tout changement de RIB par l'école repasse en vérification et prévient les familles concernées.
- Le parent garant peut payer pour l'enfant ; le reçu porte les deux noms.
- Montants et échéances modifiables par l'école seulement avant le premier paiement ; ensuite par avenant visible.
- Remboursement (refus de visa, désistement) : règles de l'école affichées avant paiement.
- Aucun frais caché : la commission éventuelle (B) est affichée avant validation.

### Écrans à maquetter
1. Candidature acceptée : bloc « Inscription définitive et paiement ».
2. Page de paiement (montage A puis B) et dépôt de preuve.
3. Échéancier et historique des paiements (élève et parent).
4. Espace école : saisie des montants et échéances, moyens de paiement, confirmation des réceptions, tableau des encaissements attendus.
5. Back-office : vérification des moyens de paiement des écoles, suivi des litiges.

### Données
- `echeanciers_scolarite` : candidature, école, devise, lignes (libellé, montant, échéance, statut).
- `paiements_scolarite` : échéance, payeur, montant, devise, montage (direct / partenaire), preuve, référence, statut (déclaré, confirmé, refusé, remboursé), confirmé par, le.
- `moyens_paiement_ecoles` : école, type (virement, lien, partenaire), coordonnées, vérifié par, le, statut.
- Nouveau statut de candidature `inscrite` (après paiement confirmé).

### Indicateurs
Taux de candidatures acceptées → inscrites ; délais de confirmation par les écoles ; montants suivis.

### Décisions à prendre
- Montage de départ (A recommandé) et choix d'un partenaire pour B.
- Navigoal prélève-t-il une commission sur les paiements (B) ou la facture-t-il à l'école ?

---

## 3. Écoles actives

### Objectif
Que chaque école réponde vite et sur la plateforme, et voie ce que Navigoal lui apporte, pour que les familles aient
des réponses et que les écoles restent.

### Existant
Espace école (`/etablissement` : candidatures, campagnes, dossier, fiche, formations, offre, prospection, vivier),
compteurs d'affichages et de clics des écoles mises en avant (`/api/vitrine`), relais admin (mode accompagné),
messagerie et appels vidéo.

### Fonctions
- **Délai de réponse** : mesuré entre `soumise` et la première action de l'école (statut, pièce demandée, message). Affiché sur la fiche publique : « Répond en moyenne sous X jours » (calculé sur 90 jours, à partir de 5 candidatures) ; badge « Réponse rapide » sous 72 h.
- **Engagement de réponse** : objectif de 7 jours. Relances automatiques à l'école à J+3 et J+6 ; à J+8, alerte à l'équipe Navigoal (relais) et message à l'élève (« l'école n'a pas encore répondu, un conseiller suit votre dossier »).
- **Tableau de bord** (accueil de l'espace école) : vues de la fiche, clics vers le site, favoris, ajouts au comparateur, devis calculés, candidatures (par formation, pays, série), taux d'acceptation, délai moyen, avis ; comparaison anonymisée à la moyenne des écoles de la même ville ; export CSV.
- **Fiche à jour** : score de complétude (photos, frais publiés, dates de campagne, pièces du dossier, contact) avec liste des éléments manquants ; rappel trimestriel.
- **Rapport mensuel** par e-mail au responsable de l'école.

### Règles
- Les délais affichés sont calculés automatiquement, jamais saisis par l'école.
- Les écoles sans compte actif affichent « Candidature relayée par l'équipe Navigoal » (mode accompagné) au lieu d'un délai.
- La position dans les listes reste régie par les offres payantes (déjà affichées « Partenaire Navigoal ») ; le délai de réponse n'est pas vendu.

### Écrans à maquetter
1. Accueil de l'espace école (tableau de bord).
2. Bloc « Réactivité » et score de complétude.
3. Mention de délai sur la fiche publique et la carte d'école.
4. E-mail de relance et rapport mensuel.
5. Back-office : classement des écoles par réactivité, dossiers en retard.

### Données
- Colonnes calculées par école : délai moyen, taux de réponse, complétude ; table `relances_ecoles` (candidature, palier, envoyée le).
- Réutilise `page_views`, compteurs de vitrine, favoris, candidatures.

### Indicateurs
Délai moyen de réponse (objectif < 7 jours), part des candidatures sans réponse à J+8, part des écoles actives chaque mois.

### Décision à prendre
- Afficher publiquement le délai dès le lancement, ou d'abord seulement aux écoles pendant un mois (période de rodage) ?

---

## 4. Financement et bourses

### Objectif
Que chaque famille sache, tôt, à quelles aides elle peut prétendre et comment boucler son budget.

### Existant
Référentiel `bourses.json` (ANBG, bourse de coopération, AMCI), outil `bourses` de Navi, campagnes des écoles de type
`bourse`, devis personnalisé avec « bourse ou réduction annuelle déduite du total ».

### Fonctions
- **Catalogue des bourses** (`/bourses/`) : bourses publiques des pays d'origine, des pays d'études, des organismes internationaux et des écoles ; fiche par bourse (organisme, montant, couverture, conditions, pièces, calendrier, lien officiel, date de vérification).
- **Éligibilité** : critères structurés (nationalité, pays d'études, niveau, série, moyenne minimale, âge, domaine, type d'établissement public/privé, revenus si publiés) ; pour un élève connecté, « Bourses pour toi » classées : éligible / à vérifier / non éligible, avec la raison.
- **Alertes** : ouverture d'une bourse suivie, J-30 / J-7 avant la date limite, résultat publié (élève et parents).
- **Dossier de bourse** : liste des pièces cochables, réutilisation des pièces déjà déposées pour les candidatures.
- **Plan de financement** dans le devis : bourse (montant, durée), réduction de l'école, épargne familiale, échelonnement de la scolarité (lien chantier 2), reste à financer par an ; partage au parent.
- **Navi** : propose les bourses éligibles quand le budget est serré (outil existant, enrichi des critères).

### Règles
- Uniquement des sources officielles, chaque fiche datée « vérifiée le » ; revue annuelle obligatoire (tâche dans le back-office, comme les accréditations).
- Navigoal ne promet jamais l'obtention : mention « Décision de l'organisme ».
- Les bourses des écoles restent des campagnes de type `bourse`, avec les mêmes critères structurés.

### Écrans à maquetter
1. Catalogue `/bourses/` (filtres pays d'origine, destination, niveau) et fiche bourse.
2. « Bourses pour toi » dans l'espace élève, et encart sur le devis.
3. Plan de financement dans le devis (et dans le PDF).
4. Espace école : création d'une bourse (campagne enrichie des critères).
5. Back-office : gestion du référentiel, revue annuelle.

### Données
- `bourses` (remplace le JSON en base, éditable) : organisme, pays d'origine, pays d'études, niveaux, critères (jsonb), montant, couverture, calendrier, pièces, liens, vérifiée le, statut.
- `bourses_suivies` : utilisateur, bourse, alertes.
- `plans_financement` : devis/candidature, lignes (source, montant, durée).

### Indicateurs
Élèves avec au moins une bourse éligible, bourses suivies, dossiers déposés, reste à financer moyen.

### Décision à prendre
- Quelles bourses ajouter en priorité au-delà du Gabon (Cameroun, Sénégal, Côte d'Ivoire, Congo) et des bourses du Maroc ?

---

## Ordre de réalisation proposé

| Ordre | Chantier | Pourquoi | Taille |
|---|---|---|---|
| 1 | Écoles actives | effet immédiat sur les familles ; s'appuie sur l'existant | moyenne |
| 2 | Financement et bourses | fort levier d'inscription (campagne « Trouve ta voie ») | moyenne |
| 3 | Avis vérifiés | demande des élèves inscrits : se lance pour la fin du 1er semestre (mars) | moyenne |
| 4 | Paiement de la scolarité | montage A d'abord ; montage B après accord d'un partenaire | A : petite, B : grande |

Prochaine étape : maquettes Figma du chantier 1 (puis 2), validation, développement.
