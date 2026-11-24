import { erudys } from "./content/erudys";
import type { Question, Track, TrackContent } from "./content/types";

/** Espaces insécables dans les nombres (« 1 500 € », « 12 % ») pour éviter les coupures */
const nb = (t: string) =>
  t.replace(/(\d) (?=\d{3}\b)/g, "$1 ").replace(/(\d) (?=[€%h])/g, "$1 ").replace(/ ([?!:;])/g, " $1");

function deepNb<T>(v: T): T {
  if (typeof v === "string") return nb(v) as T;
  if (Array.isArray(v)) return v.map(deepNb) as T;
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) o[k] = k === "id" || k === "part" || k === "kind" || k === "track" ? x : deepNb(x);
    return o as T;
  }
  return v;
}

export const CONTENT: Record<Track, TrackContent> = { erudys: deepNb(erudys) };

export type Mode = "serie" | "exam";
export const SIZES: Record<Mode, { total: number; qcm: number }> = {
  serie: { total: 8, qcm: 5 },
  exam: { total: 20, qcm: 13 },
};

/** Réponse : index d'option affichée (QCM) ou auto-évaluation (oral) */
export type Answer = { qcm: number | null } | { oral: 0 | 0.5 | 1 | null };
export type SeriesItem = { question: Question; order: number[] };
export type Result = { track: Track; mode: Mode; date: number; score: number; seconds?: number; items: { id: string; points: number }[] };

type TrackStore = {
  seen: string[];
  /** Niveau de maîtrise par question : 0 (à revoir) → 3 (maîtrisée) */
  mastery: Record<string, number>;
  flashKnown: string[];
  calcDone: string[];
};
type Store = { tracks: Record<Track, TrackStore>; history: Result[] };

const KEY = "prepa-erudys-corex:v1";
const emptyTrack = (): TrackStore => ({ seen: [], mastery: {}, flashKnown: [], calcDone: [] });

export function load(): Store {
  const empty: Store = { tracks: { erudys: emptyTrack() }, history: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const s = JSON.parse(raw) as Partial<Store>;
    return {
      tracks: {
        erudys: { ...emptyTrack(), ...s.tracks?.erudys },
      },
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

export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/**
 * Tire une série : les questions jamais vues d'abord (les « très probables » en tête),
 * puis les moins maîtrisées. Un cycle recommence quand tout a été vu.
 */
export function drawSeries(track: Track, mode: Mode, onlyPart?: string): SeriesItem[] {
  const store = load();
  const ts = store.tracks[track];
  const bank = CONTENT[track].questions.filter((q) => !onlyPart || q.part === onlyPart);
  const { total, qcm } = SIZES[mode];
  let seen = new Set(ts.seen);

  if (mode === "serie" && !onlyPart && bank.filter((q) => !seen.has(q.id)).length < total) {
    seen = new Set();
    ts.seen = [];
    save(store);
  }

  const rank = (q: Question) => {
    const unseen = seen.has(q.id) ? 1 : 0;
    const m = ts.mastery[q.id] ?? 0;
    return unseen * 10 + m * 2 + (q.proba === "tres" ? 0 : 1) + Math.random() * 1.5;
  };
  const pick = (kind: Question["kind"], n: number) =>
    bank.filter((q) => q.kind === kind).sort((a, b) => rank(a) - rank(b)).slice(0, n);

  const qcms = pick("qcm", qcm);
  const orals = pick("oral", total - qcms.length);
  // Si une catégorie manque, on complète avec l'autre
  const missing = total - qcms.length - orals.length;
  if (missing > 0) qcms.push(...pick("qcm", qcm + missing).slice(qcms.length));

  const q1 = shuffle(qcms);
  const o1 = shuffle(orals);
  const questions: Question[] = [];
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

export function finishSeries(track: Track, mode: Mode, items: SeriesItem[], answers: Answer[], seconds?: number): Result {
  const pts = items.map((it, i) => ({ id: it.question.id, points: pointsFor(it, answers[i]) }));
  const total = pts.reduce((s, p) => s + p.points, 0);
  const score = Math.round((total / items.length) * 20 * 2) / 2;
  const result: Result = { track, mode, date: Date.now(), score, seconds, items: pts };

  const store = load();
  const ts = store.tracks[track];
  const seen = new Set(ts.seen);
  for (const p of pts) {
    seen.add(p.id);
    const m = ts.mastery[p.id] ?? 0;
    ts.mastery[p.id] = p.points === 1 ? Math.min(3, m + 1) : p.points === 0.5 ? Math.max(1, Math.min(m, 2)) : 0;
  }
  ts.seen = [...seen];
  store.history = [result, ...store.history].slice(0, 100);
  save(store);
  return result;
}

export function setFlash(track: Track, id: string, known: boolean) {
  const store = load();
  const s = new Set(store.tracks[track].flashKnown);
  if (known) s.add(id);
  else s.delete(id);
  store.tracks[track].flashKnown = [...s];
  save(store);
}

export function setCalcDone(track: Track, id: string) {
  const store = load();
  const s = new Set(store.tracks[track].calcDone);
  s.add(id);
  store.tracks[track].calcDone = [...s];
  save(store);
}

export function resetAll() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* rien */
  }
}

/** Maîtrise globale et par partie (0 → 1) */
export function masteryOf(track: Track) {
  const c = CONTENT[track];
  const ts = load().tracks[track];
  const lvl = (id: string) => (ts.mastery[id] ?? 0) / 3;
  const global = c.questions.reduce((s, q) => s + lvl(q.id), 0) / c.questions.length;
  const parts = c.parts.map((part) => {
    const qs = c.questions.filter((q) => q.part === part);
    return { part, value: qs.reduce((s, q) => s + lvl(q.id), 0) / qs.length, count: qs.length };
  });
  const weak = c.questions.filter((q) => ts.seen.includes(q.id) && (ts.mastery[q.id] ?? 0) === 0);
  return { global, parts, weak, seen: ts.seen.length, flashKnown: ts.flashKnown.length, calcDone: ts.calcDone.length };
}

export function mention(score: number): { label: string; tone: "success" | "amber" | "error" } {
  if (score >= 16) return { label: "Excellent, tu es prêt·e pour le jury !", tone: "success" };
  if (score >= 13) return { label: "Bien joué ! Encore quelques points à consolider.", tone: "success" };
  if (score >= 10) return { label: "C'est en bonne voie : relis bien la correction.", tone: "amber" };
  return { label: "À retravailler : la correction et les fiches sont là pour ça.", tone: "error" };
}

/** Comparaison tolérante d'une saisie numérique (virgule, espaces, €…) */
export function parseNumber(input: string): number | null {
  const clean = input.replace(/[\s  €%]/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  if (!clean || clean === "-" || clean === ".") return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}
