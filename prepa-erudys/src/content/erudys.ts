import type { TrackContent } from "./types";

const P0 = "Présentation & recul";
const P1 = "I · Corex International";
const P2 = "II · Pôle Handling & stage";
const P3 = "III · Méthode & concepts";
const P4 = "IV · Résultats & suggestions";

export const erudys: TrackContent = {
  track: "erudys",
  label: "Rapport de stage",
  memoire: "Licence pro · Gestion logistique et transport",
  title: "Équipements et performance des entreprises d'assistance au sol des avions : cas de Corex International",
  icon: "✈️",
  tagline: "Corex International, Pôle Handling, diagnostic, Ishikawa, hypothèses, indicateurs, suggestions",
  parts: [P0, P1, P2, P3, P4],

  /* ═══════════════════════════ QUESTIONS ═══════════════════════════ */
  questions: [
    // ───── Présentation & recul ─────
    {
      id: "e01", kind: "oral", part: P0, proba: "tres", ref: "Introduction, p. 1-2",
      q: "Présentez votre sujet et la problématique de votre rapport.",
      points: [
        "Thème : « Équipements et performance des entreprises d'assistance au sol des avions : cas de Corex International ».",
        "Contexte : la croissance du transport aérien intensifie et complexifie l'assistance au sol, maillon essentiel de la chaîne logistique aérienne.",
        "La performance dépend des compétences humaines mais aussi de la disponibilité et du bon fonctionnement des engins (tracteurs, tapis à bagages, groupes électrogènes…).",
        "Problématique : quel est l'impact des défaillances des engins sur la qualité des services d'assistance au sol de Corex International ?",
      ],
      tip: "Annonce le thème, le contexte en deux phrases, puis la problématique mot pour mot.",
      relance: { q: "Pourquoi avoir choisi ce thème ?", a: "Pendant le stage, j'ai observé de près les difficultés liées aux défaillances des engins et leurs conséquences sur les opérations. Le thème permet de montrer le lien étroit entre la maintenance des équipements et la performance opérationnelle." },
    },
    {
      id: "e02", kind: "oral", part: P0, proba: "tres", ref: "Introduction, p. 2",
      q: "Quelles sont vos hypothèses et vos objectifs ?",
      points: [
        "Hypothèse 1 : les défaillances des équipements influencent la performance opérationnelle des entreprises d'assistance au sol.",
        "Hypothèse 2 : ces entreprises disposent des ressources nécessaires pour juguler les défaillances des équipements.",
        "Objectif général : analyser l'impact des défaillances des engins sur la qualité des services d'assistance au sol de Corex International.",
        "Objectifs spécifiques : identifier les types de défaillances, déterminer leurs causes, évaluer leurs conséquences, proposer des suggestions pour améliorer la fiabilité.",
      ],
      tip: "Retiens les 4 verbes des objectifs spécifiques : identifier, déterminer, évaluer, proposer.",
    },
    {
      id: "e03", kind: "qcm", part: P0, proba: "tres", ref: "Introduction, p. 1",
      q: "Quelle est la problématique de votre rapport ?",
      options: [
        "Quel est l'impact des défaillances des engins sur la qualité des services d'assistance au sol de Corex International ?",
        "Comment Corex International peut-il augmenter son chiffre d'affaires ?",
        "Faut-il renouveler tout le parc d'engins de Corex International ?",
        "Comment réduire les effectifs du Pôle Handling & Logistique ?",
      ],
      explain: "Elle relie les défaillances des engins (cause) à la qualité des services (effet), dans le cas précis de Corex International.",
    },
    {
      id: "e04", kind: "qcm", part: P0, proba: "probable", ref: "Introduction, p. 2",
      q: "Comment votre rapport est-il structuré ?",
      options: [
        "Deux parties de deux chapitres : environnement et stage (ch. I-II), puis équipements et performance (ch. III-IV)",
        "Trois parties : historique, analyse financière, recommandations",
        "Une seule partie de quatre chapitres sur la maintenance",
        "Deux parties : théorie générale puis bibliographie commentée",
      ],
      explain: "Partie 1 : Ch. I présentation de Corex, Ch. II Pôle Handling et tâches. Partie 2 : Ch. III techniques d'investigation et concepts, Ch. IV résultats et suggestions.",
    },
    {
      id: "e05", kind: "oral", part: P0, proba: "tres", ref: "Conclusion générale, p. 40",
      q: "Quelles sont les limites de votre étude ?",
      points: [
        "Démarche qualitative : l'étude ne s'appuie pas sur des données chiffrées (taux de disponibilité, temps d'immobilisation…).",
        "Durée du stage de trois mois, qui limite l'étendue des observations.",
        "Le diagramme d'Ishikawa recense les causes sans les hiérarchiser.",
        "Prolongements possibles : étude quantitative du coût des pannes et de la disponibilité du parc, analyse de l'organisation de la maintenance, impact de la qualité de service sur la satisfaction des compagnies.",
      ],
      tip: "Assume tes limites avec calme, puis enchaîne sur ce qui permettrait de les lever : c'est très apprécié du jury.",
      relance: { q: "Sans chiffres, comment pouvez-vous affirmer que l'hypothèse 1 est confirmée ?", a: "Elle est confirmée sur le plan qualitatif : la recherche documentaire, les entretiens et l'observation convergent (opérations ralenties, autre matériel mobilisé, délais affectés). Les indicateurs du tableau 4 permettraient justement de la confirmer de façon chiffrée." },
    },
    {
      id: "e06", kind: "oral", part: P0, proba: "probable", ref: "Ch. II, 2.2.2, p. 19 · Conclusion",
      q: "Qu'est-ce que ce stage vous a apporté ?",
      points: [
        "Mettre en pratique les connaissances de la formation et comprendre une entreprise d'assistance au sol et de fret aérien.",
        "La supervision du vol NAM et le pointage des colis ont développé ma capacité d'observation, ma rigueur et ma compréhension des opérations logistiques.",
        "Découvrir concrètement les équipements de manutention et comprendre l'importance de leur disponibilité pour la performance.",
      ],
    },

    // ───── Partie I : Corex International ─────
    {
      id: "e10", kind: "oral", part: P1, proba: "tres", ref: "Ch. I, section 1, p. 4-7",
      q: "Présentez-nous Corex International.",
      points: [
        "Entreprise gabonaise spécialisée dans le traitement au sol du fret aérien, créée en juin 2009 par M. Jacob Cabinda (ancien d'Air Gabon et de Gabon Airlines).",
        "Créée pour préserver les emplois et le savoir-faire gabonais après la disparition de compagnies nationales.",
        "Société Anonyme au capital de 10 000 000 FCFA, dirigée depuis juillet 2015 par M. Didier Kouakoua.",
        "Plus de 70 collaborateurs sur les plateformes aéroportuaires de Libreville et de Port-Gentil.",
        "Valeurs : l'humain, la responsabilité et la performance durable.",
      ],
      tip: "Une minute : date et fondateur → raison d'être → statut → taille → implantation → valeurs.",
    },
    {
      id: "e11", kind: "qcm", part: P1, proba: "tres", ref: "Ch. I, 1.1, p. 4",
      q: "Quand et par qui Corex International a-t-elle été créée ?",
      options: [
        "En juin 2009, par M. Jacob Cabinda, ancien des équipes dirigeantes d'Air Gabon et de Gabon Airlines",
        "En juillet 2015, par M. Didier Kouakoua",
        "En décembre 2013, par l'État gabonais",
        "En 2004, par l'ANAC",
      ],
      explain: "Juillet 2015 est la date où M. Didier Kouakoua prend la direction de Corex International ; décembre 2013, la création de COREX France.",
    },
    {
      id: "e12", kind: "qcm", part: P1, proba: "probable", ref: "Ch. I, 1.1, p. 5 · Figure 2",
      q: "Que s'est-il passé en décembre 2013 ?",
      options: [
        "M. Jacob Cabinda crée COREX France, société de droit français qui représente Corex International en Europe",
        "Corex International s'installe à Port-Gentil",
        "Corex International signe avec Sky Mali et Air Sénégal",
        "M. Didier Kouakoua devient Directeur Général",
      ],
      explain: "Frise : 2009 création · 2009-2018 développement du portefeuille clients · déc. 2013 COREX France · juil. 2015 Didier Kouakoua à la direction · 2021 Sky Mali et Air Sénégal.",
    },
    {
      id: "e13", kind: "qcm", part: P1, proba: "probable", ref: "Ch. I, 1.1, p. 4",
      q: "Laquelle de ces compagnies n'est arrivée qu'à partir de 2021 ?",
      options: ["Air Sénégal", "Lufthansa", "Ethiopian Airlines", "Turkish Airlines"],
      explain: "Entre 2009 et 2018 : Lufthansa, RwandAir, Air Côte d'Ivoire, DHL, Royal Air Maroc, Kenya Airways, South African Airways, Ethiopian Airlines, Turkish Airlines. À partir de 2021 : Sky Mali et Air Sénégal.",
    },
    {
      id: "e14", kind: "qcm", part: P1, proba: "tres", ref: "Ch. I, 1.2, p. 6 · Tableau 1",
      q: "Quels sont la forme juridique et le capital de Corex International ?",
      options: [
        "Société Anonyme (S.A.) au capital de 10 000 000 FCFA",
        "SARL au capital de 1 000 000 FCFA",
        "Société Anonyme au capital de 100 000 000 FCFA",
        "Établissement public au capital de 10 000 000 FCFA",
      ],
      explain: "RCCM 2004B03634 · NIF 783545M · BP 519 Libreville · secteur : handling, assistance au sol, logistique aéroportuaire et fret aérien.",
    },
    {
      id: "e15", kind: "qcm", part: P1, proba: "probable", ref: "Ch. I, 1.3, p. 7",
      q: "Où Corex International exerce-t-elle ses activités ?",
      options: [
        "Dans les zones fret des aéroports de Libreville et de Port-Gentil",
        "Uniquement au port d'Owendo",
        "À Libreville et à Franceville",
        "Dans toute l'Afrique centrale",
      ],
      explain: "À Libreville, le long de la plateforme aéroportuaire, entre Mikolongo au nord et Camp de Gaulle au sud, près du Débarcadère Ambowet.",
    },
    {
      id: "e16", kind: "oral", part: P1, proba: "tres", ref: "Ch. I, 2.1, p. 7-10 · Annexe 1",
      q: "Comment Corex International est-elle organisée ?",
      points: [
        "Une Direction Générale : le Directeur Général, assisté d'une Directrice Générale Adjointe chargée des Finances.",
        "Trois pôles : Handling & Logistique (opérations d'assistance au sol et fret), Commercial (relation clients), Financier (comptabilité, facturation).",
        "Des services d'appui : Ressources Humaines & Formation, IT & Systèmes, QHSE, Moyens Généraux.",
        "Ligne hiérarchique courte (agent → chef de service → responsable de pôle → DG) qui assure une bonne réactivité.",
      ],
      relance: { q: "Quel service intervient en cas de panne d'un engin ?", a: "Les Moyens Généraux, rattachés à la Direction Générale : ils veillent à la disponibilité des équipements et à la maintenance des installations, et interviennent directement en cas de panne." },
    },
    {
      id: "e17", kind: "qcm", part: P1, proba: "tres", ref: "Ch. I, 2.1, p. 8",
      q: "Quels sont les trois pôles de Corex International ?",
      options: [
        "Handling & Logistique, Commercial, Financier",
        "Handling, Maintenance, Sécurité",
        "Fret, Passagers, Bagages",
        "Commercial, QHSE, Ressources Humaines",
      ],
      explain: "QHSE, RH & Formation, IT & Systèmes et Moyens Généraux sont des services d'appui rattachés à la Direction Générale, pas des pôles.",
    },
    {
      id: "e18", kind: "qcm", part: P1, proba: "probable", ref: "Ch. I, 2.1.1, p. 9",
      q: "Quel est le rôle du service QHSE ?",
      options: [
        "Veiller à la qualité des prestations, à la sécurité des employés et à la protection de l'environnement",
        "Gérer la facturation des compagnies aériennes",
        "Assurer la maintenance des engins",
        "Recruter et former le personnel",
      ],
      explain: "QHSE = Qualité, Hygiène, Sécurité et Environnement. Il participe aussi à la prévention des risques professionnels et à l'amélioration continue.",
    },
    {
      id: "e19", kind: "qcm", part: P1, proba: "probable", ref: "Ch. I, 2.1.3, p. 10",
      q: "Lequel de ces services fait partie du Pôle Commercial ?",
      options: [
        "Le Service Statistiques",
        "Le Service Documentation Fret",
        "Le Service Facturation",
        "Le Service Traitement & Magasins",
      ],
      explain: "Pôle Commercial : Prestations Commerciales, Ventes, Statistiques. Facturation et Comptabilité relèvent du Pôle Financier ; Documentation Fret et Traitement & Magasins du Pôle Handling.",
    },
    {
      id: "e20", kind: "oral", part: P1, proba: "tres", ref: "Ch. I, 2.2-2.3, p. 11-13",
      q: "Quelles sont la mission et les activités de Corex International ?",
      points: [
        "Mission : assurer l'assistance au sol et le traitement du fret aérien (réception, manutention, stockage, livraison) dans des conditions de sécurité, de rapidité et d'efficacité.",
        "Réception et traitement du fret : vérifier les documents, traiter, orienter vers le stockage ou la livraison (SYDONIA, LTA, manifestes).",
        "Manutention et stockage : déplacer les marchandises entre zones, magasins et aéronefs, puis les conserver dans de bonnes conditions.",
        "Assistance au sol des aéronefs : chargement et déchargement du fret, déplacement entre l'aéronef et les zones de traitement.",
      ],
    },
    {
      id: "e21", kind: "oral", part: P1, proba: "tres", ref: "Ch. I, 2.3.2, p. 12 · Tableau 2",
      q: "Quels sont les principaux équipements de Corex International ?",
      points: [
        "High Loaders (7 T, 12 T, 27 T) : chargement et déchargement du fret à bord des aéronefs.",
        "Chariots élévateurs (2,5 T, 4 T, 5 T) : manutention et stockage des marchandises.",
        "GPU : alimentation électrique des aéronefs au sol.",
        "Dollies et tracteurs de manutention : transport et tractage des palettes et conteneurs sur la plateforme.",
        "Chambres froides (20 et 40 pieds), chariots à bagages, passerelle mobile, tapis à bagages, transpalettes.",
      ],
      tip: "Cite d'abord le trio clé High Loader – dolly – tracteur, puis complète.",
    },
    {
      id: "e22", kind: "qcm", part: P1, proba: "tres", ref: "Ch. I, p. 12 (note 3) · Ch. II, 2.3.1, p. 20",
      q: "Qu'est-ce qu'un High Loader ?",
      options: [
        "Un engin élévateur qui amène palettes et conteneurs à hauteur de la soute pour charger ou décharger l'aéronef",
        "Un chariot plat tracté qui transporte les palettes sur la plateforme",
        "Un groupe électrique qui alimente l'avion au sol",
        "Un logiciel de suivi douanier",
      ],
      explain: "Corex en dispose en 7 T, 12 T et 27 T. Le chariot plat tracté est la dolly ; le groupe électrique est le GPU ; le logiciel douanier est SYDONIA.",
    },
    {
      id: "e23", kind: "qcm", part: P1, proba: "probable", ref: "Ch. I, p. 12 · Tableau 2",
      q: "À quoi sert un GPU ?",
      options: [
        "À alimenter électriquement les aéronefs au sol",
        "À tracter les dollies",
        "À stocker les marchandises sous température dirigée",
        "À déplacer les palettes dans les magasins",
      ],
      explain: "GPU (Ground Power Unit). Les dollies sont tractées par les tracteurs de manutention ; le froid est assuré par les chambres froides ; les transpalettes déplacent les palettes dans les magasins.",
    },
    {
      id: "e24", kind: "qcm", part: P1, proba: "tres", ref: "Sigles · Ch. I, 2.1.2, p. 9",
      q: "Que signifient SYDONIA et LTA ?",
      options: [
        "Système Douanier Automatisé · Lettre de Transport Aérien",
        "Système de Données Aéroportuaires · Liste de Transport Autorisé",
        "Syndicat des Opérateurs Aériens · Licence de Transport Aérien",
        "Système de Documentation Nationale · Livraison du Transport Aérien",
      ],
      explain: "Autres sigles : ANAC (Agence Nationale de l'Aviation Civile), ONSFAG (Office National de Sûreté et de Facilitation des Aéroports du Gabon), RCCM, NAM (Network Aviation Group).",
    },

    // ───── Partie II : Pôle Handling & stage ─────
    {
      id: "e30", kind: "oral", part: P2, proba: "tres", ref: "Ch. II, section 1, p. 14-16",
      q: "Présentez le Pôle Handling & Logistique où vous avez fait votre stage.",
      points: [
        "Principal pôle opérationnel : assistance au sol et traitement du fret aérien.",
        "Deux services complémentaires : Traitement & Magasins (opérations physiques : réception, manutention, chargement, déchargement, stockage, mise à disposition) et Documentation Fret (traitement et suivi documentaire : LTA, manifestes, documents douaniers).",
        "Missions : réception et prise en charge, manutention, stockage (dont chambres froides de 20 et 40 pieds), traitement et suivi, mise à disposition du fret.",
      ],
    },
    {
      id: "e31", kind: "qcm", part: P2, proba: "tres", ref: "Ch. II, 1.2.1, p. 15 · Figure 5",
      q: "Quelle est la chaîne de traitement du fret au Pôle Handling ?",
      options: [
        "Réception et prise en charge → Manutention → Stockage → Traitement et suivi → Mise à disposition",
        "Stockage → Réception → Facturation → Livraison → Contrôle",
        "Manutention → Douane → Facturation → Stockage → Réception",
        "Commande → Paiement → Expédition → Livraison → Retour",
      ],
      explain: "5 étapes de la figure 5, chacune avec ses moyens : contrôle et orientation · High Loader, dolly, tracteur, chariots élévateurs · magasins et chambres froides · SYDONIA, LTA, manifestes · marchandises récupérées ou expédiées.",
    },
    {
      id: "e32", kind: "oral", part: P2, proba: "tres", ref: "Ch. II, 2.1, p. 16-18",
      q: "Quelles tâches avez-vous effectuées pendant votre stage ?",
      points: [
        "Supervision d'un vol de la compagnie Network Aviation Group (NAM) : suivi de la prise en charge du fret à l'arrivée et pendant le traitement du vol.",
        "Pointage des colis au pied de l'aéronef : vérifier leur présence et leur correspondance avec les informations disponibles, pour limiter les erreurs.",
        "Observation des opérations de manutention : comprendre l'usage des équipements et les étapes de prise en charge.",
        "Participation au suivi des opérations de fret : contrôle des marchandises à chaque étape.",
      ],
      relance: { q: "Qu'avez-vous retenu de la supervision du vol NAM ?", a: "L'importance de la coordination entre les agents et de la disponibilité des équipements : par exemple, le High Loader en position haute qui descend une palette sur une dolly, que le tracteur achemine ensuite." },
    },
    {
      id: "e33", kind: "qcm", part: P2, proba: "probable", ref: "Sigles · Ch. II, 2.1.1, p. 16",
      q: "Que signifie NAM, la compagnie dont vous avez supervisé un vol ?",
      options: ["Network Aviation Group", "National Air Mobility", "Nouvelle Aviation de Masuku", "North African Mail"],
      explain: "Cette supervision a servi à la fois de tâche de stage et de support à l'observation directe (chapitre III).",
    },
    {
      id: "e34", kind: "oral", part: P2, proba: "probable", ref: "Ch. II, 2.2.1, p. 19",
      q: "Quelles difficultés avez-vous rencontrées pendant le stage ?",
      points: [
        "La familiarisation avec le fonctionnement des opérations d'assistance au sol.",
        "La compréhension du vocabulaire spécifique au fret aérien.",
        "L'adaptation aux procédures et exigences du traitement des marchandises.",
        "La compréhension du fonctionnement des différents équipements de manutention.",
      ],
      tip: "Présente chaque difficulté avec ce que tu as fait pour la surmonter (observation, questions aux agents).",
    },
    {
      id: "e35", kind: "oral", part: P2, proba: "tres", ref: "Ch. II, 2.3.1, p. 20 · Figure 8",
      q: "Expliquez comment les engins interviennent en chaîne lors d'un déchargement.",
      points: [
        "Le High Loader met la palette à hauteur de la soute (ex. déchargement d'un Boeing 747-400).",
        "La dolly, chariot plat à plateau de rouleaux, reçoit et achemine la palette.",
        "Le tracteur de manutention tracte les dollies chargées vers les zones de traitement.",
        "L'indisponibilité d'un seul maillon peut ralentir toute l'opération.",
      ],
      tip: "C'est l'image clé de ton rapport : elle justifie pourquoi une seule panne pèse sur la performance.",
    },
    {
      id: "e36", kind: "oral", part: P2, proba: "tres", ref: "Ch. II, 2.3.2-2.3.3, p. 21-22",
      q: "Quelles sont les forces et les faiblesses de votre diagnostic ?",
      points: [
        "Forces : plusieurs équipements adaptés (tracteurs, FMC, Hyster, Manitou) ; équipements mobilisés à chaque étape ; personnel affecté à la manutention ; agents expérimentés.",
        "Faiblesses : défaillances de certains équipements ; indisponibilité temporaire (immobilisation pour panne) ; nombre d'engins limité lors d'opérations simultanées ; impact des pannes sur les délais ; besoin d'un suivi régulier de leur état.",
        "Conclusion : les équipements sont essentiels à la performance, mais leur disponibilité et leur état peuvent affecter la continuité et la rapidité des opérations.",
      ],
    },
    {
      id: "e37", kind: "qcm", part: P2, proba: "probable", ref: "Ch. II, 2.3, p. 19",
      q: "Sur quoi s'appuie votre diagnostic de l'existant ?",
      options: [
        "Le croisement de la recherche documentaire, des entretiens avec responsables et agents, et de l'observation directe",
        "Uniquement les rapports financiers de l'entreprise",
        "Un questionnaire envoyé aux compagnies aériennes",
        "Les statistiques de l'ANAC",
      ],
      explain: "Croiser trois sources renforce la fiabilité d'une étude qualitative : c'est un argument à rappeler face au jury.",
    },
    {
      id: "e38", kind: "qcm", part: P2, proba: "probable", ref: "Ch. II, 2.3.3, p. 21",
      q: "Laquelle de ces propositions est une FAIBLESSE de votre diagnostic ?",
      options: [
        "Le nombre d'équipements limité lors des opérations simultanées",
        "La connaissance des opérations par le personnel",
        "L'existence de plusieurs équipements adaptés",
        "La présence d'un personnel affecté à la manutention",
      ],
      explain: "Les trois autres sont des forces. Autres faiblesses : défaillances, indisponibilités temporaires, impact des pannes sur les délais, besoin de suivi régulier.",
    },

    // ───── Partie III : Méthode & concepts ─────
    {
      id: "e40", kind: "oral", part: P3, proba: "tres", ref: "Ch. III, 1.1-1.2, p. 24-26",
      q: "Quelle méthodologie avez-vous utilisée et pourquoi ?",
      points: [
        "Une démarche qualitative, adaptée pour observer les opérations, interroger les acteurs et consulter les documents de l'entreprise.",
        "Recherche documentaire : documents internes de Corex et ouvrages sur les équipements, l'assistance au sol, la performance.",
        "Observation directe : supervision du vol NAM et pointage des colis, pour voir le rôle réel des équipements.",
        "Entretiens avec le personnel (guide de 9 questions en annexe 2) : équipements, difficultés, conséquences des pannes, mesures prises.",
        "Analyse des causes avec le diagramme d'Ishikawa.",
      ],
      relance: { q: "Pourquoi pas une démarche quantitative ?", a: "L'entreprise ne disposait pas d'un suivi formalisé de l'état des équipements, et la durée de trois mois limitait la collecte. C'est justement une limite assumée, et une piste : mettre en place les indicateurs du tableau 4 pour une future étude chiffrée." },
    },
    {
      id: "e41", kind: "qcm", part: P3, proba: "tres", ref: "Ch. III, 1.2, p. 24",
      q: "Quelles sont les trois techniques d'investigation utilisées ?",
      options: [
        "Recherche documentaire, observation directe, entretien",
        "Questionnaire, sondage, statistiques",
        "Benchmark, audit financier, SWOT",
        "Expérimentation, simulation, modélisation",
      ],
      explain: "Elles sont complétées par le diagramme d'Ishikawa, outil d'analyse des causes (et non technique de collecte).",
    },
    {
      id: "e42", kind: "qcm", part: P3, proba: "probable", ref: "Annexe 2",
      q: "Combien de questions comporte votre guide d'entretien ?",
      options: ["9 questions", "5 questions", "12 questions", "20 questions"],
      explain: "Équipements utilisés, opérations réalisées, difficultés, fréquence des pannes, conséquences, mesures prises, suivi et signalement, moyens de l'entreprise, améliorations proposées.",
    },
    {
      id: "e43", kind: "oral", part: P3, proba: "tres", ref: "Ch. III, 1.3, p. 26-27 · Figure 10",
      q: "Expliquez le diagramme d'Ishikawa et son application à votre étude.",
      points: [
        "Diagramme de causes à effets, ou en arêtes de poisson : il identifie et classe les causes d'un problème.",
        "Effet étudié : la performance des opérations d'assistance au sol affectée.",
        "5 catégories adaptées des 5M : Matériel, Main-d'œuvre, Méthodes, Maintenance, Milieu.",
        "Matériel : pannes, indisponibilité, usure, insuffisance en forte activité. Maintenance : fréquence des contrôles, entretien préventif, rapidité des réparations, disponibilité des pièces.",
        "Main-d'œuvre : formation, maîtrise, respect des consignes, expérience. Méthodes : organisation, procédures, coordination, planification. Milieu : conditions de travail, environnement aéroportuaire, espace de circulation, contraintes autour des aéronefs.",
      ],
      tip: "Dessine mentalement le poisson : la tête = l'effet, les 5 arêtes = les 5M.",
      relance: { q: "Pourquoi avoir remplacé un « M » des 5M par la Maintenance ?", a: "Les 5M classiques sont Matériel, Main-d'œuvre, Méthodes, Milieu et Matière. Dans notre contexte, la matière est peu pertinente alors que la maintenance est centrale : c'est pourquoi la méthode a été adaptée." },
    },
    {
      id: "e44", kind: "qcm", part: P3, proba: "tres", ref: "Ch. III, 1.3, p. 26",
      q: "Quelles sont les 5 catégories de votre diagramme d'Ishikawa ?",
      options: [
        "Matériel, Main-d'œuvre, Méthodes, Maintenance, Milieu",
        "Matériel, Matière, Méthodes, Management, Mesure",
        "Machines, Marché, Marketing, Moyens, Main-d'œuvre",
        "Matériel, Main-d'œuvre, Monnaie, Météo, Mission",
      ],
      explain: "Adaptées des 5M à l'assistance au sol : la Maintenance remplace la Matière.",
    },
    {
      id: "e45", kind: "qcm", part: P3, proba: "probable", ref: "Ch. III, 1.3 · Figure 10",
      q: "Dans votre Ishikawa, à quelle catégorie appartient « la disponibilité des pièces » ?",
      options: ["Maintenance", "Matériel", "Milieu", "Méthodes"],
      explain: "Maintenance : fréquence des contrôles, entretien préventif, rapidité des réparations, disponibilité des pièces.",
    },
    {
      id: "e46", kind: "oral", part: P3, proba: "tres", ref: "Ch. III, 2.1, p. 28",
      q: "Définissez les concepts clés de votre sujet.",
      points: [
        "Équipements d'assistance au sol (d'après Jean-Paul Rodrigue, 2020) : moyens matériels, motorisés ou non, mobilisés autour de l'aéronef pendant l'escale pour sa prise en charge, son chargement, son déchargement et sa préparation au départ, dans les délais et en sécurité.",
        "Performance (à partir de Michael Porter, 1986) : capacité à atteindre efficacement ses objectifs en utilisant de façon optimale ses ressources humaines, matérielles et financières ; en assistance au sol : rapidité, qualité, ponctualité des vols, sécurité, satisfaction des compagnies.",
        "Assistance au sol : ensemble des services fournis aux aéronefs, passagers, bagages et marchandises pendant leur présence à l'aéroport.",
      ],
    },
    {
      id: "e47", kind: "qcm", part: P3, proba: "probable", ref: "Ch. III, 2.1, p. 28",
      q: "Sur quels auteurs vous appuyez-vous pour définir les équipements et la performance ?",
      options: [
        "Jean-Paul Rodrigue (The Geography of Transport Systems, 2020) et Michael Porter (L'avantage concurrentiel, 1986)",
        "Kaoru Ishikawa et Henri Fayol",
        "Kaplan et Norton uniquement",
        "Quivy et Van Campenhoudt",
      ],
      explain: "Ishikawa (1986) est cité pour le diagramme ; Kaplan et Norton, Monchy et Vernier, Quivy et Van Campenhoudt figurent aussi dans la bibliographie.",
    },
    {
      id: "e48", kind: "oral", part: P3, proba: "tres", ref: "Ch. III, 2.4-2.5, p. 29-30",
      q: "Quelles sont les causes des défaillances et quelle différence faites-vous entre maintenance préventive et corrective ?",
      points: [
        "Causes possibles : usure, manque d'entretien, panne mécanique ou électrique, mauvaise utilisation du matériel.",
        "Conséquences : utiliser un autre matériel ou suspendre l'activité, donc perte de temps et désorganisation.",
        "Maintenance préventive : réalisée régulièrement pour éviter les pannes.",
        "Maintenance corrective : intervient après l'apparition de la défaillance.",
        "Chez Corex, la maintenance est surtout corrective : la maintenance préventive est à renforcer.",
      ],
      relance: { q: "Pourquoi le préventif serait-il plus rentable que le correctif ?", a: "Il réduit les pannes imprévues, donc les immobilisations en pleine opération, les retards et l'insatisfaction des compagnies. Le correctif coûte du temps au pire moment, pendant le traitement d'un vol." },
    },
    {
      id: "e49", kind: "qcm", part: P3, proba: "tres", ref: "Ch. III, 2.5, p. 30",
      q: "Qu'est-ce que la maintenance préventive ?",
      options: [
        "Des contrôles et entretiens réalisés régulièrement, avant l'apparition des pannes",
        "La réparation d'un engin après une panne",
        "Le remplacement complet du parc d'engins",
        "La formation des agents à la conduite",
      ],
      explain: "La réparation après une panne est la maintenance corrective, celle qui domine aujourd'hui chez Corex.",
    },
    {
      id: "e50", kind: "oral", part: P3, proba: "tres", ref: "Ch. III, 2.7, p. 31 · Tableau 4",
      q: "Quels indicateurs proposez-vous pour mesurer la performance, et comment se calculent-ils ?",
      points: [
        "Taux de respect des délais = (opérations réalisées dans les délais ÷ total des opérations) × 100.",
        "Taux de disponibilité des équipements = (temps de disponibilité ÷ temps d'exploitation prévu) × 100.",
        "Nombre de pannes sur une période (mois, trimestre).",
        "Temps moyen d'immobilisation = total des heures d'immobilisation ÷ nombre de pannes.",
        "Qualité du traitement du fret = (colis endommagés, perdus ou mal orientés ÷ total des colis traités) × 100.",
        "Respect des règles de sécurité : nombre d'incidents ou d'accidents sur une période.",
      ],
      tip: "Le jury peut te faire calculer un indicateur : entraîne-toi dans la rubrique « Calculs ».",
    },
    {
      id: "e51", kind: "qcm", part: P3, proba: "tres", ref: "Ch. III, Tableau 4, p. 31",
      q: "Comment se calcule le temps moyen d'immobilisation ?",
      options: [
        "Total des heures d'immobilisation ÷ nombre de pannes",
        "Nombre de pannes ÷ temps d'exploitation prévu",
        "(Temps de disponibilité ÷ temps d'exploitation prévu) × 100",
        "Total des heures d'immobilisation × nombre d'engins",
      ],
      explain: "Il mesure la durée moyenne pendant laquelle un engin reste hors service après une panne.",
    },
    {
      id: "e52", kind: "oral", part: P3, proba: "probable", ref: "Ch. III, 2.6 · Tableau 3, p. 30-31",
      q: "Quels facteurs, au-delà des équipements, influencent la performance ?",
      points: [
        "Ressources humaines : compétences pour utiliser correctement les équipements et appliquer les procédures (limite : besoin de formations régulières).",
        "Méthodes et organisation : organisation en pôles et services, outils SYDONIA, LTA, manifestes (limite : pas de suivi formalisé de l'état des équipements).",
        "Maintenance : Moyens Généraux (limite : maintenance surtout corrective).",
        "Conditions de travail : implantation à Libreville et Port-Gentil (limite : contraintes aéroportuaires et simultanéité des vols).",
        "Ces facteurs doivent fonctionner de façon complémentaire avec les équipements.",
      ],
    },

    // ───── Partie IV : Résultats & suggestions ─────
    {
      id: "e60", kind: "oral", part: P4, proba: "tres", ref: "Ch. IV, 1.3, p. 34-35",
      q: "Vos hypothèses sont-elles vérifiées ?",
      points: [
        "Hypothèse 1 confirmée (sur le plan qualitatif) : les trois sources convergent ; en cas de panne, les opérations ralentissent, un autre matériel doit être mobilisé et les délais peuvent être affectés.",
        "Hypothèse 2 partiellement confirmée : Corex dispose d'un parc diversifié, d'un personnel expérimenté et des Moyens Généraux, mais le nombre d'engins est limité lors des opérations simultanées et le suivi de leur état manque.",
        "Les ressources existent, mais leur mobilisation (suivi, maintenance préventive) doit être renforcée.",
        "Réponse à la problématique : les défaillances ont un impact sur la qualité des services, à travers les retards, les pertes de temps et la désorganisation.",
      ],
      tip: "C'est LA question du jury : réponds hypothèse par hypothèse, avec le verdict puis la preuve.",
      relance: { q: "Pourquoi l'hypothèse 2 n'est-elle que partiellement confirmée ?", a: "Parce que les ressources existent (parc, personnel, Moyens Généraux) mais ne suffisent pas toujours : engins limités lors des vols simultanés, maintenance surtout corrective et absence de suivi formalisé de l'état des équipements." },
    },
    {
      id: "e61", kind: "qcm", part: P4, proba: "tres", ref: "Ch. IV, 1.3, p. 34",
      q: "Quel est le verdict sur vos deux hypothèses ?",
      options: [
        "H1 confirmée sur le plan qualitatif ; H2 partiellement confirmée",
        "H1 infirmée ; H2 confirmée",
        "Les deux hypothèses sont totalement confirmées",
        "Les deux hypothèses sont infirmées",
      ],
      explain: "H1 : les défaillances influencent la performance. H2 : les ressources existent mais leur mobilisation (suivi, maintenance préventive) doit être renforcée.",
    },
    {
      id: "e62", kind: "oral", part: P4, proba: "tres", ref: "Ch. IV, 1.3 · Tableau 5, p. 34 · Figure 11",
      q: "Expliquez le mécanisme entre une défaillance et la baisse de performance.",
      points: [
        "Défaillance ou indisponibilité d'un équipement : panne d'un High Loader, d'un tracteur ou d'une dolly ; engin immobilisé pour réparation.",
        "Conséquence immédiate : palettes en attente, mobilisation d'un autre matériel, opérations simultanées difficiles à assurer (ralentissements, retards, désorganisation).",
        "Effet final : allongement des délais d'exécution, perturbation du traitement du fret, risque d'insatisfaction des compagnies clientes.",
      ],
      tip: "Trois temps : défaillance → désorganisation → baisse de performance.",
    },
    {
      id: "e63", kind: "oral", part: P4, proba: "tres", ref: "Ch. IV, 2.1, p. 36-38 · Figure 12",
      q: "Quelles suggestions faites-vous à Corex International ?",
      points: [
        "1. Renforcer la maintenance préventive : calendrier d'entretien par engin et fiche de suivi des interventions.",
        "2. Suivre la disponibilité des équipements : registre quotidien (disponible / en panne / en maintenance), consulté au début de chaque vacation.",
        "3. Former le personnel à l'utilisation des équipements : sessions de formation et de rappel (règles, sécurité, bonnes pratiques).",
        "4. Améliorer la communication entre services : signalement immédiat des pannes, point quotidien, support de suivi partagé.",
        "5. Mettre en place des indicateurs : tableau de bord mensuel (disponibilité, pannes, temps d'immobilisation, respect des délais).",
      ],
      tip: "Pour chaque suggestion : quoi faire, comment (modalités), pourquoi (bénéfices attendus).",
    },
    {
      id: "e64", kind: "qcm", part: P4, proba: "tres", ref: "Ch. IV, 2.1 · Figure 12",
      q: "Combien de suggestions formulez-vous, et laquelle n'en fait PAS partie ?",
      options: [
        "Cinq ; « renouveler immédiatement tout le parc d'engins » n'en fait pas partie",
        "Trois ; « former le personnel » n'en fait pas partie",
        "Cinq ; « améliorer la communication entre services » n'en fait pas partie",
        "Quatre ; « mettre en place des indicateurs » n'en fait pas partie",
      ],
      explain: "Les 5 : maintenance préventive, suivi de la disponibilité, formation, communication, indicateurs. Le renouvellement du parc est seulement évoqué comme décision à éclairer par les bilans, à plus de 6 mois.",
    },
    {
      id: "e65", kind: "oral", part: P4, proba: "tres", ref: "Ch. IV, 2.2, p. 38-39 · Tableau 7",
      q: "Comment proposez-vous de mettre en œuvre vos suggestions ?",
      points: [
        "Court terme (0 à 3 mois) : registre quotidien de disponibilité et fiche de suivi par engin (annexe 3), calendrier de maintenance préventive, procédure de signalement immédiat des pannes.",
        "Moyen terme (3 à 6 mois) : sessions de formation (avec RH & Formation et le Coordinateur QHSE) et calcul mensuel des indicateurs du tableau 4.",
        "Au-delà de 6 mois : analyser les indicateurs, ajuster la maintenance aux pannes les plus fréquentes, bilan à la Direction Générale pour orienter renouvellement ou renforcement du parc.",
        "Suivi du plan grâce aux indicateurs du tableau 4.",
      ],
    },
    {
      id: "e66", kind: "qcm", part: P4, proba: "tres", ref: "Ch. IV, Tableau 7, p. 39",
      q: "Quelle suggestion a l'échéance la plus courte, et qui en est responsable ?",
      options: [
        "Le registre quotidien de disponibilité : 0 à 1 mois, Service Traitement & Magasins",
        "La formation du personnel : 0 à 1 mois, Direction Générale",
        "Les indicateurs : 0 à 3 mois, Service Commercial",
        "La maintenance préventive : 6 à 12 mois, Service Facturation",
      ],
      explain: "Maintenance préventive et communication : 0 à 3 mois. Formation et indicateurs : 3 à 6 mois.",
    },
    {
      id: "e67", kind: "qcm", part: P4, proba: "probable", ref: "Ch. IV, Tableau 7, p. 39",
      q: "Qui est proposé comme responsable de la formation du personnel ?",
      options: [
        "Le Service RH & Formation et le Coordinateur QHSE",
        "Le Service Comptabilité",
        "Le Pôle Commercial",
        "Les compagnies aériennes clientes",
      ],
      explain: "Échéance : 3 à 6 mois. Objectif : rappeler les règles d'utilisation, les consignes de sécurité et les bonnes pratiques de chaque engin.",
    },
    {
      id: "e68", kind: "qcm", part: P4, proba: "probable", ref: "Annexe 3",
      q: "Que contient la fiche de suivi de la disponibilité proposée en annexe 3 ?",
      options: [
        "Date, engin (n°), état (disponible / en panne / en maintenance), nature de la panne, date de dernière maintenance, visa",
        "Le coût d'achat et la date d'amortissement de chaque engin",
        "Le nom des clients et le montant facturé",
        "Les horaires des vols et le nombre de passagers",
      ],
      explain: "À renseigner quotidiennement par le Service Traitement & Magasins pour les High Loaders 7, 12 et 27 T, chariot élévateur, tracteur, dolly, GPU.",
    },
    {
      id: "e69", kind: "oral", part: P4, proba: "tres", ref: "Ch. IV, 2.2, p. 38",
      q: "Qu'avez-vous apporté à l'entreprise ?",
      points: [
        "Contribution aux activités du Pôle Handling : supervision du vol NAM, pointage des colis, suivi des opérations de fret.",
        "Un recensement structuré des facteurs qui influencent la disponibilité des équipements et la performance (diagnostic + Ishikawa).",
        "Des outils simples et applicables : fiche de suivi par engin, registre de disponibilité quotidien, indicateurs de suivi, plan de mise en œuvre en trois étapes.",
      ],
      relance: { q: "Vos suggestions ont-elles un coût pour l'entreprise ?", a: "Elles sont volontairement simples et peu coûteuses : une fiche, un registre, des points quotidiens et des formations de rappel en interne. Elles s'appuient sur les services existants (Moyens Généraux, RH & Formation, QHSE)." },
    },
  ],

  /* ═══════════════════════════ FICHES ═══════════════════════════ */
  fiches: [
    {
      part: P0, title: "Sujet, problématique et recul", pages: "p. 1-2 · p. 40",
      essentiel: "Les défaillances des engins pèsent sur la qualité de l'assistance au sol de Corex International : H1 confirmée, H2 partiellement confirmée, cinq suggestions pour fiabiliser les équipements.",
      sections: [
        { h: "Le cadre", items: ["Licence professionnelle Gestion logistique et transport · IST Libreville · 2025-2026", "Stage de 3 mois chez Corex International, Pôle Handling & Logistique", "Enseignant conseil : Dr Ifounga Ifounga Ake · Tuteur : M. Rodrigue Nze"] },
        { h: "Problématique et hypothèses", items: ["Quel est l'impact des défaillances des engins sur la qualité des services d'assistance au sol de Corex International ?", "H1 : les défaillances des équipements influencent la performance opérationnelle", "H2 : les entreprises disposent des ressources pour juguler ces défaillances"] },
        { h: "Objectifs", items: ["Général : analyser l'impact des défaillances des engins sur la qualité des services", "Spécifiques : identifier les types de défaillances · déterminer leurs causes · évaluer leurs conséquences · proposer des suggestions"] },
        { h: "Plan", items: ["Partie 1 : Ch. I Corex International · Ch. II Pôle Handling et tâches", "Partie 2 : Ch. III techniques et concepts · Ch. IV résultats et suggestions"] },
        { h: "Limites et prolongements", items: ["Démarche qualitative, sans données chiffrées", "Stage de 3 mois", "Ishikawa : causes recensées sans être hiérarchisées", "Pistes : coût des pannes, organisation de la maintenance, satisfaction des compagnies"] },
      ],
      chiffres: [
        { label: "Durée du stage", value: "3 mois" },
        { label: "Hypothèses", value: "2" },
        { label: "Suggestions", value: "5" },
        { label: "Techniques", value: "3 + Ishikawa" },
      ],
      pieges: ["Ne dis pas que l'hypothèse 2 est « confirmée » : elle est partiellement confirmée.", "Précise que H1 est confirmée « sur le plan qualitatif »."],
    },
    {
      part: P1, title: "Chapitre I — Corex International", pages: "p. 4-13",
      essentiel: "Entreprise gabonaise de handling et de fret aérien, créée en 2009, SA au capital de 10 M FCFA, 70+ collaborateurs à Libreville et Port-Gentil, organisée en trois pôles.",
      sections: [
        { h: "Historique", items: ["Juin 2009 : création par M. Jacob Cabinda (ex-Air Gabon, Gabon Airlines) pour préserver emplois et savoir-faire", "2009-2018 : Lufthansa, RwandAir, Air Côte d'Ivoire, DHL, Royal Air Maroc, Kenya Airways, South African Airways, Ethiopian, Turkish", "Déc. 2013 : COREX France · Juil. 2015 : M. Didier Kouakoua à la direction · 2021 : Sky Mali et Air Sénégal"] },
        { h: "Identité", items: ["SA, capital 10 000 000 FCFA, RCCM 2004B03634, NIF 783545M, BP 519 Libreville", "Zones fret de Libreville (entre Mikolongo et Camp de Gaulle, près du Débarcadère Ambowet) et Port-Gentil", "Valeurs : l'humain, la responsabilité, la performance durable"] },
        { h: "Organisation", items: ["DG + DGA chargée des Finances", "Pôles : Handling & Logistique · Commercial (Prestations, Ventes, Statistiques) · Financier (Comptabilité, Facturation)", "Appui : RH & Formation, IT & Systèmes, QHSE, Moyens Généraux"] },
        { h: "Mission et activités", items: ["Assistance au sol et traitement du fret en sécurité, rapidité et efficacité", "Réception et traitement · Manutention et stockage · Assistance au sol des aéronefs", "Outils : SYDONIA, LTA, manifestes"] },
        { h: "Équipements (tableau 2)", items: ["High Loaders 7/12/27 T · chariots élévateurs 2,5/4/5 T · GPU · dollies · tracteurs", "Chambres froides 20 et 40 pieds · chariots et tapis à bagages · passerelle mobile · transpalettes"] },
      ],
      chiffres: [
        { label: "Création", value: "Juin 2009" },
        { label: "Capital", value: "10 000 000 FCFA" },
        { label: "Collaborateurs", value: "70+" },
        { label: "Plateformes", value: "Libreville · Port-Gentil" },
      ],
      pieges: ["Le DG actuel est M. Didier Kouakoua (depuis 2015) ; M. Jacob Cabinda est le fondateur.", "QHSE et Moyens Généraux sont des services d'appui, pas des pôles."],
    },
    {
      part: P2, title: "Chapitre II — Pôle Handling, stage et diagnostic", pages: "p. 14-22",
      essentiel: "Le Pôle Handling traite le fret en 5 étapes ; le stage (vol NAM, pointage) a permis un diagnostic : des équipements adaptés, mais des pannes et des indisponibilités qui ralentissent toute la chaîne.",
      sections: [
        { h: "Le Pôle Handling & Logistique", items: ["Service Traitement & Magasins : opérations physiques", "Service Documentation Fret : LTA, manifestes, documents douaniers", "Chaîne : réception → manutention → stockage → traitement et suivi → mise à disposition"] },
        { h: "Tâches effectuées", items: ["Supervision d'un vol NAM (Network Aviation Group)", "Pointage des colis au pied de l'aéronef", "Observation des opérations de manutention", "Participation au suivi des opérations de fret"] },
        { h: "Difficultés et apports", items: ["Difficultés : fonctionnement de l'assistance au sol, vocabulaire du fret, procédures, équipements", "Apports : observation, rigueur, compréhension des opérations logistiques et du rôle des équipements"] },
        { h: "Les engins en chaîne", items: ["High Loader → met la palette à hauteur de soute", "Dolly → l'achemine · Tracteur → la tracte", "Un seul maillon indisponible ralentit toute l'opération"] },
        { h: "Diagnostic", items: ["Forces : équipements adaptés (tracteurs, FMC, Hyster, Manitou), personnel affecté et expérimenté", "Faiblesses : pannes, indisponibilités, engins limités en opérations simultanées, impact sur les délais, besoin de suivi"] },
      ],
      chiffres: [
        { label: "Étapes de la chaîne", value: "5" },
        { label: "Services du pôle", value: "2" },
        { label: "Tâches de stage", value: "4" },
        { label: "Avion observé", value: "Boeing 747-400" },
      ],
      pieges: ["Le pointage sert à vérifier la présence et la correspondance des colis, pour limiter les erreurs.", "Le diagnostic croise trois sources : documents, entretiens, observation."],
    },
    {
      part: P3, title: "Chapitre III — Méthode et concepts", pages: "p. 24-32",
      essentiel: "Démarche qualitative (documents, observation, entretiens) + Ishikawa en 5M adaptés ; concepts : équipements, performance, assistance au sol, maintenance, indicateurs.",
      sections: [
        { h: "Techniques d'investigation", items: ["Recherche documentaire", "Observation directe (vol NAM, pointage)", "Entretien (guide de 9 questions, annexe 2)"] },
        { h: "Ishikawa (figure 10)", items: ["Effet : performance des opérations affectée", "Matériel · Main-d'œuvre · Méthodes · Maintenance · Milieu", "Adapté des 5M : la Maintenance remplace la Matière"] },
        { h: "Concepts", items: ["Équipements (Rodrigue, 2020) : moyens mobilisés autour de l'aéronef pendant l'escale", "Performance (Porter, 1986) : atteindre ses objectifs en optimisant ses ressources", "Assistance au sol : services aux aéronefs, passagers, bagages, marchandises à l'aéroport"] },
        { h: "Défaillances et maintenance", items: ["Causes : usure, manque d'entretien, panne mécanique/électrique, mauvaise utilisation", "Préventive (avant la panne) vs corrective (après la panne)"] },
        { h: "Indicateurs (tableau 4)", items: ["Respect des délais · disponibilité · nombre de pannes", "Temps moyen d'immobilisation · qualité du traitement · sécurité"] },
      ],
      chiffres: [
        { label: "Techniques", value: "3" },
        { label: "Catégories Ishikawa", value: "5" },
        { label: "Indicateurs", value: "6" },
        { label: "Questions d'entretien", value: "9" },
      ],
      pieges: ["Ishikawa est un outil d'analyse des causes, pas une technique de collecte.", "Taux de disponibilité = temps de disponibilité ÷ temps d'exploitation PRÉVU."],
    },
    {
      part: P4, title: "Chapitre IV — Résultats et suggestions", pages: "p. 33-39",
      essentiel: "Défaillance → désorganisation → baisse de performance. H1 confirmée, H2 partiellement. Cinq suggestions avec un plan en trois étapes (0-3 mois, 3-6 mois, +6 mois).",
      sections: [
        { h: "Vérification des hypothèses", items: ["H1 confirmée (qualitatif) : ralentissements, matériel de remplacement, délais affectés", "H2 partiellement confirmée : ressources présentes, mobilisation à renforcer (suivi, préventif)"] },
        { h: "Mécanisme (tableau 5)", items: ["Panne d'un High Loader, tracteur ou dolly", "→ palettes en attente, autre matériel mobilisé, opérations simultanées difficiles", "→ délais allongés, fret perturbé, risque d'insatisfaction des compagnies"] },
        { h: "5 suggestions", items: ["Maintenance préventive (calendrier + fiche par engin)", "Suivi de la disponibilité (registre quotidien)", "Formation du personnel", "Communication entre services (signalement, point quotidien)", "Indicateurs (tableau de bord mensuel)"] },
        { h: "Plan de mise en œuvre (tableau 7)", items: ["0-1 mois : registre (Traitement & Magasins)", "0-3 mois : maintenance préventive (Moyens Généraux, Pôle Handling) · communication", "3-6 mois : formation (RH & Formation, QHSE) · indicateurs (Pôle Handling, DG)", "+6 mois : analyse, ajustement, bilan à la DG"] },
      ],
      chiffres: [
        { label: "H1", value: "Confirmée" },
        { label: "H2", value: "Partiellement" },
        { label: "Suggestions", value: "5" },
        { label: "Étapes du plan", value: "3" },
      ],
      pieges: ["Le registre quotidien est la mesure la plus rapide (0 à 1 mois).", "Le renouvellement du parc n'est pas une suggestion : c'est une décision à éclairer par les bilans."],
    },
  ],

  /* ═══════════════════════════ NOTIONS ═══════════════════════════ */
  notions: [
    { term: "Assistance au sol (handling)", def: "Ensemble des services fournis aux aéronefs, passagers, bagages et marchandises pendant leur présence à l'aéroport.", inReport: "Chez Corex : manutention, traitement du fret, utilisation d'équipements spécialisés, organisation logistique autour des aéronefs.", ref: "p. 28-29" },
    { term: "Équipements d'assistance au sol", def: "Moyens matériels, motorisés ou non, mobilisés autour de l'aéronef pendant l'escale pour sa prise en charge, son chargement, son déchargement et sa préparation au départ (d'après J.-P. Rodrigue, 2020).", inReport: "High Loaders, chariots élévateurs, GPU, dollies, tracteurs, chambres froides, tapis à bagages…", ref: "p. 12, 28" },
    { term: "Performance", def: "Capacité à atteindre efficacement ses objectifs en utilisant de façon optimale ses ressources humaines, matérielles et financières (à partir de M. Porter, 1986).", inReport: "En assistance au sol : rapidité, qualité, ponctualité des vols, sécurité, satisfaction des compagnies.", ref: "p. 28" },
    { term: "Défaillance", def: "Panne ou dysfonctionnement d'un équipement qui l'empêche de remplir sa fonction.", inReport: "Causes : usure, manque d'entretien, panne mécanique ou électrique, mauvaise utilisation.", ref: "p. 29-30" },
    { term: "Maintenance préventive", def: "Contrôles et entretiens réalisés régulièrement pour éviter les pannes.", inReport: "Première suggestion : calendrier d'entretien par engin et fiche de suivi des interventions.", ref: "p. 30, 36" },
    { term: "Maintenance corrective", def: "Intervention réalisée après l'apparition d'une défaillance, pour remettre l'équipement en état.", inReport: "Mode dominant chez Corex : c'est une limite relevée dans le tableau 3.", ref: "p. 30-31" },
    { term: "Diagramme d'Ishikawa", def: "Diagramme de causes à effets (en arêtes de poisson) qui identifie et classe les causes d'un problème.", inReport: "Effet : performance affectée · causes classées en Matériel, Main-d'œuvre, Méthodes, Maintenance, Milieu.", ref: "p. 26-27, 33" },
    { term: "Méthode des 5M", def: "Classement des causes d'un problème en cinq familles : Matériel, Main-d'œuvre, Méthodes, Milieu, Matière.", inReport: "Adaptée au contexte : la Maintenance remplace la Matière.", ref: "p. 26" },
    { term: "High Loader", def: "Plateforme élévatrice à ciseaux qui amène palettes et conteneurs à hauteur de la soute de l'aéronef.", inReport: "Indispensable aux avions-cargos ; Corex en dispose en 7 T, 12 T et 27 T.", ref: "p. 12, 20" },
    { term: "Dolly", def: "Chariot plat tracté, à plateau de rouleaux, pour transporter palettes, conteneurs et bagages sur la plateforme.", inReport: "Reçoit la palette du High Loader et l'achemine, tractée par un tracteur de manutention.", ref: "p. 12, 20" },
    { term: "GPU", def: "Groupe de parc (Ground Power Unit) qui alimente électriquement l'aéronef au sol.", inReport: "Fait partie du parc de Corex (tableau 2) et de la fiche de suivi (annexe 3).", ref: "p. 12" },
    { term: "LTA", def: "Lettre de Transport Aérien : document qui accompagne et identifie l'expédition de fret aérien.", inReport: "Traitée par le Service Documentation Fret, avec les manifestes et SYDONIA.", ref: "p. 9, 11" },
    { term: "SYDONIA", def: "Système Douanier Automatisé utilisé pour les formalités douanières.", inReport: "Outil de suivi des opérations du Pôle Handling & Logistique.", ref: "p. 9, 11" },
    { term: "Taux de disponibilité", def: "Part du temps pendant laquelle les engins sont en état de fonctionner.", formula: "(Temps de disponibilité ÷ temps d'exploitation prévu) × 100", inReport: "Indicateur clé proposé au tableau 4 et dans le tableau de bord mensuel.", ref: "p. 31, 37" },
    { term: "Temps moyen d'immobilisation", def: "Durée moyenne pendant laquelle un engin reste hors service après une panne.", formula: "Total des heures d'immobilisation ÷ nombre de pannes", inReport: "Indicateur du tableau 4 ; à suivre chaque mois.", ref: "p. 31" },
    { term: "Taux de respect des délais", def: "Capacité à traiter les vols et le fret dans les temps impartis.", formula: "(Opérations réalisées dans les délais ÷ total des opérations) × 100", inReport: "Indicateur du tableau 4 ; mesure directe de l'effet des pannes.", ref: "p. 31" },
    { term: "Démarche qualitative", def: "Approche fondée sur l'observation, les entretiens et les documents plutôt que sur des mesures chiffrées.", inReport: "Choisie pour l'étude ; c'est aussi sa principale limite.", ref: "p. 24, 40" },
    { term: "QHSE", def: "Qualité, Hygiène, Sécurité et Environnement : démarche de prévention des risques et d'amélioration continue.", inReport: "Le Coordinateur QHSE est proposé, avec les RH, pour la formation du personnel.", ref: "p. 9, 39" },
  ],

  /* ═══════════════════════════ FLASHCARDS ═══════════════════════════ */
  flashcards: [
    { front: "Problématique", back: "Quel est l'impact des défaillances des engins sur la qualité des services d'assistance au sol de Corex International ?", ref: "p. 1" },
    { front: "Hypothèse 1", back: "Les défaillances des équipements influencent la performance opérationnelle — confirmée (qualitatif)", ref: "p. 2, 34" },
    { front: "Hypothèse 2", back: "Les entreprises disposent des ressources pour juguler les défaillances — partiellement confirmée", ref: "p. 2, 34" },
    { front: "Création de Corex International", back: "Juin 2009, par M. Jacob Cabinda", ref: "p. 4" },
    { front: "Directeur Général actuel", back: "M. Didier Kouakoua, depuis juillet 2015", ref: "p. 5" },
    { front: "Forme juridique et capital", back: "Société Anonyme, 10 000 000 FCFA", ref: "p. 6" },
    { front: "RCCM et NIF", back: "RCCM 2004B03634 · NIF 783545M", ref: "p. 6" },
    { front: "Effectif et implantations", back: "70+ collaborateurs · Libreville et Port-Gentil", ref: "p. 5, 7" },
    { front: "Les 3 pôles", back: "Handling & Logistique · Commercial · Financier", ref: "p. 8" },
    { front: "Les services d'appui", back: "RH & Formation · IT & Systèmes · QHSE · Moyens Généraux", ref: "p. 8-9" },
    { front: "Capacités des High Loaders", back: "7 T, 12 T et 27 T", ref: "p. 12" },
    { front: "Capacités des chariots élévateurs", back: "2,5 T, 4 T et 5 T", ref: "p. 12" },
    { front: "Chambres froides", back: "20 pieds et 40 pieds", ref: "p. 12, 15" },
    { front: "Chaîne de traitement du fret", back: "Réception → Manutention → Stockage → Traitement et suivi → Mise à disposition", ref: "p. 15" },
    { front: "Les 4 tâches du stage", back: "Supervision du vol NAM · pointage des colis · observation de la manutention · suivi des opérations de fret", ref: "p. 16-18" },
    { front: "Les 3 techniques d'investigation", back: "Recherche documentaire · observation directe · entretien", ref: "p. 24" },
    { front: "Les 5 catégories d'Ishikawa", back: "Matériel · Main-d'œuvre · Méthodes · Maintenance · Milieu", ref: "p. 26" },
    { front: "Taux de disponibilité", back: "(Temps de disponibilité ÷ temps d'exploitation prévu) × 100", ref: "p. 31" },
    { front: "Temps moyen d'immobilisation", back: "Total des heures d'immobilisation ÷ nombre de pannes", ref: "p. 31" },
    { front: "Qualité du traitement du fret", back: "(Colis endommagés, perdus ou mal orientés ÷ total des colis traités) × 100", ref: "p. 31" },
    { front: "Les 5 suggestions", back: "Maintenance préventive · suivi de la disponibilité · formation · communication · indicateurs", ref: "p. 36-38" },
    { front: "Plan de mise en œuvre", back: "0-3 mois : registre, fiche, calendrier, signalement · 3-6 mois : formation, indicateurs · +6 mois : analyse et bilan DG", ref: "p. 38" },
    { front: "Les 3 limites de l'étude", back: "Démarche qualitative sans chiffres · stage de 3 mois · causes non hiérarchisées", ref: "p. 40" },
  ],

  /* ═══════════════════════════ CALCULS ═══════════════════════════ */
  calculs: [
    {
      title: "Taux de disponibilité d'un High Loader", ref: "Tableau 4, p. 31 · exemple d'entraînement",
      enonce: "Exemple fictif pour s'entraîner : un High Loader devait être exploité 200 heures dans le mois. Il a été immobilisé 30 heures pour panne. Quel est son taux de disponibilité (en %) ?",
      answer: 85, unit: "%", tolerance: 0.5,
      steps: ["Temps de disponibilité = 200 − 30 = 170 heures", "Taux = (170 ÷ 200) × 100 = 85 %", "Formule du tableau 4 : (temps de disponibilité ÷ temps d'exploitation prévu) × 100"],
    },
    {
      title: "Temps moyen d'immobilisation", ref: "Tableau 4, p. 31 · exemple d'entraînement",
      enonce: "Exemple fictif : sur un trimestre, le parc a connu 8 pannes pour un total de 56 heures d'immobilisation. Quel est le temps moyen d'immobilisation (en heures) ?",
      answer: 7, unit: "h", tolerance: 0.05,
      steps: ["Temps moyen = total des heures d'immobilisation ÷ nombre de pannes", "56 ÷ 8 = 7 heures par panne"],
    },
    {
      title: "Taux de respect des délais", ref: "Tableau 4, p. 31 · exemple d'entraînement",
      enonce: "Exemple fictif : en un mois, 40 vols ont été traités, dont 34 dans les délais. Quel est le taux de respect des délais (en %) ?",
      answer: 85, unit: "%", tolerance: 0.5,
      steps: ["Taux = (opérations dans les délais ÷ total des opérations) × 100", "(34 ÷ 40) × 100 = 85 %"],
    },
    {
      title: "Qualité du traitement du fret", ref: "Tableau 4, p. 31 · exemple d'entraînement",
      enonce: "Exemple fictif : sur 2 000 colis traités, 10 ont été endommagés, perdus ou mal orientés. Quel est le taux d'anomalies (en %) ?",
      answer: 0.5, unit: "%", tolerance: 0.01,
      steps: ["Taux = (colis endommagés, perdus ou mal orientés ÷ total des colis traités) × 100", "(10 ÷ 2 000) × 100 = 0,5 %", "Plus ce taux est bas, meilleure est la qualité"],
    },
    {
      title: "Disponibilité du parc", ref: "Tableau 4, p. 31 · exemple d'entraînement",
      enonce: "Exemple fictif : 4 tracteurs devaient chacun travailler 150 heures dans le mois (600 heures au total). Les immobilisations cumulées ont été de 48 heures. Quel est le taux de disponibilité du parc (en %) ?",
      answer: 92, unit: "%", tolerance: 0.5,
      steps: ["Temps prévu = 4 × 150 = 600 heures", "Temps disponible = 600 − 48 = 552 heures", "(552 ÷ 600) × 100 = 92 %"],
    },
    {
      title: "Durée du plan de mise en œuvre", ref: "Ch. IV, 2.2, p. 38",
      enonce: "Dans votre plan, combien de mois couvrent ensemble la première étape (court terme) et la deuxième étape (moyen terme) ?",
      answer: 6, unit: "mois", tolerance: 0,
      steps: ["Court terme : 0 à 3 mois", "Moyen terme : 3 à 6 mois", "Soit 6 mois avant la troisième étape (au-delà de 6 mois)"],
    },
  ],

  /* ═══════════════════════════ PITCH ═══════════════════════════ */
  pitch: [
    { label: "Introduction", seconds: 90, content: ["Saluer les membres du jury, l'enseignant conseil (Dr Ifounga Ifounga Ake) et le tuteur (M. Rodrigue Nze), puis présenter le thème.", "Contexte : croissance du transport aérien, assistance au sol maillon essentiel ; la performance dépend aussi des engins.", "Problématique : quel est l'impact des défaillances des engins sur la qualité des services d'assistance au sol de Corex International ?", "Deux hypothèses, l'objectif général et le plan en deux parties."] },
    { label: "Partie 1 — Corex et le stage", seconds: 150, content: ["Corex : créée en 2009 par M. Jacob Cabinda, SA au capital de 10 M FCFA, 70+ collaborateurs, Libreville et Port-Gentil.", "Organisation : DG, trois pôles (Handling, Commercial, Financier) et services d'appui.", "Pôle Handling : chaîne en 5 étapes ; tâches : vol NAM, pointage des colis, manutention, suivi du fret.", "Diagnostic : équipements adaptés et personnel expérimenté, mais pannes, indisponibilités et engins limités en opérations simultanées."] },
    { label: "Partie 2 — Méthode et analyse", seconds: 150, content: ["Démarche qualitative : recherche documentaire, observation directe, entretiens (9 questions).", "Ishikawa en 5 catégories : Matériel, Main-d'œuvre, Méthodes, Maintenance, Milieu.", "Concepts : équipements (Rodrigue), performance (Porter), maintenance préventive et corrective.", "Indicateurs proposés : disponibilité, pannes, temps d'immobilisation, respect des délais, qualité, sécurité."] },
    { label: "Résultats et suggestions", seconds: 150, content: ["Mécanisme : défaillance → désorganisation → baisse de performance.", "H1 confirmée (qualitatif) ; H2 partiellement confirmée : ressources présentes, mobilisation à renforcer.", "5 suggestions : maintenance préventive, registre de disponibilité, formation, communication, indicateurs.", "Plan : 0-3 mois, 3-6 mois, au-delà de 6 mois, avec responsables et suivi par les indicateurs."] },
    { label: "Conclusion", seconds: 60, content: ["Réponse à la problématique : les défaillances affectent la qualité des services (retards, pertes de temps, désorganisation).", "Limites : qualitatif, 3 mois, causes non hiérarchisées.", "Ouverture : étude quantitative du coût des pannes et de la satisfaction des compagnies. Remercier le jury."] },
  ],
};
