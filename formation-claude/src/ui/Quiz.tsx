import { useState } from "react";
import { isCorrect, type Item } from "../engine";
import { Rich } from "./Rich";

export const LETTERS = ["A", "B", "C", "D"];

/** Une question avec validation et correction immédiate */
export function QuestionCard({
  item, onDone, nextLabel = "Question suivante",
}: { item: Item; onDone: (correct: boolean, chosen: number) => void; nextLabel?: string }) {
  const [sel, setSel] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const ok = sel !== null && isCorrect(item, sel);

  return (
    <div className="stack-16">
      <h2 className="q-title"><Rich text={item.q.q} /></h2>
      <div className="stack-10" role="radiogroup" aria-label="Réponses">
        {item.order.map((oi, i) => {
          const correct = oi === 0;
          const cls = checked ? (correct ? "is-correct" : sel === i ? "is-wrong" : "is-dim") : sel === i ? "is-selected" : "";
          return (
            <button key={oi} role="radio" aria-checked={sel === i} disabled={checked} className={`option ${cls}`} onClick={() => setSel(i)}>
              <span className="badge">{checked && correct ? "✓" : checked && sel === i ? "✗" : LETTERS[i]}</span>
              <span><Rich text={item.q.options[oi]} /></span>
            </button>
          );
        })}
      </div>
      {checked && (
        <div className={`feedback ${ok ? "fb-ok" : "fb-ko"}`} role="status">
          <strong>{ok ? "Exact !" : "Pas tout à fait."}</strong>
          <span><Rich text={item.q.explain} /></span>
        </div>
      )}
      <div className="sticky-cta">
        {!checked ? (
          <button className="btn btn-primary" disabled={sel === null} onClick={() => setChecked(true)}>Valider</button>
        ) : (
          <button className="btn btn-primary" onClick={() => onDone(ok, sel!)}>{nextLabel}</button>
        )}
      </div>
    </div>
  );
}

export type Answer = { item: Item; correct: boolean };

export function QuizRunner({
  items, title, onFinish, onQuit,
}: { items: Item[]; title: string; onFinish: (a: Answer[]) => void; onQuit: () => void }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const good = answers.filter((a) => a.correct).length;
  const item = items[idx];

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Quitter" onClick={() => confirm("Quitter le quiz ? Ta tentative ne sera pas comptée.") && onQuit()}>✕</button>
        <div className="stack-6 fill">
          <div className="row-8">
            <span className="topbar-title fill">{title}</span>
            <span className="mono small">{idx + 1}/{items.length}</span>
          </div>
          <div className="bar"><span style={{ width: `${(idx / items.length) * 100}%` }} /></div>
        </div>
        <span className="score-pill" title="Bonnes réponses">✓ {good}</span>
      </header>
      <span className="chip">Module {item.module.num} · {item.module.title}</span>
      <QuestionCard
        key={item.q.id + idx}
        item={item}
        nextLabel={idx + 1 < items.length ? "Question suivante" : "Voir mon résultat"}
        onDone={(correct) => {
          const next = [...answers, { item, correct }];
          setAnswers(next);
          if (idx + 1 < items.length) setIdx(idx + 1);
          else onFinish(next);
        }}
      />
    </main>
  );
}
