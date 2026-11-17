# Cahier des charges — Neam Transit

> Plateforme gabonaise de comparaison et de mise en relation avec les transitaires (Chine / Corée du Sud → Gabon)
> Version : 0.3 — 17/11/2026
> Statut : décisions actées ; **MVP réalisé** (dossier `neam-transit/`)

### Décisions actées (v0.3)

| Sujet | Décision |
|-------|----------|
| Nom | **Neam Transit** |
| Pays d'origine | **Chine** et **Corée du Sud** |
| Paiement | **Aucun paiement sur la plateforme** : uniquement la **mise en relation** ; le client règle directement le transitaire |
| Destinations | **Tout le Gabon dès le lancement** (9 provinces, 40 villes au référentiel) |
| Informations publiées | **Uniquement des informations vérifiées** : transitaires, tarifs, modifications et avis sont contrôlés avant publication |
| Monétisation | Gratuit pour tous au lancement, aucun paiement sur la plateforme ; modèle de revenus à décider plus tard (section 10) |
| Date de lancement | Pas de date officielle |
| Méthode | À la demande de l'utilisateur, le MVP a été développé **avant** les maquettes Figma (exception à la règle « Figma d'abord ») |

---

## 1. Contexte

Les importateurs gabonais (commerçants, PME, particuliers) passent presque tous par des **transitaires** pour acheminer leurs marchandises vers le Gabon, par **avion** (Libreville – Léon Mba) ou par **bateau** (port d'Owendo, Port-Gentil) :

- depuis la **Chine** (Guangzhou, Yiwu, Shenzhen, Foshan…) : vêtements, cosmétiques, électronique, matériel, mobilier — achats Alibaba, 1688, Taobao, Shein ;
- depuis la **Corée du Sud** (Séoul/Incheon, Busan) : cosmétiques « K-beauty », électronique, pièces auto et **véhicules d'occasion**.

Le choix du transitaire se fait surtout par **bouche-à-oreille, groupes WhatsApp et Facebook**. Problèmes récurrents :

- **tarifs opaques** et difficiles à comparer (prix au kg, au CBM, frais cachés à l'arrivée, dédouanement inclus ou non) ;
- **délais annoncés rarement tenus**, aucune donnée fiable sur les délais réels ;
- **manque de confiance** : colis perdus ou retenus, transitaires non déclarés, arnaques ;
- **peu de transitaires visibles sur la route Corée → Gabon**, moins connue que la Chine.

## 2. Objectifs

| # | Objectif | Indicateur de succès (12 mois après lancement) |
|---|----------|-----------------------------------------------|
| O1 | Comparer en moins de 2 minutes les offres (prix + délai + fiabilité) | Temps moyen jusqu'au premier résultat < 2 min |
| O2 | Rendre les prix **tout compris** et comparables | ≥ 90 % des offres avec coût total estimé |
| O3 | Installer la confiance (transitaires vérifiés, avis authentiques, délais réels) | ≥ 70 % des transitaires « vérifiés » |
| O4 | Générer des **mises en relation qualifiées** pour les transitaires | Nombre de demandes de devis et de contacts par mois |
| O5 | Construire un modèle économique viable sans encaisser de paiement | Seuil de rentabilité défini dans le business plan |

## 3. Périmètre

### Inclus
- Origines : **Chine** et **Corée du Sud**.
- Modes : **groupage aérien** (au kg), **groupage maritime / LCL** (au CBM), **conteneur complet / FCL** (20' / 40'), **express** (pour comparaison), **Ro-Ro véhicules** (Corée surtout — P2).
- Destinations : **tout le Gabon** (livraison par le transitaire ou retrait en agence).
- Comparaison, demande de devis, mise en relation, suivi déclaratif, avis, signalements.

### Exclus
- **Tout paiement en ligne** (pas d'encaissement, pas de séquestre, pas de commission sur transaction). Le règlement se fait directement entre le client et le transitaire.
- La plateforme **ne transporte pas** et n'est **pas commissionnaire en douane** : elle met en relation.
- Pas de sourcing (achat pour le compte du client) ni d'export Gabon → Asie en V1.

## 4. Utilisateurs (personas)

| Persona | Profil | Besoin principal |
|---------|--------|------------------|
| **Mireille, commerçante** (Mont-Bouët) | Importe chaque mois 50–300 kg de vêtements/cosmétiques de Chine | Prix au kg le plus bas, délai fiable, transitaire sérieux |
| **Jean-Paul, PME BTP** | Importe du matériel en LCL ou conteneur 2–4 fois/an | Devis détaillé, dédouanement inclus, documents en règle |
| **Serge, revendeur auto** | Achète des véhicules d'occasion et pièces en Corée | Coût total rendu Owendo, délai de navire, dédouanement |
| **Aïcha, particulière** | Achats ponctuels en ligne (Chine ou cosmétiques coréens) | Simplicité, savoir combien et quand, ne pas se faire arnaquer |
| **Transitaire** | Agence locale avec entrepôt ou partenaire en Chine/Corée | Visibilité, demandes qualifiées, bonne réputation |
| **Administrateur** | Équipe Neam Transit | Vérifier, modérer, traiter les signalements, piloter |

## 5. Parcours clés

1. **Comparer** : origine (pays + ville/entrepôt), destination, mode (avion/bateau/indifférent), type de marchandise, poids et/ou volume → liste d'offres triables par **coût total**, **délai réel**, **note**.
2. **Simuler** : calculateur CBM / poids volumétrique si je ne connais pas mon volume.
3. **Être mis en relation** : depuis la fiche transitaire, je demande un devis (à un ou plusieurs transitaires) ou je contacte directement par **WhatsApp / appel**. La plateforme enregistre la mise en relation et me fournit, si le transitaire l'a renseigné, l'**adresse d'entrepôt** et le **format de marquage** (shipping mark) à transmettre au fournisseur.
4. **Conclure hors plateforme** : je finalise et je paie **directement le transitaire**, selon ses conditions.
5. **Suivre (déclaratif)** : j'enregistre mon envoi (« envoi confié à X le … ») ; le transitaire et/ou moi mettons à jour les étapes clés (reçu entrepôt → expédié → arrivé → disponible). Rappels WhatsApp/SMS.
6. **Évaluer** : après réception, je note le transitaire (prix respecté, délai, état, service). Le **délai réel** est enregistré.
7. **Signaler** : en cas de problème, j'ouvre un signalement ; la plateforme fait de la **médiation** et peut sanctionner le transitaire (avertissement, suspension), sans intervenir sur l'argent.

## 6. Exigences fonctionnelles

Priorité : **P1** = MVP · **P2** = V2 · **P3** = plus tard.

### 6.1 Côté client (importateur)

| ID | Fonction | Détail | Priorité |
|----|----------|--------|----------|
| C1 | Moteur de comparaison | Filtres : pays et ville d'origine, destination, mode, type de marchandise (générale, batteries, liquides, cosmétiques, marques, électronique, véhicules…), poids, volume | P1 |
| C2 | **Coût total estimé** | Fret + manutention + dédouanement (si inclus) + livraison locale + frais annexes, en **FCFA** ; liste **inclus / non inclus** | P1 |
| C3 | Délais | Délai **annoncé** ET **délai réel** mesuré (médiane, 80e percentile) ; prochaine date de départ / clôture d'entrepôt | P1 |
| C4 | Calculateur | CBM, poids volumétrique aérien (L×l×h / 6000, diviseur paramétrable par transitaire) | P1 |
| C5 | Fiche transitaire | Présentation, badges, adresses (Gabon + entrepôts Chine/Corée), tarifs, marchandises acceptées/refusées, conditions et **modes de paiement acceptés** (information seulement), avis, délais réels, taux de signalements | P1 |
| C6 | Demande de devis | Formulaire unique envoyé à 1 à 5 transitaires ; réponses comparées côte à côte | P1 |
| C7 | Contact direct | Boutons WhatsApp (message pré-rempli avec la demande) et appel ; chaque contact est tracé comme mise en relation | P1 |
| C8 | Compte client | Inscription par **téléphone + OTP** (email optionnel), historique des demandes, favoris | P1 |
| C9 | Avis vérifiés | Seuls les clients ayant une mise en relation **et** un envoi déclaré peuvent noter ; droit de réponse du transitaire | P1 |
| C10 | Guide import | Marchandises interdites, droits et taxes, documents, éviter les arnaques, spécificités Corée (véhicules) | P1 (contenu) |
| C11 | Suivi déclaratif | Timeline des étapes + rappels WhatsApp/SMS | P2 |
| C12 | Instructions fournisseur | Fiche à envoyer au fournisseur : adresse entrepôt + shipping mark, en FR / EN / 中文 / 한국어 | P2 |
| C13 | Signalements | Ouverture, pièces jointes, échanges, médiation, historique | P2 |
| C14 | Alertes | « Prévenez-moi quand un départ aérien < X FCFA/kg est disponible » | P3 |

### 6.2 Côté transitaire (espace pro)

| ID | Fonction | Détail | Priorité |
|----|----------|--------|----------|
| T1 | Inscription & vérification | RCCM, NIF, agrément de commissionnaire en douane le cas échéant, identité du gérant, adresse physique, preuves d'entrepôt ou partenaire en Chine/Corée | P1 |
| T2 | Gestion des offres | Grilles par route (pays/ville) / mode / type de marchandise, minimum facturable, frais annexes, date de validité | P1 |
| T3 | Calendrier des départs | Dates de clôture et de départ prévues | P1 |
| T4 | Réception des demandes | Devis et contacts, notifications WhatsApp/email, réponse depuis mobile | P1 |
| T5 | Mise à jour des envois | Confirmation « envoi pris en charge », étapes, photo du colis pesé | P2 |
| T6 | Tableau de bord | Demandes reçues, taux de réponse, note, délais réels, signalements | P2 |
| T7 | Abonnement / mise en avant | Choix de l'offre ; facturation **hors ligne** (facture + virement / Mobile Money manuel) | P2 |
| T8 | API / import CSV | Synchronisation des tarifs et des statuts | P3 |

### 6.3 Côté administration (back-office)

| ID | Fonction | Priorité |
|----|----------|----------|
| A1 | Validation des transitaires et documents, attribution des badges | P1 |
| A2 | Modération des avis et contenus | P1 |
| A3 | Référentiels : villes/entrepôts Chine et Corée, ports, aéroports, types de marchandises, taux de change **CNY / KRW / USD / EUR → XAF** | P1 |
| A4 | Suivi des mises en relation (demandes, contacts WhatsApp, devis) | P1 |
| A5 | Signalements et sanctions (avertissement, suspension) | P2 |
| A6 | Statistiques : recherches, mises en relation, routes demandées, délais réels | P2 |
| A7 | Gestion des abonnements transitaires (suivi des factures payées hors ligne) | P2 |

## 7. Règles de gestion

- **RG1 — Comparabilité** : tout tarif est ramené en **FCFA (XAF)** avec « inclus / non inclus ». Une offre sans coût total estimable est signalée et classée après.
- **RG2 — Délai réel** : calculé à partir des dates déclarées par le client et/ou le transitaire (« reçu à l'entrepôt » → « disponible au Gabon ») ; en cas de désaccord, la date du client prévaut sauf preuve. Affiché à partir d'un minimum d'envois (ex. 10).
- **RG3 — Classement neutre** : tri par défaut transparent (score coût / délai réel / note). Toute offre **sponsorisée** est étiquetée « Sponsorisé ».
- **RG4 — Avis** : un avis = une mise en relation + un envoi déclaré ; pas de suppression d'avis négatif à la demande du transitaire, sauf contenu illicite.
- **RG5 — Badges** : « Identité vérifiée », « Entreprise enregistrée », « Agréé en douane », « Entrepôt Chine vérifié », « Entrepôt Corée vérifié », « Délais tenus » (calculé).
- **RG6 — Marchandises sensibles** : batteries lithium, liquides, poudres, contrefaçons, produits réglementés, véhicules → avertissement et filtrage des transitaires qui ne les acceptent pas.
- **RG7 — Devises** : taux de change mis à jour quotidiennement, date du taux affichée.
- **RG8 — Aucun flux financier** : la plateforme n'encaisse ni ne garantit aucun paiement ; message clair à chaque mise en relation (« Vous réglez directement le transitaire ; ne payez jamais une personne non listée sur sa fiche »).

## 8. Exigences non fonctionnelles

| Thème | Exigence |
|-------|----------|
| **Mobile d'abord** | Majorité du trafic attendue sur smartphone Android ; conception en 360 px d'abord |
| **Performance** | Pages légères (< 1,5 Mo, LCP < 2,5 s en 3G/4G) ; PWA installable |
| **Langues** | Français (V1) ; fiches fournisseur en anglais, chinois simplifié et coréen (V2) |
| **Accessibilité** | Contrastes AA, gros boutons, textes simples |
| **Sécurité** | HTTPS, OTP, rôles (client / transitaire / admin), chiffrement des documents de vérification, journal des actions admin, sauvegardes quotidiennes, anti-spam sur les demandes de devis |
| **Données personnelles** | Conformité à la loi gabonaise sur la protection des données personnelles (loi n° 001/2011, autorité CNPDCP — **à faire valider par un juriste**) ; consentement, accès/suppression, durée de conservation |
| **Disponibilité** | 99,5 % ; supervision et alertes |
| **SEO** | Pages par route (« transitaire Chine Gabon avion », « fret maritime Busan Owendo », « importer voiture Corée Gabon »…) |
| **Évolutivité** | Ajout d'autres pays d'origine (Dubaï, Turquie…) et de destinations CEMAC |

## 9. Architecture technique proposée (à confirmer)

- **Front** : Next.js (App Router) + TypeScript + Tailwind, en **PWA**.
- **Back / API** : routes API Next.js ou service Node ; **PostgreSQL** managé (ex. Supabase, Neon) ; stockage de fichiers (documents de vérification, photos).
- **Authentification** : téléphone + OTP SMS / WhatsApp.
- **Notifications** : WhatsApp Business API, SMS (agrégateur local), email.
- **Paiement** : **aucun** module de paiement.
- **Hébergement** : Vercel + base managée ; CDN.
- **Analytique** : outil respectueux de la vie privée ; suivi des clics « Contacter » / « Demander un devis ».

## 10. Modèle économique (sans paiement en ligne)

| Option | Principe | Avantages | Risques |
|--------|----------|-----------|---------|
| Abonnement transitaire | Forfait mensuel (ex. Basique / Pro) pour débloquer statistiques, nombre de devis, badges | Revenu récurrent | Frein à l'adhésion au début |
| Mise en avant | Positions sponsorisées étiquetées, mise en avant par route | Facile à vendre | Crédibilité si mal encadré |
| Paiement au lead | Prix par demande de devis qualifiée | Directement lié à la valeur | Contestation de la qualité des leads |
| Publicité / partenariats | Assureurs, banques, agents en douane, concessionnaires | Revenu complémentaire | Ne doit pas gêner la comparaison |

Toute la facturation des transitaires se fait **hors ligne** (facture, virement, Mobile Money manuel).

**Décision (v0.3)** : plateforme **gratuite pour tous au lancement**, aucun paiement sur la plateforme. Les options ci-dessus (toujours facturées hors plateforme) seront étudiées une fois l'offre de transitaires constituée.

## 11. Contenus et données à réunir

- Liste initiale des transitaires : cible **20–30 sur la Chine** et **5–10 sur la Corée** au lancement, avec leurs grilles tarifaires.
- Référentiel des entrepôts : Chine (Guangzhou, Yiwu, Shenzhen, Foshan…) et Corée (Séoul/Incheon, Busan) ; points de retrait au Gabon.
- Marchandises interdites / réglementées, règles d'importation des véhicules d'occasion, informations douanières (DGDDI) — **à valider avec un professionnel**.
- Charte des avis, CGU (statut d'intermédiaire, absence de flux financier), conditions transitaires, politique de confidentialité, procédure de signalement.

## 12. Planning indicatif

| Phase | Contenu | Durée indicative |
|-------|---------|------------------|
| 0. Cadrage | Cahier des charges validé | ✅ fait |
| 1. MVP (P1) | Comparateur, fiches, devis, contact, espace pro, back-office, guide | ✅ fait (`neam-transit/`) |
| 2. Design | Maquettes **Figma** à partir du MVP, ajustements visuels | 2–3 semaines |
| 2 bis. Préparation | Hébergement, fournisseur SMS, juriste, recrutement des premiers transitaires (entretiens 10 importateurs / 5–8 transitaires) | 3–6 semaines |
| 3. Pilote | 15–25 transitaires, Libreville, mesure des KPIs | 1–2 mois |
| 4. V2 (P2) | Suivi déclaratif, instructions fournisseur multilingues, signalements, abonnements, Ro-Ro véhicules | 2–3 mois |

## 13. Indicateurs de pilotage (KPIs)

- Recherches par semaine ; taux recherche → mise en relation (devis ou contact).
- Taux de réponse des transitaires et délai moyen de réponse.
- Envois déclarés suite à une mise en relation (taux de conversion déclaré).
- Nombre de transitaires actifs et vérifiés ; fraîcheur des tarifs (< 30 jours).
- Écart délai annoncé / délai réel par transitaire.
- Note moyenne, taux de signalements, délai de traitement.
- Abonnés payants, taux de rétention.

## 14. Risques et parades

| Risque | Parade |
|--------|--------|
| Transitaires réticents à afficher leurs prix | Lancement gratuit, leads démontrés, « à partir de » toléré au début |
| Tarifs obsolètes | Date de mise à jour visible, rappels, déclassement des offres périmées |
| Faux avis | Avis liés à une mise en relation + envoi déclaré, modération |
| Valeur difficile à prouver (transaction hors plateforme) | Traçage des contacts, confirmation d'envoi par le client et le transitaire, statistiques fournies aux transitaires |
| Peu de données de délais réels au début | Délai annoncé seul avec mention « pas encore assez de données », incitation à déclarer l'envoi |
| Arnaques par usurpation d'un transitaire | Coordonnées officielles vérifiées sur chaque fiche, avertissements, signalement rapide |
| Responsabilité en cas de perte | CGU claires (intermédiaire, aucun flux financier), médiation, sanctions |
| Faible offre sur la Corée | Démarchage ciblé, partenariats avec des agents à Busan/Incheon |

## 15. Budget prévisionnel (estimation, année 1)

> Fourchettes indicatives en FCFA, à confirmer par des devis locaux. Le développement du MVP est déjà réalisé et n'est pas compté.

### Dépenses de démarrage (une fois)

| Poste | Estimation |
|-------|-----------:|
| Maquettes Figma et identité visuelle (logo, charte) | 500 000 – 1 500 000 |
| Juriste : CGU, politique de confidentialité, formalités données personnelles | 500 000 – 1 500 000 |
| Nom de domaine, mise en place serveur et HTTPS | 100 000 – 300 000 |
| Formalités entreprise / dépôt de marque (si nécessaire) | 300 000 – 800 000 |
| Campagne de lancement (réseaux sociaux, vidéos, flyers) | 1 000 000 – 2 000 000 |
| **Total démarrage** | **2 400 000 – 6 100 000** |

### Dépenses mensuelles

| Poste | Estimation / mois |
|-------|------------------:|
| Serveur (VPS) et sauvegardes | 15 000 – 40 000 |
| Envoi des codes de connexion (SMS / WhatsApp) | 10 000 – 30 000 |
| Agent de vérification terrain (temps partiel + déplacements) | 150 000 – 300 000 |
| Modération et support (temps partiel) | 100 000 – 250 000 |
| Marketing continu | 150 000 – 400 000 |
| Maintenance et évolutions techniques | 100 000 – 300 000 |
| **Total mensuel** | **525 000 – 1 320 000** |

### Total année 1

**Environ 8,7 à 22 millions FCFA** (démarrage + 12 mois).
**Recommandation** : budget de départ d'environ **10 millions FCFA**, en version économe (vérification et modération assurées en interne au début, marketing ciblé sur Facebook / WhatsApp), puis augmenter selon l'activité.

## 16. Questions ouvertes

1. Qui assure la vérification terrain des transitaires (équipe interne, partenaire) ?
2. Quel fournisseur SMS / WhatsApp pour les codes de connexion ?
3. Quel modèle de revenus, et à partir de quand ?

## 17. Livrables

1. Cahier des charges validé (ce document). ✅
2. MVP (site public, espace transitaire, administration) et documentation technique (`neam-transit/README.md`). ✅
3. Maquettes **Figma** (mobile et desktop) et design system Neam Transit.
4. Mise en production et guide d'administration.
