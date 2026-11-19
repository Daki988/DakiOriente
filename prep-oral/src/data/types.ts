export type Track = "gestion" | "management";

type Base = {
  id: string;
  /** Thème affiché dans le bilan par thème */
  theme: string;
  q: string;
  /** "tres" = quasi certaine au jury, "probable" = souvent posée */
  proba: "tres" | "probable";
  /** Référence dans le rapport (version 2) */
  ref: string;
};

export type QcmQuestion = Base & {
  kind: "qcm";
  /** La première option est la bonne ; l'ordre est mélangé à l'affichage */
  options: [string, string, string, string];
  explain: string;
};

export type OralQuestion = Base & {
  kind: "oral";
  /** Points clés attendus dans la réponse */
  points: string[];
  /** Conseil de formulation à l'oral */
  tip?: string;
};

export type Question = QcmQuestion | OralQuestion;
