import { useEffect, useState } from "react";
import type { Track } from "./content/types";
import { CONTENT, SIZES, drawSeries, finishSeries, load, masteryOf, resetAll, type Answer, type Mode, type Result, type SeriesItem } from "./engine";
import { Chevron, Meter, Ring, TopBar, fmt } from "./ui/common";
import { Calculs, FicheView, FichesList, Flashcards, Notions, Pitch } from "./ui/Learn";
import { Quiz, ResultView, Review } from "./ui/Quiz";

type Run = { mode: Mode; part?: string; items: SeriesItem[]; answers: Answer[]; serie: number; startedAt: number };
type Screen =
  | { name: "home" }
  | { name: "hub"; track: Track }
  | { name: "quiz"; track: Track; run: Run; index: number }
  | { name: "result"; track: Track; run: Run; result: Result }
  | { name: "review"; track: Track; run: Run }
  | { name: "fiches"; track: Track }
  | { name: "fiche"; track: Track; index: number }
  | { name: "notions"; track: Track }
  | { name: "flash"; track: Track }
  | { name: "calculs"; track: Track }
  | { name: "pitch"; track: Track };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const track = screen.name === "home" ? null : screen.track;

  useEffect(() => {
    document.documentElement.dataset.track = track ?? "gestion";
  }, [track]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  const start = (t: Track, mode: Mode, part?: string) => {
    const serie = load().history.filter((h) => h.track === t && h.mode === mode).length + 1;
    setScreen({ name: "quiz", track: t, index: 0, run: { mode, part, items: drawSeries(t, mode, part), answers: [], serie, startedAt: Date.now() } });
  };
  const hub = (t: Track) => setScreen({ name: "hub", track: t });
  const runTitle = (t: Track, r: Run) =>
    `${CONTENT[t].label} · ${r.mode === "exam" ? "Examen blanc" : r.part ? r.part : `Série ${r.serie}`}`;

  switch (screen.name) {
    case "home":
      return <Home onOpen={hub} />;
    case "hub":
      return <Hub track={screen.track} go={setScreen} start={start} onBack={() => setScreen({ name: "home" })} />;
    case "quiz": {
      const { run, index, track: t } = screen;
      return (
        <Quiz
          key={run.startedAt + "-" + index}
          track={t}
          mode={run.mode}
          items={run.items}
          index={index}
          answers={run.answers}
          startedAt={run.startedAt}
          title={runTitle(t, run)}
          onBack={() => {
            if (index > 0) setScreen({ ...screen, index: index - 1 });
            else if (confirm("Quitter ? Tes réponses de cette série ne seront pas enregistrées.")) hub(t);
          }}
          onAnswer={(a) => {
            const answers = [...run.answers];
            answers[index] = a;
            const r = { ...run, answers };
            if (index + 1 < run.items.length) setScreen({ ...screen, run: r, index: index + 1 });
            else {
              const seconds = Math.round((Date.now() - run.startedAt) / 1000);
              const result = finishSeries(t, run.mode, run.items, answers, run.mode === "exam" ? seconds : undefined);
              setScreen({ name: "result", track: t, run: r, result });
            }
          }}
        />
      );
    }
    case "result":
      return (
        <ResultView
          track={screen.track}
          items={screen.run.items}
          result={screen.result}
          title={runTitle(screen.track, screen.run)}
          onReview={() => setScreen({ name: "review", track: screen.track, run: screen.run })}
          onNext={() => start(screen.track, screen.run.mode, screen.run.part)}
          onHome={() => hub(screen.track)}
        />
      );
    case "review":
      return (
        <Review
          items={screen.run.items}
          answers={screen.run.answers}
          title={`Correction · ${runTitle(screen.track, screen.run)}`}
          onNext={() => start(screen.track, screen.run.mode, screen.run.part)}
          onHome={() => hub(screen.track)}
        />
      );
    case "fiches":
      return <FichesList track={screen.track} onOpen={(i) => setScreen({ name: "fiche", track: screen.track, index: i })} onBack={() => hub(screen.track)} />;
    case "fiche":
      return (
        <FicheView
          track={screen.track}
          index={screen.index}
          onBack={() => setScreen({ name: "fiches", track: screen.track })}
          onNav={(i) => setScreen({ name: "fiche", track: screen.track, index: i })}
          onPractice={(part) => start(screen.track, "serie", part)}
        />
      );
    case "notions":
      return <Notions track={screen.track} onBack={() => hub(screen.track)} />;
    case "flash":
      return <Flashcards track={screen.track} onBack={() => hub(screen.track)} />;
    case "calculs":
      return <Calculs track={screen.track} onBack={() => hub(screen.track)} />;
    case "pitch":
      return <Pitch track={screen.track} onBack={() => hub(screen.track)} />;
  }
}

/* ───────────────────────── Accueil ───────────────────────── */

