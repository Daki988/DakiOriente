import type { Question } from "./types";

const T = {
  role: "Posture & rôle",
  equipe: "Organisation de l'équipe",
  adhesion: "Adhésion & conduite du changement",
  communication: "Communication & animation",
  suivi: "Suivi & pilotage",
};

export const management: Question[] = [
  // ───────── Posture & rôle ─────────
  {
    id: "m01", kind: "oral", theme: T.role, proba: "tres", ref: "Introduction, p. 3",
    q: "Quel est votre rôle dans le magasin et comment le légitimez-vous auprès de l'équipe ?",
    points: [
      "Responsable d'établissement marchand par délégation du gérant ; alternante comme 6 autres membres de l'équipe.",
      "Le gérant valide les décisions et garde le budget et les commandes ; je coordonne, suis les indicateurs, anime briefings et challenges.",
      "Légitimité par l'exemple (démonstrations en caisse), les résultats du projet de septembre et l'écoute.",
    ],
    tip: "Assume ta position d'alternante qui manage des pairs : c'est un point que le jury creuse.",
  },
  {
    id: "m02", kind: "qcm", theme: T.role, proba: "tres", ref: "Introduction, p. 3",
    q: "Comment est composée l'équipe du magasin ?",
    options: [
      "10 salariés : 3 CDI et 7 alternants, autour du gérant",
      "10 salariés : 7 CDI et 3 alternants",
      "7 salariés : 3 CDI et 4 alternants",
      "12 salariés dont 2 étudiants saisonniers",
    ],
    explain: "CDI : Djaya-Perle, Peyo et Ismail. Avec 7 alternants sur 10, tout le monde n'est jamais présent en même temps.",
  },
  {
    id: "m03", kind: "oral", theme: T.role, proba: "tres", ref: "Conclusion, p. 19",
    q: "Qu'avez-vous appris sur vous en tant que future manager ?",
    points: [
      "Passer d'une vision de terrain à une vision de gestion.",
      "Relier les chiffres aux gestes de l'équipe (35 centimes par client, 12 clients de plus).",
      "Reconnaître les limites de ma position : pas accès à tous les chiffres, confronter avec le gérant.",
      "Capacité à analyser, prévoir et ajuster, que je veux développer pour diriger un magasin.",
    ],
  },
  {
    id: "m04", kind: "qcm", theme: T.role, proba: "probable", ref: "3.5, p. 18",
    q: "Comment se répartissent les rôles dans le suivi des actions ?",
    options: [
      "Le gérant valide les ajustements ; les 3 référents suivent leur indicateur ; je centralise et anime",
      "Je décide seule de tout, le gérant est informé",
      "Chaque alternant suit un indicateur différent",
      "Le gérant fait le tableau de bord, je le présente",
    ],
    explain: "Cette répartition permet de suivre les quatre actions en même temps sans que tout repose sur une seule personne.",
  },

  // ───────── Organisation de l'équipe ─────────
  {
    id: "m05", kind: "qcm", theme: T.equipe, proba: "tres", ref: "1.3, p. 7",
    q: "Qui sont les référents de chaque orientation ?",
    options: [
      "Djaya-Perle : fidélisation · Peyo : panier moyen · Ismail : livraison",
      "Peyo : fidélisation · Ismail : panier moyen · Djaya-Perle : livraison",
      "Ismail : fidélisation · Djaya-Perle : panier moyen · Peyo : livraison",
      "Le gérant est référent des trois orientations",
    ],
    explain: "Un référent par orientation, choisi parmi les CDI. Les alternants participent par équipes, en caisse et en rayon.",
  },
  {
    id: "m06", kind: "oral", theme: T.equipe, proba: "tres", ref: "1.3, p. 7",
    q: "Pourquoi avoir choisi des référents parmi les CDI ?",
    points: [
      "Ce sont les personnes les plus présentes et stables, alors que les alternants alternent école et magasin.",
      "Ils assurent la continuité au quotidien et me signalent les difficultés.",
      "Ça responsabilise et valorise les CDI, et ça évite que tout repose sur moi.",
    ],
  },
  {
    id: "m07", kind: "qcm", theme: T.equipe, proba: "probable", ref: "1.2, p. 7",
    q: "Combien de personnes sont présentes en moyenne en même temps au magasin ?",
    options: [
      "2 à 3 personnes (1 100 heures/mois pour 102 h d'ouverture/semaine)",
      "5 à 6 personnes",
      "Toute l'équipe le samedi",
      "1 seule personne l'après-midi",
    ],
    explain: "Contrainte forte : c'est pour cela que la vente en ligne a été écartée et que les livraisons sont placées sur les créneaux calmes.",
  },
  {
    id: "m08", kind: "oral", theme: T.equipe, proba: "tres", ref: "1.1 SWOT, p. 4 · 1.4, p. 8",
    q: "Comment gérez-vous les plannings avec 7 alternants ?",
    points: [
      "Plannings complexes à cause des rythmes d'alternance : c'est une faiblesse identifiée dans le SWOT.",
      "Règle légale : les salariés ne travaillent pas le dimanche après 13 h ; règles propres aux apprentis.",
      "Jours calmes : garder une personne disponible pour la livraison sans dégarnir la caisse.",
      "Réunions sur deux créneaux et groupe WhatsApp pour informer les absents.",
    ],
  },
  {
    id: "m09", kind: "qcm", theme: T.equipe, proba: "tres", ref: "3.2, p. 15",
    q: "Quel a été le taux de rotation du personnel entre février et juillet 2026 ?",
    options: ["30 % (3 départs)", "10 % (1 départ)", "50 % (5 départs)", "0 %"],
    explain: "Chaque départ a désorganisé les plannings et mobilisé un tuteur 2 semaines, au détriment des actions commerciales. Aucun départ depuis août 2026.",
  },
  {
    id: "m10", kind: "oral", theme: T.equipe, proba: "tres", ref: "3.2, p. 15",
    q: "Comment comptez-vous limiter le turnover ?",
    points: [
      "Constat : 3 départs en 6 mois (30 %) qui ont désorganisé l'équipe.",
      "Donner du sens : expliquer pourquoi fidélité et panier protègent le magasin et nos emplois.",
      "Reconnaissance : progrès annoncés au briefing, réussites récompensées (challenges).",
      "Accompagnement : binôme et démonstration pour les moins à l'aise, entretien individuel si besoin.",
      "Pas d'heures supplémentaires demandées.",
    ],
    tip: "Le rapport constate le turnover sans plan dédié : montre que tes leviers d'adhésion y répondent.",
  },
  {
    id: "m11", kind: "qcm", theme: T.equipe, proba: "probable", ref: "1.3, p. 7",
    q: "Comment organisez-vous les livraisons pour ne pas désorganiser le magasin ?",
    options: [
      "Regroupées sur les créneaux calmes de l'après-midi",
      "Faites par le gérant le dimanche après-midi",
      "Confiées à une plateforme de livraison",
      "Faites le soir après la fermeture",
    ],
    explain: "Un salarié qui livre n'est plus au magasin : c'est pour cela que la livraison est la priorité n°3, lancée au 2nd semestre.",
  },

  // ───────── Adhésion & conduite du changement ─────────
  {
    id: "m12", kind: "oral", theme: T.adhesion, proba: "tres", ref: "1.4, p. 8",
    q: "Comment allez-vous faire adhérer l'équipe à vos orientations ?",
    points: [
      "Réunion d'équipe en décembre 2026 sur deux créneaux pour toucher tous les alternants.",
      "Contenu : le constat, le sens, ce qui change pour chacun, le rôle des référents.",
      "Préparer au changement : repères simples (1-2 cartes/jour), fiches mémo, rappel au briefing, challenge matin vs après-midi.",
      "Résultats affichés en réserve et sur WhatsApp ; démonstration en caisse et binôme.",
    ],
    tip: "Structure : informer → former → animer → mesurer.",
  },
  {
    id: "m13", kind: "qcm", theme: T.adhesion, proba: "tres", ref: "1.4, p. 8",
    q: "Pourquoi organiser la réunion de décembre 2026 sur deux créneaux ?",
    options: [
      "Pour toucher les alternants présents à des jours différents",
      "Pour séparer CDI et alternants",
      "Pour ne pas fermer le magasin",
      "Parce que le gérant ne peut venir qu'à un seul",
    ],
    explain: "Avec 7 alternants sur 10, tout le monde n'est jamais présent en même temps.",
  },
  {
    id: "m14", kind: "oral", theme: T.adhesion, proba: "tres", ref: "1.4, p. 8",
    q: "Quelles réticences attendez-vous et comment y répondrez-vous ?",
    points: [
      "Certains alternants craignent de ralentir la file d'attente en proposant la carte.",
      "Réponse : une phrase courte à dire au moment de l'encaissement.",
      "Règle d'ouverture de la 2e caisse dès que la file s'allonge.",
      "Inscription directe sur l'application quand la file est calme.",
    ],
  },
  {
    id: "m15", kind: "qcm", theme: T.adhesion, proba: "tres", ref: "1.4, p. 8",
    q: "Quels sont les trois signaux qui montrent que l'équipe adhère ?",
    options: [
      "La carte est proposée sans rappel, les alternants posent des questions/proposent des idées, les indicateurs progressent",
      "Personne ne se plaint, le CA augmente, le gérant est satisfait",
      "Tout le monde vient à la réunion, signe la charte et fait des heures en plus",
      "Le taux d'absentéisme baisse, les ventes augmentent, la démarque baisse",
    ],
    explain: "Si un signal manque : entretien individuel avec les personnes concernées pour comprendre ce qui les freine.",
  },
  {
    id: "m16", kind: "qcm", theme: T.adhesion, proba: "probable", ref: "1.4, p. 8",
    q: "Quel repère quotidien simple avez-vous donné pour la carte de fidélité ?",
    options: ["1 à 2 cartes par personne et par jour", "10 cartes par jour et par caisse", "50 cartes par semaine pour l'équipe", "1 carte par heure"],
    explain: "Des repères simples, issus de ce qui a fonctionné en septembre 2026.",
  },
  {
    id: "m17", kind: "oral", theme: T.adhesion, proba: "tres", ref: "2.4, p. 13",
    q: "Quels arguments utilisez-vous pour motiver l'équipe sur le prévisionnel ?",
    points: [
      "La sécurité : un magasin au-dessus de son seuil dure, donc les emplois et contrats d'alternance continuent.",
      "La reconnaissance : progrès annoncés chaque semaine au briefing, réussites récompensées par les challenges.",
      "La preuve : en septembre 2026, +5,5 % sur le snacking et 43 nouvelles cartes en un mois.",
    ],
  },
  {
    id: "m18", kind: "oral", theme: T.adhesion, proba: "tres", ref: "2.4, p. 13",
    q: "Un salarié vous demande : « Qu'est-ce qu'on y gagne ? » ou « On va devoir travailler plus ? ». Que répondez-vous ?",
    points: [
      "« Qu'est-ce qu'on y gagne ? » : récompenses collectives du budget challenges (500 €) et stabilité du magasin.",
      "« Travailler plus ? » : non, le prévisionnel ne prévoit aucune heure supplémentaire ; les objectifs reposent sur des gestes en caisse.",
      "« Objectif trop élevé ? » : le calcul, 35 centimes de plus par client, un produit complémentaire de temps en temps.",
    ],
    tip: "Le jury peut jouer le salarié : réponds calmement, avec le chiffre concret.",
  },
  {
    id: "m19", kind: "qcm", theme: T.adhesion, proba: "probable", ref: "1.4, p. 8",
    q: "Comment accompagnez-vous les alternants les moins à l'aise avec la vente ?",
    options: [
      "Une démonstration en caisse avant le lancement, puis un accompagnement en binôme",
      "Une formation e-learning de l'enseigne",
      "Ils restent en rayon et ne vont pas en caisse",
      "Un objectif de cartes réduit de moitié",
    ],
    explain: "S'ajoutent les fiches mémo et le rappel au briefing.",
  },
  {
    id: "m20", kind: "qcm", theme: T.adhesion, proba: "probable", ref: "1.2, p. 7",
    q: "En septembre 2026, la proposition de la carte était oubliée lors des pics. Quelle réponse prévoyez-vous ?",
    options: [
      "Un rappel régulier au briefing et un challenge renouvelé chaque mois",
      "Une sanction pour les oublis",
      "La suppression de l'objectif carte pendant les pics",
      "Un affichage obligatoire sur chaque caisse uniquement",
    ],
    explain: "Risque identifié : l'essoufflement de l'équipe.",
  },
  {
    id: "m21", kind: "qcm", theme: T.adhesion, proba: "tres", ref: "1.4, p. 8",
    q: "Quel type de challenge avez-vous mis en place ?",
    options: [
      "Un challenge collectif entre l'équipe du matin et celle de l'après-midi",
      "Un classement individuel du meilleur vendeur",
      "Un challenge entre magasins Carrefour City de Toulouse",
      "Une prime individuelle par carte créée",
    ],
    explain: "Collectif pour renforcer la cohésion ; récompenses d'environ 40 € par challenge mensuel (budget 500 €).",
  },

  // ───────── Communication & animation ─────────
  {
    id: "m22", kind: "oral", theme: T.communication, proba: "tres", ref: "2.4, p. 13",
    q: "Que présentez-vous à l'équipe, et que gardez-vous confidentiel ?",
    points: [
      "Confidentiel : le compte de résultat complet (salaires…), qui relève de la gestion du gérant.",
      "Présenté : l'objectif de CA par jour (~5 000 €, objectif du mois affiché en réserve).",
      "Le seuil de 3 935 €/jour, pour comprendre pourquoi les jours calmes comptent.",
      "Le panier moyen (12,24 €) et la carte de fidélité (45 %).",
    ],
  },
  {
    id: "m23", kind: "qcm", theme: T.communication, proba: "tres", ref: "2.4, p. 13",
    q: "Comment traduisez-vous l'objectif de +150 € par jour pour l'équipe ?",
    options: [
      "« Environ 12 clients de plus, ou 35 centimes de plus dans le panier de chaque client »",
      "« 3 % de croissance du chiffre d'affaires annuel »",
      "« 54 000 € de CA supplémentaire sur l'année »",
      "« 1 000 € de plus par semaine »",
    ],
    explain: "Traduire les chiffres en gestes concrets favorise l'adhésion. Support : graphique du CA mois par mois.",
  },
  {
    id: "m24", kind: "qcm", theme: T.communication, proba: "probable", ref: "1.4, p. 8 · 2.4, p. 13",
    q: "Comment informez-vous les alternants absents ?",
    options: [
      "Résultats publiés sur le groupe WhatsApp de l'équipe, en plus de l'affichage en réserve",
      "Par e-mail hebdomadaire du gérant",
      "Ils sont informés à leur retour seulement",
      "Par courrier",
    ],
    explain: "Chaque mois : comparaison simple objectif du mois / chiffre réalisé.",
  },
  {
    id: "m25", kind: "oral", theme: T.communication, proba: "tres", ref: "3.5, p. 18",
    q: "Comment communiquez-vous les résultats, notamment quand un indicateur recule ?",
    points: [
      "Chaque lundi au briefing : les 4 indicateurs, en commençant par ce qui a progressé.",
      "Tableau affiché en réserve et publié sur WhatsApp.",
      "Objectif intermédiaire atteint (ex. 40 % de cartes fin juin) : félicitations + récompense.",
      "Indicateur qui recule : chercher la cause avec les personnes concernées, sans chercher de coupable.",
    ],
  },
  {
    id: "m26", kind: "qcm", theme: T.communication, proba: "probable", ref: "3.4, p. 17",
    q: "Qu'intégrez-vous chaque jour dans le briefing ?",
    options: [
      "Un point rapide sur la carte de fidélité et le panier moyen de la veille",
      "La lecture du compte de résultat",
      "Le planning du mois suivant",
      "Le classement individuel des vendeurs",
    ],
    explain: "Le CA de la veille est aussi comparé au repère de 5 000 €/jour.",
  },
  {
    id: "m27", kind: "oral", theme: T.communication, proba: "probable", ref: "1.4, p. 8",
    q: "Que dites-vous concrètement lors de la réunion de décembre ?",
    points: [
      "Le constat : concurrence proche, CA variable (jours à 4 000 € et d'autres à 6 000 €).",
      "Le sens : fidélité et panier moyen protègent le magasin, donc nos emplois.",
      "Ce qui change : proposer la carte à chaque client, suggérer un produit complémentaire, parler livraison aux clients âgés.",
      "Le rôle des référents : à qui s'adresser pour chaque orientation.",
    ],
  },

  // ───────── Suivi & pilotage ─────────
  {
    id: "m28", kind: "oral", theme: T.suivi, proba: "tres", ref: "3.5, p. 18",
    q: "Comment suivez-vous la mise en œuvre de vos actions ?",
    points: [
      "Chaque lundi : tableau de bord (4 indicateurs, objectif, écart).",
      "Chaque fin de mois : bilan avec le gérant et ajustements.",
      "Indicateur sous l'objectif 2 semaines de suite : recherche de la cause avec l'équipe avant de modifier l'action.",
      "Bilan complet fin juin 2027 : poursuivre, renforcer ou abandonner chaque action.",
    ],
  },
  {
    id: "m29", kind: "qcm", theme: T.suivi, proba: "probable", ref: "3.5, p. 18",
    q: "Que faites-vous si un indicateur reste sous son objectif deux semaines de suite ?",
    options: [
      "Chercher la cause avec l'équipe concernée avant de modifier l'action",
      "Abandonner immédiatement l'action",
      "Doubler l'objectif pour rattraper",
      "Attendre le bilan de fin d'année",
    ],
    explain: "Méthode déjà appliquée à mi-parcours du projet de septembre.",
  },
  {
    id: "m30", kind: "qcm", theme: T.suivi, proba: "probable", ref: "3.5, p. 17",
    q: "Qui est responsable de l'action « produits à date courte » (Too Good To Go) ?",
    options: ["L'équipe du rayon frais", "Ismail", "Le gérant seul", "Peyo"],
    explain: "Échéance 31 mars 2027 ; indicateurs : paniers vendus par jour et démarque du frais.",
  },
  {
    id: "m31", kind: "oral", theme: T.suivi, proba: "probable", ref: "1.4, p. 8",
    q: "Comment gérez-vous un collaborateur qui n'applique pas les nouvelles consignes ?",
    points: [
      "Je l'observe d'abord en caisse pour objectiver.",
      "Entretien individuel pour comprendre ce qui le freine (peur de ralentir la file, manque d'aisance…).",
      "Solution adaptée : démonstration, binôme, phrase courte, fiche mémo.",
      "Jamais de recherche de coupable : on cherche la cause.",
    ],
  },
];
