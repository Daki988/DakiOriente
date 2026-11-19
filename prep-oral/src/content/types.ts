export type Track = "gestion" | "management";

/** Question de relance du jury, avec la piste de réponse */
export type Relance = { q: string; a: string };

type Base = {
  id: string;
  /** Partie du rapport : sert au bilan par partie et au lien vers la fiche */
  part: string;
  q: string;
  /** "tres" = quasi certaine au jury, "probable" = souvent posée */
  proba: "tres" | "probable";
  /** Référence dans le rapport */
  ref: string;
  relance?: Relance;
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

export type Fiche = {
  part: string;
  title: string;
  pages: string;
  /** L'idée à retenir en une phrase */
  essentiel: string;
  sections: { h: string; items: string[] }[];
  chiffres?: { label: string; value: string }[];
  /** Les pièges classiques à l'oral sur cette partie */
  pieges?: string[];
};

export type Notion = {
  term: string;
  def: string;
  formula?: string;
  /** Comment la notion s'applique dans le rapport */
  inReport: string;
  ref: string;
};

export type Flashcard = { front: string; back: string; ref: string };

export type Calcul = {
  title: string;
  enonce: string;
  answer: number;
  unit: string;
  /** Écart toléré (valeur absolue) */
  tolerance: number;
  steps: string[];
  ref: string;
};

export type PitchStep = { label: string; seconds: number; content: string[] };

export type TrackContent = {
  track: Track;
  label: string;
  memoire: string;
  title: string;
  icon: string;
  tagline: string;
  parts: string[];
  questions: Question[];
  fiches: Fiche[];
  notions: Notion[];
  flashcards: Flashcard[];
  calculs: Calcul[];
  pitch: PitchStep[];
};
