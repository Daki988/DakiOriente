# Conformité au cahier des charges POUFA

Vérification du code au 12/11/2026, fonction par fonction (68 fonctionnalités, sections 5 et 6), puis exigences transversales (sections 7 à 9).

- **Conforme** : la fonction et ses « attendus du fournisseur » sont livrés.
- **Partiel** : la fonction existe mais un attendu manque. Compté pour moitié dans le taux.

## Taux de réalisation

| Priorité | Fonctions | Conformes | Partielles | Absentes | Taux |
|---|---|---|---|---|---|
| Obligatoire MVP | 36 | 30 | 6 | 0 | 92 % |
| Phase ultérieure | 18 | 11 | 7 | 0 | 81 % |
| À arbitrer | 5 | 3 | 2 | 0 | 80 % |
| Évolutive | 9 | 9 | 0 | 0 | 100 % |
| **Total** | **68** | **53** | **15** | **0** | **89 %** |

Couverture : 68 fonctions sur 68 présentes (100 %). Conformité stricte, sans demi-points : 53 sur 68 (78 %).

## Fonctions partielles (15)

| N° | Fonction | Priorité | Ce qui manque |
|---|---|---|---|
| 1 | Fiche d'identification de la ferme | MVP | Doublons signalés mais confirmables (pas de blocage dur) ; référence AMI non contrôlée ; provinces non paramétrables |
| 21 | Déclaration sanitaire | MVP | La DGE peut lire les déclarations : elles doivent aller aux seuls services vétérinaires |
| 26 | Qualification et validation des alertes | MVP | Statuts d'alerte codés en dur ; la DGE voit les alertes avant qualification |
| 38 | Cartographie des exploitations | MVP | Carte schématique colorée et filtrée, mais ni fond de carte, ni zoom, ni clic sur une ferme |
| 40 | Rapports périodiques automatiques | MVP | Périodicité paramétrable ; modèles de rapport non modifiables |
| 46 | Historique et journal des modifications | MVP | Consultations sensibles non tracées |
| 30 | Enregistrement des ventes | Phase ultérieure | Prix par tête seulement, pas par kg |
| 31 | Charges d'exploitation | Phase ultérieure | Pas de reprise automatique de la valeur des intrants |
| 32 | Coût de production | Phase ultérieure | Formule codée en dur (non paramétrable) |
| 34 | Marge et rentabilité | Phase ultérieure | Indicateurs codés en dur (non paramétrables) |
| 45 | Visites techniques | Phase ultérieure | Formulaire de visite non paramétrable |
| 64 | Recherche amont / aval | Phase ultérieure | Recherche par lot, ferme, bande et lot fournisseur ; pas par période ni par opérateur |
| 65 | Unicité et non-réutilisation des identifiants | Phase ultérieure | QR inconnu rejeté et scans journalisés, mais aucun statut « clos » rejeté au scan |
| 35 | Domiciliation des revenus | À arbitrer | Masquée à l'écran, mais envoyée par le serveur à tous les profils qui lisent la ferme |
| 41 | Filtres et exports | À arbitrer | Exports CSV / PDF / EPCIS non journalisés |

## Fonctions conformes (53)

