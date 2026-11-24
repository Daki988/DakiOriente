import { useEffect, useMemo, useState } from "react";
import type { Question, Track } from "../content/types";
import { CONTENT, mention, pointsFor, type Answer, type Mode, type Result, type SeriesItem } from "../engine";
import { Meter, Segments, TopBar, fmt, mmss } from "./common";

const LETTERS = ["A", "B", "C", "D"];

/* ───────────────────────── Question ───────────────────────── */

function QuestionHead({ q }: { q: Question }) {
  return (
    <section className="card stack-12">
      <div className="row-8 wrap">
        <span className="chip">{q.part}</span>
        <span className="chip chip-neutral">{q.kind === "qcm" ? "QCM" : "🎤 Oral"}</span>
      </div>
      <h2 className="h2">{q.q}</h2>
      <span className={`proba proba-${q.proba}`}>🎯 {q.proba === "tres" ? "Très probable au jury" : "Probable au jury"}</span>
    </section>
  );
}

export function Quiz({
  track, mode, items, index, answers, startedAt, title, onAnswer, onBack,
}: {
  track: Track; mode: Mode; items: SeriesItem[]; index: number; answers: Answer[]; startedAt: number; title: string;
  onAnswer: (a: Answer) => void; onBack: () => void;
}) {
  const item = items[index];
  const q = item.question;
  const prev = answers[index];
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (mode !== "exam") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [mode]);
  void track;

  return (
    <main className="screen">
      <div className="stack-12">
        <TopBar
          title={title}
          onBack={onBack}
          right={
            <span className="row-8">
              {mode === "exam" && <span className="pill pill-timer">⏱ {mmss(Math.floor((now - startedAt) / 1000))}</span>}
              <span className="topbar-count">{index + 1} / {items.length}</span>
            </span>
          }
        />
        <Segments n={items.length} done={index + 1} />
      </div>
      <QuestionHead q={q} />
      {q.kind === "qcm" ? (
        <QcmBody item={item} initial={prev && "qcm" in prev ? prev.qcm : null} onValidate={(i) => onAnswer({ qcm: i })} />
      ) : (
        <OralBody q={q} onRate={(v) => onAnswer({ oral: v })} />
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
          <button key={oi} role="radio" aria-checked={sel === i} className={`option ${sel === i ? "is-selected" : ""}`} onClick={() => setSel(i)}>
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

function OralBody({ q, onRate }: { q: Question; onRate: (v: 0 | 0.5 | 1) => void }) {
  const [shown, setShown] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  if (q.kind !== "oral") return null;

  return (
    <>
      {!shown && (
        <>
          <div className="tip row-8">
            <span aria-hidden>🎤</span>
            <span className="small">Réponds à voix haute comme devant le jury (≈ 1 min), puis compare avec la réponse modèle.</span>
          </div>
          <button className={`timer ${left === 0 ? "is-done" : ""}`} onClick={() => setLeft(60)}>
            <span className="timer-ring" style={{ ["--p" as string]: left === null ? 0 : (60 - left) / 60 }}>
              <span>{left === null ? "60" : left}</span>
            </span>
            <span className="small">{left === null ? "Lancer le chrono d'une minute" : left === 0 ? "Temps écoulé !" : "Je parle…"}</span>
          </button>
        </>
      )}
      {shown && (
        <section className="card card-accent stack-10" aria-live="polite">
          <p className="kicker">Réponse modèle · points clés</p>
          <ul className="points">{q.points.map((p) => <li key={p}>{p}</li>)}</ul>
          {q.tip && <p className="small tip-inline">💬 {q.tip}</p>}
          <p className="small muted">📄 {q.ref}</p>
        </section>
      )}
      {shown && q.relance && <RelanceBox r={q.relance} />}
      <div className="grow" />
      <div className="sticky-cta">
        {shown ? (
          <div className="stack-8">
            <p className="small muted center">As-tu cité l'essentiel de ces points ?</p>
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

function RelanceBox({ r }: { r: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="relance">
      <button className="relance-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="row-8 fill">
          <span aria-hidden>🔁</span>
          <span className="stack-2">
            <span className="kicker kicker-amber">Relance possible du jury</span>
            <strong className="small-lg">{r.q}</strong>
          </span>
        </span>
        <span className={`plus ${open ? "is-open" : ""}`} aria-hidden>+</span>
      </button>
      {open && <p className="small relance-a">{r.a}</p>}
    </section>
  );
}

/* ───────────────────────── Note ───────────────────────── */

export function ResultView({
  track, items, result, title, onReview, onNext, onHome,
}: {
  track: Track; items: SeriesItem[]; result: Result; title: string;
  onReview: () => void; onNext: () => void; onHome: () => void;
}) {
  const m = mention(result.score);
  const byPart = useMemo(() => {
    const map = new Map<string, { got: number; max: number }>();
    items.forEach((it, i) => {
      const t = map.get(it.question.part) ?? { got: 0, max: 0 };
      t.got += result.items[i].points;
      t.max += 1;
      map.set(it.question.part, t);
    });
    return CONTENT[track].parts.filter((p) => map.has(p)).map((p) => [p, map.get(p)!] as const);
  }, [items, result, track]);
  const good = result.items.filter((p) => p.points === 1).length;
  const weakest = byPart.reduce<(typeof byPart)[number] | null>((w, x) => (!w || x[1].got / x[1].max < w[1].got / w[1].max ? x : w), null);

  return (
    <main className="screen">
      <TopBar title={title} onBack={onHome} />
      <section className="stack-12 center">
        <p className="kicker">{result.mode === "exam" ? "Examen blanc terminé" : "Série terminée"}</p>
        <div className={`score tone-${m.tone}`} style={{ ["--p" as string]: result.score / 20 }}>
          <span className="score-num">{fmt(result.score)}</span>
          <span className="score-max">/ 20</span>
        </div>
        <h2 className="h2">{m.label}</h2>
        <p className="small muted">
          {good} réponse{good > 1 ? "s" : ""} pleinement juste{good > 1 ? "s" : ""} sur {items.length}
          {result.seconds ? ` · en ${mmss(result.seconds)}` : ""}
        </p>
      </section>

      <section className="card stack-12">
        <p className="small muted strong">Par partie du rapport</p>
        {byPart.map(([part, v]) => (
          <div key={part} className="stack-6">
            <div className="row-8">
              <span className="small fill">{part}</span>
              <strong className="small">{fmt(v.got)}/{v.max}</strong>
            </div>
            <Meter value={v.got / v.max} />
          </div>
        ))}
      </section>

      {weakest && weakest[1].got / weakest[1].max < 0.75 && (
        <section className="tip row-8">
          <span aria-hidden>📚</span>
          <span className="small">
            <strong>Conseil :</strong> relis la fiche « {weakest[0]} » avant ta prochaine série. Les questions ratées reviendront en priorité.
          </span>
        </section>
      )}

      <div className="grow" />
      <div className="sticky-cta stack-10">
        <button className="btn btn-primary" onClick={onReview}>Voir la correction détaillée</button>
        <button className="btn btn-secondary" onClick={onNext}>Nouvelle série (questions différentes)</button>
      </div>
    </main>
  );
}

/* ───────────────────────── Correction ───────────────────────── */

export function Review({
  items, answers, title, onNext, onHome,
}: {
  items: SeriesItem[]; answers: Answer[]; title: string; onNext: () => void; onHome: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "wrong">("all");
  const list = items.map((it, i) => ({ it, a: answers[i], pts: pointsFor(it, answers[i]), i })).filter((x) => filter === "all" || x.pts < 1);

  return (
    <main className="screen">
      <TopBar title={title} onBack={onHome} />
      <h1 className="h1-sm">Les bonnes réponses</h1>
      <div className="seg-ctrl" role="tablist">
        <button role="tab" aria-selected={filter === "all"} onClick={() => setFilter("all")}>Toutes ({items.length})</button>
        <button role="tab" aria-selected={filter === "wrong"} onClick={() => setFilter("wrong")}>
          À revoir ({items.filter((it, i) => pointsFor(it, answers[i]) < 1).length})
        </button>
      </div>
      {list.length === 0 && <p className="muted center">Aucune erreur : bravo ! 🎉</p>}
      {list.map(({ it, a, pts, i }) => {
        const q = it.question;
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
                  🎤 Points clés attendus <span className="muted">· ton auto-éval : {pts === 1 ? "maîtrisé" : pts === 0.5 ? "partiel" : "à revoir"}</span>
                </strong>
                <ul className="points small">{q.points.map((p) => <li key={p}>{p}</li>)}</ul>
                {q.tip && <span className="small">💬 {q.tip}</span>}
              </div>
            )}
            {q.relance && <RelanceBox r={q.relance} />}
            <span className="small muted">📄 {q.ref}</span>
          </section>
        );
      })}
      <div className="sticky-cta stack-10">
        <button className="btn btn-primary" onClick={onNext}>Nouvelle série</button>
        <button className="btn btn-secondary" onClick={onHome}>Retour au tableau de bord</button>
      </div>
    </main>
  );
}
