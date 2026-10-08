# CAHIER DES CHARGES FONCTIONNEL ET TECHNIQUE

# NAVIGOAL

**Plateforme panafricaine d'orientation, d'éducation, d'accès aux formations et au logement étudiant**

| | |
|---|---|
| **Version** | 1.1 |
| **Statut** | Document de cadrage produit |
| **Périmètre de lancement** | **Gabon, Maroc, Sénégal** (ancrage historique au Gabon) |
| **Publics cibles** | Collégiens, lycéens, étudiants, jeunes diplômés, parents/tuteurs, établissements d'enseignement, bailleurs et partenaires |
| **Modules** | Navigoal (orientation, formations, candidatures) · **Navilease** (logement étudiant) |
| **Référentiels associés** | `data/referentiels/` (voir [référentiels](referentiels.md)) |

> Historique : v1.0 — cahier des charges initial (nom de travail « Campus Afrique »).
> v1.1 — renommage en **Navigoal**, périmètre de lancement à 3 pays, ajout du module logement **Navilease**, ajout des référentiels de données (formations, métiers, compétences, séries, établissements secondaires et supérieurs, logements).

---

## Sommaire

1. Présentation du projet
2. Problématique
3. Vision
4. Objectifs du projet
5. Périmètre géographique de lancement
6. Publics cibles
7. Architecture fonctionnelle globale
8. Inscription et authentification
9. Profil utilisateur
10. Module d'orientation
11. Résultat du test d'orientation
12. Parcours « Ma Série au lycée »
13. Espace pédagogique collège
14. Recherche de métiers
15. Catalogue des formations
16. Catalogue des établissements
17. Système de recommandation
18. Espace étudiant
19. Candidature à une formation
20. Gestion des documents
21. Paiement
22. Bordereau et attestation
23. Suivi des candidatures
24. Messagerie
25. Conseiller d'orientation
26. Espace parent/tuteur
27. Espace établissement
28. Gestion des formations par les établissements
29. Gestion des offres et campagnes
30. Gestion des candidatures par l'établissement
31. **Navilease — logement étudiant**
32. Moteur de recherche global
33. Articles et contenus éditoriaux
34. Mise en avant des établissements et partenaires
35. Notifications
36. Back-office administrateur
37. Statistiques
38. **Référentiels de données**
39. Architecture technique proposée
40. Moteur d'intelligence et recommandations
41. Sécurité et conformité
42. Responsive et accessibilité
43. Modèle économique
44. Parcours utilisateurs principaux
45. MVP — Version 1
46. Version 2
47. Version 3
48. Indicateurs clés de performance (KPI)
49. Positionnement
50. Proposition de valeur
51. Résumé fonctionnel
52. Conclusion

---

## 1. Présentation du projet

Navigoal est une plateforme numérique éducative et d'orientation destinée à accompagner les jeunes Africains dans leurs choix scolaires, universitaires et professionnels, **jusqu'à leur installation dans leur ville d'études** grâce à son module logement **Navilease**.

La plateforme doit permettre à un utilisateur de passer progressivement :

> « Je ne sais pas quoi faire » → « Je comprends mon profil » → « Je découvre les métiers et formations adaptés » → « Je choisis une formation » → « Je candidate » → « Je trouve mon logement » → « Je suis mon parcours ».

Navigoal ne doit donc pas être uniquement un annuaire d'écoles. Il doit constituer un **écosystème d'orientation et d'accompagnement éducatif**, reliant :

- les élèves ;
- les étudiants ;
- les parents/tuteurs ;
- les établissements ;
- les formations ;
- les métiers et les compétences ;
- les contenus pédagogiques ;
- les conseillers ;
- les opportunités de candidature ;
- les solutions de logement étudiant (Navilease).

---

## 2. Problématique

Au Gabon, au Maroc, au Sénégal et plus largement en Afrique, de nombreux élèves et étudiants rencontrent des difficultés pour :

- identifier leur profil et leurs aptitudes ;
- choisir une série au lycée ;
- comprendre les différents métiers ;
- trouver une formation adaptée ;
- comparer les établissements ;
- connaître les conditions d'admission ;
- préparer leurs candidatures ;
- comprendre les documents nécessaires ;
- suivre leurs démarches ;
- obtenir un accompagnement personnalisé ;
- **trouver un logement sûr, abordable et proche de leur établissement**, en particulier lorsqu'ils quittent leur ville d'origine ou leur pays.

Les informations sont souvent dispersées entre les sites internet des établissements, les réseaux sociaux, les forums, les proches et les conseillers. Côté logement, les annonces circulent surtout de bouche-à-oreille ou sur des groupes de messagerie, sans vérification des bailleurs et avec un risque élevé d'arnaques (cautions versées pour des logements inexistants).

Navigoal centralise cette information et transforme la recherche d'orientation — puis de logement — en un parcours guidé.

---

## 3. Vision

Devenir la plateforme de référence pour l'orientation, l'accès à l'éducation et l'installation étudiante en Afrique.

### Vision à long terme

Créer un environnement dans lequel un jeune peut, depuis son téléphone :

1. renseigner son profil ;
2. passer un test d'orientation ;
3. découvrir ses aptitudes ;
4. identifier les métiers correspondant à son profil ;
5. découvrir les formations permettant d'accéder à ces métiers ;
6. comparer les établissements ;
7. constituer son dossier ;
8. candidater ;
9. suivre sa candidature ;
10. **réserver un logement vérifié près de son établissement (Navilease)** ;
11. être accompagné jusqu'à son intégration dans son parcours.

