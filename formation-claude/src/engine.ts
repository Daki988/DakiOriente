import { MODULES } from "./content";
import type { Module, Question } from "./content/types";

export const PASS = 0.8;
export const QUIZ_SIZE = 8;
export const FINAL_SIZE = 30;
export const FINAL_MINUTES = 40;
export const REVIEW_SIZE = 10;

export type ModState = {
  /** Nombre de sections validées (leçon), dans l'ordre */
  done: number;
  passed: boolean;
  best: number; // 0 → 1
  attempts: number;
  /** Sections à relire après un quiz raté (bloque un nouvel essai tant qu'elles ne sont pas relues) */
  toReview: string[];
  skills: string[];
};
export type Store = {
  mods: Record<string, ModState>;
  final: {
    passed: boolean; best: number; attempts: number; date?: number; name?: string;
    /** Critères pratiques de la grille de certification (module 9) cochés */
    grille?: string[];
    /** Après un échec, une révision express est exigée avant de retenter */
    needReview?: boolean;
    history?: { date: number; score: number; seconds: number }[];
  };
  flashKnown: string[];
};

const KEY = "formation-claude-code:v1";
const emptyMod = (): ModState => ({ done: 0, passed: false, best: 0, attempts: 0, toReview: [], skills: [] });

export function load(): Store {
  const base: Store = { mods: {}, final: { passed: false, best: 0, attempts: 0 }, flashKnown: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<Store>;
      Object.assign(base, s);
      base.final = { ...{ passed: false, best: 0, attempts: 0 }, ...s.final };
    }
  } catch {
    /* stockage indisponible */
  }
  for (const m of MODULES) base.mods[m.id] = { ...emptyMod(), ...base.mods[m.id] };
  return base;
}

export function save(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* rien */
  }
}

export function update(fn: (s: Store) => void): Store {
  const s = load();
  fn(s);
  save(s);
  return s;
}

export function resetAll() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* rien */
  }
}

export function isUnlocked(s: Store, i: number) {
  return i === 0 || s.mods[MODULES[i - 1].id].passed;
}

export function lessonDone(s: Store, m: Module) {
  return s.mods[m.id].done >= m.sections.length;
}

export type Status = "locked" | "todo" | "lesson" | "quiz" | "review" | "passed";
export function statusOf(s: Store, i: number): Status {
  const m = MODULES[i];
  const st = s.mods[m.id];
  if (!isUnlocked(s, i)) return "locked";
  if (st.passed) return "passed";
  if (st.toReview.length) return "review";
  if (lessonDone(s, m)) return "quiz";
  if (st.done > 0) return "lesson";
  return "todo";
}

export function currentIndex(s: Store) {
  const i = MODULES.findIndex((m) => !s.mods[m.id].passed);
  return i === -1 ? MODULES.length : i;
}

export function progress(s: Store) {
  // Chaque module pèse : leçon 50 %, quiz 50 %
  const per = MODULES.map((m) => {
    const st = s.mods[m.id];
    return (Math.min(st.done, m.sections.length) / m.sections.length) * 0.5 + (st.passed ? 0.5 : 0);
  });
  const mods = per.reduce((a, b) => a + b, 0) / MODULES.length;
  return mods * 0.9 + (s.final.passed ? 0.1 : 0);
}

export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export type Item = { q: Question; order: number[]; module: Module };
const toItem = (q: Question, module: Module): Item => ({ q, order: shuffle([0, 1, 2, 3]), module });

/** Question de contrôle pour une section, différente de la précédente si possible */
export function checkFor(m: Module, sectionId: string, avoid?: string): Item | null {
  const pool = m.questions.filter((q) => q.section === sectionId);
  if (!pool.length) return null;
  const choices = pool.length > 1 && avoid ? pool.filter((q) => q.id !== avoid) : pool;
  return toItem(choices[Math.floor(Math.random() * choices.length)], m);
}

/** Quiz de validation : une question par section au minimum, complété au hasard */
export function drawQuiz(m: Module): Item[] {
  const bySection = m.sections.map((sec) => shuffle(m.questions.filter((q) => q.section === sec.id)));
  const picked: Question[] = [];
  for (const list of bySection) if (list.length) picked.push(list[0]);
  const rest = shuffle(m.questions.filter((q) => !picked.includes(q)));
  while (picked.length < Math.min(QUIZ_SIZE, m.questions.length) && rest.length) picked.push(rest.shift()!);
  return shuffle(picked.slice(0, QUIZ_SIZE)).map((q) => toItem(q, m));
}

/** Examen final : questions de tous les modules, réparties équitablement */
export function drawFinal(): Item[] {
  const per = Math.ceil(FINAL_SIZE / MODULES.length);
  const all = MODULES.flatMap((m) => shuffle(m.questions).slice(0, per).map((q) => toItem(q, m)));
  return shuffle(all).slice(0, FINAL_SIZE);
}

/** Révision : questions des modules déjà validés */
export function drawReview(s: Store): Item[] {
  const mods = MODULES.filter((m) => s.mods[m.id].passed);
  const all = mods.flatMap((m) => m.questions.map((q) => toItem(q, m)));
  return shuffle(all).slice(0, REVIEW_SIZE);
}

export const isCorrect = (it: Item, displayIndex: number) => it.order[displayIndex] === 0;

/** Rendu texte simple (pour les comparaisons) */
export const plain = (t: string) => t.replace(/\*\*|`/g, "");
