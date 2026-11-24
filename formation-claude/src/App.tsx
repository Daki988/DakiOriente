import { useEffect, useState } from "react";
import { MODULES } from "./content";
import {
  FINAL_SIZE, PASS, QUIZ_SIZE, currentIndex, drawFinal, drawQuiz, drawReview, isUnlocked, lessonDone, load, progress, resetAll, statusOf, update,
  type Item, type Status, type Store,
} from "./engine";
import { Lesson, type LessonMode } from "./ui/Lesson";
import { QuizRunner, type Answer } from "./ui/Quiz";
import { Rich } from "./ui/Rich";
import { Toolbox } from "./ui/Toolbox";

type QuizKind = { k: "module"; i: number } | { k: "final" } | { k: "review" };
type Screen =
  | { name: "map" }
  | { name: "module"; i: number }
  | { name: "lesson"; i: number; s: number; mode: LessonMode }
  | { name: "quiz"; kind: QuizKind; items: Item[] }
  | { name: "result"; kind: QuizKind; answers: Answer[] }
  | { name: "toolbox" }
  | { name: "certificate" };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "map" });
  const [store, setStore] = useState<Store>(load);
  const refresh = () => setStore(load());

  useEffect(() => {
    if (screen.name !== "lesson") window.scrollTo({ top: 0 });
  }, [screen]);

  const go = (s: Screen) => {
    refresh();
    setScreen(s);
  };

  switch (screen.name) {
    case "map":
      return <MapView store={store} go={go} />;
    case "module":
      return <ModuleView i={screen.i} store={store} go={go} />;
    case "lesson": {
      const m = MODULES[screen.i];
      return (
        <Lesson
          module={m}
          index={screen.s}
          mode={screen.mode}
          onBack={() => go({ name: "module", i: screen.i })}
          onNav={(s) => setScreen({ ...screen, s })}
          onPass={() => {
            if (screen.mode === "reread") return go({ name: "module", i: screen.i });
            const sec = m.sections[screen.s];
            const s = update((st) => {
              const ms = st.mods[m.id];
              if (screen.mode === "review") ms.toReview = ms.toReview.filter((x) => x !== sec.id);
              else ms.done = Math.max(ms.done, screen.s + 1);
            });
            setStore(s);
            if (screen.mode === "review") {
              const nextId = s.mods[m.id].toReview[0];
              if (nextId) setScreen({ name: "lesson", i: screen.i, s: m.sections.findIndex((x) => x.id === nextId), mode: "review" });
              else setScreen({ name: "module", i: screen.i });
            } else if (screen.s + 1 < m.sections.length) setScreen({ ...screen, s: screen.s + 1 });
            else setScreen({ name: "module", i: screen.i });
          }}
        />
      );
    }
    case "quiz": {
      const k = screen.kind;
      const title = k.k === "module" ? `Validation · Module ${MODULES[k.i].num}` : k.k === "final" ? "Examen de certification" : "Révision";
      return (
        <QuizRunner
          items={screen.items}
          title={title}
          onQuit={() => go(k.k === "module" ? { name: "module", i: k.i } : { name: k.k === "final" ? "map" : "toolbox" })}
          onFinish={(answers) => {
            const score = answers.filter((a) => a.correct).length / answers.length;
            update((st) => {
              if (k.k === "module") {
                const m = MODULES[k.i];
                const ms = st.mods[m.id];
                ms.attempts++;
                ms.best = Math.max(ms.best, score);
                if (score >= PASS) {
                  ms.passed = true;
                  ms.toReview = [];
                } else {
                  ms.toReview = [...new Set(answers.filter((a) => !a.correct).map((a) => a.item.q.section))];
                }
              } else if (k.k === "final") {
                st.final.attempts++;
                st.final.best = Math.max(st.final.best, score);
                if (score >= PASS && !st.final.passed) {
                  st.final.passed = true;
                  st.final.date = Date.now();
                }
              }
            });
            go({ name: "result", kind: k, answers });
          }}
        />
      );
    }
    case "result":
      return <ResultView kind={screen.kind} answers={screen.answers} store={store} go={go} />;
    case "toolbox":
      return <Toolbox store={store} onBack={() => go({ name: "map" })} onReview={() => go({ name: "quiz", kind: { k: "review" }, items: drawReview(load()) })} onChange={refresh} />;
    case "certificate":
      return <Certificate store={store} onBack={() => go({ name: "map" })} onSave={refresh} />;
  }
}

