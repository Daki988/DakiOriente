import type { TrackContent } from "./types";

const P0 = "Présentation & recul";
const P1 = "I · Orientations stratégiques";
const P2 = "II · Prévisionnel";
const P3 = "III · Performances & actions";

export const gestion: TrackContent = {
  track: "gestion",
  label: "Gestion",
  memoire: "Document mémoire n°1",
  title: "Contribuer aux orientations stratégiques de l'enseigne et optimiser la performance économique de l'établissement marchand",
  icon: "📊",
  tagline: "Diagnostic, orientations, prévisionnel 2027, seuil de rentabilité, écarts, actions correctives",
  parts: [P0, P1, P2, P3],

  /* ═══════════════════════════ QUESTIONS ═══════════════════════════ */
  questions: [
    // ───── Présentation & recul ─────
    {
      id: "g01", kind: "oral", part: P0, proba: "tres", ref: "Introduction, p. 3",
      q: "Présentez-nous rapidement votre établissement et votre rôle.",
      points: [
        "Carrefour City, 231 avenue de Muret à Toulouse, ouvert le 29 janvier 2025.",
        "Franchise en location-gérance ; gérant Dimitri Roussilhe, aussi mon maître d'apprentissage.",
        "300 m² de vente (345,83 m² au total), ouvert 102 h/semaine : 7h–22h du lundi au samedi, 9h–21h le dimanche.",
        "CA de 4 000 à 6 000 €/jour ; 152 000 € en mai 2026 pour 1 100 heures travaillées. Épicerie et liquides génèrent le plus de passages.",
        "10 salariés : 3 CDI (Djaya-Perle, Peyo, Ismail) + 7 alternants dont moi ; REM par délégation du gérant.",
      ],
      tip: "1 minute maximum : lieu → statut → taille → chiffres → équipe → ton rôle.",
      relance: { q: "Quelle est votre clientèle ?", a: "Riverains (courses du quotidien), étudiants des résidences du quartier, actifs qui passent avant/après le travail grâce au tramway, et clients âgés ou à mobilité réduite livrés à domicile." },
    },
    {
      id: "g02", kind: "qcm", part: P0, proba: "probable", ref: "Introduction, p. 3",
      q: "Sous quel statut le magasin est-il exploité ?",
      options: [
        "Franchise sous contrat de location-gérance",
        "Magasin intégré détenu par le groupe Carrefour",
        "Commission-affiliation, stock détenu par l'enseigne",
        "Coopérative d'indépendants",
      ],
      explain: "Le gérant exploite le fonds en location-gérance et verse une redevance au propriétaire du fonds (4 % du CA HT dans le prévisionnel). Il n'est pas salarié : il se rémunère sur l'EBE.",
      relance: { q: "Quelle conséquence sur votre compte de résultat ?", a: "La redevance est une charge variable (4 % du CA) : elle réduit le taux de marge sur coût variable à 21,2 % en 2027 (25,2 % − 4 %)." },
    },
    {
      id: "g03", kind: "oral", part: P0, proba: "tres", ref: "3.5 « Les limites de mon analyse », p. 20 · Conclusion, p. 21",
      q: "Quelles sont les limites de votre travail ?",
      points: [
        "Plusieurs chiffres sont des estimations : pas d'accès au compte de résultat détaillé (taux de marge, masse salariale, redevance, autres charges).",
        "Historique de moins de deux ans : coefficients saisonniers encore approximatifs.",
        "Premier bilan 2027 : confronter mes chiffres aux comptes réels du gérant et ajuster le prévisionnel.",
      ],
      tip: "Connaître ses limites est un point fort à l'oral : dis-le avec assurance et enchaîne sur la façon de les lever.",
      relance: { q: "Si vos estimations sont fausses, que vaut votre prévisionnel ?", a: "Les hypothèses sont explicitées une par une et les trois scénarios montrent que le magasin reste rentable même en pessimiste (EBE 73 500 €). La méthode reste valable : il suffira d'actualiser les chiffres avec le gérant." },
    },
    {
      id: "g04", kind: "oral", part: P0, proba: "tres", ref: "Conclusion, p. 21",
      q: "Qu'est-ce que ce dossier vous a appris ?",
      points: [
        "Passer d'une vision de terrain à une vision de gestion.",
        "On ne rivalise pas par la taille : on se distingue par la fidélité, le service et la valeur de chaque passage.",
        "Relier les chiffres aux gestes de l'équipe (35 centimes par client, 12 clients de plus).",
        "Le seuil de 3 935 €/jour a changé ma lecture des jours calmes : un lundi à 4 000 €, le magasin ne gagne presque rien.",
      ],
    },

    // ───── Partie I ─────
    {
      id: "g10", kind: "oral", part: P1, proba: "tres", ref: "1.1, p. 4",
      q: "Quels outils de diagnostic avez-vous utilisés et qu'en retenez-vous ?",
      points: [
        "PESTEL (environnement) en ne gardant que les facteurs qui nous concernent directement.",
        "SWOT (interne + concurrentiel) : forces, faiblesses, opportunités, menaces.",
        "Comparaison des 3 concurrents directs : Vival, Auchan de proximité, Carrefour City Déodat.",
        "Conclusion : on ne gagne pas sur la taille de l'assortiment, mais sur la fidélité, le service et la valeur de chaque passage en caisse.",
      ],
      relance: { q: "Pourquoi ne pas avoir fait un PESTEL complet ?", a: "Par choix : je n'ai retenu que les facteurs qui ont un effet concret sur le magasin, pour que le diagnostic débouche directement sur des actions." },
    },
    {
      id: "g11", kind: "qcm", part: P1, proba: "probable", ref: "1.1 PESTEL, p. 4",
      q: "Quel facteur « politique » du PESTEL limite l'activité du magasin ?",
      options: [
        "Les salariés ne peuvent travailler le dimanche que jusqu'à 13 h ; l'après-midi est tenu par le gérant",
        "Le magasin doit fermer à 12 h le dimanche",
        "Seuls les CDI peuvent travailler le dimanche",
        "L'ouverture du dimanche est interdite aux franchisés",
      ],
      explain: "C'est aussi pour cette raison que l'allongement des horaires a été écarté des propositions stratégiques (p. 6).",
    },
    {
      id: "g12", kind: "qcm", part: P1, proba: "probable", ref: "1.1 PESTEL, p. 4",
      q: "Quel facteur « économique » avez-vous retenu dans le PESTEL ?",
      options: [
        "L'inflation pousse les clients à comparer les prix et à se tourner vers la marque Carrefour",
        "La hausse des loyers commerciaux à Toulouse",
        "La baisse du pouvoir d'achat des étudiants l'été",
        "La concurrence des drives",
      ],
      explain: "C'est aussi une opportunité : l'inflation rend la carte de fidélité et la marque Carrefour (meilleure marge pour le magasin) plus attractives.",
    },
    {
      id: "g13", kind: "qcm", part: P1, proba: "tres", ref: "1.1 SWOT, p. 4",
      q: "Laquelle de ces propositions est une MENACE de votre SWOT ?",
      options: [
        "La baisse de fréquentation l'été quand les étudiants partent",
        "La forte affluence du midi (11h30–14h)",
        "Les matchs du Fenix Toulouse",
        "Les clients âgés intéressés par la livraison",
      ],
      explain: "Les trois autres sont des opportunités. Menaces : concurrence proche (Vival, Auchan de proximité, Carrefour City Déodat), hausse des charges (énergie pour le froid), baisse estivale.",
      relance: { q: "Et vos forces ?", a: "Large amplitude horaire (102 h/semaine), emplacement sur l'avenue de Muret desservi par le tramway, équipe jeune et polyvalente, accueil apprécié." },
    },
    {
      id: "g14", kind: "qcm", part: P1, proba: "tres", ref: "1.1, p. 5",
      q: "Quel concurrent considérez-vous comme le plus important, et pourquoi ?",
      options: [
        "Le Carrefour City Déodat : mêmes prix, promotions et carte ; on ne se différencie que par le service",
        "Le Vival : il a la plus grande surface du secteur",
        "L'Auchan de proximité : il propose déjà la livraison",
        "Aucun : la clientèle étudiante est captive",
      ],
      explain: "Face à la même enseigne, le client choisit selon la distance, la qualité du service et l'habitude. D'où des orientations centrées d'abord sur la fidélité et le service.",
      relance: { q: "Comment vous différenciez-vous du Vival ?", a: "Assortiment plus large, offre repas du midi et carte de fidélité Carrefour. Face à Auchan (image prix) : marque Carrefour pour les clients attentifs aux prix, et qualité de l'accueil." },
    },
    {
      id: "g15", kind: "oral", part: P1, proba: "tres", ref: "1.1, p. 5",
      q: "Quelles sont vos trois orientations stratégiques ?",
      points: [
        "1. Fidéliser la clientèle du quartier : carte de fidélité Carrefour en réflexe en caisse + mise en avant de la marque Carrefour.",
        "2. Augmenter le panier moyen : offre repas du midi + vente additionnelle en caisse (plus de valeur par passage sans avoir besoin de plus de clients).",
        "3. Développer la livraison à domicile auprès des personnes âgées ou à mobilité réduite, que les concurrents ne servent pas de la même façon.",
      ],
      tip: "Annonce-les dans l'ordre des priorités avec un verbe d'action, puis justifie en une phrase chacune.",
      relance: { q: "Pourquoi pas une 4e orientation sur les prix ?", a: "Les prix et promotions sont fixés par l'enseigne et identiques chez le concurrent le plus proche : ce n'est pas un levier pour le magasin." },
    },
    {
      id: "g16", kind: "oral", part: P1, proba: "tres", ref: "1.1 « Pourquoi ces orientations sont pertinentes », p. 5-6",
      q: "En quoi vos orientations sont-elles pertinentes ?",
      points: [
        "Vision à moyen terme : fin 2028, devenir le commerce de proximité de référence de l'avenue de Muret (installer en 2027, mesurer sur 2028 ; le magasin aura 4 ans).",
        "Missions : rendre service, être disponible, prix accessibles grâce à la marque Carrefour.",
        "Capacité financière : peu d'investissement ; le projet de septembre 2026 a été rentable avec 30 € ; budget 2027 de 1 500 €.",
        "Acceptabilité : l'enseigne (stratégie nationale), le gérant (rentabilité), les clients (avantages), l'équipe (pas d'heures en plus).",
        "Opportunité : l'inflation et la rentrée universitaire.",
      ],
      tip: "Retiens les 5 critères : Vision · Missions · Capacité financière · Acceptabilité · Opportunité.",
    },
    {
      id: "g17", kind: "oral", part: P1, proba: "tres", ref: "1.1 « Les pistes que j'ai écartées », p. 6",
      q: "Quelles pistes avez-vous écartées, et pourquoi ?",
      points: [
        "Allonger les horaires : impossible le dimanche après 13 h pour les salariés, et déjà ouvert jusqu'à 22 h en semaine.",
        "Ajouter des rayons : difficile avec 300 m² de vente déjà entièrement occupés.",
        "Vente en ligne : il faudrait une personne dédiée alors que 2 à 3 personnes seulement sont présentes en même temps, et une plateforme prélèverait une commission sur une marge déjà faible. À revoir si l'équipe s'agrandit.",
      ],
      relance: { q: "Le drive ou le click & collect ne seraient-ils pas l'avenir ?", a: "Peut-être à terme, mais avec 1 100 heures/mois pour 102 h d'ouverture, préparer des commandes dégarnirait la caisse. Je préfère m'appuyer sur ce qui existe : l'équipe, la clientèle et les outils de l'enseigne." },
    },
    {
      id: "g18", kind: "qcm", part: P1, proba: "tres", ref: "1.2, p. 6",
      q: "Quel est l'objectif fin 2027 pour la part des passages avec la carte Carrefour ?",
      options: ["45 % (contre 35 % estimés en 2026)", "40 % (contre 30 % en 2026)", "50 % (contre 35 % en 2026)", "35 % (contre 25 % en 2026)"],
      explain: "Avec une étape intermédiaire à 40 % au 30 juin 2027 (action corrective n°2).",
    },
    {
      id: "g19", kind: "qcm", part: P1, proba: "tres", ref: "1.2, p. 6",
      q: "Quels sont les objectifs chiffrés fin 2027 ?",
      options: [
        "Carte 45 % · panier 12,24 € · 15 livraisons/semaine · CA 1 854 000 €",
        "Carte 40 % · panier 12,50 € · 20 livraisons/semaine · CA 1 900 000 €",
        "Carte 45 % · panier 12,00 € · 10 livraisons/semaine · CA 1 800 000 €",
        "Carte 50 % · panier 12,24 € · 15 livraisons/semaine · CA 2 000 000 €",
      ],
      explain: "Départs 2026 : 35 %, 12,00 €, environ 10 livraisons/semaine, 1 800 000 €. Hausse de 3 % du CA = environ 150 €/jour.",
    },
    {
      id: "g20", kind: "oral", part: P1, proba: "tres", ref: "1.2, p. 6",
      q: "En quoi vos objectifs sont-ils SMART ?",
      points: [
        "Spécifiques : un indicateur précis par orientation.",
        "Mesurables dans Visual Store ou le cahier de livraisons.",
        "Atteignables avec nos moyens actuels (dix salariés, 1 100 h/mois, 1 500 € de budget).",
        "Réalistes et cohérents avec la stratégie de l'enseigne.",
        "Temporels : échéance fin 2027.",
        "Volontairement modestes : +3 % = ~150 €/jour, soit une douzaine de paniers ou quelques dizaines de centimes par client.",
      ],
    },
    {
      id: "g21", kind: "qcm", part: P1, proba: "probable", ref: "1.2 « L'ordre des priorités », p. 7",
      q: "Pourquoi la livraison est-elle seulement votre priorité n°3 ?",
      options: [
        "Elle demande plus d'organisation : un salarié quitte le magasin pendant la livraison",
        "Elle n'intéresse pas les clients",
        "Elle coûte la plus grande partie du budget",
        "Le gérant y est opposé",
      ],
      explain: "Ordre : 1) fidélisation dès janvier (la moins coûteuse, protège le CA), 2) panier moyen renforcé au printemps (affluence du midi), 3) livraison au 2nd semestre, une fois les deux premières installées.",
    },
    {
      id: "g22", kind: "qcm", part: P1, proba: "tres", ref: "1.3 « Le détail du budget », p. 8",
      q: "Comment se répartit votre budget de 1 500 € pour 2027 ?",
      options: [
        "350 € présentoirs · 250 € affichage · 500 € challenges · 300 € communication livraison · 100 € sacs isothermes",
        "600 € affichage · 500 € challenges · 400 € communication livraison",
        "500 € présentoirs · 500 € challenges · 500 € flyers",
        "1 000 € présentoirs · 300 € challenges · 200 € sacs",
      ],
      explain: "Moins de 0,1 % du CA prévu, financé par le résultat du magasin et validé par le gérant. Les affiches de promotions et le programme de fidélité sont fournis gratuitement par l'enseigne.",
      relance: { q: "Pourquoi 500 € de challenges ?", a: "Environ 40 € de récompense collective par challenge mensuel : c'est ce qui a fonctionné en septembre 2026 pour la carte de fidélité." },
    },
    {
      id: "g23", kind: "oral", part: P1, proba: "probable", ref: "1.3, p. 7",
      q: "Quelles ressources mobilisez-vous ?",
      points: [
        "Financières : 1 500 € pour 2027, validés par le gérant.",
        "Matérielles : présentoirs d'impulsion, meuble snacking réorganisé, bacs anti-gaspi, chariot et sacs isothermes.",
        "Humaines : moi comme cheffe de projet ; un référent CDI par orientation (Djaya-Perle fidélisation, Peyo panier, Ismail livraison) ; les alternants en caisse et en rayon ; le gérant valide.",
        "Techniques : Visual Store, terminaux portables, application Carrefour, Too Good To Go.",
      ],
    },
    {
      id: "g24", kind: "qcm", part: P1, proba: "tres", ref: "1.3, p. 7",
      q: "Qui sont les référents de chaque orientation ?",
      options: [
        "Djaya-Perle : fidélisation · Peyo : panier moyen · Ismail : livraison",
        "Peyo : fidélisation · Ismail : panier moyen · Djaya-Perle : livraison",
        "Ismail : fidélisation · Djaya-Perle : panier moyen · Peyo : livraison",
        "Le gérant est référent des trois orientations",
      ],
      explain: "Un référent CDI par orientation : ils sont les plus présents, suivent leur indicateur au quotidien et me signalent les difficultés.",
    },
    {
      id: "g25", kind: "oral", part: P1, proba: "tres", ref: "1.2 « Les risques identifiés », p. 7",
      q: "Quels risques avez-vous identifiés et comment les maîtrisez-vous ?",
      points: [
        "Essoufflement de l'équipe (carte oubliée lors des pics en septembre 2026) → rappel régulier au briefing + challenge renouvelé chaque mois.",
        "File d'attente qui s'allonge (carte + produit complémentaire) → règle d'ouverture de la 2e caisse prioritaire.",
        "Livraison : un salarié qui livre n'est plus au magasin → livraisons regroupées sur les créneaux calmes de l'après-midi.",
      ],
    },
    {
      id: "g26", kind: "qcm", part: P1, proba: "probable", ref: "1.3 « Le planning de mise en œuvre », p. 8",
      q: "Quel est le bon planning de mise en œuvre ?",
      options: [
        "Déc. 2026 validation · janv.–mars fidélisation · avr.–juin panier moyen · sept. livraison · bilans fin juin et fin déc.",
        "Janv. livraison · avr. fidélisation · sept. panier moyen · bilan annuel",
        "Déc. 2026 lancement des 3 orientations en même temps · bilan fin 2027",
        "Janv.–juin livraison · juil.–déc. fidélisation et panier",
      ],
      explain: "La livraison démarre en septembre, quand la fréquentation repart après l'été.",
    },
    {
      id: "g27", kind: "oral", part: P1, proba: "tres", ref: "1.4, p. 8-9",
      q: "Comment allez-vous faire adhérer l'équipe à vos orientations ?",
      points: [
        "Réunion en décembre 2026 sur deux créneaux pour toucher les alternants présents à des jours différents.",
        "J'y présente : le constat (jours à 4 000 € et à 6 000 €), le sens (fidélité et panier protègent le magasin et nos emplois), ce qui change pour chacun, le rôle des référents.",
        "Préparer au changement : repères simples (1 à 2 cartes/personne/jour), fiches mémo, rappel au briefing, challenge matin contre après-midi.",
        "Résultats affichés en réserve et publiés sur WhatsApp ; démonstration en caisse et binôme pour les moins à l'aise.",
      ],
      tip: "Structure : informer → donner du sens → former → animer → mesurer.",
      relance: { q: "Comment saurez-vous que l'équipe adhère ?", a: "Trois signaux : la carte est proposée sans rappel de ma part, les alternants posent des questions ou proposent des idées, les indicateurs progressent. Sinon : entretien individuel pour comprendre le frein." },
    },
    {
      id: "g28", kind: "qcm", part: P1, proba: "probable", ref: "1.4, p. 9",
      q: "Quelle réticence attendez-vous de l'équipe, et quelle réponse ?",
      options: [
        "Peur de ralentir la file d'attente → phrase courte + ouverture de la 2e caisse dès que la file s'allonge",
        "Peur de travailler plus → heures supplémentaires payées",
        "Refus de la carte → suppression de l'objectif carte",
        "Manque de temps → confier la carte au gérant",
      ],
      explain: "Une phrase courte à utiliser au moment de l'encaissement rend la proposition rapide.",
    },

    // ───── Partie II ─────
    {
      id: "g30", kind: "oral", part: P2, proba: "tres", ref: "2.2, p. 11",
      q: "Expliquez la méthode utilisée pour construire votre prévisionnel 2027.",
      points: [
        "Étape 1 : partir de la base réelle, CA 2026 estimé à 1 800 000 € HT, plutôt qu'un ratio moyen du secteur (clientèle étudiante, concurrence proche, forte variabilité).",
        "Étape 2 : ajouter l'effet des actions : +2 % de panier, +1 % de fréquentation → 12,24 € × 415 clients/jour × 365 jours = 1 854 000 € (+3 %).",
        "Étape 3 : répartir l'année avec des coefficients saisonniers (1 = mois moyen) : baisse estivale, reprise à la rentrée, pic de décembre.",
        "Avantage : le prévisionnel est relié aux actions de l'équipe ; si elles ne marchent pas, l'écart apparaît dans le suivi mensuel.",
      ],
      tip: "C'est LA question de la partie II : sois fluide sur les trois étapes et donne le calcul.",
      relance: { q: "Pourquoi ne pas avoir pris un ratio sectoriel ?", a: "Notre magasin a ses propres particularités : clientèle étudiante, concurrence très proche, forte variabilité journalière. Un ratio moyen ne les reflète pas." },
    },
    {
      id: "g31", kind: "qcm", part: P2, proba: "tres", ref: "2.1, p. 10",
      q: "Comment avez-vous estimé le CA 2026 à 1 800 000 € HT ?",
      options: [
        "À partir de 152 000 € HT en mai 2026 (mois représentatif) et d'environ 4 900 € HT/jour en moyenne",
        "À partir du compte de résultat du gérant",
        "En appliquant le CA moyen au m² des Carrefour City",
        "En doublant le CA du premier semestre",
      ],
      explain: "Le magasin n'a pas deux années complètes d'activité. Tous les montants de CA sont exprimés HT.",
    },
    {
      id: "g32", kind: "qcm", part: P2, proba: "tres", ref: "2.2, p. 11",
      q: "Quel calcul donne le CA prévisionnel 2027 ?",
      options: [
        "12,24 € × 415 clients/jour × 365 jours ≈ 1 854 000 €",
        "12,00 € × 410 clients/jour × 365 jours ≈ 1 800 000 €",
        "5 000 €/jour × 365 jours = 1 825 000 €",
        "152 000 € × 12 mois = 1 824 000 €",
      ],
      explain: "+2 % sur le panier (12,00 → 12,24 €) et +1 % sur la fréquentation (≈ 410 → 415 passages/jour), soit +3 % de CA.",
    },
    {
      id: "g33", kind: "qcm", part: P2, proba: "tres", ref: "2.2, p. 12",
      q: "Quel mois a le coefficient saisonnier le plus faible ?",
      options: ["Août (0,86)", "Juillet (0,89)", "Janvier (0,96)", "Juin (0,99)"],
      explain: "Départ des étudiants en juillet-août. Le plus fort : décembre (1,16), avec les fêtes. La somme des 12 coefficients vaut 12.",
      relance: { q: "Comment avez-vous fixé ces coefficients ?", a: "À partir de ce que nous observons au magasin : baisse estivale, reprise à la rentrée, pic de décembre. Avec moins de deux ans d'historique, ils restent approximatifs (limite assumée)." },
    },
    {
      id: "g34", kind: "qcm", part: P2, proba: "probable", ref: "2.2, p. 12",
      q: "Quel est le CA prévisionnel de décembre 2027 ?",
      options: ["179 600 € (coef. 1,16)", "163 700 € (coef. 1,06)", "160 600 € (coef. 1,04)", "154 500 € (coef. 1,00)"],
      explain: "1 854 000 € ÷ 12 = 154 500 € pour un mois moyen ; × 1,16 ≈ 179 600 €, soit 5 794 €/jour.",
    },
    {
      id: "g35", kind: "qcm", part: P2, proba: "tres", ref: "2.1, p. 10",
      q: "À combien estimez-vous la masse salariale 2026 ?",
      options: ["≈ 181 000 €, soit 10 % du CA", "≈ 250 000 €, soit 14 % du CA", "≈ 88 600 €, soit 5 % du CA", "≈ 140 000 €, soit 8 % du CA"],
      explain: "3 CDI à 2 050 € brut + ~20 % de charges (après réductions sur les bas salaires) = 88 600 € ; 7 apprentis à 1 100 € brut avec charges très réduites = 92 400 €. 185 000 € en 2027 (+2,2 %).",
    },
    {
      id: "g36", kind: "qcm", part: P2, proba: "tres", ref: "2.2 « Les charges », p. 12",
      q: "Comment avez-vous classé les charges ?",
      options: [
        "Fixes : masse salariale, énergie, autres charges · Variable : redevance de 4 % du CA",
        "Fixes : redevance · Variables : salaires et énergie",
        "Toutes les charges sont variables",
        "Fixes : achats de marchandises · Variables : salaires",
      ],
      explain: "Cette distinction permet de calculer le seuil de rentabilité. Le budget des actions (1 500 €) s'ajoute aux charges fixes en 2027.",
    },
    {
      id: "g37", kind: "qcm", part: P2, proba: "tres", ref: "2.3, p. 12",
      q: "Quel EBE prévoyez-vous pour 2027 ?",
      options: ["88 500 €, soit 4,8 % du CA", "82 000 €, soit 4,6 % du CA", "96 200 €, soit 5,1 % du CA", "467 200 €, soit 25,2 % du CA"],
      explain: "Marge 467 200 € − salaires 185 000 − redevance 74 200 − énergie 46 000 − autres 72 000 − actions 1 500 ≈ 88 500 € (+7,9 %). 467 200 € est la marge commerciale, pas l'EBE.",
    },
    {
      id: "g38", kind: "oral", part: P2, proba: "tres", ref: "2.3, p. 13",
      q: "Qu'est-ce que l'EBE et pourquoi est-il important pour votre magasin ?",
      points: [
        "Ce qui reste au magasin une fois les achats et les charges de fonctionnement payés.",
        "Le gérant n'étant pas salarié, c'est sur l'EBE qu'il se rémunère et qu'il finance les investissements.",
        "82 000 € (4,6 % du CA) en 2026 → 88 500 € (4,8 %) en 2027, soit +7,9 %.",
      ],
      relance: { q: "Pourquoi l'EBE progresse-t-il plus vite que le CA (+7,9 % contre +3 %) ?", a: "Effet de levier des charges fixes : elles augmentent moins vite que la marge (+3,8 % grâce au taux de 25,2 %). Chaque euro de CA en plus rapporte 21,2 centimes une fois la redevance déduite." },
    },
    {
      id: "g39", kind: "oral", part: P2, proba: "tres", ref: "2.3 « Les choix et leur justification », p. 13",
      q: "Justifiez les choix faits dans votre compte de résultat prévisionnel.",
      points: [
        "Croissance prudente de 3 % : concurrence forte, moins de 2 ans d'historique ; un objectif atteignable motive davantage.",
        "Taux de marge de 25 % à 25,2 % : baisse de la démarque du frais (-17 % en septembre) et mise en avant de la marque Carrefour.",
        "Pas d'embauche : masse salariale +2,2 % (revalorisations et progression des apprentis).",
        "Budget d'actions de 1 500 € (< 0,1 % du CA) pour un gain attendu de 54 000 € de CA.",
        "Énergie +2,2 % grâce aux rideaux de nuit sur les meubles froids et au contrôle des températures.",
      ],
    },
    {
      id: "g40", kind: "qcm", part: P2, proba: "tres", ref: "2.3 « Le seuil de rentabilité », p. 13",
      q: "Quel est votre seuil de rentabilité 2027 ?",
      options: [
        "≈ 1 436 000 €/an, soit 3 935 €/jour",
        "≈ 1 854 000 €/an, soit 5 079 €/jour",
        "≈ 1 410 000 €/an, soit 3 863 €/jour",
        "≈ 1 218 000 €/an, soit 3 337 €/jour",
      ],
      explain: "Charges fixes 304 500 € ÷ taux de marge sur coût variable 21,2 % (25,2 % − 4 %) ≈ 1 436 000 €, ÷ 365 ≈ 3 935 €/jour. 1 410 000 € est le seuil 2026.",
      relance: { q: "Et si le taux de marge restait à 25 % ?", a: "Le taux de MCV tomberait à 21 % : 304 500 ÷ 0,21 ≈ 1 450 000 €, soit environ 3 973 €/jour. Le seuil monte : d'où l'importance de la démarque et de la marque Carrefour." },
    },
    {
      id: "g41", kind: "oral", part: P2, proba: "tres", ref: "2.3, p. 13",
      q: "Détaillez le calcul de votre seuil de rentabilité.",
      points: [
        "Charges fixes 2027 : 185 000 + 46 000 + 72 000 + 1 500 = 304 500 €.",
        "Taux de marge sur coût variable : 25,2 % − 4 % de redevance = 21,2 % (chaque euro de CA rapporte 21,2 centimes).",
        "SR = 304 500 ÷ 0,212 ≈ 1 436 000 €/an, soit ≈ 3 935 €/jour.",
        "Nos jours faibles (~4 000 €) sont à peine au-dessus : l'enjeu de 2027 est le CA des jours calmes.",
      ],
      tip: "SR = Charges fixes ÷ Taux de marge sur coût variable.",
    },
    {
      id: "g42", kind: "qcm", part: P2, proba: "tres", ref: "2.3 « Trois scénarios », p. 13",
      q: "Que donne le scénario pessimiste (CA stable, marge 25 %) ?",
      options: ["EBE 73 500 € (4,1 %) : le magasin reste rentable", "Perte d'environ 15 000 €", "EBE 88 500 € (4,8 %)", "EBE 82 000 € (4,6 %)"],
      explain: "Réaliste (+3 %) : 88 500 € (4,8 %) ; optimiste (+5 %) : 96 200 € (5,1 %), soit jusqu'à 22 700 € d'EBE de plus que le pessimiste. Seuls CA, marge et redevance varient.",
    },
    {
      id: "g43", kind: "oral", part: P2, proba: "tres", ref: "2.4, p. 14-15",
      q: "Comment présenterez-vous le prévisionnel à l'équipe ?",
      points: [
        "Pas le compte de résultat complet : il relève du gérant et contient des informations confidentielles (salaires).",
        "Les chiffres sur lesquels l'équipe agit : objectif ~5 000 €/jour (objectif du mois affiché en réserve), seuil de 3 935 €/jour, panier 12,24 € et carte 45 %.",
        "À la réunion de décembre 2026, avec un graphique du CA mois par mois comparé au seuil mensuel moyen (≈ 120 k€) : juillet et août en rouge.",
        "Traduction en gestes : « 150 € de plus par jour = 12 clients de plus ou 35 centimes de plus par panier ».",
        "Arguments : sécurité (emplois), reconnaissance (briefing, challenges), preuve (+5,5 % snacking, 43 cartes en septembre). Comparaison mensuelle sur WhatsApp.",
      ],
    },
    {
      id: "g44", kind: "oral", part: P2, proba: "probable", ref: "2.4 « Les questions que j'anticipe », p. 15",
      q: "Un salarié vous demande : « Qu'est-ce qu'on y gagne ? » puis « On va devoir travailler plus ? ». Que répondez-vous ?",
      points: [
        "« Qu'est-ce qu'on y gagne ? » → les récompenses collectives du budget challenges et la stabilité du magasin (donc des emplois).",
        "« Travailler plus ? » → non : le prévisionnel ne prévoit aucune heure supplémentaire, les objectifs reposent sur des gestes en caisse.",
        "« Objectif trop élevé ? » → je montre le calcul : 35 centimes de plus par client, c'est un produit complémentaire de temps en temps.",
      ],
      tip: "Le jury peut jouer le salarié : reste calme et réponds avec le chiffre concret.",
    },

    // ───── Partie III ─────
    {
      id: "g50", kind: "oral", part: P3, proba: "tres", ref: "3.1, p. 16",
      q: "Comment analysez-vous les performances du magasin ?",
      points: [
        "Chaque jour : dans Visual Store, CA de la veille, passages, panier moyen, comparés au repère de 5 000 €/jour et commentés au briefing.",
        "Chaque semaine : comparaison des jours, démarque, cartes créées, ventes du snacking.",
        "Chaque mois : avec le gérant, CA réalisé contre prévisionnel et ratios de gestion.",
        "Décomposition des écarts : fréquentation contre panier moyen, pour orienter l'action.",
      ],
    },
    {
      id: "g51", kind: "qcm", part: P3, proba: "tres", ref: "3.1, p. 16",
      q: "Quelle est la productivité horaire du magasin ?",
      options: ["≈ 138 € de CA par heure travaillée", "≈ 48 € par heure d'ouverture", "≈ 6 000 € par m²", "≈ 1 100 € par salarié"],
      explain: "152 000 € (mai 2026) ÷ 1 100 heures ≈ 138 €/h. Elle mesure l'adéquation entre les heures et l'activité.",
    },
    {
      id: "g52", kind: "qcm", part: P3, proba: "probable", ref: "3.1, p. 16",
      q: "Quel est le CA au m² de vente ?",
      options: ["≈ 6 000 € par an", "≈ 5 200 € par an", "≈ 500 € par mois", "≈ 1 800 € par an"],
      explain: "1 800 000 € ÷ 300 m² = 6 000 €/m²/an : efficacité d'une surface limitée à 300 m².",
    },
    {
      id: "g53", kind: "qcm", part: P3, proba: "tres", ref: "3.1, p. 16",
      q: "Que signifie un ratio CA 2026 / seuil 2026 de 128 % ?",
      options: [
        "Le CA peut baisser d'environ 22 % avant que le magasin soit en perte",
        "Le magasin dépasse son objectif de 28 %",
        "Le magasin réalise 28 % de marge",
        "Les charges fixes représentent 28 % du CA",
      ],
      explain: "1 800 000 / 1 410 000 ≈ 128 %. Seuil 2026 : charges fixes 296 000 € ÷ 21 % (25 % − 4 %) ≈ 1 410 000 €. Marge de sécurité ≈ 390 000 / 1 800 000 ≈ 22 %.",
    },
    {
      id: "g54", kind: "oral", part: P3, proba: "tres", ref: "3.2, p. 17",
      q: "Pourquoi ciblez-vous la fréquentation des jours calmes plutôt que le panier moyen ?",
      points: [
        "Mardi type : 4 300 € contre un repère de 5 000 € (360 passages contre 417 ; 11,94 € contre 12 €).",
        "Écart de fréquentation : (360 − 417) × 12 € = −684 €.",
        "Écart de panier : (11,94 − 12) × 360 = −22 €.",
        "La quasi-totalité des 700 € d'écart vient du nombre de clients : le problème n'est pas ce qu'ils achètent mais combien viennent.",
      ],
      tip: "Fréquentation : écart × panier de référence. Panier : écart × fréquentation réelle.",
      relance: { q: "Quelles actions pour la fréquentation, alors ?", a: "Promotions de l'enseigne et marque Carrefour mises en avant ces jours-là, livraison proposée aux clients âgés (disponibles en semaine), offre midi pour les actifs." },
    },
    {
      id: "g55", kind: "qcm", part: P3, proba: "tres", ref: "3.2, p. 17",
      q: "Sur un mardi type à 4 300 €, quel est l'écart dû à la fréquentation ?",
      options: ["−684 €", "−22 €", "−700 €", "−57 €"],
      explain: "(360 − 417) × 12,00 € = −684 €. Le panier n'explique que −22 €. Total ≈ −700 €.",
    },
    {
      id: "g56", kind: "qcm", part: P3, proba: "probable", ref: "3.2, p. 17",
      q: "Quels sont vos jours forts ?",
      options: [
        "Mercredi, vendredi, samedi et dimanche matin (5 500 à 6 000 €)",
        "Lundi, mardi et jeudi (4 000 à 4 500 €)",
        "Uniquement le samedi",
        "Tous les jours sauf le dimanche",
      ],
      explain: "Les jours calmes (lundi, mardi, jeudi) descendent vers 4 000–4 500 €, juste au-dessus du seuil. Moyenne 2026 : ~4 900 €/jour, sous le repère de 5 000 €.",
    },
    {
      id: "g57", kind: "qcm", part: P3, proba: "tres", ref: "3.2, p. 17",
      q: "Quel objectif du projet de septembre 2026 n'a PAS été atteint ?",
      options: [
        "Les paniers Too Good To Go : restés à 1 par jour pour un objectif de 2 à 3",
        "Le snacking : +5,5 %",
        "Le panier moyen du midi : de 8,50 € à 9,35 €",
        "Les cartes de fidélité : 43 nouvelles en un mois",
      ],
      explain: "D'où l'action corrective n°4 : passer à 2 paniers Too Good To Go par jour d'ici le 31 mars 2027. La démarque du frais a quand même baissé de 17 %.",
    },
    {
      id: "g58", kind: "oral", part: P3, proba: "probable", ref: "3.2, p. 17-18",
      q: "Quels événements internes et externes ont influencé vos résultats ?",
      points: [
        "Internes : ouverture récente (< 2 ans, habitudes pas installées) ; rotation du personnel de 30 % (3 départs de février à juillet 2026, plannings désorganisés, tuteur mobilisé 2 semaines) ; projet de septembre réussi.",
        "Externes : calendrier universitaire (baisse en juillet-août), matchs du Fenix Toulouse (pics boissons et apéritif), inflation (comparaison avec Vival et Auchan).",
        "À venir : hausse de l'énergie, évolution de l'offre des concurrents (je visite régulièrement leurs magasins).",
      ],
    },
    {
      id: "g59", kind: "oral", part: P3, proba: "tres", ref: "3.3, p. 18",
      q: "Quelles sont vos quatre actions correctives pour 2027 ?",
      points: [
        "1. Relever les jours calmes : CA lundi/mardi/jeudi de 4 300 € à 4 400 € au 31 mars 2027.",
        "2. Carte de fidélité : 35 % → 40 % au 30 juin, puis 45 % au 31 décembre 2027.",
        "3. Panier moyen : 12,00 € → 12,24 € au 31 décembre 2027 (étape 12,10 € fin juin).",
        "4. Produits à date courte : 1 → 2 paniers Too Good To Go/jour au 31 mars 2027.",
      ],
      tip: "Chaque action répond à un problème identifié : jours calmes, fidélité face à la concurrence, valeur du passage, objectif non atteint en septembre.",
    },
    {
      id: "g60", kind: "oral", part: P3, proba: "tres", ref: "3.3 « L'effet attendu sur le CA », p. 18",
      q: "Comment vos actions permettent-elles d'atteindre les +54 000 € de CA ?",
      points: [
        "Jours calmes : +100 €/jour × ~156 jours (lundis, mardis, jeudis) ≈ 15 600 €.",
        "Panier moyen : +0,24 € × ~151 000 passages/an ≈ 36 000 €.",
        "Livraison : +5 livraisons/semaine × 17 semaines (sept.–déc.) × 28 € = 2 380 € ≈ 2 400 €.",
        "Total ≈ 54 000 €. La carte de fidélité n'est pas chiffrée à part (déjà dans la fréquentation et le panier) ; Too Good To Go agit sur la démarque, donc sur la marge.",
      ],
    },
    {
      id: "g61", kind: "oral", part: P3, proba: "probable", ref: "3.4, p. 19",
      q: "Quels leviers d'action mobilisez-vous pour chaque action corrective ?",
      points: [
        "Jours calmes : promotions de l'enseigne et marque Carrefour ces jours-là, communication livraison auprès des clients âgés, offre midi pour les actifs.",
        "Carte : proposée à chaque client avec une phrase courte, inscription sur l'application quand la file est calme, challenge mensuel matin contre après-midi.",
        "Panier : zone de caisse réorganisée avec des produits d'impulsion, suggestion d'un produit complémentaire, offre midi (+0,85 € en septembre 2026).",
        "Date courte : offre Too Good To Go affichée en caisse, mentionnée aux clients du soir, paniers préparés plus tôt l'après-midi.",
      ],
    },
    {
      id: "g62", kind: "qcm", part: P3, proba: "probable", ref: "3.4 « Les ajustements prévus en cas d'écart », p. 19",
      q: "Que ferez-vous si le CA des jours calmes ne progresse pas fin février ?",
      options: [
        "Tester une animation en magasin, par exemple une dégustation de produits marque Carrefour",
        "Abandonner l'action",
        "Réduire les horaires d'ouverture ces jours-là",
        "Baisser les prix de tout le magasin",
      ],
      explain: "Autres ajustements prévus : si la carte stagne, démonstration en caisse + analyse des créneaux où elle est moins proposée ; si le panier stagne, changer les produits de la zone de caisse.",
    },
    {
      id: "g63", kind: "qcm", part: P3, proba: "tres", ref: "3.5, p. 19-20",
      q: "Qui est responsable de quelle action corrective ?",
      options: [
        "Jours calmes : moi avec le gérant · Carte : Djaya-Perle · Panier : Peyo · Date courte : équipe du rayon frais",
        "Jours calmes : Ismail · Carte : Peyo · Panier : Djaya-Perle · Date courte : le gérant",
        "Tout est piloté par le gérant",
        "Jours calmes : Djaya-Perle · Carte : moi · Panier : Ismail · Date courte : Peyo",
      ],
      explain: "Ressources : jours calmes (promotions, 300 € de communication et 100 € de sacs isothermes), carte (application, 500 € de challenges), panier (350 € de présentoirs, 250 € d'affichage, formation), date courte (application, affichette).",
    },
    {
      id: "g64", kind: "oral", part: P3, proba: "tres", ref: "3.5 « Le suivi et les points d'étape », p. 20 · Annexe 1",
      q: "Comment suivez-vous vos actions correctives ?",
      points: [
        "Chaque lundi : tableau de bord (Annexe 1) avec indicateur, objectif, réalisé, écart et action si écart.",
        "Chaque fin de mois : bilan avec le gérant et ajustements.",
        "Indicateur sous l'objectif 2 semaines de suite : recherche de la cause avec l'équipe avant de modifier l'action.",
        "Fin juin 2027 : bilan complet pour poursuivre, renforcer ou abandonner chaque action.",
        "Rôles : le gérant valide ; les 3 référents suivent leur indicateur ; je centralise et anime.",
      ],
    },
    {
      id: "g65", kind: "oral", part: P3, proba: "probable", ref: "3.5 « La communication des résultats », p. 20",
      q: "Comment communiquez-vous les résultats, surtout quand un indicateur recule ?",
      points: [
        "Chaque lundi au briefing : les 4 indicateurs, en commençant par ce qui a progressé.",
        "Tableau affiché en réserve et publié sur WhatsApp.",
        "Objectif intermédiaire atteint (ex. 40 % de cartes fin juin) : félicitations et récompense avec le budget challenges.",
        "Indicateur qui recule : je cherche la cause avec les personnes concernées, sans chercher de coupable.",
      ],
    },
  ],

  /* ═══════════════════════════ FICHES ═══════════════════════════ */
  fiches: [
    {
      part: P0, title: "Présentation du magasin", pages: "p. 3 · p. 20-21",
      essentiel: "Un Carrefour City récent, en location-gérance, très concurrencé, qui doit se distinguer par la fidélité, le service et la valeur de chaque passage.",
      sections: [
        { h: "Le magasin", items: ["231 avenue de Muret, Toulouse — ouvert le 29 janvier 2025", "Franchise en location-gérance, gérant Dimitri Roussilhe (maître d'apprentissage)", "300 m² de vente, 345,83 m² au total", "102 h d'ouverture/semaine : 7h–22h (lun–sam), 9h–21h (dim)"] },
        { h: "Clientèle et concurrence", items: ["Riverains, étudiants des résidences, actifs (tramway), clients âgés livrés", "Concurrents : Vival, Auchan de proximité, Carrefour City Déodat"] },
        { h: "Équipe et rôle", items: ["10 salariés : 3 CDI (Djaya-Perle, Peyo, Ismail) + 7 alternants", "Moi : REM par délégation du gérant"] },
        { h: "Fil rouge du dossier", items: ["I. Proposer des orientations adaptées au quartier", "II. Établir le prévisionnel 2027", "III. Analyser les performances et définir des actions correctives", "Chiffres manquants reconstitués à partir des données de caisse, hypothèses précisées"] },
      ],
      chiffres: [
        { label: "CA journalier", value: "4 000 – 6 000 €" },
        { label: "CA mai 2026", value: "152 000 € HT" },
        { label: "Heures/mois", value: "1 100 h" },
        { label: "CA 2026 estimé", value: "1 800 000 € HT" },
      ],
      pieges: ["Ne pas confondre surface de vente (300 m²) et surface totale (345,83 m²).", "Le gérant n'est pas salarié : il se rémunère sur l'EBE."],
    },
    {
      part: P1, title: "Partie I — Orientations stratégiques", pages: "p. 4-9",
      essentiel: "Diagnostic (PESTEL, SWOT, concurrents) → 3 orientations : fidéliser, augmenter le panier, développer la livraison. Objectifs SMART, budget de 1 500 €, adhésion de l'équipe.",
      sections: [
        { h: "Diagnostic", items: ["PESTEL limité aux facteurs qui nous touchent : dimanche 13 h, inflation, quartier mixte, Visual Store, anti-gaspi, HACCP/apprentis", "SWOT : forces (amplitude, tramway, équipe, accueil) / faiblesses (300 m², plannings, CA variable)", "Concurrent clé : Carrefour City Déodat (mêmes prix) → différenciation par le service"] },
        { h: "3 orientations (par priorité)", items: ["1. Fidéliser : carte Carrefour en réflexe + marque Carrefour (dès janvier)", "2. Panier moyen : offre midi + vente additionnelle (printemps)", "3. Livraison aux personnes âgées / à mobilité réduite (2nd semestre)"] },
        { h: "Pertinence (5 critères)", items: ["Vision fin 2028 : référence de l'avenue de Muret", "Missions : service, disponibilité, prix accessibles", "Capacité financière : 1 500 €, projet de septembre rentable avec 30 €", "Acceptabilité : enseigne, gérant, clients, équipe", "Opportunité : inflation, rentrée universitaire"] },
        { h: "Pistes écartées", items: ["Allonger les horaires (dimanche, déjà 22 h)", "Nouveaux rayons (surface occupée)", "Vente en ligne (pas de personne dédiée, commission des plateformes)"] },
        { h: "Ressources et adhésion", items: ["Référents CDI : Djaya-Perle (fidélité), Peyo (panier), Ismail (livraison)", "Risques : essoufflement, file d'attente, absence pendant la livraison", "Réunion de décembre 2026 sur 2 créneaux ; repères simples, fiches mémo, challenges, binômes", "3 signaux d'adhésion : carte proposée sans rappel, questions/idées, indicateurs en hausse"] },
      ],
      chiffres: [
        { label: "Carte fidélité", value: "35 % → 45 %" },
        { label: "Panier moyen", value: "12,00 → 12,24 €" },
        { label: "Livraisons/sem.", value: "10 → 15" },
        { label: "CA", value: "1,80 → 1,854 M€ (+3 %)" },
        { label: "Budget 2027", value: "1 500 € (< 0,1 % du CA)" },
      ],
      pieges: ["Budget de ce rapport : 350 présentoirs + 250 affichage + 500 challenges + 300 communication + 100 sacs isothermes.", "Ne pas présenter la vente en ligne comme impossible : elle est écartée « pour l'instant »."],
    },
    {
      part: P2, title: "Partie II — Prévisionnel 2027", pages: "p. 10-15",
      essentiel: "Base réelle 2026 + effet des actions + saisonnalité = 1 854 000 € de CA. EBE 88 500 € (4,8 %). Seuil 3 935 €/jour : les jours calmes sont l'enjeu.",
      sections: [
        { h: "Données utilisées", items: ["CA ~4 900 €/jour, 152 000 € en mai 2026 → 1 800 000 € HT en 2026", "Productivité ≈ 138 €/h ; ~410 passages/jour à 12 €", "Snacking : 2 800 € → 2 954 € sur 4 semaines", "Saisonnalité, jours de pic, matchs du Fenix, inflation"] },
        { h: "Méthode en 3 étapes", items: ["1. Base réelle 2026 (pas de ratio sectoriel)", "2. Effet des actions : 12,24 € × 415 × 365 = 1 854 000 €", "3. Coefficients saisonniers (août 0,86 → décembre 1,16)"] },
        { h: "Compte de résultat 2026 → 2027", items: ["Marge commerciale 450 000 → 467 200 € (25 % → 25,2 %)", "Masse salariale 181 000 → 185 000 € · Redevance 72 000 → 74 200 €", "Énergie 45 000 → 46 000 € · Autres 70 000 → 72 000 € · Actions 0 → 1 500 €", "EBE 82 000 € (4,6 %) → 88 500 € (4,8 %), soit +7,9 %"] },
        { h: "Seuil et scénarios", items: ["CF 304 500 € ÷ 21,2 % ≈ 1 436 000 €/an ≈ 3 935 €/jour", "Pessimiste 73 500 € · réaliste 88 500 € · optimiste 96 200 €"] },
        { h: "Présenter à l'équipe", items: ["Pas le compte de résultat complet (confidentiel)", "Objectif ~5 000 €/jour, seuil 3 935 €, panier 12,24 €, carte 45 %", "Graphique mensuel avec le seuil (≈ 120 k€/mois), juillet-août en rouge", "« 150 €/jour = 12 clients ou 35 centimes par panier »"] },
      ],
      chiffres: [
        { label: "CA 2027", value: "1 854 000 €" },
        { label: "EBE 2027", value: "88 500 € (4,8 %)" },
        { label: "Seuil 2027", value: "≈ 1 436 000 € · 3 935 €/j" },
        { label: "Taux de MCV", value: "21,2 %" },
        { label: "Charges fixes", value: "304 500 €" },
      ],
      pieges: ["Ne pas confondre marge commerciale (467 200 €) et EBE (88 500 €).", "Le seuil 2026 (1 410 000 €) n'est pas celui de 2027 (1 436 000 €).", "Le budget d'actions de 1 500 € est inclus dans les charges fixes 2027."],
    },
    {
      part: P3, title: "Partie III — Performances & actions correctives", pages: "p. 16-22",
      essentiel: "Analyse jour/semaine/mois. L'écart des jours calmes vient de la fréquentation (−684 € sur −700 €). 4 actions SMART qui rapportent +54 000 €, suivies chaque lundi.",
      sections: [
        { h: "Méthode d'analyse", items: ["Jour : CA, passages, panier vs 5 000 € (briefing)", "Semaine : jours, démarque, cartes, snacking", "Mois : réalisé vs prévisionnel + ratios avec le gérant", "Décomposition : fréquentation vs panier moyen"] },
        { h: "Ratios 2026", items: ["CA/m² : 6 000 €/an", "Productivité : 138 €/h", "Masse salariale/CA : 10 %", "EBE/CA : 4,6 %", "CA/seuil : 128 % → marge de sécurité ≈ 22 %"] },
        { h: "Résultats et événements", items: ["Moyenne 4 900 €/jour ; jours forts 5 500–6 000 €, jours calmes 4 000–4 500 €", "Mardi type : −684 € fréquentation, −22 € panier", "Septembre : 4 objectifs atteints, Too Good To Go non (1/jour)", "Rotation de 30 % (3 départs fév.–juil.), aucun depuis août"] },
        { h: "4 actions correctives", items: ["Jours calmes 4 300 → 4 400 € (31/03/2027)", "Carte 35 → 40 % (30/06) → 45 % (31/12)", "Panier 12,00 → 12,10 (juin) → 12,24 € (31/12)", "Too Good To Go 1 → 2 paniers/jour (31/03)"] },
        { h: "Effet sur le CA (+54 000 €)", items: ["Jours calmes : 100 € × 156 jours ≈ 15 600 €", "Panier : 0,24 € × 151 000 passages ≈ 36 000 €", "Livraison : 5 × 17 semaines × 28 € ≈ 2 400 €"] },
        { h: "Suivi", items: ["Tableau de bord chaque lundi (Annexe 1)", "Bilan mensuel avec le gérant ; 2 semaines sous l'objectif → recherche de cause", "Bilan complet fin juin 2027", "Communication : progrès d'abord, sans chercher de coupable"] },
      ],
      chiffres: [
        { label: "Écart fréquentation", value: "−684 €" },
        { label: "Écart panier", value: "−22 €" },
        { label: "Marge de sécurité", value: "≈ 22 %" },
        { label: "Gain attendu", value: "+54 000 € de CA" },
      ],
      pieges: ["Écart de fréquentation × panier de référence (12 €) ; écart de panier × fréquentation réelle (360).", "Too Good To Go agit sur la démarque (la marge), pas sur le CA."],
    },
  ],

  /* ═══════════════════════════ NOTIONS ═══════════════════════════ */
  notions: [
    { term: "PESTEL", def: "Analyse de l'environnement externe selon 6 facteurs : Politique, Économique, Social, Technologique, Environnemental, Légal.", inReport: "Limité aux facteurs qui touchent directement le magasin : dimanche jusqu'à 13 h, inflation, quartier mixte, Visual Store, anti-gaspi, HACCP.", ref: "p. 4" },
    { term: "SWOT", def: "Matrice croisant le diagnostic interne (Forces, Faiblesses) et externe (Opportunités, Menaces).", inReport: "Forces : amplitude, tramway, équipe, accueil. Faiblesses : 300 m², plannings, CA variable. Opportunités : carte, midi, livraison, Fenix. Menaces : concurrence, énergie, été.", ref: "p. 4" },
    { term: "Objectif SMART", def: "Objectif Spécifique, Mesurable, Atteignable, Réaliste et Temporellement défini.", inReport: "Carte 45 %, panier 12,24 €, 15 livraisons/semaine, CA 1 854 000 € fin 2027, mesurés dans Visual Store.", ref: "p. 6" },
    { term: "Panier moyen", def: "Montant moyen dépensé par passage en caisse.", formula: "Panier moyen = CA ÷ nombre de passages", inReport: "12,00 € en 2026 (estimé), objectif 12,24 € (+2 %) fin 2027.", ref: "p. 6, 10" },
    { term: "Coefficient saisonnier", def: "Rapport entre l'activité d'un mois et celle d'un mois moyen (1 = mois moyen). La somme des 12 coefficients vaut 12.", formula: "CA du mois = CA annuel ÷ 12 × coefficient", inReport: "Août 0,86 (le plus bas) ; décembre 1,16 (le plus haut).", ref: "p. 11-12" },
    { term: "Marge commerciale", def: "Différence entre le CA HT et le coût d'achat des marchandises vendues.", formula: "Marge = CA × taux de marge", inReport: "450 000 € (25 %) en 2026 → 467 200 € (25,2 %) en 2027.", ref: "p. 12" },
    { term: "Charges fixes / variables", def: "Les charges fixes ne dépendent pas du CA ; les charges variables évoluent avec lui.", inReport: "Fixes : masse salariale, énergie, autres charges (+ budget d'actions). Variable : redevance de 4 % du CA.", ref: "p. 12" },
    { term: "EBE", def: "Excédent brut d'exploitation : ce qui reste après les achats et les charges de fonctionnement, avant amortissements, frais financiers et impôts.", formula: "EBE = marge commerciale − charges de fonctionnement", inReport: "82 000 € (4,6 %) → 88 500 € (4,8 %). Le gérant, non salarié, se rémunère dessus.", ref: "p. 12-13" },
    { term: "Taux de marge sur coût variable", def: "Part de chaque euro de CA qui reste pour couvrir les charges fixes.", formula: "Taux de MCV = taux de marge − charges variables en % du CA", inReport: "25,2 % − 4 % = 21,2 % en 2027 (21 % en 2026).", ref: "p. 13" },
    { term: "Seuil de rentabilité", def: "CA à partir duquel le magasin ne perd plus d'argent (résultat nul).", formula: "SR = charges fixes ÷ taux de MCV", inReport: "304 500 ÷ 0,212 ≈ 1 436 000 €/an ≈ 3 935 €/jour en 2027.", ref: "p. 13" },
    { term: "Marge de sécurité", def: "Baisse de CA possible avant d'atteindre le seuil de rentabilité.", formula: "(CA − SR) ÷ CA", inReport: "(1 800 000 − 1 410 000) ÷ 1 800 000 ≈ 22 % en 2026 (indice CA/SR = 128 %).", ref: "p. 16" },
    { term: "Productivité horaire", def: "CA réalisé par heure travaillée.", formula: "CA ÷ heures travaillées", inReport: "152 000 € ÷ 1 100 h ≈ 138 €/h (mai 2026).", ref: "p. 10, 16" },
    { term: "Décomposition des écarts", def: "Séparer un écart de CA en effet fréquentation et effet panier moyen.", formula: "Écart fréquentation = (clients réels − prévus) × panier prévu · Écart panier = (panier réel − prévu) × clients réels", inReport: "Mardi type : −684 € (fréquentation) et −22 € (panier).", ref: "p. 17" },
    { term: "Démarque", def: "Perte de marchandises : casse, vol, produits périmés, erreurs.", inReport: "Démarque du frais −17 % lors du projet de septembre 2026 ; levier du passage de 25 % à 25,2 % de marge.", ref: "p. 13, 17" },
    { term: "Location-gérance", def: "Le propriétaire du fonds de commerce le confie à un gérant qui l'exploite à ses risques contre une redevance.", inReport: "Redevance retenue : 4 % du CA HT, versée au propriétaire du fonds.", ref: "p. 3, 10" },
  ],

  /* ═══════════════════════════ FLASHCARDS ═══════════════════════════ */
  flashcards: [
    { front: "Date d'ouverture du magasin", back: "29 janvier 2025", ref: "p. 3" },
    { front: "Heures d'ouverture par semaine", back: "102 h (7h–22h lun–sam, 9h–21h dim)", ref: "p. 3" },
    { front: "CA de mai 2026 et heures travaillées", back: "152 000 € HT pour 1 100 heures", ref: "p. 3, 10" },
    { front: "CA 2026 estimé", back: "1 800 000 € HT (≈ 4 900 €/jour)", ref: "p. 10" },
    { front: "CA prévisionnel 2027", back: "1 854 000 € (+3 %) = 12,24 € × 415 × 365", ref: "p. 11" },
    { front: "Objectif carte de fidélité", back: "35 % → 40 % (30/06/2027) → 45 % (31/12/2027)", ref: "p. 6, 18" },
    { front: "Objectif panier moyen", back: "12,00 € → 12,10 € (juin) → 12,24 € (décembre 2027)", ref: "p. 6, 18" },
    { front: "Objectif livraisons", back: "≈ 10 → 15 livraisons par semaine", ref: "p. 6" },
    { front: "Budget des actions 2027", back: "1 500 € : 350 présentoirs, 250 affichage, 500 challenges, 300 com. livraison, 100 sacs isothermes", ref: "p. 8" },
    { front: "Masse salariale 2026 → 2027", back: "181 000 € (10 % du CA) → 185 000 € (+2,2 %)", ref: "p. 10, 12" },
    { front: "Taux de marge 2026 → 2027", back: "25 % → 25,2 %", ref: "p. 11-12" },
    { front: "EBE 2026 → 2027", back: "82 000 € (4,6 %) → 88 500 € (4,8 %), +7,9 %", ref: "p. 12" },
    { front: "Charges fixes 2027", back: "304 500 € (185 000 + 46 000 + 72 000 + 1 500)", ref: "p. 13" },
    { front: "Seuil de rentabilité 2027", back: "≈ 1 436 000 €/an, soit 3 935 €/jour", ref: "p. 13" },
    { front: "Seuil de rentabilité 2026", back: "≈ 1 410 000 € (296 000 ÷ 21 %)", ref: "p. 16" },
    { front: "Les 3 scénarios (EBE)", back: "Pessimiste 73 500 € (4,1 %) · Réaliste 88 500 € (4,8 %) · Optimiste 96 200 € (5,1 %)", ref: "p. 13" },
    { front: "Coefficient le plus bas / le plus haut", back: "Août 0,86 / Décembre 1,16", ref: "p. 12" },
    { front: "Productivité horaire", back: "≈ 138 € par heure travaillée", ref: "p. 16" },
    { front: "Mardi type", back: "360 passages × 11,94 € = 4 300 € (repère : 417 × 12 € = 5 000 €)", ref: "p. 17" },
    { front: "Résultats du projet de septembre 2026", back: "+5,5 % snacking · panier midi 8,50 → 9,35 € · démarque frais −17 % · 43 cartes · TGTG 1/jour (non atteint)", ref: "p. 17" },
    { front: "Taux de rotation du personnel", back: "30 % : 3 départs de février à juillet 2026", ref: "p. 17" },
    { front: "Décomposition des +54 000 €", back: "15 600 € (jours calmes) + 36 000 € (panier) + 2 400 € (livraison)", ref: "p. 18" },
    { front: "Référents des orientations", back: "Djaya-Perle : fidélisation · Peyo : panier · Ismail : livraison", ref: "p. 7" },
  ],

  /* ═══════════════════════════ CALCULS ═══════════════════════════ */
  calculs: [
    {
      title: "CA prévisionnel 2027", ref: "2.2, p. 11",
      enonce: "Panier moyen visé : 12,24 €. Fréquentation visée : 415 passages par jour. Magasin ouvert 365 jours. Quel CA annuel prévisionnel ?",
      answer: 1854000, unit: "€", tolerance: 2000,
      steps: ["CA = panier × passages/jour × jours", "12,24 × 415 = 5 079,60 € par jour", "5 079,60 × 365 ≈ 1 854 054 € → arrondi à 1 854 000 €", "Soit +3 % par rapport à 1 800 000 €"],
    },
    {
      title: "CA d'un mois avec coefficient", ref: "2.2, p. 12",
      enonce: "CA annuel 2027 : 1 854 000 €. Coefficient saisonnier de décembre : 1,16. Quel CA prévisionnel pour décembre ?",
      answer: 179400, unit: "€", tolerance: 400,
      steps: ["Mois moyen = 1 854 000 ÷ 12 = 154 500 €", "Décembre = 154 500 × 1,16 = 179 220 €", "Le rapport affiche 179 600 € (coefficients arrondis à 2 décimales) : toute réponse entre 179 000 et 179 800 € est acceptée"],
    },
    {
      title: "Taux de marge sur coût variable 2027", ref: "2.3, p. 13",
      enonce: "Taux de marge commerciale 2027 : 25,2 %. Redevance de location-gérance : 4 % du CA. Quel taux de marge sur coût variable (en %) ?",
      answer: 21.2, unit: "%", tolerance: 0.05,
      steps: ["La redevance est la seule charge variable", "25,2 % − 4 % = 21,2 %", "Chaque euro de CA rapporte 21,2 centimes pour couvrir les charges fixes"],
    },
    {
      title: "Seuil de rentabilité annuel 2027", ref: "2.3, p. 13",
      enonce: "Charges fixes 2027 : 304 500 €. Taux de marge sur coût variable : 21,2 %. Quel seuil de rentabilité annuel ?",
      answer: 1436000, unit: "€", tolerance: 2000,
      steps: ["SR = charges fixes ÷ taux de MCV", "304 500 ÷ 0,212 ≈ 1 436 321 €", "Soit environ 1 436 000 € par an"],
    },
    {
      title: "Seuil de rentabilité par jour", ref: "2.3, p. 13",
      enonce: "Seuil de rentabilité annuel 2027 : 1 436 000 €. Combien de CA par jour (365 jours) ?",
      answer: 3935, unit: "€/jour", tolerance: 5,
      steps: ["1 436 000 ÷ 365 ≈ 3 934 €", "Le rapport retient 3 935 €/jour", "Nos jours calmes (~4 000 €) sont à peine au-dessus"],
    },
    {
      title: "EBE 2027", ref: "2.3, p. 12",
      enonce: "Marge commerciale 467 200 € ; masse salariale 185 000 € ; redevance 74 200 € ; énergie 46 000 € ; autres charges 72 000 € ; budget d'actions 1 500 €. Quel EBE ?",
      answer: 88500, unit: "€", tolerance: 100,
      steps: ["Total des charges : 185 000 + 74 200 + 46 000 + 72 000 + 1 500 = 378 700 €", "EBE = 467 200 − 378 700 = 88 500 €", "EBE/CA = 88 500 ÷ 1 854 000 ≈ 4,8 %"],
    },
    {
      title: "Écart dû à la fréquentation", ref: "3.2, p. 17",
      enonce: "Repère : 417 passages à 12,00 €. Mardi type : 360 passages à 11,94 €. Quel est l'écart dû à la fréquentation (en €, avec le signe) ?",
      answer: -684, unit: "€", tolerance: 1,
      steps: ["Écart fréquentation = (passages réels − repère) × panier de référence", "(360 − 417) × 12,00 = −57 × 12 = −684 €", "Écart panier = (11,94 − 12,00) × 360 = −22 € → total ≈ −700 €"],
    },
    {
      title: "Productivité horaire", ref: "3.1, p. 16",
      enonce: "En mai 2026, le magasin a réalisé 152 000 € de CA pour 1 100 heures travaillées. Quelle productivité horaire ?",
      answer: 138, unit: "€/h", tolerance: 1,
      steps: ["Productivité = CA ÷ heures travaillées", "152 000 ÷ 1 100 ≈ 138,2 €/h"],
    },
    {
      title: "Effet du panier moyen sur le CA", ref: "3.3, p. 18",
      enonce: "Hausse du panier moyen de 0,24 € sur environ 151 000 passages par an. Quel CA supplémentaire ?",
      answer: 36240, unit: "€", tolerance: 300,
      steps: ["0,24 × 151 000 = 36 240 €", "Le rapport arrondit à ≈ 36 000 €", "+ 15 600 € (jours calmes) + 2 400 € (livraison) = 54 000 €"],
    },
    {
      title: "Effet de la livraison", ref: "3.3, p. 18",
      enonce: "+5 livraisons par semaine pendant 17 semaines (septembre à décembre), panier livré estimé à 28 €. Quel CA supplémentaire ?",
      answer: 2380, unit: "€", tolerance: 5,
      steps: ["5 × 17 = 85 livraisons", "85 × 28 = 2 380 €, soit ≈ 2 400 €"],
    },
  ],

  /* ═══════════════════════════ PITCH ═══════════════════════════ */
  pitch: [
    { label: "Accroche et présentation", seconds: 45, content: ["Bonjour, je suis Viorica, alternante en Bachelor MCO, REM par délégation au Carrefour City du 231 avenue de Muret à Toulouse.", "Magasin ouvert le 29 janvier 2025, en location-gérance, 300 m², 102 h d'ouverture par semaine, 10 salariés dont 7 alternants.", "Annonce la problématique : comment un petit magasin très concurrencé peut-il améliorer sa performance économique ?"] },
    { label: "Partie I — Diagnostic et orientations", seconds: 90, content: ["PESTEL et SWOT, 3 concurrents dont le Carrefour City Déodat aux mêmes prix.", "Idée clé : on ne gagne pas sur la taille mais sur la fidélité, le service et la valeur de chaque passage.", "3 orientations par priorité : fidéliser (45 %), panier moyen (12,24 €), livraison (15/semaine).", "Budget de 1 500 €, référents CDI, adhésion via la réunion de décembre et les challenges."] },
    { label: "Partie II — Prévisionnel", seconds: 90, content: ["Méthode en 3 étapes : base réelle 2026, effet des actions, coefficients saisonniers → 1 854 000 €.", "EBE 88 500 € (4,8 %), +7,9 %.", "Seuil de 3 935 €/jour : les jours calmes à 4 000 € sont l'enjeu.", "3 scénarios : rentable même en pessimiste (73 500 €)."] },
    { label: "Partie III — Analyse et actions", seconds: 90, content: ["Analyse jour / semaine / mois et ratios (128 % du seuil, 138 €/h).", "Mardi type : −684 € de fréquentation sur −700 € → je cible la fréquentation des jours calmes.", "4 actions SMART qui rapportent +54 000 €, suivies chaque lundi avec le tableau de bord."] },
    { label: "Conclusion", seconds: 30, content: ["Je suis passée d'une vision de terrain à une vision de gestion.", "Limites assumées : estimations à confronter aux comptes réels du gérant en 2027.", "Ouverture : c'est cette capacité à analyser, prévoir et ajuster que je veux développer pour diriger un magasin."] },
  ],
};
