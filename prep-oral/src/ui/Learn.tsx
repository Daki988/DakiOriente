import { useEffect, useMemo, useState } from "react";
import type { Track } from "../content/types";
import { CONTENT, load, parseNumber, setCalcDone, setFlash, shuffle } from "../engine";
import { Chevron, Meter, Segments, TopBar, fmtNum, mmss } from "./common";

/* ───────────────────────── Fiches de cours ───────────────────────── */

export function FichesList({ track, onOpen, onBack }: { track: Track; onOpen: (i: number) => void; onBack: () => void }) {
  const c = CONTENT[track];
  return (
    <main className="screen">
      <TopBar title={`${c.label} · Fiches de cours`} onBack={onBack} />
      <header className="stack-6">
        <h1 className="h1-sm">Fiches de cours</h1>
        <p className="muted small">L'essentiel de chaque partie du rapport : idées clés, chiffres à connaître et pièges à éviter.</p>
      </header>
      <div className="stack-10">
        {c.fiches.map((f, i) => (
          <button key={f.title} className="list-item" onClick={() => onOpen(i)}>
            <span className="list-num">{i === 0 ? "★" : ["", "I", "II", "III", "IV"][i]}</span>
            <span className="stack-2 fill">
              <strong>{f.title}</strong>
              <span className="small muted">{f.pages}</span>
            </span>
            <Chevron />
          </button>
        ))}
      </div>
    </main>
  );
}