/* ───────────────────────── Carte du parcours ───────────────────────── */

const STATUS_LABEL: Record<Status, string> = {
  locked: "Verrouillé", todo: "À commencer", lesson: "Leçon en cours", quiz: "Quiz à passer", review: "Sections à relire", passed: "Validé",
};

function MapView({ store, go }: { store: Store; go: (s: Screen) => void }) {
  const pct = Math.round(progress(store) * 100);
  const cur = currentIndex(store);
  const allPassed = cur >= MODULES.length;
  const passedCount = MODULES.filter((m) => store.mods[m.id].passed).length;

  return (
    <main className="screen">
      <section className="hero">
        <div className="hero-glow" aria-hidden />
        <div className="row-12 hero-top">
          <span className="logo" aria-hidden>✳</span>
          <span className="kicker">Formation Claude Code</span>
          <button className="pill-btn" onClick={() => go({ name: "toolbox" })}>🧰 Boîte à outils</button>
        </div>
        <h1 className="display">Devenir un crack de Claude&nbsp;Code</h1>
        <p className="hero-sub">10 paliers, de l'installation à l'automatisation. Chaque palier se débloque quand le précédent est validé : leçon guidée avec contrôles, puis quiz réussi à {Math.round(PASS * 100)} %.</p>
        <div className="hero-stats">
          <div className="ring-lg" style={{ ["--p" as string]: pct / 100 }}><span>{pct}<small>%</small></span></div>
          <div className="stack-6 fill">
            <strong>{passedCount}/{MODULES.length} paliers validés</strong>
            <span className="small muted">{store.final.passed ? "Certifié·e 🎓" : allPassed ? "Examen de certification débloqué" : `Prochain : module ${MODULES[cur].num} · ${MODULES[cur].title}`}</span>
            {!allPassed ? (
              <button className="btn btn-primary btn-sm" onClick={() => go({ name: "module", i: cur })}>
                {store.mods[MODULES[cur].id].done > 0 ? "Continuer" : "Commencer"} le palier {MODULES[cur].num} →
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => go(store.final.passed ? { name: "certificate" } : { name: "quiz", kind: { k: "final" }, items: drawFinal() })}>
                {store.final.passed ? "Voir mon certificat" : "Passer l'examen final →"}
              </button>
            )}
          </div>
        </div>
      </section>

      <ol className="path" aria-label="Paliers du parcours">
        {MODULES.map((m, i) => {
          const st = statusOf(store, i);
          const ms = store.mods[m.id];
          const lessonPct = Math.min(ms.done, m.sections.length) / m.sections.length;
          return (
            <li key={m.id} className={`node node-${st} ${i === cur ? "is-current" : ""}`}>
              <span className="node-dot" aria-hidden>{st === "passed" ? "✓" : st === "locked" ? "🔒" : m.num}</span>
              <button className="node-card" disabled={st === "locked"} onClick={() => go({ name: "module", i })}>
                <span className="row-8">
                  <span className="node-num mono">Palier {m.num}</span>
                  {m.key && <span className="tag-key">module clé</span>}
                  <span className="small muted fill right">{m.duration}</span>
                </span>
                <strong className="node-title">{m.title}</strong>
                <span className="row-8">
                  <span className={`status status-${st}`}>{STATUS_LABEL[st]}</span>
                  {st !== "locked" && st !== "passed" && <span className="mini-bar fill"><span style={{ width: `${lessonPct * 100}%` }} /></span>}
                  {st === "passed" && <span className="small muted">meilleur score {Math.round(ms.best * 100)} %</span>}
                </span>
              </button>
            </li>
          );
        })}
        <li className={`node node-final ${allPassed ? (store.final.passed ? "node-passed" : "is-current") : "node-locked"}`}>
          <span className="node-dot" aria-hidden>{store.final.passed ? "🎓" : allPassed ? "★" : "🔒"}</span>
          <button className="node-card" disabled={!allPassed} onClick={() => go(store.final.passed ? { name: "certificate" } : { name: "quiz", kind: { k: "final" }, items: drawFinal() })}>
            <span className="node-num mono">Certification</span>
            <strong className="node-title">Examen final · {FINAL_SIZE} questions</strong>
            <span className="small muted">{store.final.passed ? `Réussi à ${Math.round(store.final.best * 100)} %` : allPassed ? `${Math.round(PASS * 100)} % requis sur l'ensemble du parcours` : "Se débloque quand les 10 paliers sont validés"}</span>
          </button>
        </li>
      </ol>

      <section className="card stack-10 method">
        <strong>Comment ça marche</strong>
        <ol className="blist">
          <li><strong>Leçon guidée</strong> : chaque section se termine par une question de contrôle. Réponse fausse → tu relis, une autre question t'est posée.</li>
          <li><strong>Quiz de validation</strong> : {QUIZ_SIZE} questions tirées au sort, couvrant toutes les sections. {Math.round(PASS * 100)} % pour valider.</li>
          <li><strong>Raté ?</strong> Les sections concernées sont à relire (avec contrôle) avant de retenter.</li>
          <li><strong>Pratique</strong> : l'exercice guidé sur DakiOriente ancre les compétences.</li>
        </ol>
      </section>
      <button className="link small" onClick={() => { if (confirm("Remettre toute ta progression à zéro ?")) { resetAll(); go({ name: "map" }); } }}>Remettre à zéro</button>
    </main>
  );
}