**Fermes :**
- 2 Géolocalisation (GPS sur place, correction manuelle, contrôle de cohérence avec la province).
- 3 Capacités et infrastructures (taux d'occupation paramétrable).
- 4 Statut, cohorte et historique.
- 5 Financement BCEG et consentement révocable.

**Bandes :**
- 6 Ouverture d'une bande, depuis la livraison de poussins, avec rattrapage.
- 7 Fiche d'élevage hors ligne, avec le contrôle « morts ≤ effectif ».
- 8 Pesées (fréquence et échantillon paramétrables, rappel).
- 9 Sorties, avec motifs paramétrables et lien vente / lot.
- 10 Clôture, bilan et lecture seule.
- 11 Historique des bandes.

**Indicateurs :**
- 12 à 15 Mortalité, viabilité, GMQ (avec courbe de croissance) et IC, par formules paramétrables.
- 16 Volumes en têtes, kg ou tonnes.

**Intrants :**
- 17 Réception, confirmée par l'éleveur.
- 18 Stock, avec alerte de stock négatif.
- 19 Recoupement livré / déclaré / constaté, avec seuil.
- 20 Commande : demande, puis validation DGE, puis livraison.

**Sanitaire :**
- 22 Vaccinations, comparées au calendrier.
- 23 Traitements, avec délai d'attente bloquant.
- 24 Diagnostics réservés aux vétérinaires, avec pièce jointe.
- 25 Alerte précoce, au seuil fixé par les vétérinaires et à la tendance.
- 27 Biosécurité (score, grille paramétrable, mesures suivies).
- 28 Export EMA-i (le protocole reste à formaliser avec la FAO).

**Économie :**
- 29 Rendez-vous d'abattage.
- 33 Chiffre d'affaires.

**Pilotage :**
- 36 Tableau de bord éleveur.
- 37 Tableaux de bord province et national, avec filtres.
- 39 Classement pondéré.
- 42 Diffusion après validation du MAEDR.

**Fonctions transversales :**
- 43 Comptes et matrice des droits.
- 44 Collecte hors connexion avec règle de conflit.
- 47 Complétude des saisies.
- 48 Reprise des données avec rapport.

**Services complémentaires :**
- 49 Prix.
- 50 Assistance.
- 51 Mise en relation.
- 52 Ressources.

**Traçabilité :**
- 53 Identifiant de lot.
- 54 Chronologie du lot.
- 55 Cession et sous-lots.
- 56 Registre des opérateurs.
- 57 QR signé imprimable.
- 58 Réception à l'abattoir avec écart.
- 59 Lots dérivés.
- 60 Transport.
- 61 Contrôle distributeur.
- 62 Page publique.
- 63 Statut de validation.
- 66 Indicateurs avec seuil de 95 %.
- 67 Aucun compte sans convention.
- 68 Document d'accompagnement.

## Exigences transversales (sections 7 à 9)

| Exigence | État | Écart |
|---|---|---|
| 7.1 Web, Android, écrans calqués sur la fiche papier | Conforme | — |
| 7.2 Hors connexion, synchronisation automatique, règle de conflit | Conforme | — |
| 7.3 Paramétrage sans développement | Partiel | Provinces, statuts d'alerte, statuts de validation des lots, formules de coût et de marge, modèles de rapports |
| 7.4 Calculs et contrôles automatiques | Conforme | — |
| 7.5 Identifiants et QR | Partiel | QR « clos » non rejeté |
| 7.6 GPS, carte, notifications | Partiel | Carte non interactive ; notification d'alerte seulement dans l'application ouverte (ni SMS ni e-mail) ; rappel de pesée seulement à l'écran |
| 7.7 API, imports, exports | Conforme | API documentée (OpenAPI), import AMI, exports CSV et PDF, EPCIS |
| 8 Authentification et matrice des droits | Conforme | — |
| 8 Cloisonnement sanitaire | Partiel | Déclarations et alertes non qualifiées lisibles par la DGE |
| 8 Données BCEG | Partiel | Domiciliation non filtrée côté serveur |
| 8 Diffusion MAEDR, page publique, conservation des bandes | Conforme | — |
| 8 Journal non modifiable et exportable | Partiel | Exports et consultations sensibles non tracés |
| 9 Livrables (plateforme, paramétrage, reprise, modèles de rapports) | Conforme | — |
| 9 Documentation (identifiants, conflits, API) | Partiel | Règles décrites dans le README et l'OpenAPI ; pas de document dédié |
| Sécurité de la base | Conforme | Connexion chiffrée, certificat Supabase vérifié (DATABASE_SSL=verify) |
