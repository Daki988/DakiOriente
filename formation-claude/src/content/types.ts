/** Blocs de contenu d'une section de cours. Le texte accepte le `code en ligne` entre accents graves. */
export type Block =
  | { t: "p"; text: string }
  | { t: "list"; items: string[]; ordered?: boolean }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "code"; title?: string; text: string }
  | { t: "callout"; tone: "warn" | "tip" | "key"; title: string; text: string }
  | { t: "compare"; flou: string; precis: string };

export type Section = { id: string; title: string; blocks: Block[] };

export type Question = {
  id: string;
  /** Section à laquelle se rattache la question (contrôle de fin de section) */
  section: string;
  q: string;
  /** La première option est la bonne ; l'ordre est mélangé à l'affichage */
  options: [string, string, string, string];
  explain: string;
};

export type Module = {
  id: string;
  num: number;
  title: string;
  duration: string;
  key?: boolean;
  objectif: string;
  pourquoi: string;
  sections: Section[];
  retenir: string[];
  exercice: { steps: string[]; resultat: string };
  competences: string[];
  questions: Question[];
};