/* ───────────────────────── Page d'un module ───────────────────────── */

function ModuleView({ i, store, go }: { i: number; store: Store; go: (s: Screen) => void }) {
  const m = MODULES[i];
  const ms = store.mods[m.id];
  const st = statusOf(store, i);
  const done = lessonDone(store, m);
  const [skills, setSkills] = useState<string[]>(ms.skills);
  if (!isUnlocked(store, i)) return <main className="screen"><p>Ce palier est verrouillé.</p><button className="btn" onClick={() => go({ name: "map" })}>Retour</button></main>;

  const nextSection = Math.min(ms.done, m.sections.length - 1);
  const firstReview = ms.toReview[0];

  const cta = () => {
    if (st === "review" && firstReview) return go({ name: "lesson", i, s: m.sections.findIndex((x) => x.id === firstReview), mode: "review" });
    if (!done) return go({ name: "lesson", i, s: nextSection, mode: "learn" });
    return go({ name: "quiz", kind: { k: "module", i }, items: drawQuiz(m) });
  };
  const ctaLabel =
    st === "review" ? `Relire ${ms.toReview.length} section${ms.toReview.length > 1 ? "s" : ""} avant de retenter` :
    !done ? (ms.done > 0 ? `Continuer la leçon · ${ms.done + 1}/${m.sections.length}` : "Commencer la leçon") :
    st === "passed" ? "Refaire le quiz" : `Passer le quiz de validation`;

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Retour au parcours" onClick={() => go({ name: "map" })}>←</button>
        <span className="topbar-title fill">Parcours</span>
        <span className={`status status-${st}`}>{STATUS_LABEL[st]}</span>
      </header>

      <section className="mod-hero">
        <span className="mod-num" aria-hidden>{m.num}</span>
        <div className="stack-8">
          <span className="row-8 wrap"><span className="kicker">Module {m.num} · {m.duration}</span>{m.key && <span className="tag-key">module clé</span>}</span>
          <h1 className="h1">{m.title}</h1>
          <p className="lead"><strong>Objectif :</strong> {m.objectif}</p>
        </div>
      </section>

      <aside className="callout callout-key"><strong>Pourquoi c'est important</strong><span>{m.pourquoi}</span></aside>

      {st === "review" && (
        <aside className="callout callout-warn">
          <strong>Quiz non validé ({Math.round(ms.best * 100)} % au mieux)</strong>
          <span>Relis les sections marquées 🔁 et réponds juste à leur contrôle : le quiz se débloque ensuite.</span>
        </aside>
      )}

      <section className="stack-10">
        <h2 className="h3">Leçon · {m.sections.length} sections</h2>
        <ol className="sections">
          {m.sections.map((sec, s) => {
            const isDone = s < ms.done;
            const toReview = ms.toReview.includes(sec.id);
            const isNext = !done && s === ms.done;
            const locked = s > ms.done;
            return (
              <li key={sec.id}>
                <button
                  className={`sec ${isDone ? "is-done" : ""} ${isNext ? "is-next" : ""} ${toReview ? "is-review" : ""}`}
                  disabled={locked}
                  onClick={() => go({ name: "lesson", i, s, mode: toReview ? "review" : isDone ? "reread" : "learn" })}
                >
                  <span className="sec-dot">{toReview ? "🔁" : isDone ? "✓" : locked ? "·" : s + 1}</span>
                  <span className="fill">{sec.title}</span>
                  <span className="small muted">{toReview ? "à relire" : isDone ? "relire" : isNext ? "suivante" : ""}</span>
                </button>
              </li>
            );
          })}
          <li>
            <div className={`sec sec-quiz ${done && st !== "review" ? "is-next" : ""} ${ms.passed ? "is-done" : ""}`}>
              <span className="sec-dot">{ms.passed ? "✓" : done && st !== "review" ? "★" : "🔒"}</span>
              <span className="fill">Quiz de validation · {Math.min(QUIZ_SIZE, m.questions.length)} questions</span>
              <span className="small muted">{ms.attempts ? `${ms.attempts} essai${ms.attempts > 1 ? "s" : ""}` : `${Math.round(PASS * 100)} % requis`}</span>
            </div>
          </li>
        </ol>
      </section>

      {(done || ms.passed) && (
        <>
          <section className="card stack-10">
            <h2 className="h3">À retenir</h2>
            <ul className="blist">{m.retenir.map((r) => <li key={r}><Rich text={r} /></li>)}</ul>
          </section>
          <section className="card stack-10">
            <h2 className="h3">🛠 Exercice guidé sur DakiOriente</h2>
            <ol className="blist">{m.exercice.steps.map((s) => <li key={s}><Rich text={s} /></li>)}</ol>
            <p className="small"><strong>Résultat attendu :</strong> {m.exercice.resultat}</p>
          </section>
          <section className="card stack-10">
            <h2 className="h3">Compétences acquises</h2>
            <p className="small muted">Coche honnêtement : une compétence est acquise quand tu la fais sans relire le cours.</p>
            {m.competences.map((c) => (
              <label key={c} className="check">
                <input
                  type="checkbox"
                  checked={skills.includes(c)}
                  onChange={(e) => {
                    const next = e.target.checked ? [...skills, c] : skills.filter((x) => x !== c);
                    setSkills(next);
                    update((s) => { s.mods[m.id].skills = next; });
                  }}
                />
                <span>{c}</span>
              </label>
            ))}
          </section>
        </>
      )}

      <div className="sticky-cta stack-10">
        <button className="btn btn-primary" onClick={cta}>{ctaLabel}</button>
        {ms.passed && i + 1 < MODULES.length && <button className="btn btn-ghost" onClick={() => go({ name: "module", i: i + 1 })}>Palier suivant : {MODULES[i + 1].title} →</button>}
      </div>
    </main>
  );
}

