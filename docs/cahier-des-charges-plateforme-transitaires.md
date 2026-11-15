# Cahier des charges — Plateforme gabonaise de comparaison de transitaires (Chine / Asie → Gabon)

> Nom de travail : **« FretCompare 241 »** (à remplacer)
> Version : 0.1 — brouillon pour validation
> Date : 15/11/2026
> Statut : à valider avant maquettage Figma

---

## 1. Contexte

Les importateurs gabonais — commerçants, PME, particuliers qui achètent sur Alibaba, 1688, Taobao ou Shein — passent presque tous par des **transitaires** pour acheminer leurs marchandises de Chine (Guangzhou, Yiwu, Shenzhen…) et d'Asie vers le Gabon, par **avion** (Libreville – Léon Mba) ou par **bateau** (port d'Owendo, Port-Gentil).

Aujourd'hui, le choix se fait surtout par **bouche-à-oreille, groupes WhatsApp et Facebook**. Les problèmes récurrents :

- **Tarifs opaques et difficiles à comparer** (prix au kg, au CBM, frais cachés à l'arrivée, dédouanement inclus ou non).
- **Délais annoncés rarement tenus** et peu d'informations fiables sur les délais réels.
- **Manque de confiance** : colis perdus ou retenus, transitaires non déclarés, arnaques.
- **Pas de suivi** clair entre l'entrepôt en Chine et la livraison au Gabon.

## 2. Objectifs

| # | Objectif | Indicateur de succès (12 mois après lancement) |
|---|----------|-----------------------------------------------|
| O1 | Permettre de comparer en moins de 2 minutes les offres (prix + délai + fiabilité) | Temps moyen jusqu'au premier résultat < 2 min |
| O2 | Rendre les prix **tout compris** et comparables | ≥ 90 % des offres affichées avec coût total estimé |
| O3 | Installer la confiance (transitaires vérifiés, avis authentiques, délais réels mesurés) | ≥ 70 % des transitaires référencés « vérifiés » |
| O4 | Générer des mises en relation qualifiées pour les transitaires | Volume de demandes de devis / réservations par mois |
| O5 | Construire un modèle économique viable | Seuil de rentabilité défini dans le business plan |

## 3. Périmètre

### Inclus (cible)
- Fret **aérien** et **maritime** depuis la **Chine** (priorité) puis le reste de l'Asie (Turquie, Dubaï, Inde, Vietnam… à arbitrer).
- Modes : **groupage aérien** (au kg), **groupage maritime / LCL** (au CBM), **conteneur complet / FCL** (20' / 40'), **express** (DHL/FedEx-like, pour comparaison).
- Destinations : Libreville en priorité, puis Port-Gentil, Franceville, Oyem… (livraison ou point de retrait).
- Comparaison, demande de devis, réservation, suivi, avis, litiges.

### Exclus (au moins en V1)
- La plateforme **ne transporte pas** et n'est **pas commissionnaire en douane** : elle met en relation.
- Pas d'achat de marchandises pour le compte du client (sourcing) en V1 — piste d'évolution.
- Pas d'export Gabon → Asie en V1.

## 4. Utilisateurs (personas)

| Persona | Profil | Besoin principal |
|---------|--------|------------------|
| **Mireille, commerçante** (Mont-Bouët) | Importe tous les mois 50–300 kg de vêtements/cosmétiques | Prix au kg le plus bas, délai fiable, paiement en Mobile Money |
| **Jean-Paul, PME BTP** | Importe du matériel en LCL ou conteneur 2–4 fois/an | Devis détaillé, dédouanement inclus, documents en règle |
| **Aïcha, particulière** | Achète ponctuellement sur Shein / AliExpress / 1688 | Simplicité, savoir combien et quand, ne pas se faire arnaquer |
| **Transitaire** (agence locale avec entrepôt en Chine) | Veut plus de clients et une meilleure image | Visibilité, demandes qualifiées, outil de gestion simple |
| **Administrateur plateforme** | Équipe interne | Vérifier les transitaires, modérer, gérer les litiges, piloter |

## 5. Parcours clés

1. **Comparer** : je saisis origine (ville/entrepôt en Chine), destination, mode (avion/bateau/indifférent), type de marchandise, poids et/ou volume → je vois la liste des offres triables par **coût total**, **délai réel**, **note**.
2. **Simuler** : je ne connais pas mon volume → un **calculateur** (dimensions des cartons → CBM, poids volumétrique aérien) m'aide.
3. **Choisir et réserver** : je consulte la fiche du transitaire, je demande un devis ou je réserve directement ; je reçois l'**adresse d'entrepôt en Chine** et un **code client** (shipping mark) à communiquer à mon fournisseur.
4. **Suivre** : je suis les étapes (reçu à l'entrepôt → pesé/mesuré → expédié → arrivé → dédouané → disponible / livré) avec notifications WhatsApp/SMS.
5. **Payer** : je paie à l'étape convenue (Mobile Money, carte, virement, espèces au retrait).
6. **Évaluer** : après réception, je note le transitaire (prix respecté, délai, état du colis, service client). Le **délai réel** est enregistré automatiquement.
7. **Réclamer** : en cas de problème, j'ouvre un litige avec pièces jointes.

## 6. Exigences fonctionnelles

Priorité : **P1** = MVP · **P2** = V2 · **P3** = plus tard.

### 6.1 Côté client (importateur)

| ID | Fonction | Détail | Priorité |
|----|----------|--------|----------|
| C1 | Moteur de comparaison | Filtres : origine, destination, mode, type de marchandise (générale, batteries, liquides, cosmétiques, marques, électronique…), poids, volume, date | P1 |
| C2 | **Coût total estimé** | Fret + frais de manutention + dédouanement (si inclus) + livraison locale + frais annexes ; mention claire de ce qui est **inclus / non inclus** | P1 |
| C3 | Délais | Délai **annoncé** ET **délai réel moyen** mesuré (médiane, 80e percentile) sur les derniers envois ; prochaine date de départ / clôture d'entrepôt | P1 |
| C4 | Calculateur | CBM, poids volumétrique (aérien : L×l×h / 6000 — diviseur paramétrable par transitaire), conversion en coût | P1 |
| C5 | Fiche transitaire | Présentation, badges de vérification, adresses (Gabon + entrepôts Asie), grille tarifaire, marchandises acceptées/refusées, conditions, avis, délais réels, taux de litiges | P1 |
| C6 | Demande de devis | Formulaire unique envoyé à 1 ou plusieurs transitaires ; réponses comparées côte à côte | P1 |
| C7 | Compte client | Inscription par **numéro de téléphone + OTP** (email optionnel), historique, favoris | P1 |
| C8 | Contact WhatsApp | Bouton de contact direct pré-rempli (canal dominant au Gabon) | P1 |
| C9 | Avis vérifiés | Seuls les clients ayant un envoi enregistré peuvent noter ; réponse publique du transitaire | P1 |
| C10 | Réservation en ligne | Génération du shipping mark et des instructions pour le fournisseur chinois (FR / EN / 中文) | P2 |
| C11 | Suivi d'envoi | Timeline des statuts + notifications WhatsApp/SMS/push | P2 |
| C12 | Paiement en ligne | Airtel Money, Moov Money, carte ; option **séquestre** (paiement libéré à la réception) | P2 |
| C13 | Litiges | Ouverture, échanges, médiation par la plateforme, historique | P2 |
| C14 | Alertes | « Prévenez-moi quand un départ aérien < X FCFA/kg est disponible » | P3 |
| C15 | Assurance marchandise | Proposition d'assurance ad valorem via partenaire | P3 |
| C16 | Guide import | Contenus : marchandises interdites, droits et taxes, documents, éviter les arnaques | P1 (contenu) |

### 6.2 Côté transitaire (espace pro)

| ID | Fonction | Détail | Priorité |
|----|----------|--------|----------|
| T1 | Inscription & vérification (KYC) | RCCM, NIF, agrément de commissionnaire en douane le cas échéant, pièce d'identité du gérant, adresse physique, preuves d'entrepôt en Chine | P1 |
| T2 | Gestion des offres | Grilles tarifaires par route/mode/type de marchandise, minimum facturable, frais annexes, validité | P1 |
| T3 | Calendrier des départs | Dates de clôture et de départ prévues (aérien hebdo, maritime mensuel…) | P1 |
| T4 | Réception des demandes | Devis, messages, réservations ; notifications WhatsApp/email | P1 |
| T5 | Mise à jour des statuts | Saisie simple (mobile) ou import CSV / API ; photo du colis pesé | P2 |
| T6 | Tableau de bord | Demandes, taux de conversion, note, délais réels, litiges | P2 |
| T7 | Abonnement / mise en avant | Gestion de l'offre payante, factures | P2 |
| T8 | API | Synchronisation des tarifs et des statuts pour les gros transitaires | P3 |

### 6.3 Côté administration (back-office)

| ID | Fonction | Priorité |
|----|----------|----------|
| A1 | Validation des transitaires et des documents KYC, attribution des badges | P1 |
| A2 | Modération des avis et des contenus | P1 |
| A3 | Gestion des référentiels (villes, ports, aéroports, types de marchandises, taux de change CNY/USD/EUR → XAF) | P1 |
| A4 | Gestion des litiges et sanctions (avertissement, suspension) | P2 |
| A5 | Statistiques : recherches, conversions, routes les plus demandées, délais réels par transitaire | P2 |
| A6 | Facturation des transitaires / commissions | P2 |

## 7. Règles de gestion importantes

- **RG1 — Comparabilité** : tout tarif affiché est ramené en **FCFA (XAF)** et accompagné de la liste « inclus / non inclus ». Une offre sans coût total estimable est signalée comme telle et classée après.
- **RG2 — Délai réel** : calculé à partir des dates « reçu à l'entrepôt » et « disponible au Gabon » des envois suivis sur la plateforme ; affiché seulement au-delà d'un nombre minimal d'envois (ex. 10) pour être significatif.
- **RG3 — Classement neutre** : le tri par défaut est transparent (ex. score combinant coût, délai réel, note). Les offres **sponsorisées** sont toujours étiquetées « Sponsorisé ».
- **RG4 — Avis** : un avis = un envoi vérifié ; pas de suppression d'avis négatif à la demande du transitaire, sauf contenu illicite.
- **RG5 — Badges** : « Identité vérifiée », « Entreprise enregistrée », « Agréé en douane », « Entrepôt Chine vérifié », « Délais tenus » (calculé).
- **RG6 — Marchandises sensibles** : batteries lithium, liquides, poudres, contrefaçons, produits réglementés → message d'avertissement et filtrage des transitaires qui ne les acceptent pas.
- **RG7 — Devises** : taux de change mis à jour quotidiennement ; date du taux affichée.

## 8. Exigences non fonctionnelles

| Thème | Exigence |
|-------|----------|
| **Mobile d'abord** | > 80 % du trafic attendu sur smartphone Android d'entrée/milieu de gamme ; interface conçue en 360 px d'abord |
| **Performance** | Pages légères (objectif < 1,5 Mo, LCP < 2,5 s en 3G/4G) ; mode PWA installable ; fonctionnement dégradé hors ligne pour le suivi |
| **Langues** | Français (V1) ; anglais et chinois simplifié pour les instructions aux fournisseurs (V2) |
| **Accessibilité** | Contrastes AA, gros boutons, textes simples |
| **Sécurité** | HTTPS, OTP, rôles (client / transitaire / admin), chiffrement des documents KYC, journalisation des actions admin, sauvegardes quotidiennes |
| **Données personnelles** | Conformité à la loi gabonaise sur la protection des données personnelles (loi n° 001/2011 et autorité de contrôle CNPDCP — **à faire valider par un juriste**) ; consentement, droit d'accès/suppression, durée de conservation |
| **Disponibilité** | 99,5 % ; supervision et alertes |
| **SEO** | Pages indexables par route (« transitaire Chine Gabon avion », « fret maritime Guangzhou Owendo »…) |
| **Évolutivité** | Architecture permettant d'ajouter d'autres pays d'origine et de destination (CEMAC) |

## 9. Architecture technique proposée (à confirmer)

- **Front** : Next.js (App Router) + TypeScript + Tailwind — cohérent avec les projets existants NEAM — en **PWA**.
- **Back / API** : Next.js API routes ou service Node (NestJS) ; base **PostgreSQL** (ex. Supabase ou Neon) ; stockage de fichiers (documents KYC, photos colis).
- **Authentification** : téléphone + OTP SMS / WhatsApp.
- **Notifications** : WhatsApp Business API, SMS (agrégateur local), email.
- **Paiement** (V2) : agrégateur compatible Airtel Money / Moov Money / cartes (ex. CinetPay, PawaPay, Flutterwave… — **à comparer** selon frais et disponibilité au Gabon).
- **Hébergement** : Vercel (front) + base managée ; CDN.
- **Analytique** : outil respectueux de la vie privée.

## 10. Modèle économique (options à arbitrer)

| Option | Principe | Avantages | Risques |
|--------|----------|-----------|---------|
| Abonnement transitaire | Forfait mensuel pour être référencé / débloquer des fonctions | Revenu récurrent | Frein à l'adhésion au début |
| Commission | % sur chaque réservation payée via la plateforme | Aligné sur la valeur | Contournement (paiement hors plateforme) |
| Paiement au lead | Prix par demande de devis qualifiée | Simple | Contestation de la qualité des leads |
| Mise en avant | Positions sponsorisées étiquetées | Facile à vendre | Crédibilité si mal encadré |
| Services client | Assurance, séquestre, suivi premium | Valeur ajoutée | Partenaires à trouver |

**Recommandation de départ** : gratuit pour les clients ; **référencement gratuit** des transitaires pendant 3–6 mois pour constituer l'offre, puis **abonnement + mise en avant**, la commission arrivant avec le paiement/séquestre en V2.

## 11. Contenus et données à réunir

- Liste initiale des transitaires opérant Chine → Gabon (cible : 20–30 au lancement) et leurs grilles tarifaires.
- Référentiel des entrepôts en Chine (Guangzhou, Yiwu, Shenzhen, Foshan…) et des points de retrait au Gabon.
- Liste des marchandises interdites / réglementées et informations douanières (DGDDI) — **à valider auprès d'un professionnel**.
- Charte des avis, CGU, CGV transitaires, politique de confidentialité, procédure de litige.

## 12. Planning indicatif

| Phase | Contenu | Durée indicative |
|-------|---------|------------------|
| 0. Cadrage | Validation de ce cahier des charges, entretiens avec 10 importateurs et 5 transitaires | 2–3 semaines |
| 1. Design | Arborescence, wireframes puis **maquettes Figma** (design system, écrans clés) — validées avant tout code | 3–4 semaines |
| 2. MVP (P1) | Comparateur, fiches, devis, comptes, espace pro, back-office, contenus | 8–10 semaines |
| 3. Pilote | 10–20 transitaires, Libreville uniquement, mesure des KPIs | 1–2 mois |
| 4. V2 (P2) | Réservation, suivi, paiement / séquestre, litiges, abonnements | 2–3 mois |

## 13. Indicateurs de pilotage (KPIs)

- Recherches / semaine, taux recherche → demande de devis, taux devis → réservation.
- Nombre de transitaires actifs et vérifiés ; fraîcheur des tarifs (mis à jour < 30 jours).
- Écart **délai annoncé vs délai réel** par transitaire.
- Note moyenne, taux de litiges, délai de résolution.
- Revenus par transitaire, taux de rétention des abonnés.

## 14. Risques et parades

| Risque | Parade |
|--------|--------|
| Transitaires réticents à afficher leurs prix | Lancement gratuit, valeur démontrée (leads), affichage « à partir de » accepté au début |
| Tarifs obsolètes | Date de mise à jour visible, rappels automatiques, déclassement des offres périmées |
| Faux avis | Avis liés à un envoi vérifié, modération, détection de doublons |
| Contournement de la plateforme | Valeur ajoutée côté client (suivi, séquestre, litiges) pour garder les transactions |
| Responsabilité juridique en cas de perte | CGU claires (plateforme = intermédiaire), assurance optionnelle, médiation |
| Faible connectivité | PWA légère, WhatsApp comme canal principal de notification |

## 15. Questions ouvertes (à trancher)

1. Nom et identité de la marque ?
2. Pays d'origine au lancement : Chine seule ou Chine + Dubaï/Turquie ?
3. Villes de destination au lancement : Libreville seule ?
4. Modèle économique retenu pour la première année ?
5. Paiement en ligne dès le MVP ou mise en relation pure ?
6. Qui assure la vérification terrain des transitaires (équipe interne, partenaire) ?
7. Budget et date de lancement visés ?

## 16. Livrables attendus

1. Cahier des charges validé (ce document).
2. Arborescence + parcours utilisateurs.
3. Maquettes **Figma** (mobile et desktop) + design system.
4. MVP en production + back-office.
5. Documentation technique et guide d'administration.
