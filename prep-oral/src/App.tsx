import { useEffect, useMemo, useState } from "react";
import type { Track } from "./data/types";
import {
  BANKS, SERIES_SIZE, drawSeries, finishSeries, load, mention, pointsFor, resetTrack,
  type Answer, type Result, type SeriesItem,
} from "./engine";

type Screen =
  | { name: "home" }
  | { name: "quiz"; track: Track; items: SeriesItem[]; index: number; answers: Answer[]; serie: number }
  | { name: "result"; track: Track; items: SeriesItem[]; answers: Answer[]; result: Result; serie: number }
  | { name: "review"; track: Track; items: SeriesItem[]; answers: Answer[]; serie: number };

const LETTERS = ["A", "B", "C", "D"];
const TRACKS: Record<Track, { title: string; sub: string; icon: string }> = {
  gestion: { title: "Gestion", sub: "Diagnostic, prévisionnel, seuil de rentabilité, ratios, écarts, actions correctives", icon: "📊" },
  management: { title: "Management", sub: "Rôle, équipe, référents, adhésion, communication, suivi", icon: "🤝" },
};

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen.name, screen.name === "quiz" ? screen.index : 0]);

  const track = screen.name === "home" ? null : screen.track;
  useEffect(() => {
    document.documentElement.dataset.track = track ?? "gestion";
  }, [track]);

  const start = (t: Track) => {
    const serie = load().history.filter((h) => h.track === t).length + 1;
    setScreen({ name: "quiz", track: t, items: drawSeries(t), index: 0, answers: [], serie });
  };

  switch (screen.name) {
    case "home":
      return <Home onStart={start} />;
    case "quiz":
      return (
        <Quiz
          key={screen.serie + "-" + screen.index}
          s={screen}
          onQuit={() => setScreen({ name: "home" })}
          onAnswer={(a) => {
            const answers = [...screen.answers];
            answers[screen.index] = a;
            if (screen.index + 1 < screen.items.length) {
              setScreen({ ...screen, answers, index: screen.index + 1 });
            } else {
              const result = finishSeries(screen.track, screen.items, answers);
              setScreen({ name: "result", track: screen.track, items: screen.items, answers, result, serie: screen.serie });
            }
          }}
          onBack={() => screen.index > 0 && setScreen({ ...screen, index: screen.index - 1 })}
        />
      );
    case "result":
      return (
        <ResultView
          s={screen}
          onReview={() => setScreen({ name: "review", track: screen.track, items: screen.items, answers: screen.answers, serie: screen.serie })}
          onNext={() => start(screen.track)}
          onHome={() => setScreen({ name: "home" })}
        />
      );
    case "review":
      return <Review s={screen} onNext={() => start(screen.track)} onHome={() => setScreen({ name: "home" })} />;
  }
}

/* ───────────────────────── Accueil ───────────────────────── */