/* ───────────────────────── Résultat ───────────────────────── */

function ResultView({ kind, answers, store, go }: { kind: QuizKind; answers: Answer[]; store: Store; go: (s: Screen) => void }) {
  const good = answers.filter((a) => a.correct).length;
  const score = good / answers.length;
  const pass = score >= PASS;
  const wrong = answers.filter((a) => !a.correct);
  const m = kind.k === "module" ? MODULES[kind.i] : null;
  const nextI = kind.k === "module" ? kind.i + 1 : -1;

  return (
    <main className="screen">
      <section className={`result ${kind.k === "review" ? "" : pass ? "is-pass" : "is-fail"}`}>
        {pass && kind.k !== "review" && <div className="confetti" aria-hidden>{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ ["--i" as string]: i }} />)}</div>}
        <span className="big-emoji" aria-hidden>{kind.k === "review" ? "🧠" : pass ? (kind.k === "final" ? "🎓" : "🏆") : "📖"}</span>
        <div className="ring-lg" style={{ ["--p" as string]: score }}><span>{Math.round(score * 100)}<small>%</small></span></div>
        <h1 className="h1 center">
          {kind.k === "review" ? "Révision terminée" : pass ? (kind.k === "final" ? "Tu es certifié·e !" : `Palier ${m!.num} validé !`) : "Pas encore validé"}
        </h1>
        <p className="muted center">
          {good}/{answers.length} bonnes réponses · {Math.round(PASS * 100)} % requis.{" "}
          {kind.k === "module" && !pass && "Relis les sections concernées : le quiz se débloque ensuite, avec de nouvelles questions."}
          {kind.k === "module" && pass && nextI < MODULES.length && `Le module ${MODULES[nextI].num} est débloqué.`}
          {kind.k === "final" && !pass && "Revois les modules concernés dans la boîte à outils, puis retente."}
        </p>
      </section>

      {wrong.length > 0 && (
        <section className="stack-10">
          <h2 className="h3">À retenir de tes erreurs</h2>
          {wrong.map((a) => (
            <div key={a.item.q.id} className="card stack-8">
              <span className="chip">Module {a.item.module.num} · {a.item.module.sections.find((s) => s.id === a.item.q.section)?.title}</span>
              <strong><Rich text={a.item.q.q} /></strong>
              <span className="answer-ok">✓ <Rich text={a.item.q.options[0]} /></span>
              <span className="small muted"><Rich text={a.item.q.explain} /></span>
            </div>
          ))}
        </section>
      )}

      <div className="sticky-cta stack-10">
        {kind.k === "module" && pass && nextI < MODULES.length && <button className="btn btn-primary" onClick={() => go({ name: "module", i: nextI })}>Commencer le palier {MODULES[nextI].num} →</button>}
        {kind.k === "module" && pass && nextI >= MODULES.length && <button className="btn btn-primary" onClick={() => go({ name: "quiz", kind: { k: "final" }, items: drawFinal() })}>Passer l'examen final →</button>}
        {kind.k === "module" && !pass && <button className="btn btn-primary" onClick={() => go({ name: "module", i: kind.i })}>Relire les sections concernées</button>}
        {kind.k === "final" && pass && <button className="btn btn-primary" onClick={() => go({ name: "certificate" })}>Voir mon certificat 🎓</button>}
        {kind.k === "final" && !pass && <button className="btn btn-primary" onClick={() => go({ name: "quiz", kind: { k: "final" }, items: drawFinal() })}>Retenter l'examen</button>}
        {kind.k === "review" && <button className="btn btn-primary" onClick={() => go({ name: "quiz", kind: { k: "review" }, items: drawReview(store) })}>Nouvelle révision</button>}
        <button className="btn btn-ghost" onClick={() => go({ name: "map" })}>Retour au parcours</button>
      </div>
    </main>
  );
}