---

## 4. Objectifs du projet

### 4.1 Objectif général

Faciliter l'orientation scolaire, universitaire et professionnelle des jeunes Africains, ainsi que leur installation dans leur ville d'études, grâce à une plateforme numérique centralisée, personnalisée et accessible.

### 4.2 Objectifs spécifiques

Navigoal doit permettre de :

- démocratiser l'accès à l'information éducative ;
- améliorer la qualité de l'orientation ;
- réduire les erreurs d'orientation ;
- faciliter la recherche d'établissements ;
- faciliter la recherche de formations ;
- accompagner les élèves dans le choix de leur série ;
- préparer les élèves aux examens (BEPC, BFEM, examen régional, baccalauréat) ;
- faciliter les candidatures ;
- permettre aux établissements de gérer leurs opportunités ;
- mettre en relation étudiants et établissements ;
- fournir des recommandations personnalisées ;
- **sécuriser l'accès au logement étudiant (Navilease)** ;
- créer progressivement une base de données éducative africaine structurée (référentiels).

---

## 5. Périmètre géographique de lancement

La phase de lancement couvre **trois pays**, choisis pour leur complémentarité (Afrique centrale, Afrique du Nord, Afrique de l'Ouest) et pour les flux d'étudiants entre eux (de nombreux étudiants gabonais et sénégalais étudient au Maroc).

| | **Gabon (GA)** | **Maroc (MA)** | **Sénégal (SN)** |
|---|---|---|---|
| Rôle | Pays d'ancrage, pilote | Hub universitaire régional, forte mobilité entrante | Hub d'Afrique de l'Ouest |
| Langues d'enseignement | Français | Arabe, français, anglais | Français, arabe |
| Fin de collège | BEPC | Examen régional normalisé (3e année collégiale) | BFEM |
| Baccalauréat | Séries A1, A2, B, C, D, E, F1–F4, G1–G3 | Filières SM, PC, SVT, SA, STE, STM, SE, SGC, L, SH, AA, originel, bac pro | Séries L1, L'1, L2, LA, S1–S5, S1A, S2A, F6, STIDD, STEG |
| Système supérieur | LMD + BTS/DUT/DTS | LMD + CPGE / cycles d'ingénieur, DUT, BTS, OFPPT | LMD + BTS, DUT, DST, DIC |
| Organismes clés | MESRS, MEN, ANBG (bourses), CNOU (œuvres universitaires) | MESRSI, MENPS, ONOUSC, OFPPT, plateforme Cursus Sup | MESRI, MEN, Office du Bac, Campusen, COUD / CROUS |
| Monnaie | XAF | MAD | XOF |
| Paiement mobile | Airtel Money, Moov Money | Orange Money, inwi money, CMI (carte), Cash Plus, Wafacash | Wave, Orange Money, Free Money |
| Villes universitaires prioritaires | Libreville, Owendo, Akanda, Franceville, Moanda | Rabat, Casablanca, Marrakech, Fès, Meknès, Agadir, Oujda, Tanger, Tétouan, Kénitra, Benguerir, Ifrane | Dakar, Diamniadio, Thiès, Saint-Louis, Ziguinchor, Bambey, Kaolack |

Exigences liées au multi-pays :

- chaque entité (série, établissement, formation, campagne, logement, paiement) est rattachée à un **pays** ;
- les contenus pédagogiques et séries sont **contextualisés par pays** ;
- la plateforme gère **plusieurs devises** (XAF, XOF, MAD) et des **moyens de paiement par pays** ;
- l'interface est en **français** au lancement ; l'**arabe** (avec affichage RTL) est prévu pour le Maroc en V2, l'**anglais** en V3 ;
- les mobilités entre pays sont un cas d'usage natif (un lycéen gabonais peut rechercher une école d'ingénieurs au Maroc et un logement Navilease à Rabat) ;
- l'extension à d'autres pays se fait par ajout de données de référence, sans développement spécifique.

---

## 6. Publics cibles

### 6.1 Collégiens

Particulièrement les élèves de **4e et 3e** (Gabon, Sénégal) et de **2e et 3e année collégiale** (Maroc).

Objectifs :

- préparation au brevet (BEPC, BFEM, examen régional) ;
- découverte des métiers ;
- identification des centres d'intérêt ;
- préparation au choix de série / de tronc commun ;
- découverte des parcours scolaires.

### 6.2 Lycéens

Objectifs :

