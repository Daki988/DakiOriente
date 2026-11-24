import { useEffect, useRef, useState } from "react";
import { FINAL_MINUTES, isCorrect, type Item } from "../engine";
import { LETTERS, type Answer } from "./Quiz";
import { Rich } from "./Rich";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Examen de certification : chronométré, sans correction pendant l'épreuve, navigation libre */
export function ExamRunner({ items, onFinish, onQuit }: { items: Item[]; onFinish: (a: Answer[], seconds: number) => void; onQuit: () => void }) {
  const total = FINAL_MINUTES * 60;
  const [picks, setPicks] = useState<(number | null)[]>(() => items.map(() => null));
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(total);
  const [grid, setGrid] = useState(false);
  const done = useRef(false);

  const submit = (p = picks, l = left) => {
    if (done.current) return;
    done.current = true;
    onFinish(items.map((item, i) => ({ item, correct: p[i] !== null && isCorrect(item, p[i]!) })), total - l);
  };

  useEffect(() => {
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (left <= 0) submit(picks, 0);
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  const item = items[idx];
  const answered = picks.filter((p) => p !== null).length;
  const urgent = left <= 300;

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Abandonner" onClick={() => confirm("Abandonner l'examen ? Il sera compté comme non réussi.") && onQuit()}>✕</button>
        <div className="stack-6 fill">
          <div className="row-8">
            <span className="topbar-title fill">Certification</span>
            <span className="mono small">{answered}/{items.length} répondues</span>
          </div>
          <div className="bar"><span style={{ width: `${(answered / items.length) * 100}%` }} /></div>
        </div>
        <span className={`timer-pill ${urgent ? "is-urgent" : ""}`} role="timer" aria-label="Temps restant">⏱ {mmss(Math.max(left, 0))}</span>
      </header>

      <div className="row-8">
        <span className="chip">Question {idx + 1} / {items.length}</span>
        <button className="pill-btn" onClick={() => setGrid(!grid)}>{grid ? "Masquer" : "Toutes les questions"}</button>
      </div>

      {grid && (
        <div className="qgrid" aria-label="Aller à une question">
          {items.map((_, i) => (
            <button key={i} className={`${picks[i] !== null ? "is-answered" : ""} ${i === idx ? "is-current" : ""}`} onClick={() => { setIdx(i); setGrid(false); }}>{i + 1}</button>
          ))}
        </div>
      )}

      <h2 className="q-title"><Rich text={item.q.q} /></h2>
      <div className="stack-10" role="radiogroup" aria-label="Réponses">
        {item.order.map((oi, i) => (
          <button
            key={oi}
            role="radio"
            aria-checked={picks[idx] === i}
            className={`option ${picks[idx] === i ? "is-selected" : ""}`}
            onClick={() => setPicks(picks.map((p, k) => (k === idx ? i : p)))}
          >
            <span className="badge">{LETTERS[i]}</span>
            <span><Rich text={item.q.options[oi]} /></span>
          </button>
        ))}
      </div>
      <p className="small muted center">Pas de correction pendant l'épreuve : tu peux revenir sur tes réponses jusqu'à la remise.</p>

      <div className="sticky-cta stack-10">
        <div className="row-8">
          <button className="btn btn-ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Précédente</button>
          {idx + 1 < items.length ? (
            <button className="btn btn-primary" onClick={() => setIdx(idx + 1)}>Suivante →</button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                const missing = items.length - answered;
                if (!missing || confirm(`${missing} question${missing > 1 ? "s" : ""} sans réponse. Remettre ta copie quand même ?`)) submit();
              }}
            >
              Remettre ma copie
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