/* ───────────────────────── Certificat ───────────────────────── */

function Certificate({ store, onBack, onSave }: { store: Store; onBack: () => void; onSave: () => void }) {
  const [name, setName] = useState(store.final.name ?? "");
  if (!store.final.passed) return <main className="screen"><p>Certificat non encore obtenu.</p><button className="btn" onClick={onBack}>Retour</button></main>;
  const date = new Date(store.final.date ?? Date.now()).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return (
    <main className="screen">
      <header className="topbar"><button className="icon-btn" aria-label="Retour" onClick={onBack}>←</button><span className="topbar-title fill">Certificat</span></header>
      <section className="certificate">
        <span className="logo logo-lg" aria-hidden>✳</span>
        <span className="kicker">Certificat de réussite</span>
        <h1 className="display center">Formation Claude Code</h1>
        <p className="muted center">décerné à</p>
        <p className="cert-name">{name || "Ton nom"}</p>
        <p className="center">pour avoir validé les 10 paliers du parcours et réussi l'examen final à <strong>{Math.round(store.final.best * 100)} %</strong>.</p>
        <p className="small muted center">{date}</p>
      </section>
      <label className="stack-6">
        <span className="small strong">Ton nom sur le certificat</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => { update((s) => { s.final.name = name; }); onSave(); }} placeholder="Prénom Nom" />
      </label>
      <section className="callout callout-key">
        <strong>Les 5 règles d'or</strong>
        <span>Plan avant le code · Toujours une preuve de vérification · Une tâche, un contexte propre · Consigne répétée trois fois → CLAUDE.md, skill ou hook · Relire chaque diff ; aucun agent ne fusionne seul.</span>
      </section>
    </main>
  );
}