export function FicheView({ track, index, onBack, onPractice, onNav }: { track: Track; index: number; onBack: () => void; onPractice: (part: string) => void; onNav: (i: number) => void }) {
  const c = CONTENT[track];
  const f = c.fiches[index];
  return (
    <main className="screen">
      <TopBar title={`Fiche ${index + 1} / ${c.fiches.length}`} onBack={onBack} />
      <header className="stack-8">
        <span className="chip">{f.part}</span>
        <h1 className="h1-sm">{f.title}</h1>
        <p className="small muted">📄 {f.pages}</p>
      </header>
      <section className="card card-accent stack-6">
        <p className="kicker">À retenir en une phrase</p>
        <p className="lead">{f.essentiel}</p>
      </section>
      {f.chiffres && (
        <section className="stack-8">
          <p className="kicker">Chiffres clés</p>
          <div className="kpis">
            {f.chiffres.map((k) => (
              <div key={k.label} className="kpi">
                <span className="kpi-v">{k.value}</span>
                <span className="kpi-l">{k.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      {f.sections.map((s) => (
        <section key={s.h} className="card stack-8">
          <h2 className="h3">{s.h}</h2>
          <ul className="points">{s.items.map((it) => <li key={it}>{it}</li>)}</ul>
        </section>
      ))}
      {f.pieges && (
        <section className="card card-warn stack-8">
          <h2 className="h3">⚠️ Pièges à éviter à l'oral</h2>
          <ul className="points">{f.pieges.map((p) => <li key={p}>{p}</li>)}</ul>
        </section>
      )}
      <div className="sticky-cta stack-10">
        <button className="btn btn-primary" onClick={() => onPractice(f.part)}>M'entraîner sur cette partie</button>
        <div className="row-8">
          <button className="btn btn-secondary" disabled={index === 0} onClick={() => onNav(index - 1)}>← Précédente</button>
          <button className="btn btn-secondary" disabled={index === c.fiches.length - 1} onClick={() => onNav(index + 1)}>Suivante →</button>
        </div>
      </div>
    </main>
  );
}

/* ───────────────────────── Notions ───────────────────────── */

export function Notions({ track, onBack }: { track: Track; onBack: () => void }) {
  const c = CONTENT[track];
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const list = c.notions.filter((n) => !q || norm(n.term + " " + n.def).includes(norm(q)));
  return (
    <main className="screen">
      <TopBar title={`${c.label} · Notions clés`} onBack={onBack} />
      <header className="stack-6">
        <h1 className="h1-sm">Notions clés</h1>
        <p className="muted small">Définition, formule et application dans ton rapport : le jury vérifie que tu maîtrises le vocabulaire.</p>
      </header>
      <input className="search" type="search" placeholder="Rechercher une notion…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher une notion" />
      <div className="stack-10">
        {list.map((n) => {
          const isOpen = open === n.term;
          return (
            <section key={n.term} className={`card notion ${isOpen ? "is-open" : ""}`}>
              <button className="notion-head" onClick={() => setOpen(isOpen ? null : n.term)} aria-expanded={isOpen}>
                <strong className="fill">{n.term}</strong>
                <span className={`plus ${isOpen ? "is-open" : ""}`} aria-hidden>+</span>
              </button>
              {isOpen && (
                <div className="stack-10">
                  <p className="small">{n.def}</p>
                  {n.formula && <p className="formula">{n.formula}</p>}
                  <div className="explain stack-4">
                    <strong className="small">📌 Dans ton rapport</strong>
                    <span className="small">{n.inReport}</span>
                  </div>
                  <span className="small muted">📄 {n.ref}</span>
                </div>
              )}
            </section>
          );
        })}
        {list.length === 0 && <p className="muted center small">Aucune notion trouvée.</p>}
      </div>
    </main>
  );
}

/* ───────────────────────── Flashcards ───────────────────────── */

export function Flashcards({ track, onBack }: { track: Track; onBack: () => void }) {
  const c = CONTENT[track];
  const ids = c.flashcards.map((_, i) => `${track}-f${i}`);
  const [onlyUnknown, setOnlyUnknown] = useState(false);
  const [deck, setDeck] = useState<number[]>(() => shuffle(c.flashcards.map((_, i) => i)));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(() => new Set(load().tracks[track].flashKnown));

  const restart = (unknownOnly: boolean) => {
    const pool = c.flashcards.map((_, i) => i).filter((i) => !unknownOnly || !known.has(ids[i]));
    setOnlyUnknown(unknownOnly);
    setDeck(shuffle(pool));
    setPos(0);
    setFlipped(false);
  };

  const answer = (k: boolean) => {
    const id = ids[deck[pos]];
    setFlash(track, id, k);
    const s = new Set(known);
    if (k) s.add(id);
    else s.delete(id);
    setKnown(s);
    setFlipped(false);
    setPos(pos + 1);
  };

  const done = pos >= deck.length;
  const card = !done ? c.flashcards[deck[pos]] : null;

  return (
    <main className="screen">
      <div className="stack-12">
        <TopBar title={`${c.label} · Flashcards`} onBack={onBack} right={<span className="topbar-count">{Math.min(pos + 1, deck.length)} / {deck.length}</span>} />
        <Segments n={Math.min(deck.length, 24)} done={Math.round((pos / Math.max(deck.length, 1)) * Math.min(deck.length, 24))} />
      </div>
      <p className="small muted">Chiffres et listes à connaître par cœur. Essaie de répondre, retourne la carte, puis sois honnête.</p>
      {card ? (
        <>
          <button className={`flash ${flipped ? "is-flipped" : ""}`} onClick={() => setFlipped(!flipped)} aria-live="polite">
            <span className="flash-inner">
              <span className="flash-face flash-front">
                <span className="kicker">Question</span>
                <span className="flash-text">{card.front}</span>
                <span className="small muted">Touche pour retourner</span>
              </span>
              <span className="flash-face flash-back">
                <span className="kicker">Réponse</span>
                <span className="flash-text flash-answer">{card.back}</span>
                <span className="small muted">📄 {card.ref}</span>
              </span>
            </span>
          </button>
          <div className="grow" />
          <div className="sticky-cta">
            {flipped ? (
              <div className="rate rate-2">
                <button className="rate-btn tone-error" onClick={() => answer(false)}>🔁<span>À revoir</span></button>
                <button className="rate-btn tone-success" onClick={() => answer(true)}>✅<span>Je savais</span></button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={() => setFlipped(true)}>Voir la réponse</button>
            )}
          </div>
        </>
      ) : (
        <section className="card stack-12 center">
          <span className="emoji-xl" aria-hidden>🎉</span>
          <h2 className="h2">Paquet terminé !</h2>
          <p className="small muted">{known.size} carte{known.size > 1 ? "s" : ""} sue{known.size > 1 ? "s" : ""} sur {c.flashcards.length}</p>
          <Meter value={known.size / c.flashcards.length} />
          <div className="stack-10 fill-w">
            {known.size < c.flashcards.length && <button className="btn btn-primary" onClick={() => restart(true)}>Revoir celles à retravailler ({c.flashcards.length - known.size})</button>}
            <button className="btn btn-secondary" onClick={() => restart(false)}>Tout le paquet {onlyUnknown ? "" : "(mélangé)"}</button>
          </div>
        </section>
      )}
    </main>
  );
}

/* ───────────────────────── Calculs ───────────────────────── */

export function Calculs({ track, onBack }: { track: Track; onBack: () => void }) {
  const c = CONTENT[track];
  const [i, setI] = useState<number | null>(null);
  const [doneSet, setDoneSet] = useState(() => new Set(load().tracks[track].calcDone));
  if (i !== null)
    return (
      <CalculView
        key={i}
        track={track}
        index={i}
        onBack={() => setI(null)}
        onNext={i + 1 < c.calculs.length ? () => setI(i + 1) : undefined}
        onSolved={() => setDoneSet(new Set(load().tracks[track].calcDone))}
      />
    );
  return (
    <main className="screen">
      <TopBar title={`${c.label} · Calculs`} onBack={onBack} />
      <header className="stack-6">
        <h1 className="h1-sm">Refais les calculs</h1>
        <p className="muted small">Le jury peut te demander de justifier un chiffre. Refais chaque calcul toi-même : la correction est donnée pas à pas.</p>
      </header>
      <div className="stack-10">
        {c.calculs.map((k, j) => (
          <button key={k.title} className="list-item" onClick={() => setI(j)}>
            <span className={`list-num ${doneSet.has(`${track}-c${j}`) ? "is-done" : ""}`}>{doneSet.has(`${track}-c${j}`) ? "✓" : j + 1}</span>
            <span className="stack-2 fill">
              <strong>{k.title}</strong>
              <span className="small muted">📄 {k.ref}</span>
            </span>
            <Chevron />
          </button>
        ))}
      </div>
    </main>
  );
}

function CalculView({ track, index, onBack, onNext, onSolved }: { track: Track; index: number; onBack: () => void; onNext?: () => void; onSolved: () => void }) {
  const k = CONTENT[track].calculs[index];
  const [val, setVal] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "ko" | "shown">("idle");
  const [tries, setTries] = useState(0);
  const check = () => {
    const n = parseNumber(val);
    if (n === null) return;
    const ok = Math.abs(n - k.answer) <= k.tolerance;
    setTries(tries + 1);
    setState(ok ? "ok" : "ko");
    if (ok) {
      setCalcDone(track, `${track}-c${index}`);
      onSolved();
    }
  };
  const showSteps = state === "ok" || state === "shown";

  return (
    <main className="screen">
      <TopBar title={`Calcul ${index + 1} / ${CONTENT[track].calculs.length}`} onBack={onBack} />
      <section className="card stack-12">
        <span className="chip">🧮 {k.title}</span>
        <p className="lead">{k.enonce}</p>
        <span className="small muted">📄 {k.ref}</span>
      </section>
      <form className="calc-input" onSubmit={(e) => { e.preventDefault(); check(); }}>
        <input
          inputMode="decimal"
          placeholder="Ta réponse"
          value={val}
          onChange={(e) => { setVal(e.target.value); if (state === "ko") setState("idle"); }}
          aria-label="Ta réponse"
          disabled={showSteps}
        />
        <span className="unit">{k.unit}</span>
      </form>
      {state === "ko" && (
        <div className="feedback tone-error-soft">
          ❌ Pas tout à fait. {tries >= 2 ? "Regarde la correction pour comprendre." : "Vérifie la formule et réessaie."}
        </div>
      )}
      {state === "ok" && <div className="feedback tone-success-soft">✅ Bravo ! Réponse attendue : {fmtNum(k.answer)} {k.unit}</div>}
      {showSteps && (
        <section className="card card-accent stack-8">
          <p className="kicker">Correction pas à pas</p>
          <ol className="steps">{k.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </section>
      )}
      <div className="grow" />
      <div className="sticky-cta stack-10">
        {!showSteps ? (
          <>
            <button className="btn btn-primary" disabled={parseNumber(val) === null} onClick={check}>Vérifier</button>
            <button className="btn btn-secondary" onClick={() => setState("shown")}>Voir la correction</button>
          </>
        ) : onNext ? (
          <button className="btn btn-primary" onClick={onNext}>Calcul suivant</button>
        ) : (
          <button className="btn btn-primary" onClick={onBack}>Retour à la liste</button>
        )}
      </div>
    </main>
  );
}

/* ───────────────────────── Pitch ───────────────────────── */

export function Pitch({ track, onBack }: { track: Track; onBack: () => void }) {
  const c = CONTENT[track];
  const total = useMemo(() => c.pitch.reduce((s, p) => s + p.seconds, 0), [c]);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  let acc = 0;
  const current = c.pitch.findIndex((p) => (acc += p.seconds) > elapsed);
  const stepIndex = current === -1 ? c.pitch.length - 1 : current;

  return (
    <main className="screen">
      <TopBar title={`${c.label} · Mon pitch`} onBack={onBack} />
      <header className="stack-6">
        <h1 className="h1-sm">Entraîne ta présentation</h1>
        <p className="muted small">
          Une trame de {mmss(total)} pour ouvrir ta soutenance. Lance le chrono et présente à voix haute : l'étape en cours s'allume. Masque ensuite le texte pour t'entraîner sans support.
        </p>
      </header>
      <section className="card row-12 pitch-bar">
        <span className="pitch-time">{mmss(elapsed)}</span>
        <span className="fill"><Meter value={Math.min(elapsed / total, 1)} tone={elapsed > total ? "error" : "accent"} /></span>
        <span className="small muted">{mmss(total)}</span>
      </section>
      <div className="stack-10">
        {c.pitch.map((p, i) => {
          const active = (running || elapsed > 0) && i === stepIndex;
          return (
            <section key={p.label} className={`card stack-8 pitch-step ${active ? "is-active" : ""} ${elapsed > 0 && i < stepIndex ? "is-past" : ""}`}>
              <div className="row-8">
                <strong className="fill">{i + 1}. {p.label}</strong>
                <span className="pill">{mmss(p.seconds)}</span>
              </div>
              {!hide && <ul className="points small">{p.content.map((x) => <li key={x}>{x}</li>)}</ul>}
            </section>
          );
        })}
      </div>
      <div className="sticky-cta stack-10">
        <button className="btn btn-primary" onClick={() => setRunning(!running)}>
          {running ? "⏸ Pause" : elapsed > 0 ? "▶ Reprendre" : "▶ Lancer le chrono"}
        </button>
        <div className="row-8">
          <button className="btn btn-secondary" onClick={() => { setRunning(false); setElapsed(0); }}>↺ Recommencer</button>
          <button className="btn btn-secondary" onClick={() => setHide(!hide)}>{hide ? "👁 Afficher le texte" : "🙈 Masquer le texte"}</button>
        </div>
      </div>
    </main>
  );
}