- orientation post-baccalauréat ;
- découverte des métiers ;
- recherche de formations ;
- préparation aux études supérieures et aux concours (CPGE, écoles d'ingénieurs, médecine…) ;
- découverte des établissements ;
- anticipation du logement dans la future ville d'études.

### 6.3 Étudiants

Objectifs :

- trouver une formation ;
- trouver un établissement ;
- rechercher une spécialisation ;
- préparer et suivre une candidature ;
- obtenir un accompagnement ;
- trouver un logement (Navilease).

### 6.4 Jeunes diplômés

Accompagnement dans la poursuite d'études, la spécialisation, la réorientation et l'insertion professionnelle.

### 6.5 Parents et tuteurs

Les parents doivent pouvoir participer au parcours d'orientation de l'élève, suivre les candidatures et, pour le logement, se porter **garants** et valider les réservations des mineurs.

### 6.6 Établissements

Universités, grandes écoles, instituts, centres de formation (dont OFPPT), établissements secondaires, organismes de formation.

### 6.7 Bailleurs et gestionnaires de logements (Navilease)

Propriétaires particuliers, agences immobilières, résidences étudiantes privées, offices publics des œuvres universitaires (CNOU, ONOUSC, COUD/CROUS), familles d'accueil.

---

## 7. Architecture fonctionnelle globale

Navigoal est organisé autour des espaces suivants.

**ESPACE PUBLIC**
Accueil · Métiers · Formations · Établissements · Orientation · Logements (Navilease) · Articles · Ressources pédagogiques · Actualités

**ESPACE ÉLÈVE**
Profil · Orientation · Ma série au lycée · Cours · Annales · Exercices · Métiers · Formations · Établissements

**ESPACE ÉTUDIANT**
Profil · Orientation · Recherche · Recommandations · Candidatures · Documents · Paiements · Messagerie · Conseiller · **Mon logement**

**ESPACE PARENT/TUTEUR**
Profil de l'enfant · Suivi de l'orientation · Résultats · Recommandations · Suivi des candidatures · **Garantie et suivi du logement**

**ESPACE ÉTABLISSEMENT**
Tableau de bord · Profil établissement · Formations · Offres · Campagnes · Candidatures · Inscriptions · Statistiques · **Logements partenaires**

**ESPACE BAILLEUR (NAVILEASE)**
Profil et vérification · Mes logements · Disponibilités · Demandes et réservations · Contrats · Paiements et quittances · Avis · Messagerie

**BACK-OFFICE ADMINISTRATEUR**
Utilisateurs · Établissements · Formations · Métiers · Compétences · Séries · Tests · Contenus · Candidatures · Paiements · Partenaires · Statistiques · Témoignages · Mise en avant · **Référentiels** · **Navilease (bailleurs, annonces, vérifications, litiges)**

---

## 8. Module d'inscription et d'authentification

L'utilisateur crée un compte selon son profil.

**Types de comptes** : Élève · Étudiant · Parent/tuteur · Établissement · Bailleur (Navilease) · Conseiller · Administrateur.

**Informations initiales** (selon le profil) : nom ; prénom ; date/année de naissance ; pays ; ville ; niveau scolaire ; établissement actuel ; diplôme obtenu ; série ; domaine d'étude.

Les listes déroulantes (pays, niveaux, séries, établissements, domaines) sont alimentées par les **référentiels** (section 38).

**Authentification** : e-mail ou numéro de téléphone + mot de passe, code OTP par SMS/WhatsApp (adapté aux usages mobiles), connexion Google en option.

Pour les **mineurs**, les informations du parent ou tuteur sont saisies et un **consentement parental** est recueilli avant l'activation des fonctionnalités sensibles (candidature, paiement, réservation de logement).

---

## 9. Profil utilisateur

Le profil évolue progressivement selon l'utilisation de la plateforme.

Un étudiant peut renseigner : identité ; année de naissance ; pays ; ville ; niveau ; diplôme ; série ; établissement ; filière ; **compétences** (issues du référentiel) ; centres d'intérêt ; objectifs ; préférences de formation (pays, ville, public/privé, budget) ; projets professionnels ; **préférences de logement** (budget, type, colocation acceptée).

Le profil constitue la base du moteur de recommandation.

---

## 10. Module d'orientation

C'est l'un des modules stratégiques de Navigoal. La plateforme propose plusieurs tests selon le profil de l'utilisateur, fondés sur la typologie **RIASEC** (référentiel `profils_riasec`) complétée par des tests d'aptitudes et de préférences.

| Public | Tests |
|---|---|
| Collégien | Centres d'intérêt · aptitudes · préférences · environnement scolaire |
| Lycéen | Profil d'orientation · intérêts · aptitudes · domaines professionnels |
| Étudiant | Orientation académique · réorientation · projet professionnel |
| Jeune diplômé | Évolution professionnelle · reconversion · spécialisation |

Les questions, pondérations et barèmes sont administrables depuis le back-office.

---

## 11. Résultat du test d'orientation

Le résultat ne doit pas être présenté sous forme d'un simple score : il produit une **restitution visuelle** (radar RIASEC, domaines, métiers, formations).

**Exemple**

- **Profil dominant** : Analyste / Organisateur (codes I + C)
- **Domaines recommandés** : Finance · Gestion · Informatique · Administration · Management
- **Métiers recommandés** : Data analyst · Contrôleur de gestion · Auditeur · Chef de projet · Analyste financier
- **Formations recommandées** : les formations du référentiel menant à ces métiers, accessibles depuis la série de l'élève, puis les établissements qui les proposent dans les pays choisis.

---

## 12. Parcours « Ma Série au lycée »

Ce module concerne principalement les élèves de 4e/3e (et 2e/3e année collégiale au Maroc).

Objectif : aider l'élève à comprendre quelle série ou quel parcours pourrait lui correspondre.

Pour chaque série du référentiel `series`, la plateforme présente :

- les matières principales ;
- les compétences nécessaires ;
- les métiers accessibles ;
- les études supérieures possibles ;
- les formations correspondantes ;
- les lycées qui la proposent (référentiel `etablissements_secondaires`).

Le système peut proposer une recommandation basée sur : résultats scolaires ; centres d'intérêt ; test d'orientation ; matières préférées ; projet professionnel.

Particularités pays :

- **Gabon** : orientation en 2nde après le BEPC vers les séries générales (A1, A2, B, C, D) ou techniques (E, F, G) ;
- **Maroc** : choix du **tronc commun** (scientifique, technologique, lettres, originel, arts appliqués, professionnel) puis de la filière du baccalauréat ; option internationale (BIOF) ;
- **Sénégal** : orientation en 2nde après le BFEM ; prise en compte de la **réforme des séries** (STEG remplace G, STIDD remplace T1/T2, regroupement en grands parcours à l'étude).

---

## 13. Espace pédagogique collège

Contenus : cours vidéo ; fiches de cours ; annales ; exercices ; corrigés ; ressources pour le brevet (BEPC, BFEM, examen régional).

Les contenus sont **contextualisés par pays** (programmes officiels, langues d'enseignement, calendrier des examens).

---

## 14. Recherche de métiers

L'utilisateur peut rechercher un métier (référentiel `metiers`).

**Fiche métier** : nom ; description ; missions ; compétences (référentiel `competences`) ; qualités ; profil RIASEC ; niveau d'étude minimal ; formations recommandées ; établissements proposant ces formations ; secteurs d'activité ; employeurs types ; débouchés.

**Parcours** : Métier → Formation → Établissement → Candidature → Logement

---

## 15. Catalogue des formations

Le catalogue (référentiel `formations` + offres publiées par les établissements) permet de rechercher les formations disponibles.

**Filtres** : pays ; ville ; domaine ; secteur ; niveau d'étude ; diplôme ; durée ; établissement ; statut (public/privé) ; mode d'admission (de droit, dossier, concours) ; frais ; série d'accès ; **logement disponible à proximité**.

Exemple : Licence → Informatique → Sénégal → Dakar.

---

## 16. Catalogue des établissements

Chaque établissement dispose d'une fiche : nom ; sigle ; **logo** ; présentation ; type et statut ; localisation (carte) ; contacts ; site web ; réseaux sociaux ; formations ; conditions d'admission ; frais ; calendrier ; documents demandés ; **logements Navilease à proximité**.

Le référentiel initial (`etablissements_superieurs`, `etablissements_secondaires`, logos dans `assets/logos/`) sert d'amorçage ; chaque établissement revendique ensuite sa fiche (« claim ») et la met à jour.

---

## 17. Système de recommandation

Le moteur de recommandation exploite les données du profil pour proposer :

- **des métiers** : « Ces métiers correspondent à votre profil » ;
- **des formations** : « Ces formations correspondent à votre projet » ;
- **des établissements** : « Ces établissements proposent les formations recherchées » ;
- **des logements** : « Ces logements sont à moins de 20 minutes de votre établissement et dans votre budget ».

Le système intègre progressivement un **score de compatibilité** (ex. : Formation X — Compatibilité : 87 %).

Critères : niveau ; diplôme ; série ; domaine ; centres d'intérêt (RIASEC) ; compétences ; projet professionnel ; localisation et mobilité acceptée ; budget ; prérequis.

---

## 18. Espace étudiant

Tableau de bord : Profil · Mon orientation · Mes recommandations · Mes formations favorites · Mes établissements favoris · Mes candidatures · Mes documents · Mes paiements · Mes messages · Mon conseiller · **Mon logement (Navilease)**.

---

## 19. Candidature à une formation

1. Choisir une formation
2. Vérifier les conditions (série, notes, prérequis)
3. Constituer le dossier
4. Ajouter les documents
5. Valider la candidature
6. Suivre le traitement
7. Recevoir la décision
8. **Après admission : proposition de logements Navilease proches de l'établissement**

---

## 20. Gestion des documents

Documents associés au profil : pièce d'identité ; acte de naissance ; diplôme ; relevé de notes ; certificat ; photo ; documents administratifs ; autres pièces exigées ; **pièces Navilease** (attestation d'admission ou de scolarité, pièce du garant).

Le système affiche les documents obligatoires en fonction du profil, du pays et de la formation. Un document déposé une fois est réutilisable pour plusieurs candidatures et pour Navilease.

---

## 21. Paiement

Lorsqu'une candidature (ou une réservation de logement) nécessite des frais, le système permet le paiement.

Parcours : Validation → Paiement → Confirmation → Génération du bordereau → Traitement.

Moyens de paiement par pays (via agrégateurs locaux) :

- **Gabon** : Airtel Money, Moov Money, carte bancaire ;
- **Maroc** : CMI (carte bancaire), Orange Money, inwi money, paiement en agence (Cash Plus, Wafacash) ;
- **Sénégal** : Wave, Orange Money, Free Money, carte bancaire ;
- virement international pour les étudiants en mobilité.

---

## 22. Bordereau et attestation

Génération automatique au format PDF : bordereau de paiement ; reçu ; attestation ; confirmation de candidature ; **confirmation de réservation, contrat de location et quittances Navilease**.

---

## 23. Suivi des candidatures

Statuts : Brouillon → Soumise → Paiement confirmé → Dossier en vérification → Dossier complet → En cours de traitement → Acceptée / Refusée / Liste d'attente.

L'étudiant reçoit des notifications lors des changements importants.

---

## 24. Messagerie

Échanges entre : étudiant ↔ établissement ; étudiant ↔ conseiller ; établissement ↔ administrateur ; **étudiant/parent ↔ bailleur (Navilease)**.

La messagerie est rattachée au contexte lorsque c'est pertinent :

> Candidature #2026-00125 — Formation : Licence Informatique
> Réservation NL-2026-00342 — Studio meublé, Rabat Agdal

Pour Navilease, les coordonnées personnelles ne sont pas échangées avant la réservation (messagerie masquée, anti-fraude).

---

## 25. Conseiller d'orientation

Accompagnement humain : demande de rendez-vous ; messagerie ; suivi du dossier ; recommandations ; historique des échanges.

---

## 26. Espace parent/tuteur

Pour les utilisateurs mineurs : consulter le profil scolaire ; les résultats d'orientation ; les recommandations ; suivre le parcours et certaines candidatures ; recevoir des notifications ; **valider une réservation de logement et se porter garant**.

---

## 27. Espace établissement

Tableau de bord : nombre de candidatures ; dossiers reçus ; dossiers en attente ; inscriptions ; formations populaires ; statistiques ; **besoins en logement des admis**.

---

## 28. Gestion des formations par les établissements

Un établissement peut : créer, modifier, activer/désactiver une formation ; ajouter les conditions d'admission (séries acceptées, notes minimales, concours) ; définir les documents requis ; définir les frais ; publier les dates.

Chaque formation publiée est **rattachée à une formation type du référentiel** (`formations`) afin d'alimenter le moteur de recommandation et les liens métiers ↔ formations.

---

## 29. Gestion des offres et campagnes

Publications : campagnes d'admission ; concours ; inscriptions ; bourses ; formations ; journées portes ouvertes ; événements.

Chaque campagne a : une date de début ; une date de fin ; des conditions ; un nombre de places ; des documents requis.

---

## 30. Gestion des candidatures par l'établissement

L'établissement peut : consulter et filtrer les candidatures ; consulter les documents ; changer le statut ; demander une pièce complémentaire ; accepter ; refuser ; contacter le candidat ; exporter les listes.

---

## 31. Navilease — logement étudiant

### 31.1 Présentation

**Navilease** est le module logement de Navigoal. Il permet aux élèves en mobilité, aux étudiants et à leurs parents de **trouver, réserver et gérer un logement étudiant vérifié** à proximité de leur établissement, au Gabon, au Maroc et au Sénégal.

Navilease prolonge naturellement le parcours Navigoal :

> Orientation → Formation → Admission → **Logement** → Intégration

### 31.2 Problèmes adressés

- pénurie et saturation des cités universitaires publiques ;
- annonces dispersées (bouche-à-oreille, groupes WhatsApp/Facebook) et peu fiables ;
- arnaques à la caution et faux bailleurs ;
- difficulté pour les étudiants étrangers (ex. Gabonais et Sénégalais au Maroc) de louer à distance sans garant local ;
- absence de contrat écrit et de quittances ;
- manque de visibilité sur le trajet logement ↔ établissement.

### 31.3 Types de logement

Référentiel `navilease_logements` (`_meta.types_logement`) :

- résidence / cité universitaire publique (CNOU, ONOUSC, COUD/CROUS) ;
- résidence étudiante privée ;
- studio / appartement individuel ;
- colocation ;
- chambre chez l'habitant (famille d'accueil) ;
- foyer / internat.

### 31.4 Fonctionnalités étudiant / parent

- recherche par **établissement** (rayon / temps de trajet), ville, quartier, budget, type, équipements (wifi, eau, électricité incluse, groupe électrogène, gardiennage…), genre (résidences filles/garçons), durée ;
- carte des logements autour de l'établissement ;
- fiche logement : photos, vidéo, description, équipements, règlement, loyer, charges, caution, frais Navilease, disponibilités, avis vérifiés, **badge de vérification** ;
- favoris et alertes (« nouveau studio < 2 500 MAD près de l'ENSIAS ») ;
- demande de réservation avec pièces (attestation d'admission/scolarité, identité, garant) ;
- **paiement sécurisé de la réservation et de la caution** (mobile money, carte) avec **séquestre** : les fonds sont versés au bailleur après l'entrée dans les lieux ;
- **contrat de location numérique** et signature électronique ;
- **état des lieux** d'entrée et de sortie (photos horodatées) ;
- paiement des loyers et quittances mensuelles en PDF ;
- **garant** : parent/tuteur ou garantie Navilease (offre premium) ;
- colocation : profils de colocataires compatibles (établissement, habitudes, budget) ;
- signalement d'incident et service de médiation.

### 31.5 Fonctionnalités bailleur

- création de compte et **vérification d'identité** (KYC) et du titre de propriété / mandat ;
- publication d'annonces (photos, prix, disponibilités, règles) ;
- calendrier de disponibilités ;
- gestion des demandes, acceptation/refus ;
- contrats, encaissements, quittances automatiques ;
- tableau de bord (taux d'occupation, revenus, avis) ;
- messagerie avec les candidats locataires.

### 31.6 Fonctionnalités établissement

- mise en avant des **logements partenaires** et des résidences de l'établissement ;
- conventions avec des résidences privées (quotas réservés aux admis) ;
- vision agrégée des besoins en logement des admis (notamment internationaux).

### 31.7 Niveaux de vérification

| Niveau | Signification |
|---|---|
| Non vérifié | Annonce publiée, bailleur non contrôlé (non visible par défaut pour les mineurs) |
| Identité vérifiée | Pièce d'identité et téléphone du bailleur contrôlés |
| Visité par Navilease | Logement visité par un agent ou un ambassadeur, photos certifiées |
| Partenaire certifié | Résidence/gestionnaire sous convention, engagements qualité et sécurité |

### 31.8 Statuts d'une réservation

Demande envoyée → Acceptée par le bailleur → Paiement en séquestre → Contrat signé → Entrée dans les lieux (état des lieux) → Fonds versés au bailleur → En cours → Préavis → Sortie (état des lieux) → Caution restituée.
Statuts alternatifs : Refusée · Annulée · Litige.

### 31.9 Règles de gestion clés

- un mineur ne peut réserver qu'avec la **validation d'un parent/tuteur** ;
- les coordonnées directes sont masquées jusqu'à la réservation ;
- aucun versement direct au bailleur hors plateforme n'est encouragé (perte de la protection séquestre) ;
- les avis ne peuvent être déposés que par des locataires ayant effectivement séjourné ;
- les loyers sont affichés dans la devise locale (XAF, MAD, XOF) avec conversion indicative ;
- les annonces sont modérées (photos réelles, prix cohérents, contenu interdit).

### 31.10 Modèle économique Navilease

- frais de service à la réservation (étudiant et/ou bailleur) ;
- abonnement des résidences privées et agences (visibilité, outils de gestion) ;
- garantie locative Navilease (premium) ;
- services additionnels : accueil à l'arrivée (aéroport/gare), kit d'installation, assurance habitation.

### 31.11 Données de démarrage

Le référentiel `navilease_logements` recense les **résidences universitaires publiques** des trois pays (CNOU au Gabon, ONOUSC au Maroc, COUD et CROUS au Sénégal) et les établissements qu'elles desservent. Les offres privées sont saisies par les bailleurs.

---

## 32. Moteur de recherche global

Recherche transversale. Exemple : « Informatique » retourne métiers ; formations ; établissements ; articles ; vidéos ; ressources pédagogiques ; **logements proches des établissements correspondants**.

Tolérance aux fautes, synonymes et sigles (« UCAD », « ENSIAS », « UOB ») ; filtres par pays.

---

## 33. Articles et contenus éditoriaux

Thématiques : orientation ; études ; métiers ; conseils ; vie étudiante ; **logement et installation** ; examens ; formations ; actualités éducatives des trois pays.

---

## 34. Mise en avant des établissements et partenaires

Le back-office gère : établissements partenaires ; partenaires institutionnels ; témoignages ; contenus sponsorisés ; établissements et formations mis en avant ; **résidences et bailleurs partenaires Navilease**.

---

## 35. Notifications

Événements : nouvelle recommandation ; nouveau contenu ; candidature envoyée ; paiement confirmé ; document manquant ; changement de statut ; admission ; message reçu ; échéance importante ; **nouvelle annonce correspondant à une alerte logement ; réservation acceptée ; loyer à échéance ; quittance disponible**.

Canaux : notification interne ; e-mail ; SMS ; WhatsApp (selon intégrations retenues) ; notifications push (PWA).

---

## 36. Back-office administrateur

Gestion : utilisateurs ; élèves ; étudiants ; parents ; établissements ; formations ; métiers ; compétences ; séries ; tests ; questions ; résultats ; contenus ; articles ; vidéos ; annales ; candidatures ; paiements ; partenaires ; campagnes ; témoignages ; notifications ; **référentiels (import/export CSV-JSON, versionnement)** ; **Navilease : bailleurs, vérifications KYC, annonces, modération, réservations, séquestre, litiges**.

---

## 37. Statistiques

**Utilisateurs** : inscrits ; actifs ; nouveaux ; répartition par pays ; par niveau.

**Orientation** : tests réalisés ; profils dominants ; métiers et formations les plus recommandés ; séries les plus visées.

**Établissements** : inscrits ; formations publiées ; candidatures ; admissions.

**Navilease** : annonces actives ; taux de vérification ; réservations ; taux d'occupation ; loyer moyen par ville ; délai moyen de relogement ; litiges.

**Conversion** : Visiteur → Inscription → Test → Recommandation → Candidature → Admission → **Logement réservé**.

---

## 38. Référentiels de données

Navigoal repose sur des référentiels structurés, versionnés et partagés entre tous les modules. Ils sont livrés dans `data/referentiels/` (JSON) et décrits dans [docs/referentiels.md](referentiels.md).

| Référentiel | Fichier | Contenu (v1.0) |
|---|---|---|
| Pays | `pays.json` | Gabon, Maroc, Sénégal : examens, systèmes, organismes, moyens de paiement, villes universitaires |
| Niveaux | `niveaux.json` | Primaire → Doctorat, classes par pays |
| Diplômes | `diplomes.json` | BTS, DUT, DTS, DEUST, Licence, Master, Ingénieur, Doctorat… |
| Domaines | `domaines.json` | 20 domaines/secteurs |
| Profils RIASEC | `profils_riasec.json` | 6 profils (R, I, A, S, E, C) |
| Compétences | `competences.json` | ≈ 80 compétences transversales, langues, scientifiques et techniques |
| Métiers | `metiers.json` | ≈ 100 fiches métiers (missions, compétences, RIASEC, formations, secteurs) |
| Formations | `formations.json` | ≈ 90 formations types (diplôme, durée, admission, compétences, métiers, séries d'accès par pays, établissements) |
| Séries | `series.json` | 42 séries/filières du baccalauréat (13 GA, 15 MA, 14 SN) + voies d'orientation après le brevet |
| Établissements supérieurs | `etablissements_superieurs.json` | ≈ 120 universités, grandes écoles et instituts (publics et privés), sites web, coordonnées, logos |
| Établissements secondaires | `etablissements_secondaires.json` | Lycées de référence curés + ≈ 3 400 collèges et lycées importés de Wikidata |
| Logements | `navilease_logements.json` | Résidences universitaires publiques, types de logement, équipements, niveaux de vérification |
| Logos | `assets/logos/<pays>/` | Logos collectés (Wikidata/Commons, sites officiels), avec source et statut de vérification |

Le graphe central reliant ces référentiels est :

```
Profil (RIASEC, compétences, série)
   └─► Métiers ──► Compétences
          └─► Formations ──► Séries d'accès (par pays)
                 └─► Établissements ──► Logements Navilease
```

Règles de gouvernance :

- chaque élément a un identifiant stable (`met-…`, `frm-…`, `ga-bac-c`, `sn-ucad`…) ;
- les établissements valident et enrichissent leur fiche et leur offre lors de l'onboarding (l'offre importée est **indicative**) ;
- les intitulés de séries sont revus chaque année (réformes) ;
- les logos restent la propriété des établissements et sont confirmés par eux ;
- un script de validation (`scripts/validate_referentiels.py`) contrôle l'intégrité des références croisées.

---

## 39. Architecture technique proposée

### Front-office

- React / Next.js ; Tailwind CSS ;
- interface responsive, **Progressive Web App** (mode hors-ligne partiel, installation sur l'écran d'accueil) ;
- internationalisation (fr au lancement, ar-RTL en V2, en en V3) ;
- cartographie (OpenStreetMap / Mapbox) pour établissements et logements.

### Backend

- Laravel ; API REST (documentée OpenAPI) ;
- authentification sécurisée (tokens, OTP) ;
- gestion des rôles et permissions (élève, étudiant, parent, établissement, bailleur, conseiller, administrateur) ;
- files de traitement (notifications, génération PDF, imports de référentiels) ;
- intégrations : agrégateurs de paiement mobile par pays, SMS/WhatsApp, e-mail, signature électronique.

### Base de données

PostgreSQL (recommandé, avec PostGIS pour la recherche géographique des logements) ou MySQL.

### Principales tables

**Cœur** : users · profiles · students · parents · counselors · countries · cities

**Référentiels** : levels · diplomas · domains · riasec_profiles · skills · careers · career_skills · formation_types · formation_type_skills · career_formation_types · bac_series · series_formation_types · establishments · establishment_logos

**Offre et candidatures** : formations (offres publiées, liées à formation_types) · campaigns · applications · application_documents · payments · receipts

**Orientation** : orientation_tests · questions · answers · orientation_results · recommendations

**Pédagogie et contenus** : courses · resources · articles · testimonials · partners

**Communication** : conversations · messages · notifications

**Navilease** : landlords · landlord_verifications · housings · housing_photos · housing_amenities · housing_availabilities · housing_establishment_distances · bookings · booking_payments (séquestre) · leases · inventories (états des lieux) · rent_payments · rent_receipts · housing_reviews · disputes

---

## 40. Moteur d'intelligence et recommandations

- **Moteur 1 — Orientation** : analyse des réponses aux tests, du profil, du niveau et des intérêts → profil RIASEC.
- **Moteur 2 — Métiers** : associe le profil (RIASEC, compétences) aux familles de métiers.
- **Moteur 3 — Formation** : associe les métiers aux formations, filtrées par série et pays.
- **Moteur 4 — Établissement** : associe les formations aux établissements (localisation, coût, admission).
- **Moteur 5 — Candidature** : analyse conditions et pièces nécessaires.
- **Moteur 6 — Logement (Navilease)** : associe l'établissement d'admission, le budget et les préférences aux logements disponibles (distance, prix, vérification, avis).

À terme : **Profil → Orientation → Métier → Formation → Établissement → Candidature → Logement** constitue le cœur intelligent de Navigoal.

---

## 41. Sécurité et conformité

- chiffrement des mots de passe ; authentification sécurisée (OTP, 2FA pour établissements, bailleurs et administrateurs) ;
- gestion des rôles et contrôle des permissions ;
- HTTPS ; protection contre les injections ; validation et analyse antivirus des fichiers ;
- journalisation des actions sensibles ; sauvegardes ;
- **protection des données personnelles** conformément aux lois des trois pays : loi n° 001/2011 (Gabon, CNPDCP), loi 09-08 (Maroc, CNDP), loi 2008-12 (Sénégal, CDP) ;
- attention particulière aux **données des mineurs** (consentement parental, visibilité restreinte) ;
- **Navilease** : KYC des bailleurs, séquestre des fonds, détection de fraude (annonces dupliquées, prix anormaux), modération, conservation des preuves (contrats, états des lieux).

---

## 42. Responsive et accessibilité

Plateforme **mobile-first**, fonctionnant sur smartphone, tablette et ordinateur.

Priorités : navigation simple ; faible consommation de données ; chargement rapide ; images optimisées (logos et photos compressés) ; vidéos adaptées ; UX adaptée aux jeunes ; accessibilité (contrastes, tailles de police, lecteurs d'écran) ; support RTL pour l'arabe.

---

## 43. Modèle économique

**B2C** : services premium pour l'orientation ; l'accompagnement ; les candidatures ; le conseiller ; les ressources spécialisées ; **frais de service et garantie Navilease**.

**B2B** : présence premium ; publication de formations ; campagnes de recrutement ; gestion des candidatures ; statistiques ; visibilité ; **abonnements bailleurs et résidences privées**.

**Partenariats** : écoles ; universités ; organismes de formation ; entreprises ; institutions (ministères, offices des œuvres universitaires, agences de bourses) ; organismes internationaux ; banques et opérateurs de paiement mobile ; assureurs.

---

## 44. Parcours utilisateurs principaux

**Élève de 3e (Gabon)** : Inscription → Profil → Test d'orientation → Résultat → Découverte des métiers → Ma Série au lycée → Recommandations → Ressources pédagogiques → BEPC → Orientation en 2nde.

**Lycéen en Terminale C (Gabon) souhaitant étudier au Maroc** : Inscription → Profil → Test → Projet « ingénieur informatique » → Formations (CPGE, cycles d'ingénieur) → Établissements au Maroc → Candidature → Paiement → Admission → **Navilease : studio vérifié à Rabat, garant parent, paiement Airtel Money en séquestre** → Arrivée.

**Étudiant (Sénégal)** : Inscription → Profil → Test → Projet professionnel → Recherche de métier → Formation → Établissement → Recommandation → Candidature → Paiement (Wave) → Suivi → Admission → **Logement à Thiès près de l'UIDT**.

---

## 45. MVP — Version 1

1. Authentification
2. Profils utilisateurs
3. Tests d'orientation (RIASEC)
4. Résultats graphiques
5. Base métiers (référentiel)
6. Base formations (référentiel)
7. Base établissements des 3 pays (référentiel + logos)
8. Recherche et filtres
9. Recommandations
10. Espace étudiant
11. Candidature
12. Back-office (dont gestion des référentiels)
13. **Navilease — vitrine** : annuaire des résidences publiques et premières annonces de bailleurs vérifiés, recherche par établissement, demande de contact

---

## 46. Version 2

Espace parent ; espace établissement complet ; paiements (mobile money par pays) ; documents ; messagerie ; conseiller ; notifications ; campagnes ; ressources pédagogiques ; espace collège ; Ma Série au lycée ; interface en arabe ; **Navilease transactionnel** : réservation, séquestre, contrat numérique, états des lieux, quittances, avis.

---

## 47. Version 3

Recommandations avancées ; IA d'orientation ; assistant conversationnel ; analyse du profil ; matching formation/profil ; matching établissement/candidat ; personnalisation des parcours ; statistiques avancées ; **matching colocataires, garantie locative Navilease, services d'arrivée** ; extension à d'autres pays africains (Côte d'Ivoire, Cameroun, Tunisie…).

---

## 48. Indicateurs clés de performance (KPI)

- **Acquisition** : visiteurs ; inscriptions ; coût d'acquisition ; taux d'inscription — par pays.
- **Engagement** : tests réalisés ; recherches ; formations et métiers consultés ; temps passé.
- **Orientation** : tests terminés ; recommandations consultées ; recommandations suivies.
- **Conversion** : formations ajoutées ; candidatures ; candidatures complètes ; admissions.
- **Établissements** : établissements actifs ; fiches revendiquées ; formations publiées ; candidatures reçues.
- **Navilease** : annonces actives et vérifiées ; demandes ; réservations ; volume en séquestre ; taux d'occupation ; note moyenne ; litiges pour 100 réservations.

---

## 49. Positionnement

Navigoal est **la plateforme qui accompagne le jeune Africain dans son parcours, de l'orientation à la formation, jusqu'à son installation**.

Le produit se différencie d'un simple annuaire d'écoles, site d'offres de formation, site d'orientation, plateforme de cours ou site d'annonces immobilières : Navigoal est la **passerelle entre l'élève, son projet, le métier, la formation, l'établissement et son lieu de vie étudiant**.

---

## 50. Proposition de valeur

- **Pour l'élève** : « Comprends ton profil et construis ton avenir. »
- **Pour l'étudiant** : « Trouve la formation qui correspond à ton projet — et le logement qui va avec. »
- **Pour le parent** : « Accompagne l'orientation de ton enfant et son installation en toute sécurité. »
- **Pour l'établissement** : « Trouvez les bons candidats et gérez vos admissions. »
- **Pour le bailleur (Navilease)** : « Louez à des étudiants vérifiés, avec des paiements garantis. »

---

## 51. Résumé fonctionnel

```
                           NAVIGOAL
                              │
     ┌──────────────┬─────────┴─────────┬────────────────┐
     │              │                   │                │
  ORIENTER        FORMER            CANDIDATER        S'INSTALLER
     │              │                   │            (NAVILEASE)
     ↓              ↓                   ↓                ↓
   Tests       Ressources           Dossiers        Logements vérifiés
     │         pédagogiques             │                │
     ↓              │                   ↓                ↓
   Profil           │               Paiement        Réservation / séquestre
     │              │                   ↓                ↓
     ↓              │                 Suivi          Contrat / quittances
  Métiers           │                   │                │
     ↓              │                   ↓                ↓
 Formations ←───────┘               Admission ─────► Installation
     │
     ↓
Établissements
```

**Le cœur du produit** : PROFIL → ORIENTATION → MÉTIER → FORMATION → ÉTABLISSEMENT → CANDIDATURE → ADMISSION → LOGEMENT

---

## 52. Conclusion

Navigoal a vocation à devenir un véritable écosystème numérique africain de l'orientation, de l'accès à la formation et de l'installation étudiante, en démarrant au **Gabon, au Maroc et au Sénégal**.

Le projet repose sur quatre piliers :

1. **ORIENTER** — tests, profils, métiers, compétences, séries et recommandations.
2. **INFORMER & FORMER** — formations, établissements, contenus pédagogiques, cours, annales et ressources.
3. **FACILITER L'ACCÈS** — candidatures, documents, paiements, suivi, messagerie et accompagnement.
4. **LOGER (NAVILEASE)** — logements vérifiés, réservation sécurisée, contrats et accompagnement à l'installation.

L'ambition finale est de créer un parcours numérique continu :

> « Je découvre qui je suis → je découvre ce que je peux devenir → je trouve où me former → je candidate → je trouve où vivre → je construis mon avenir. »
