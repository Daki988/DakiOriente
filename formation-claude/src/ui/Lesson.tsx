import { useEffect, useRef, useState } from "react";
import type { Module } from "../content/types";
import { checkFor, type Item } from "../engine";
import { Blocks } from "./Rich";
import { QuestionCard } from "./Quiz";

export type LessonMode = "learn" | "review" | "reread";

export function Lesson({
  module: m, index, mode, onPass, onBack, onNav,
}: {
  module: Module; index: number; mode: LessonMode;
  onPass: () => void; onBack: () => void; onNav?: (i: number) => void;
}) {
  const sec = m.sections[index];
  const [phase, setPhase] = useState<"read" | "check" | "retry">("read");
  const [item, setItem] = useState<Item | null>(null);
  const [fails, setFails] = useState(0);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPhase("read");
    setItem(null);
    setFails(0);
    window.scrollTo({ top: 0 });
  }, [index, m.id]);

  const startCheck = () => {
    const it = checkFor(m, sec.id, item?.q.id);
    if (!it) return onPass();
    setItem(it);
    setPhase("check");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="screen" ref={top}>
      <header className="topbar">
        <button className="icon-btn" aria-label="Retour au module" onClick={onBack}>←</button>
        <div className="stack-6 fill">
          <div className="row-8">
            <span className="topbar-title fill">Module {m.num} · {m.title}</span>
            <span className="mono small">{index + 1}/{m.sections.length}</span>
          </div>
          <div className="bar"><span style={{ width: `${((index + (phase === "read" ? 0 : 0.5)) / m.sections.length) * 100}%` }} /></div>
        </div>
      </header>

      {phase === "read" && (
        <>
          <div className="stack-6">
            <span className="chip">{mode === "review" ? "🔁 À relire" : `Section ${m.num}.${index + 1}`}</span>
            <h1 className="h1">{sec.title}</h1>
          </div>
          <article className="lesson card">
            <Blocks blocks={sec.blocks} />
          </article>
          <div className="sticky-cta">
            {mode === "reread" ? (
              <div className="row-8">
                <button className="btn btn-ghost" disabled={index === 0} onClick={() => onNav?.(index - 1)}>←</button>
                <button className="btn btn-primary" onClick={onPass}>J'ai relu</button>
                <button className="btn btn-ghost" disabled={!onNav || index >= m.sections.length - 1} onClick={() => onNav?.(index + 1)}>→</button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={startCheck}>J'ai compris · vérifier</button>
            )}
          </div>
        </>
      )}

      {phase === "check" && item && (
        <>
          <div className="check-head">
            <span className="check-icon" aria-hidden>🧠</span>
            <div className="stack-2">
              <span className="kicker">Contrôle de compréhension</span>
              <span className="small muted">Réponds juste pour débloquer la suite.</span>
            </div>
          </div>
          <div className="check-card">
            <QuestionCard
              key={item.q.id + fails}
              item={item}
              nextLabel="Continuer"
              onDone={(ok) => {
                if (ok) onPass();
                else {
                  setFails(fails + 1);
                  setPhase("retry");
                }
              }}
            />
          </div>
        </>
      )}

      {phase === "retry" && (
        <section className="card stack-16 center retry">
          <span className="big-emoji" aria-hidden>📖</span>
          <h2 className="h2">Relis la section, puis réessaie</h2>
          <p className="muted">Une autre question te sera posée. L'objectif n'est pas de deviner, mais de comprendre.</p>
          <button className="btn btn-primary" onClick={() => { setPhase("read"); window.scrollTo({ top: 0 }); }}>Relire « {sec.title} »</button>
        </section>
      )}
    </main>
  );
}