function Home({ onOpen }: { onOpen: (t: Track) => void }) {
  const [, force] = useState(0);
  const history = load().history;
  const last = history[0];

  return (
    <main className="screen">
      <header className="stack-8">
        <p className="kicker">Prépa soutenance · Titre REM</p>
        <h1 className="h1">Révise tes deux mémoires et arrive serein·e devant le jury</h1>
        <p className="muted">Choisis le rapport à travailler. Tu y trouveras des fiches de cours, les notions clés, des flashcards, des calculs à refaire, des séries de questions probables du jury et un examen blanc.</p>
      </header>

      <div className="stack-16">
        {(["gestion", "management"] as Track[]).map((t) => {
          const c = CONTENT[t];
          const m = masteryOf(t);
          return (
            <button key={t} className={`track track-${t}`} onClick={() => onOpen(t)}>
              <span className="track-top">
                <span className="track-icon" aria-hidden>{c.icon}</span>
                <span className="stack-4 fill">
                  <span className="track-memo">{c.memoire}</span>
                  <span className="track-title">{c.label}</span>
                </span>
                <Ring value={m.global} size={56} />
              </span>
              <span className="small track-sub">{c.title}</span>
              <span className="pills">
                <span className="pill">{c.questions.length} questions</span>
                <span className="pill">{c.fiches.length} fiches</span>
                <span className="pill">{c.notions.length} notions</span>
                <span className="pill">{c.calculs.length} calculs</span>
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
            <strong>Dernier score : {fmt(last.score)}/20 en {CONTENT[last.track].label}</strong>
            <span className="small muted">{history.length} série{history.length > 1 ? "s" : ""} au total · la maîtrise (anneau) monte quand tu réussis une question plusieurs fois</span>
          </span>
        </section>
      ) : (
        <section className="card row-12">
          <span className="emoji-lg" aria-hidden>🧭</span>
          <span className="small">
            <strong>Méthode conseillée :</strong> 1. lis la fiche d'une partie · 2. revois les notions · 3. fais une série sur cette partie · 4. termine par l'examen blanc et ton pitch.
          </span>
        </section>
      )}
      {history.length > 0 && (
        <button className="link small" onClick={() => { if (confirm("Effacer toute ta progression ?")) { resetAll(); force((x) => x + 1); } }}>
          Réinitialiser ma progression
        </button>
      )}
    </main>
  );
}

/* ───────────────────────── Tableau de bord d'un rapport ───────────────────────── */

function Hub({ track, go, start, onBack }: { track: Track; go: (s: Screen) => void; start: (t: Track, m: Mode, part?: string) => void; onBack: () => void }) {
  const c = CONTENT[track];
  const m = masteryOf(track);
  const hist = load().history.filter((h) => h.track === track);
  const avg = hist.length ? hist.slice(0, 5).reduce((s, h) => s + h.score, 0) / Math.min(hist.length, 5) : null;

  const learn = [
    { icon: "📘", title: "Fiches de cours", sub: `${c.fiches.length} fiches · essentiel, chiffres, pièges`, go: () => go({ name: "fiches", track }) },
    { icon: "🧠", title: "Notions clés", sub: `${c.notions.length} définitions et formules`, go: () => go({ name: "notions", track }) },
    { icon: "🃏", title: "Flashcards", sub: `${m.flashKnown}/${c.flashcards.length} cartes sues`, go: () => go({ name: "flash", track }) },
    { icon: "🧮", title: "Calculs à refaire", sub: `${m.calcDone}/${c.calculs.length} réussis`, go: () => go({ name: "calculs", track }) },
  ];

  return (
    <main className="screen">
      <TopBar title={`${c.memoire} · ${c.label}`} onBack={onBack} />
      <section className="hero">
        <div className="stack-6 fill">
          <span className="kicker">Ma maîtrise du rapport</span>
          <h1 className="h1-sm">{c.label}</h1>
          <span className="small muted">
            {m.seen}/{c.questions.length} questions vues{avg !== null ? ` · moyenne récente ${fmt(Math.round(avg * 2) / 2)}/20` : ""}
          </span>
        </div>
        <Ring value={m.global} size={84} />
      </section>

      <section className="stack-10">
        <p className="kicker">S'entraîner</p>
        <button className="action action-primary" onClick={() => start(track, "serie")}>
          <span className="action-icon" aria-hidden>🎯</span>
          <span className="stack-2 fill">
            <strong>Série de {SIZES.serie.total} questions</strong>
            <span className="small">QCM + oral · note sur 20 · correction · nouvelles questions à chaque tour</span>
          </span>
          <Chevron />
        </button>
        <div className="grid-2">
          <button className="tile" onClick={() => start(track, "exam")}>
            <span className="tile-icon" aria-hidden>📝</span>
            <strong>Examen blanc</strong>
            <span className="small muted">{SIZES.exam.total} questions chronométrées</span>
          </button>
          <button className="tile" onClick={() => go({ name: "pitch", track })}>
            <span className="tile-icon" aria-hidden>🎤</span>
            <strong>Mon pitch</strong>
            <span className="small muted">Trame chronométrée</span>
          </button>
        </div>
      </section>

      <section className="stack-10">
        <p className="kicker">Apprendre</p>
        <div className="grid-2">
          {learn.map((l) => (
            <button key={l.title} className="tile" onClick={l.go}>
              <span className="tile-icon" aria-hidden>{l.icon}</span>
              <strong>{l.title}</strong>
              <span className="small muted">{l.sub}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card stack-12">
        <p className="small muted strong">Maîtrise par partie · touche pour t'entraîner dessus</p>
        {m.parts.map((p) => (
          <button key={p.part} className="part-row" onClick={() => start(track, "serie", p.part)}>
            <span className="row-8">
              <span className="small fill">{p.part}</span>
              <strong className="small">{Math.round(p.value * 100)} %</strong>
            </span>
            <Meter value={p.value} />
          </button>
        ))}
      </section>

      {m.weak.length > 0 && (
        <section className="card card-warn stack-8">
          <p className="small strong">⚠️ {m.weak.length} question{m.weak.length > 1 ? "s" : ""} ratée{m.weak.length > 1 ? "s" : ""} à retravailler</p>
          <ul className="points small">{m.weak.slice(0, 4).map((q) => <li key={q.id}>{q.q}</li>)}</ul>
          <span className="small muted">Elles reviennent en priorité dans tes prochaines séries.</span>
        </section>
      )}
    </main>
  );
}
