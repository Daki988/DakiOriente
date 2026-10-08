// Questionnaire d'orientation RIASEC (version lycée, démo). Chaque choix renforce un ou deux profils.
export type Choice = { t: string; icon: string; codes: string[] };
export type Question = { q: string; choices: Choice[] };

export const QUESTIONS: Question[] = [
  { q: "Quelle activité préfères-tu ?", choices: [
    { t: "Travailler en équipe sur des projets", icon: "users", codes: ["S", "E"] },
    { t: "Résoudre des problèmes techniques", icon: "cpu", codes: ["I", "R"] },
    { t: "Exprimer ma créativité", icon: "palette", codes: ["A"] },
    { t: "Organiser et planifier des activités", icon: "clipboard-list", codes: ["C", "E"] } ] },
  { q: "Pendant ton temps libre, tu préfères…", choices: [
    { t: "Bricoler, réparer, construire", icon: "wrench", codes: ["R"] },
    { t: "Lire, me documenter, comprendre", icon: "book-open", codes: ["I"] },
    { t: "Dessiner, écrire, faire de la musique", icon: "music", codes: ["A"] },
    { t: "Aider mes amis ou ma famille", icon: "heart-handshake", codes: ["S"] } ] },
  { q: "Quelle matière t'attire le plus ?", choices: [
    { t: "Mathématiques", icon: "sigma", codes: ["I", "C"] },
    { t: "Sciences de la vie (SVT)", icon: "leaf", codes: ["I", "S"] },
    { t: "Français, langues, philosophie", icon: "languages", codes: ["A", "S"] },
    { t: "Économie, gestion", icon: "chart-line", codes: ["E", "C"] } ] },
  { q: "Dans un projet de groupe, ton rôle naturel est…", choices: [
    { t: "Le leader qui motive l'équipe", icon: "megaphone", codes: ["E"] },
    { t: "L'analyste qui vérifie les données", icon: "search", codes: ["I", "C"] },
    { t: "Le créatif qui propose des idées", icon: "lightbulb", codes: ["A"] },
    { t: "Celui qui fabrique et met en œuvre", icon: "hammer", codes: ["R"] } ] },
  { q: "Quel environnement de travail te plaît ?", choices: [
    { t: "Un bureau calme et bien organisé", icon: "briefcase", codes: ["C"] },
    { t: "Le terrain, en plein air", icon: "mountain", codes: ["R"] },
    { t: "Un laboratoire ou un centre de recherche", icon: "flask-conical", codes: ["I"] },
    { t: "Au contact du public", icon: "users", codes: ["S", "E"] } ] },
  { q: "Qu'est-ce qui te rendrait le plus fier·e ?", choices: [
    { t: "Soigner ou accompagner quelqu'un", icon: "stethoscope", codes: ["S"] },
    { t: "Créer mon entreprise", icon: "rocket", codes: ["E"] },
    { t: "Inventer une solution technique", icon: "cpu", codes: ["I", "R"] },
    { t: "Gérer un budget sans erreur", icon: "calculator", codes: ["C"] } ] },
  { q: "Tu dois apprendre quelque chose de nouveau :", choices: [
    { t: "Je teste directement en pratiquant", icon: "hand", codes: ["R"] },
    { t: "Je lis et je prends des notes structurées", icon: "notebook-pen", codes: ["C", "I"] },
    { t: "J'en discute avec d'autres", icon: "message-circle", codes: ["S"] },
    { t: "J'imagine ma propre façon de faire", icon: "sparkles", codes: ["A"] } ] },
  { q: "Quel métier te fait rêver ?", choices: [
    { t: "Ingénieur·e ou architecte", icon: "hard-hat", codes: ["R", "I"] },
    { t: "Médecin, infirmier·e, psychologue", icon: "stethoscope", codes: ["S", "I"] },
    { t: "Chef·fe d'entreprise, commercial·e", icon: "trending-up", codes: ["E"] },
    { t: "Designer, journaliste, artiste", icon: "palette", codes: ["A"] } ] },
  { q: "Quelle qualité te décrit le mieux ?", choices: [
    { t: "Rigoureux·se", icon: "list-checks", codes: ["C"] },
    { t: "Curieux·se", icon: "telescope", codes: ["I"] },
    { t: "Persuasif·ve", icon: "megaphone", codes: ["E"] },
    { t: "À l'écoute", icon: "ear", codes: ["S"] } ] },
  { q: "Un week-end idéal, c'est…", choices: [
    { t: "Une randonnée ou un match", icon: "mountain", codes: ["R"] },
    { t: "Un atelier créatif ou un concert", icon: "music", codes: ["A"] },
    { t: "Organiser un événement associatif", icon: "calendar-check", codes: ["E", "S"] },
    { t: "Un documentaire ou un jeu de logique", icon: "brain", codes: ["I"] } ] },
];
