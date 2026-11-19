import { gestion } from "./data/gestion";
import { management } from "./data/management";
import type { Question, Track } from "./data/types";

/** Espaces insécables dans les nombres (« 1 500 € », « 12 % ») pour éviter les coupures */
const nb = (t: string) => t.replace(/(\d) (?=\d{3}\b)/g, "$1\u202f").replace(/(\d) (?=[€%])/g, "$1\u00a0");
const fix = (q: Question): Question => {
  const base = { ...q, q: nb(q.q) };
  return q.kind === "qcm"
    ? { ...base, kind: "qcm", options: q.options.map(nb) as typeof q.options, explain: nb(q.explain) }
    : { ...base, kind: "oral", points: q.points.map(nb), tip: q.tip && nb(q.tip) };
};

export const BANKS: Record<Track, Question[]> = { gestion: gestion.map(fix), management: management.map(fix) };
export const SERIES_SIZE = 8;
const QCM_PER_SERIES = 5;

/** Réponse donnée : index d'option (QCM, dans l'ordre affiché) ou auto-évaluation (oral) */
export type Answer = { qcm: number | null } | { oral: 0 | 0.5 | 1 | null };

export type SeriesItem = {
  question: Question;
  /** Pour les QCM : ordre d'affichage des options (indices de question.options) */
  order: number[];
};

export type Result = {
  track: Track;
  date: number;
  score: number; // sur 20
  items: { id: string; points: number }[];
};

type Store = {
  seen: Record<Track, string[]>;
  missed: Record<Track, string[]>;
  history: Result[];
};

const KEY = "prep-oral-rem:v1";

export function load(): Store {
  const empty: Store = { seen: { gestion: [], management: [] }, missed: { gestion: [], management: [] }, history: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const s = JSON.parse(raw) as Partial<Store>;
    return {
      seen: { ...empty.seen, ...s.seen },
      missed: { ...empty.missed, ...s.missed },
      history: Array.isArray(s.history) ? s.history : [],
    };
  } catch {
    return empty;
  }
}

function save(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* stockage indisponible : l'app fonctionne quand même */
  }
}

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/**
 * Tire une série : d'abord les questions jamais vues (les « très probables » en tête),
 * puis, quand tout a été vu, un nouveau cycle qui fait revenir en priorité les erreurs.
 */
export function drawSeries(track: Track): SeriesItem[] {
  const store = load();
  const bank = BANKS[track];
  let seen = new Set(store.seen[track]);
  const missed = new Set(store.missed[track]);

  const pick = (kind: Question["kind"], n: number, exclude: Set<string>) => {
    const pool = bank.filter((q) => q.kind === kind && !exclude.has(q.id));
    const fresh = pool.filter((q) => !seen.has(q.id));
    const rank = (q: Question) => (missed.has(q.id) ? 0 : 1) + (q.proba === "tres" ? 0 : 0.5) + Math.random() * 0.9;
    const sortedFresh = [...fresh].sort((a, b) => rank(a) - rank(b));
    const out = sortedFresh.slice(0, n);
    if (out.length < n) {
      const rest = pool.filter((q) => !out.includes(q)).sort((a, b) => rank(a) - rank(b));
      out.push(...rest.slice(0, n - out.length));
    }
    return out;
  };

  // Nouveau cycle quand il ne reste plus assez de questions inédites
  const unseen = bank.filter((q) => !seen.has(q.id)).length;
  if (unseen < SERIES_SIZE) {
    seen = new Set();
    store.seen[track] = [];
    save(store);
  }

  const qcms = pick("qcm", QCM_PER_SERIES, new Set());
  const orals = pick("oral", SERIES_SIZE - qcms.length, new Set());
  // On alterne pour garder du rythme : QCM, QCM, oral, …
  const questions: Question[] = [];
  const q1 = shuffle(qcms);
  const o1 = shuffle(orals);
  while (q1.length || o1.length) {
    if (q1.length) questions.push(q1.shift()!);
    if (q1.length) questions.push(q1.shift()!);
    if (o1.length) questions.push(o1.shift()!);
  }
  return questions.map((question) => ({ question, order: shuffle([0, 1, 2, 3]) }));
}

export function pointsFor(item: SeriesItem, a: Answer | undefined): number {
  if (!a) return 0;
  if ("qcm" in a) return a.qcm !== null && item.order[a.qcm] === 0 ? 1 : 0;
  return a.oral ?? 0;
}

export function finishSeries(track: Track, items: SeriesItem[], answers: Answer[]): Result {
  const pts = items.map((it, i) => ({ id: it.question.id, points: pointsFor(it, answers[i]) }));
  const total = pts.reduce((s, p) => s + p.points, 0);
  const score = Math.round((total / items.length) * 20 * 2) / 2;
  const result: Result = { track, date: Date.now(), score, items: pts };

  const store = load();
  const seen = new Set(store.seen[track]);
  const missed = new Set(store.missed[track]);
  for (const p of pts) {
    seen.add(p.id);
    if (p.points < 1) missed.add(p.id);
    else missed.delete(p.id);
  }
  store.seen[track] = [...seen];
  store.missed[track] = [...missed];
  store.history = [result, ...store.history].slice(0, 50);
  save(store);
  return result;
}

export function resetTrack(track: Track) {
  const store = load();
  store.seen[track] = [];
  store.missed[track] = [];
  store.history = store.history.filter((h) => h.track !== track);
  save(store);
}

export function mention(score: number): { label: string; tone: "success" | "amber" | "error" } {
  if (score >= 16) return { label: "Excellent, tu es prêt·e pour le jury !", tone: "success" };
  if (score >= 13) return { label: "Bien joué ! Encore quelques points à consolider.", tone: "success" };
  if (score >= 10) return { label: "C'est en bonne voie : relis la correction.", tone: "amber" };
  return { label: "À retravailler : la correction est là pour ça.", tone: "error" };
}
