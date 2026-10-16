// Questionnaire d'orientation RIASEC (version lycée). Chaque choix renforce un ou deux profils.
// Photos : Pexels (licence libre), crédits dans public/images/credits-orientation.json.
export type Choice = { t: string; icon: string; codes: string[]; img?: string };
export type Question = { q: string; choices: Choice[] };

const img = (id: string) => `/images/orientation/${id}.webp`;

export const QUESTIONS: Question[] = [
  { q: "Quelle activité préfères-tu ?", choices: [
    { t: "Travailler en équipe sur des projets", icon: "users", codes: ["S", "E"], img: img("9429550") },
    { t: "Résoudre des problèmes techniques", icon: "cpu", codes: ["I", "R"], img: img("11679118") },
    { t: "Exprimer ma créativité", icon: "palette", codes: ["A"], img: img("3880749") },
    { t: "Organiser et planifier des activités", icon: "clipboard-list", codes: ["C", "E"], img: img("19915770") } ] },
  { q: "Pendant ton temps libre, tu préfères…", choices: [
    { t: "Bricoler, réparer, construire", icon: "wrench", codes: ["R"], img: img("11242855") },
    { t: "Lire, me documenter, comprendre", icon: "book-open", codes: ["I"], img: img("6550399") },
    { t: "Dessiner, écrire, faire de la musique", icon: "music", codes: ["A"], img: img("20576428") },
    { t: "Aider les autres, faire du bénévolat", icon: "heart-handshake", codes: ["S"], img: img("6646770") } ] },
  { q: "Quelle matière t'attire le plus ?", choices: [
    { t: "Mathématiques", icon: "sigma", codes: ["I", "C"], img: img("6238297") },
    { t: "Sciences de la vie (SVT), physique-chimie", icon: "leaf", codes: ["I", "S"], img: img("3938022") },
    { t: "Français, langues, philosophie", icon: "languages", codes: ["A", "S"], img: img("31245740") },
    { t: "Économie, gestion", icon: "chart-line", codes: ["E", "C"], img: img("7173026") } ] },
  { q: "Dans un projet de groupe, ton rôle naturel est…", choices: [
    { t: "Le leader qui motive l'équipe", icon: "megaphone", codes: ["E"], img: img("6172586") },
    { t: "L'analyste qui vérifie les données", icon: "search", codes: ["I", "C"], img: img("6592678") },
    { t: "Le créatif qui propose des idées", icon: "lightbulb", codes: ["A"], img: img("6925422") },
    { t: "Celui qui fabrique et met en œuvre", icon: "hammer", codes: ["R"], img: img("16850260") } ] },
  { q: "Quel environnement de travail te plaît ?", choices: [
    { t: "Un bureau calme et bien organisé", icon: "briefcase", codes: ["C"], img: img("5240008") },
    { t: "Le terrain, en plein air", icon: "mountain", codes: ["R"], img: img("34526422") },
    { t: "Un laboratoire ou un atelier technique", icon: "flask-conical", codes: ["I"], img: img("3825580") },
    { t: "Au contact du public", icon: "users", codes: ["S", "E"], img: img("6592729") } ] },
  { q: "Qu'est-ce qui te rendrait le plus fier·e ?", choices: [
    { t: "Soigner ou accompagner quelqu'un", icon: "stethoscope", codes: ["S"], img: img("33055499") },
    { t: "Créer mon entreprise", icon: "rocket", codes: ["E"], img: img("3861923") },
    { t: "Inventer une solution technique", icon: "cpu", codes: ["I", "R"], img: img("442151") },
    { t: "Gérer un budget sans erreur", icon: "calculator", codes: ["C"], img: img("8296974") } ] },
  { q: "Tu dois apprendre quelque chose de nouveau :", choices: [
    { t: "Je teste directement en pratiquant", icon: "hand", codes: ["R"], img: img("1154089") },
    { t: "Je lis et je prends des notes structurées", icon: "notebook-pen", codes: ["C", "I"], img: img("9158712") },
    { t: "J'en discute avec d'autres", icon: "message-circle", codes: ["S"], img: img("34162714") },
    { t: "J'imagine ma propre façon de faire", icon: "sparkles", codes: ["A"], img: img("5682054") } ] },
  { q: "Quel métier te fait rêver ?", choices: [
    { t: "Ingénieur·e ou architecte", icon: "hard-hat", codes: ["R", "I"], img: img("37198875") },
    { t: "Médecin, infirmier·e, psychologue", icon: "stethoscope", codes: ["S", "I"], img: img("4989174") },
    { t: "Chef·fe d'entreprise, commercial·e", icon: "trending-up", codes: ["E"], img: img("9301840") },
    { t: "Artiste, designer, journaliste", icon: "palette", codes: ["A"], img: img("36707740") } ] },
  { q: "Quelle qualité te décrit le mieux ?", choices: [
    { t: "Rigoureux·se", icon: "list-checks", codes: ["C"], img: img("7428866") },
    { t: "Curieux·se", icon: "telescope", codes: ["I"], img: img("11025018") },
    { t: "Persuasif·ve", icon: "megaphone", codes: ["E"], img: img("3861811") },
    { t: "À l'écoute", icon: "ear", codes: ["S"], img: img("5234504") } ] },
  { q: "Un week-end idéal, c'est…", choices: [
    { t: "Un match ou une randonnée", icon: "mountain", codes: ["R"], img: img("19416414") },
    { t: "Un atelier créatif ou un concert", icon: "music", codes: ["A"], img: img("3880749") },
    { t: "Organiser un événement associatif", icon: "calendar-check", codes: ["E", "S"], img: img("6646770") },
    { t: "Un documentaire ou un jeu de logique", icon: "brain", codes: ["I"], img: img("6238297") } ] },
];