function Home({ onStart }: { onStart: (t: Track) => void }) {
  const [store, setStore] = useState(load);
  const last = store.history[0];

  return (
    <main className="screen">
      <header className="stack-8">
        <p className="kicker">Prépa oral · REM</p>
        <h1 className="h1">Prêt·e pour ta soutenance ?</h1>
        <p className="muted">
          Choisis ton parcours. À chaque tour : {SERIES_SIZE} questions probables du jury, une note sur 20, puis la correction
          détaillée. Les questions changent à chaque série.
        </p>
      </header>

      <div className="stack-16">
        {(Object.keys(TRACKS) as Track[]).map((t) => {
          const bank = BANKS[t];
          const seen = store.seen[t].length;
          const pct = Math.round((seen / bank.length) * 100);
          return (
            <button key={t} className={`track track-${t}`} onClick={() => onStart(t)}>
              <span className="track-top">
                <span className="track-icon" aria-hidden>{TRACKS[t].icon}</span>
                <span className="stack-4">
                  <span className="track-title">{TRACKS[t].title}</span>
                  <span className="small muted">{TRACKS[t].sub}</span>
                </span>
                <svg className="chev" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
                  <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="pills">
                <span className="pill">{bank.length} questions</span>
                <span className="pill">QCM + oral</span>
                <span className="pill">≈ 10 min</span>
              </span>
              <span className="coverage" aria-label={`${pct} % des questions déjà vues`}>
                <span className="coverage-bar"><span style={{ width: `${pct}%` }} /></span>
                <span className="small muted">{seen === 0 ? "Jamais commencé" : `${seen}/${bank.length} vues`}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grow" />

      {last ? (
        <section className="card row-12">
          <span className="emoji-lg" aria-hidden>🔥</span>
          <span className="stack-2 fill">
            <strong>Dernier score : {fmt(last.score)}/20 en {TRACKS[last.track].title}</strong>
            <span className="small muted">
              {store.history.length} série{store.history.length > 1 ? "s" : ""} faite{store.history.length > 1 ? "s" : ""} · moyenne{" "}
              {fmt(avg(store.history.map((h) => h.score)))}/20
            </span>
          </span>
        </section>
      ) : (
        <section className="card row-12">
          <span className="emoji-lg" aria-hidden>💡</span>
          <span className="small">
            <strong>Comment ça marche ?</strong> Les QCM sont notés automatiquement. Pour les questions orales, réponds à voix haute,
            révèle la réponse modèle et évalue-toi honnêtement.
          </span>
        </section>
      )}
      {store.history.length > 0 && (
        <button
          className="link small"
          onClick={() => {
            if (confirm("Effacer ta progression (questions vues et scores) ?")) {
              resetTrack("gestion");
              resetTrack("management");
              setStore(load());
            }
          }}
        >
          Réinitialiser ma progression
        </button>
      )}
    </main>
  );
}

/* ───────────────────────── Série ───────────────────────── */

function TopBar({ title, progress, onBack }: { title: string; progress?: [number, number]; onBack: () => void }) {
  return (
    <div className="stack-12">
      <div className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Retour">
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
            <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="topbar-title">{title}</span>
        {progress && <span className="topbar-count">{progress[0]} / {progress[1]}</span>}
      </div>
      {progress && (
        <div className="segments" aria-hidden>
          {Array.from({ length: progress[1] }, (_, i) => (
            <span key={i} className={i < progress[0] ? "on" : ""} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionHead({ theme, q, proba, kind }: { theme: string; q: string; proba: "tres" | "probable"; kind: "qcm" | "oral" }) {
  return (
    <section className="card stack-12">
      <div className="row-8 wrap">
        <span className="chip">{theme}</span>
        <span className="chip chip-neutral">{kind === "qcm" ? "QCM" : "Oral"}</span>
      </div>
      <h2 className="h2">{q}</h2>
      <span className={`proba proba-${proba}`}>🎯 {proba === "tres" ? "Très probable au jury" : "Probable au jury"}</span>
    </section>
  );
}

function Quiz({
  s, onAnswer, onQuit, onBack,
}: {
  s: Extract<Screen, { name: "quiz" }>;
  onAnswer: (a: Answer) => void;
  onQuit: () => void;
  onBack: () => void;
}) {
  const item = s.items[s.index];
  const q = item.question;
  const prev = s.answers[s.index];
  const title = `${TRACKS[s.track].title} · Série ${s.serie}`;
  const back = () => (s.index === 0 ? confirm("Quitter la série ? Ta progression sur cette série sera perdue.") && onQuit() : onBack());

  return (
    <main className="screen">
      <TopBar title={title} progress={[s.index + 1, s.items.length]} onBack={back} />
      <QuestionHead theme={q.theme} q={q.q} proba={q.proba} kind={q.kind} />
      {q.kind === "qcm" ? (
        <QcmBody item={item} initial={prev && "qcm" in prev ? prev.qcm : null} onValidate={(i) => onAnswer({ qcm: i })} />
      ) : (
        <OralBody points={q.points} tip={q.tip} refText={q.ref} onRate={(v) => onAnswer({ oral: v })} />
      )}
    </main>
  );
}

function QcmBody({ item, initial, onValidate }: { item: SeriesItem; initial: number | null; onValidate: (i: number) => void }) {
  const [sel, setSel] = useState<number | null>(initial);
  if (item.question.kind !== "qcm") return null;
  const opts = item.question.options;
  return (
    <>
      <div className="stack-10" role="radiogroup" aria-label="Réponses">
        {item.order.map((oi, i) => (
          <button
            key={oi}
            role="radio"
            aria-checked={sel === i}
            className={`option ${sel === i ? "is-selected" : ""}`}
            onClick={() => setSel(i)}
          >
            <span className="badge">{LETTERS[i]}</span>
            <span>{opts[oi]}</span>
          </button>
        ))}
      </div>
      <div className="grow" />
      <div className="sticky-cta">
        <button className="btn btn-primary" disabled={sel === null} onClick={() => sel !== null && onValidate(sel)}>
          Valider
        </button>
      </div>
    </>
  );
}

function OralBody({ points, tip, refText, onRate }: { points: string[]; tip?: string; refText: string; onRate: (v: 0 | 0.5 | 1) => void }) {
  const [shown, setShown] = useState(false);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  return (
    <>
      <div className="tip row-8">
        <span aria-hidden>🎤</span>
        <span className="small">Réponds à voix haute comme devant le jury (≈ 1 min), puis révèle la réponse modèle.</span>
      </div>
      {!shown && (
        <button className={`timer ${left === 0 ? "is-done" : ""}`} onClick={() => setLeft(60)}>
          <span className="timer-ring" style={{ ["--p" as string]: left === null ? 0 : (60 - left) / 60 }}>
            <span>{left === null ? "60" : left}</span>
          </span>
          <span className="small">{left === null ? "Lancer le chrono d'une minute" : left === 0 ? "Temps écoulé !" : "Je parle…"}</span>
        </button>
      )}
      {shown ? (
        <section className="card card-accent stack-10" aria-live="polite">
          <p className="kicker">Réponse modèle · points clés</p>
          <ul className="points">
            {points.map((p) => <li key={p}>{p}</li>)}
          </ul>
          {tip && <p className="small tip-inline">💬 {tip}</p>}
          <p className="small muted">📄 Rapport · {refText}</p>
        </section>
      ) : null}
      <div className="grow" />
      <div className="sticky-cta">
        {shown ? (
          <div className="stack-8">
            <p className="small muted center">Comment t'en es-tu sorti·e ?</p>
            <div className="rate">
              <button className="rate-btn tone-error" onClick={() => onRate(0)}>😕<span>À revoir</span></button>
              <button className="rate-btn tone-amber" onClick={() => onRate(0.5)}>🙂<span>Partiel</span></button>
              <button className="rate-btn tone-success" onClick={() => onRate(1)}>😎<span>Maîtrisé</span></button>
            </div>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => setShown(true)}>Révéler la réponse modèle</button>
        )}
      </div>
    </>
  );
}

/* ───────────────────────── Note ───────────────────────── */

function ResultView({
  s, onReview, onNext, onHome,
}: {
  s: Extract<Screen, { name: "result" }>;
  onReview: () => void;
  onNext: () => void;
  onHome: () => void;
}) {
  const { result } = s;
  const m = mention(result.score);
  const byTheme = useMemo(() => {
    const map = new Map<string, { got: number; max: number }>();
    s.items.forEach((it, i) => {
      const t = map.get(it.question.theme) ?? { got: 0, max: 0 };
      t.got += result.items[i].points;
      t.max += 1;
      map.set(it.question.theme, t);
    });
    return [...map.entries()];
  }, [s.items, result]);
  const good = result.items.filter((p) => p.points === 1).length;

  return (
    <main className="screen">
      <TopBar title={`${TRACKS[s.track].title} · Série ${s.serie}`} onBack={onHome} />
      <section className="stack-12 center">
        <p className="kicker">Série terminée</p>
        <div className={`score tone-${m.tone}`} style={{ ["--p" as string]: result.score / 20 }}>
          <span className="score-num">{fmt(result.score)}</span>
          <span className="score-max">/ 20</span>
        </div>
        <h2 className="h2">{m.label}</h2>
        <p className="small muted">{good} réponse{good > 1 ? "s" : ""} pleinement juste{good > 1 ? "s" : ""} sur {s.items.length}</p>
      </section>

      <section className="card stack-12">
        <p className="small muted strong">Par thème</p>
        {byTheme.map(([theme, v]) => {
          const pct = Math.round((v.got / v.max) * 100);
          const tone = pct >= 75 ? "success" : pct >= 50 ? "amber" : "error";
          return (
            <div key={theme} className="stack-6">
              <div className="row-8">
                <span className="small fill">{theme}</span>
                <strong className={`small text-${tone}`}>{pct} %</strong>
              </div>
              <div className="meter"><span className={`bg-${tone}`} style={{ width: `${Math.max(pct, 3)}%` }} /></div>
            </div>
          );
        })}
      </section>

      <div className="grow" />
      <div className="sticky-cta stack-10">
        <button className="btn btn-primary" onClick={onReview}>Voir la correction</button>
        <button className="btn btn-secondary" onClick={onNext}>Nouvelle série (questions différentes)</button>
      </div>
    </main>
  );
}

/* ───────────────────────── Correction ───────────────────────── */

function Review({ s, onNext, onHome }: { s: Extract<Screen, { name: "review" }>; onNext: () => void; onHome: () => void }) {
  return (
    <main className="screen">
      <TopBar title={`Correction · Série ${s.serie}`} onBack={onHome} />
      <h1 className="h1-sm">Les bonnes réponses</h1>
      {s.items.map((it, i) => {
        const q = it.question;
        const a = s.answers[i];
        const pts = pointsFor(it, a);
        const icon = pts === 1 ? "✅" : pts === 0.5 ? "🟠" : "❌";
        return (
          <section key={q.id} className="card stack-10">
            <div className="row-8 top">
              <span aria-hidden>{icon}</span>
              <strong className="fill small-lg">Q{i + 1} · {q.q}</strong>
            </div>
            {q.kind === "qcm" ? (
              <>
                {it.order.map((oi, k) => {
                  const picked = a && "qcm" in a && a.qcm === k;
                  const correct = oi === 0;
                  if (!correct && !picked) return null;
                  return (
                    <div key={oi} className={`option is-static ${correct ? "is-correct" : "is-wrong"}`}>
                      <span className="badge">{LETTERS[k]}</span>
                      <span>{q.options[oi]}{picked ? <em className="muted"> (ta réponse)</em> : null}</span>
                    </div>
                  );
                })}
                <div className="explain stack-4">
                  <strong className="small">💡 Pourquoi</strong>
                  <span className="small">{q.explain}</span>
                </div>
              </>
            ) : (
              <div className="explain stack-6">
                <strong className="small">
                  🎤 Points clés attendus{" "}
                  <span className="muted">· ton auto-éval : {pts === 1 ? "maîtrisé" : pts === 0.5 ? "partiel" : "à revoir"}</span>
                </strong>
                <ul className="points small">{q.points.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            )}
            <span className="small muted">📄 Rapport · {q.ref}</span>
          </section>
        );
      })}
      <div className="sticky-cta stack-10">
        <button className="btn btn-primary" onClick={onNext}>Nouvelle série</button>
        <button className="btn btn-secondary" onClick={onHome}>Changer de parcours</button>
      </div>
    </main>
  );
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));
const avg = (a: number[]) => Math.round((a.reduce((s, x) => s + x, 0) / a.length) * 2) / 2;
