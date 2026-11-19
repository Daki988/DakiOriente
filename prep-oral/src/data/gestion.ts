import type { Question } from "./types";

const T = {
  contexte: "Contexte & diagnostic",
  strategie: "Orientations & objectifs",
  previsionnel: "Prévisionnel",
  rentabilite: "Seuil & rentabilité",
  analyse: "Ratios & écarts",
  actions: "Actions correctives",
};

export const gestion: Question[] = [
  // ───────── Contexte & diagnostic ─────────
  {
    id: "g01", kind: "oral", theme: T.contexte, proba: "tres", ref: "Introduction, p. 3",
    q: "Présentez-nous rapidement votre établissement.",
    points: [
      "Carrefour City, 231 avenue de Muret, Toulouse (Croix-de-Pierre), ouvert le 29 janvier 2025.",
      "Franchise en location-gérance, gérant Dimitri Roussilhe (mon maître d'apprentissage).",
      "300 m² de vente (345,83 m² avec la réserve de 45,83 m²), ouvert 102 h par semaine.",
      "CA de 4 000 à 6 000 € par jour ; 152 000 € en mai 2026 pour 1 100 heures travaillées.",
      "10 salariés : 3 CDI (Djaya-Perle, Peyo, Ismail) et 7 alternants ; je suis REM par délégation du gérant.",
    ],
    tip: "Une minute maximum : lieu, statut, taille, chiffres clés, équipe, ton rôle.",
  },
  {
    id: "g02", kind: "qcm", theme: T.contexte, proba: "probable", ref: "Introduction, p. 3",
    q: "Sous quel statut le magasin est-il exploité ?",
    options: [
      "Franchise en contrat de location-gérance",
      "Magasin intégré détenu par le groupe Carrefour",
      "Commission-affiliation avec stock détenu par l'enseigne",
      "Coopérative d'indépendants",
    ],
    explain: "Le gérant exploite le fonds en location-gérance et verse une redevance (4 % du CA dans le prévisionnel) au propriétaire du fonds.",
  },
  {
    id: "g03", kind: "qcm", theme: T.contexte, proba: "tres", ref: "1.1, p. 5",
    q: "Quel concurrent considérez-vous comme le plus important, et pourquoi ?",
    options: [
      "Le Carrefour City Déodat : mêmes prix et promotions, on ne se différencie que par le service",
      "Le Vival : il a la plus grande surface du secteur",
      "L'Auchan de proximité : il propose la livraison à domicile",
      "Aucun : la clientèle étudiante est captive",
    ],
    explain: "Face à un magasin de la même enseigne, prix et promotions sont identiques : le client choisit selon la distance, le service et l'habitude. D'où des orientations centrées sur la fidélité et le service.",
  },
  {
    id: "g04", kind: "oral", theme: T.contexte, proba: "tres", ref: "1.1, p. 4",
    q: "Quels outils de diagnostic avez-vous utilisés et qu'en retenez-vous ?",
    points: [
      "PESTEL : seulement les facteurs qui nous concernent (dimanche, inflation, clientèle mixte, Visual Store, anti-gaspi, HACCP/apprentis).",
      "SWOT : forces (102 h d'ouverture, tramway, équipe jeune, accueil) / faiblesses (300 m², réserve, plannings, CA variable).",
      "Analyse des 3 concurrents directs : Vival, Auchan de proximité, Carrefour City Déodat.",
      "Conclusion : on ne gagne pas sur la taille de l'assortiment, mais sur la fidélité, le service et la valeur de chaque passage.",
    ],
  },
  {
    id: "g05", kind: "qcm", theme: T.contexte, proba: "probable", ref: "1.1 PESTEL, p. 4",
    q: "Quelle contrainte « politique/légale » limite l'activité le dimanche ?",
    options: [
      "Les salariés ne peuvent travailler que jusqu'à 13 h ; l'après-midi est tenu par le gérant",
      "Le magasin doit fermer à 12 h le dimanche",
      "Seuls les CDI peuvent travailler le dimanche",
      "L'ouverture du dimanche est interdite aux franchisés",
    ],
    explain: "C'est aussi pour cela que l'allongement des horaires a été écarté.",
  },
  {
    id: "g06", kind: "qcm", theme: T.contexte, proba: "probable", ref: "1.1 SWOT, p. 4",
    q: "Laquelle de ces menaces figure dans votre SWOT ?",
    options: [
      "La baisse de fréquentation l'été quand les étudiants partent",
      "L'affluence du midi entre 11h30 et 14h",
      "Les matchs du Fenix Toulouse",
      "La clientèle âgée intéressée par la livraison",
    ],
    explain: "Les trois autres propositions sont des opportunités. Menaces : concurrence proche, hausse des charges (énergie du froid), baisse estivale.",
  },

  // ───────── Orientations & objectifs ─────────
  {
    id: "g07", kind: "oral", theme: T.strategie, proba: "tres", ref: "1.1, p. 5",
    q: "Quelles sont vos trois orientations stratégiques ?",
    points: [
      "1. Fidéliser la clientèle du quartier : carte de fidélité Carrefour en réflexe en caisse + produits marque Carrefour.",
      "2. Augmenter le panier moyen : offre repas du midi + vente additionnelle en caisse.",
      "3. Développer la livraison à domicile auprès des personnes âgées ou à mobilité réduite.",
      "Vision : fin 2028, être le commerce de proximité de référence de la Croix-de-Pierre.",
    ],
    tip: "Annonce-les dans l'ordre des priorités, avec un verbe d'action chacune.",
  },
  {
    id: "g08", kind: "qcm", theme: T.strategie, proba: "tres", ref: "1.2, p. 6",
    q: "Quel est l'objectif fin 2027 pour la part des passages en caisse avec la carte Carrefour ?",
    options: ["45 % (contre 35 % estimé en 2026)", "40 % (contre 30 % en 2026)", "50 % (contre 35 % en 2026)", "35 % (contre 25 % en 2026)"],
    explain: "Étape intermédiaire : 40 % au 30 juin 2027, puis 45 % au 31 décembre 2027.",
  },
  {
    id: "g09", kind: "qcm", theme: T.strategie, proba: "tres", ref: "1.2, p. 6",
    q: "Quel objectif de panier moyen visez-vous pour fin 2027 ?",
    options: ["12,24 € (+2 %)", "12,50 € (+4 %)", "12,10 € (+1 %)", "13,00 € (+8 %)"],
    explain: "Départ estimé à 12,00 € ; étape à 12,10 € fin juin, 12,24 € au 31 décembre 2027.",
  },
  {
    id: "g10", kind: "oral", theme: T.strategie, proba: "tres", ref: "1.2, p. 6",
    q: "En quoi vos objectifs sont-ils SMART ?",
    points: [
      "Spécifiques : un indicateur précis par orientation (taux carte, panier moyen, livraisons/semaine, CA).",
      "Mesurables : dans Visual Store ou le cahier de livraisons.",
      "Atteignables avec nos moyens actuels (pas d'heures en plus, 1 500 € de budget).",
      "Réalistes / cohérents avec la stratégie, et Temporels : échéance fin 2027 (étapes intermédiaires).",
      "Volontairement modestes : +3 % de CA = ~150 €/jour, une douzaine de paniers.",
    ],
  },
  {
    id: "g11", kind: "qcm", theme: T.strategie, proba: "probable", ref: "1.2, p. 6",
    q: "Pourquoi la fidélisation est-elle votre priorité n°1 ?",
    options: [
      "C'est l'action la moins coûteuse et elle protège le CA face à la concurrence",
      "C'est celle qui rapporte le plus de chiffre d'affaires immédiat",
      "Elle est imposée par le gérant",
      "Elle ne demande aucune formation de l'équipe",
    ],
    explain: "Ordre : 1) fidélisation dès janvier, 2) panier moyen au printemps (affluence du midi), 3) livraison au 2nd semestre car un salarié quitte le magasin pendant la livraison.",
  },
  {
    id: "g12", kind: "oral", theme: T.strategie, proba: "tres", ref: "1.1, p. 6",
    q: "Quelles pistes avez-vous écartées, et pourquoi ?",
    points: [
      "Allonger les horaires : impossible le dimanche après 13 h pour les salariés, et déjà ouvert jusqu'à 22 h en semaine.",
      "Ajouter des rayons : impossible avec 300 m² de vente et 45,83 m² de réserve.",
      "Vente en ligne : demanderait des moyens humains et techniques qu'on n'a pas (2-3 personnes présentes en moyenne, commission des plateformes).",
      "Les orientations retenues s'appuient sur l'existant : équipe, clientèle, outils de l'enseigne.",
    ],
  },
  {
    id: "g13", kind: "qcm", theme: T.strategie, proba: "probable", ref: "1.1, p. 5",
    q: "Combien a coûté le projet « Pause Déjeuner Express & Anti-Gaspi » de septembre 2026 ?",
    options: ["30 € de dépenses réelles", "300 € de présentoirs", "1 500 €", "Rien, tout était fourni par l'enseigne"],
    explain: "Il a prouvé qu'une action de ce type peut être rentable avec très peu d'investissement : argument de capacité financière.",
  },
  {
    id: "g14", kind: "qcm", theme: T.strategie, proba: "tres", ref: "1.3, p. 7",
    q: "Comment se répartit le budget de 1 500 € prévu pour 2027 ?",
    options: [
      "600 € affichage et petit matériel de caisse, 500 € challenges, 400 € communication livraison",
      "500 € présentoirs, 500 € challenges, 500 € communication",
      "1 000 € présentoirs, 300 € challenges, 200 € flyers",
      "750 € challenges, 750 € affichage",
    ],
    explain: "Moins de 0,1 % du CA prévu, financé par le résultat du magasin et validé par le gérant. Les affiches promo et le programme de fidélité sont fournis par l'enseigne.",
  },
  {
    id: "g15", kind: "qcm", theme: T.strategie, proba: "probable", ref: "1.2, p. 7",
    q: "Quel risque avez-vous identifié pour la livraison, et quelle réponse ?",
    options: [
      "Un salarié qui livre n'est plus au magasin : livraisons regroupées sur les créneaux calmes de l'après-midi",
      "Le coût du carburant : facturation de frais de livraison",
      "Le manque de clients : publicité sur les réseaux sociaux",
      "Le vol de marchandises : livraison uniquement par le gérant",
    ],
    explain: "Les deux autres risques : essoufflement de l'équipe (rappel au briefing, challenge mensuel) et file d'attente (ouverture de la 2e caisse).",
  },
  {
    id: "g16", kind: "qcm", theme: T.strategie, proba: "probable", ref: "1.3, p. 7-8",
    q: "Quand est lancée la communication sur la livraison ?",
    options: [
      "En septembre 2027, quand la fréquentation repart",
      "En janvier 2027, avec la fidélisation",
      "En juillet 2027, pendant la baisse estivale",
      "Dès décembre 2026",
    ],
    explain: "Planning : déc. 2026 validation + présentation équipe ; janv.–mars fidélisation ; avr.–juin panier moyen ; sept. livraison ; bilans fin juin et fin décembre.",
  },

  // ───────── Prévisionnel ─────────
  {
    id: "g17", kind: "oral", theme: T.previsionnel, proba: "tres", ref: "2.2, p. 10",
    q: "Expliquez la méthode utilisée pour construire votre prévisionnel 2027.",
    points: [
      "Étape 1 : partir de la base réelle, CA 2026 estimé à 1 800 000 € (pas un ratio moyen du secteur).",
      "Étape 2 : ajouter l'effet des actions : +2 % panier moyen, +1 % fréquentation.",
      "Calcul : 12,24 € × 415 clients/jour × 365 jours = 1 854 000 €, soit +3 %.",
      "Étape 3 : répartir l'année avec des coefficients saisonniers (été bas, rentrée, pic de décembre).",
      "Adaptée à un magasin récent avec peu d'historique, et reliée aux actions de l'équipe.",
    ],
    tip: "C'est LA question de la partie 2 : sois fluide sur les trois étapes et le calcul.",
  },
  {
    id: "g18", kind: "qcm", theme: T.previsionnel, proba: "tres", ref: "2.1, p. 9",
    q: "Comment avez-vous estimé le CA 2026 à 1 800 000 € ?",
    options: [
      "À partir de 152 000 € en mai 2026 (mois représentatif) et d'environ 4 900 €/jour en moyenne",
      "À partir du compte de résultat certifié du gérant",
      "En appliquant le CA moyen au m² des Carrefour City",
      "En doublant le CA du premier semestre",
    ],
    explain: "Le magasin n'a pas deux années complètes ; je n'ai pas accès au compte de résultat détaillé, d'où des estimations explicitées.",
  },
  {
    id: "g19", kind: "qcm", theme: T.previsionnel, proba: "tres", ref: "2.2, p. 10",
    q: "Quel calcul donne le CA prévisionnel 2027 ?",
    options: [
      "12,24 € × 415 clients/jour × 365 jours ≈ 1 854 000 €",
      "12,00 € × 410 clients/jour × 365 jours ≈ 1 800 000 € + 3 %",
      "5 000 €/jour × 365 jours = 1 825 000 €",
      "152 000 € × 12 mois = 1 824 000 €",
    ],
    explain: "+2 % sur le panier (12,00 → 12,24 €) et +1 % sur la fréquentation (410 → 415 passages/jour).",
  },
  {
    id: "g20", kind: "qcm", theme: T.previsionnel, proba: "tres", ref: "2.2, p. 11",
    q: "Quel mois a le coefficient saisonnier le plus faible ?",
    options: ["Août (0,86)", "Juillet (0,89)", "Janvier (0,96)", "Juin (0,99)"],
    explain: "Départ des étudiants en juillet-août. Le plus fort : décembre (1,16), avec les fêtes.",
  },
  {
    id: "g21", kind: "qcm", theme: T.previsionnel, proba: "probable", ref: "2.2, p. 11",
    q: "Quel est le CA prévisionnel de décembre 2027 ?",
    options: ["179 600 € (coef. 1,16)", "163 700 € (coef. 1,06)", "160 600 € (coef. 1,04)", "155 900 € (coef. 1,01)"],
    explain: "1 854 000 € ÷ 12 × 1,16 ≈ 179 600 €.",
  },
  {
    id: "g22", kind: "qcm", theme: T.previsionnel, proba: "tres", ref: "2.1, p. 9",
    q: "À combien estimez-vous la masse salariale 2026 ?",
    options: ["≈ 181 000 €, soit 10 % du CA", "≈ 250 000 €, soit 14 % du CA", "≈ 88 600 €, soit 5 % du CA", "≈ 140 000 €, soit 8 % du CA"],
    explain: "3 CDI à 2 050 € brut + ~20 % de charges = 88 600 € ; 7 apprentis à ~1 100 € brut avec charges très réduites = 92 400 €. 185 000 € en 2027 (+2,2 %).",
  },
  {
    id: "g23", kind: "qcm", theme: T.previsionnel, proba: "probable", ref: "2.2, p. 11",
    q: "Comment avez-vous classé la redevance de location-gérance ?",
    options: [
      "Charge variable : 4 % du CA",
      "Charge fixe : montant forfaitaire annuel",
      "Investissement amorti sur 5 ans",
      "Elle n'apparaît pas dans le prévisionnel",
    ],
    explain: "Charges fixes : masse salariale, énergie, autres charges (+ budget actions). Charge variable : redevance de 4 %. Cette distinction permet le seuil de rentabilité.",
  },
  {
    id: "g24", kind: "qcm", theme: T.previsionnel, proba: "tres", ref: "2.3, p. 11",
    q: "Quel EBE prévoyez-vous pour 2027 ?",
    options: ["88 500 €, soit 4,8 % du CA", "82 000 €, soit 4,6 % du CA", "96 200 €, soit 5,1 % du CA", "467 200 €, soit 25,2 % du CA"],
    explain: "Marge 467 200 € − salaires 185 000 − redevance 74 200 − énergie 46 000 − autres 72 000 − actions 1 500 ≈ 88 500 € (+7,9 %). 467 200 € est la marge commerciale.",
  },
  {
    id: "g25", kind: "oral", theme: T.previsionnel, proba: "tres", ref: "2.3, p. 12",
    q: "Qu'est-ce que l'EBE et pourquoi est-il important pour votre magasin ?",
    points: [
      "Ce qui reste une fois les achats et charges de fonctionnement payés (avant amortissements, intérêts, impôts).",
      "Le gérant n'étant pas salarié, c'est sur l'EBE qu'il se rémunère et finance les investissements.",
      "82 000 € en 2026 (4,6 %) → 88 500 € en 2027 (4,8 %).",
    ],
  },
  {
    id: "g26", kind: "oral", theme: T.previsionnel, proba: "tres", ref: "2.3, p. 12",
    q: "Pourquoi un objectif de croissance de seulement +3 % ?",
    points: [
      "Concurrence forte et moins de deux ans d'historique : prudence.",
      "Un objectif atteignable motive davantage qu'un objectif hors de portée.",
      "+3 % = ~150 €/jour, soit ~12 clients de plus ou 35 centimes de plus par client.",
      "Scénario optimiste (+5 %) chiffré à part.",
    ],
  },
  {
    id: "g27", kind: "qcm", theme: T.previsionnel, proba: "probable", ref: "2.3, p. 12",
    q: "Comment justifiez-vous le passage du taux de marge de 25 % à 25,2 % ?",
    options: [
      "Baisse de la démarque du frais (-17 % en septembre) et mise en avant de la marque Carrefour",
      "Hausse générale des prix de vente",
      "Négociation des prix d'achat avec les fournisseurs",
      "Suppression des promotions de l'enseigne",
    ],
    explain: "Deux leviers déjà testés en 2026. Les produits marque Carrefour ont en général une meilleure marge pour le magasin.",
  },
  {
    id: "g28", kind: "qcm", theme: T.previsionnel, proba: "probable", ref: "2.3, p. 12",
    q: "Pourquoi la masse salariale n'augmente-t-elle que de 2,2 % ?",
    options: [
      "Pas d'embauche : seulement revalorisation des salaires et progression des apprentis",
      "Deux alternants quittent le magasin",
      "Les heures sont réduites l'été",
      "Les CDI passent à temps partiel",
    ],
    explain: "La performance doit venir des compétences de l'équipe, pas d'heures en plus.",
  },
  {
    id: "g29", kind: "qcm", theme: T.previsionnel, proba: "probable", ref: "2.3, p. 12",
    q: "Quelle hypothèse retenez-vous pour l'énergie en 2027 ?",
    options: [
      "+2,2 % (46 000 €) grâce à des gestes simples : rideaux de nuit sur les meubles froids, contrôle des températures",
      "Stable à 45 000 € grâce à un contrat bloqué",
      "+10 % (49 500 €) à cause de la hausse des tarifs",
      "-5 % grâce au remplacement des meubles froids",
    ],
    explain: "L'énergie est le 2e poste de charges (meubles réfrigérés, chambres froides).",
  },

  // ───────── Seuil & rentabilité ─────────
  {
    id: "g30", kind: "qcm", theme: T.rentabilite, proba: "tres", ref: "2.3, p. 12",
    q: "Quel est votre seuil de rentabilité 2027 ?",
    options: [
      "≈ 1 436 000 €/an, soit 3 935 €/jour",
      "≈ 1 854 000 €/an, soit 5 079 €/jour",
      "≈ 1 410 000 €/an, soit 3 860 €/jour",
      "≈ 1 218 000 €/an, soit 3 337 €/jour",
    ],
    explain: "Charges fixes 304 500 € ÷ taux de marge après redevance 21,2 % (25,2 % − 4 %) ≈ 1 436 000 €. 1 410 000 € est le seuil 2026.",
  },
  {
    id: "g31", kind: "oral", theme: T.rentabilite, proba: "tres", ref: "2.3, p. 12",
    q: "Détaillez le calcul de votre seuil de rentabilité.",
    points: [
      "Charges fixes 2027 : 185 000 + 46 000 + 72 000 + 1 500 = 304 500 €.",
      "Taux de marge sur coût variable : 25,2 % − 4 % de redevance = 21,2 % (chaque euro de CA rapporte 21,2 centimes).",
      "Seuil = 304 500 ÷ 0,212 ≈ 1 436 000 €/an, soit ≈ 3 935 €/jour.",
      "Enjeu : nos jours faibles (~4 000 €) sont à peine au-dessus du seuil.",
    ],
    tip: "Écris la formule au tableau si possible : SR = CF ÷ taux de MCV.",
  },
  {
    id: "g32", kind: "qcm", theme: T.rentabilite, proba: "tres", ref: "2.3, p. 12",
    q: "Pourquoi déduisez-vous 4 % du taux de marge pour calculer le seuil ?",
    options: [
      "La redevance de location-gérance est une charge variable de 4 % du CA",
      "C'est le taux de démarque moyen",
      "C'est la TVA sur l'alimentaire",
      "C'est la commission des cartes bancaires",
    ],
    explain: "Taux de marge sur coût variable = 25,2 % − 4 % = 21,2 %.",
  },
  {
    id: "g33", kind: "oral", theme: T.rentabilite, proba: "tres", ref: "2.3, p. 12 · Conclusion",
    q: "Qu'est-ce que le calcul du seuil a changé dans votre façon de piloter ?",
    points: [
      "Un lundi à 4 000 € n'est pas « un jour moins bon » : c'est un jour où le magasin ne gagne presque rien.",
      "Un jour à 6 000 € dégage une vraie marge.",
      "L'enjeu principal de 2027 : augmenter le CA des jours calmes.",
      "Je l'utilise aussi pour faire adhérer l'équipe (seuil de 3 935 €/jour affiché).",
    ],
  },
  {
    id: "g34", kind: "qcm", theme: T.rentabilite, proba: "tres", ref: "2.3, p. 12",
    q: "Que donne le scénario pessimiste (CA 0 %, marge 25 %) ?",
    options: ["EBE de 73 500 € (4,1 %) : le magasin reste rentable", "EBE négatif : perte de 15 000 €", "EBE de 88 500 € (4,8 %)", "EBE de 82 000 € (4,6 %)"],
    explain: "Réaliste : 88 500 € (4,8 %) ; optimiste (+5 %) : 96 200 € (5,1 %). Le budget de 1 500 € ne présente donc pas de risque financier.",
  },
  {
    id: "g35", kind: "qcm", theme: T.rentabilite, proba: "probable", ref: "2.3, p. 12",
    q: "Pourquoi avoir construit trois scénarios ?",
    options: [
      "Pour tenir compte de l'incertitude : seuls CA, marge et redevance varient, les charges fixes restent les mêmes",
      "Parce que le franchiseur l'impose",
      "Pour présenter le plus favorable à l'équipe",
      "Pour calculer trois seuils de rentabilité différents",
    ],
    explain: "Même dans le pessimiste le magasin est rentable ; l'optimiste peut apporter jusqu'à 22 700 € d'EBE supplémentaire.",
  },

  // ───────── Ratios & écarts ─────────
  {
    id: "g36", kind: "oral", theme: T.analyse, proba: "tres", ref: "3.1, p. 14",
    q: "Comment analysez-vous les performances du magasin au quotidien ?",
    points: [
      "Chaque jour : CA de la veille, passages, panier moyen (Visual Store) vs repère 5 000 €, commentés au briefing.",
      "Chaque semaine : comparaison des jours, démarque, cartes créées, ventes snacking.",
      "Chaque mois : CA réel vs prévisionnel avec le gérant + ratios de gestion.",
      "Décomposition des écarts : fréquentation vs panier moyen, pour orienter l'action.",
    ],
  },
  {
    id: "g37", kind: "qcm", theme: T.analyse, proba: "tres", ref: "3.1, p. 14",
    q: "Quelle est la productivité horaire du magasin ?",
    options: ["≈ 138 € par heure travaillée", "≈ 48 € par heure d'ouverture", "≈ 6 000 € par m²", "≈ 1 100 € par salarié"],
    explain: "152 000 € (mai 2026) ÷ 1 100 heures ≈ 138 €/h. Elle mesure l'adéquation entre les heures et l'activité.",
  },
  {
    id: "g38", kind: "qcm", theme: T.analyse, proba: "probable", ref: "3.1, p. 14",
    q: "Quel est le CA au m² de vente ?",
    options: ["≈ 6 000 € par an", "≈ 5 200 € par an", "≈ 500 € par mois", "≈ 1 800 € par an"],
    explain: "1 800 000 € ÷ 300 m² = 6 000 €/m²/an : efficacité d'une surface limitée.",
  },
  {
    id: "g39", kind: "qcm", theme: T.analyse, proba: "tres", ref: "3.1, p. 14",
    q: "Que signifie un ratio CA / seuil de 128 % en 2026 ?",
    options: [
      "Le CA peut baisser d'environ 22 % avant que le magasin soit en perte",
      "Le magasin dépasse son objectif de 28 %",
      "Le magasin réalise 28 % de marge",
      "Les charges fixes représentent 28 % du CA",
    ],
    explain: "1 800 000 / 1 410 000 ≈ 128 % ; marge de sécurité ≈ (1 800 000 − 1 410 000) / 1 800 000 ≈ 22 %.",
  },
  {
    id: "g40", kind: "oral", theme: T.analyse, proba: "tres", ref: "3.2, p. 15",
    q: "Pourquoi ciblez-vous la fréquentation des jours calmes plutôt que le panier moyen ?",
    points: [
      "Mardi type : 4 300 € contre un repère de 5 000 € (360 passages vs 417 ; 11,94 € vs 12 €).",
      "Écart de fréquentation : (360 − 417) × 12 € = −684 €.",
      "Écart de panier : (11,94 − 12) × 360 = −22 €.",
      "Quasi-totalité des 700 € d'écart = nombre de clients → action sur la fréquentation.",
    ],
    tip: "Fréquentation × panier ancien, puis écart de panier × fréquentation réelle.",
  },
  {
    id: "g41", kind: "qcm", theme: T.analyse, proba: "tres", ref: "3.2, p. 15",
    q: "Sur un mardi type à 4 300 €, quel est l'écart dû à la fréquentation ?",
    options: ["−684 €", "−22 €", "−700 €", "−57 €"],
    explain: "(360 − 417) × 12,00 € = −684 €. Le panier n'explique que −22 €.",
  },
  {
    id: "g42", kind: "qcm", theme: T.analyse, proba: "probable", ref: "3.2, p. 15",
    q: "Quel objectif du projet de septembre 2026 n'a PAS été atteint ?",
    options: [
      "Les paniers Too Good To Go : restés à 1 par jour pour un objectif de 2 à 3",
      "Le snacking : +5,5 %",
      "Le panier moyen du midi : de 8,50 € à 9,35 €",
      "Les cartes de fidélité : 43 nouvelles en un mois",
    ],
    explain: "D'où l'action corrective n°4 : passer à 2 paniers Too Good To Go par jour d'ici le 31 mars 2027.",
  },
  {
    id: "g43", kind: "qcm", theme: T.analyse, proba: "probable", ref: "3.2, p. 15",
    q: "Quel événement interne a pesé sur les résultats de 2026 ?",
    options: [
      "3 départs entre février et juillet 2026, soit 30 % de rotation du personnel",
      "La fermeture du magasin pour travaux",
      "Le changement de logiciel de caisse",
      "Le départ du gérant",
    ],
    explain: "Chaque départ a désorganisé les plannings et mobilisé un tuteur 2 semaines. Aucun départ depuis août 2026.",
  },

  // ───────── Actions correctives ─────────
  {
    id: "g44", kind: "oral", theme: T.actions, proba: "tres", ref: "3.3, p. 16",
    q: "Quelles sont vos quatre actions correctives pour 2027 ?",
    points: [
      "1. Relever les jours calmes : CA lundi/mardi/jeudi de 4 300 € à 4 400 € au 31 mars 2027.",
      "2. Carte de fidélité : 35 % → 40 % au 30 juin, puis 45 % au 31 décembre 2027.",
      "3. Panier moyen : 12,00 € → 12,24 € au 31 décembre (étape 12,10 € fin juin).",
      "4. Produits à date courte : 1 → 2 paniers Too Good To Go/jour au 31 mars 2027.",
    ],
  },
  {
    id: "g45", kind: "oral", theme: T.actions, proba: "tres", ref: "3.3, p. 16",
    q: "Comment vos actions permettent-elles d'atteindre les +54 000 € de CA ?",
    points: [
      "Jours calmes : +100 €/jour × ~156 jours ≈ 15 600 €.",
      "Panier moyen : +0,24 € × ~151 000 passages/an ≈ 36 000 €.",
      "Carte de fidélité et livraison : soutiennent la fréquentation des autres jours ≈ 2 400 €.",
      "Total ≈ 54 000 €. Too Good To Go agit surtout sur la démarque, donc la marge.",
    ],
  },
  {
    id: "g46", kind: "qcm", theme: T.actions, proba: "probable", ref: "3.4, p. 17",
    q: "Que ferez-vous si le CA des jours calmes ne progresse pas fin février ?",
    options: [
      "Tester une animation en magasin, par exemple une dégustation de produits marque Carrefour",
      "Abandonner l'action",
      "Réduire les horaires d'ouverture ces jours-là",
      "Baisser les prix de tout le magasin",
    ],
    explain: "Ajustements prévus d'avance : démonstration en caisse si le taux de cartes stagne, changement des produits de caisse si le panier ne progresse pas.",
  },
  {
    id: "g47", kind: "qcm", theme: T.actions, proba: "probable", ref: "Annexe 1, p. 20",
    q: "Quel outil utilisez-vous pour suivre vos actions correctives ?",
    options: [
      "Un tableau de bord hebdomadaire mis à jour chaque lundi : objectif, réalisé, écart, action si écart",
      "Le compte de résultat mensuel du gérant",
      "Un sondage clients trimestriel",
      "Un bilan annuel uniquement",
    ],
    explain: "Indicateurs : CA moyen lun/mar/jeu (4 400 €), part carte (40 %/45 %), panier moyen (12,24 €), paniers TGTG (2), CA de la semaine.",
  },
  {
    id: "g48", kind: "oral", theme: T.actions, proba: "tres", ref: "3.5, p. 18 · Conclusion",
    q: "Quelles sont les limites de votre analyse ?",
    points: [
      "Plusieurs chiffres sont des estimations : pas d'accès au compte de résultat détaillé (taux de marge, masse salariale, redevance, autres charges).",
      "Historique de moins de deux ans : coefficients saisonniers encore approximatifs.",
      "Premier bilan 2027 : confronter aux chiffres réels du gérant et ajuster le prévisionnel.",
    ],
    tip: "Montre que tu connais tes limites : c'est un point fort à l'oral, pas une faiblesse.",
  },
];
