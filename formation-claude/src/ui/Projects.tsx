import { useMemo, useState } from "react";
import { MODULES } from "../content";
import { LEVEL_ORDER, PROJECTS, type Project } from "../content/projects";
import { update, type Store } from "../engine";
import { videoForProject, videoMs } from "../video";
import { CodeBlock, Rich } from "./Rich";
import { VideoPlayer } from "./VideoPlayer";

const LEVEL_ICON: Record<Project["level"], string> = { Débutant: "🌱", Intermédiaire: "🔧", Avancé: "⚙️", Expert: "🚀" };
const unlocked = (s: Store, p: Project) => s.mods[MODULES[p.requires].id].passed;
const doneOf = (s: Store, p: Project) => (s.projects?.[p.id] ?? []).length;

export function ProjectsList({ store, onOpen, onBack }: { store: Store; onOpen: (id: string) => void; onBack: () => void }) {
  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Retour" onClick={onBack}>←</button>
        <span className="topbar-title fill">Projets guidés</span>
      </header>
      <section className="stack-8">
        <span className="kicker">Mettre en pratique</span>
        <h1 className="h1">Du premier projet à ta propre IA</h1>
        <p className="muted">9 tutoriels pas à pas sur DakiOriente, chacun avec sa vidéo, les prompts à donner à Claude, le code et un point de contrôle par étape. Chaque projet s'ouvre quand le palier qui l'enseigne est validé.</p>
      </section>
      {LEVEL_ORDER.map((lvl) => (
        <section key={lvl} className="stack-10">
          <h2 className="h3">{LEVEL_ICON[lvl]} {lvl}</h2>
          {PROJECTS.filter((p) => p.level === lvl).map((p) => {
            const open = unlocked(store, p);
            const d = doneOf(store, p);
            return (
              <button key={p.id} className={`proj ${open ? "" : "is-locked"}`} disabled={!open} onClick={() => onOpen(p.id)}>
                <span className="row-8">
                  <span className="small muted fill">{p.duration} · {p.steps.length} étapes</span>
                  {!open ? <span className="status">🔒 Palier {MODULES[p.requires].num}</span> : d === p.steps.length ? <span className="status status-passed">Terminé</span> : d > 0 ? <span className="status status-lesson">{d}/{p.steps.length}</span> : null}
                </span>
                <strong className="proj-title">{p.title}</strong>
                <span className="small muted">{p.pitch}</span>
                {open && d > 0 && <span className="mini-bar"><span style={{ width: `${(d / p.steps.length) * 100}%` }} /></span>}
              </button>
            );
          })}
        </section>
      ))}
    </main>
  );
}

export function ProjectView({ id, store, onBack, onChange }: { id: string; store: Store; onBack: () => void; onChange: () => void }) {
  const p = PROJECTS.find((x) => x.id === id)!;
  const video = useMemo(() => videoForProject(p), [p]);
  const [done, setDone] = useState<string[]>(store.projects?.[p.id] ?? []);
  const [showVideo, setShowVideo] = useState(false);
  const toggle = (k: string) => {
    const next = done.includes(k) ? done.filter((x) => x !== k) : [...done, k];
    setDone(next);
    update((s) => { s.projects = { ...(s.projects ?? {}), [p.id]: next }; });
    onChange();
  };
  const nextIdx = p.steps.findIndex((_, i) => !done.includes(String(i)));

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Retour" onClick={onBack}>←</button>
        <span className="topbar-title fill">{LEVEL_ICON[p.level]} Projet {p.level.toLowerCase()}</span>
        <span className="mono small">{done.length}/{p.steps.length}</span>
      </header>
      <section className="stack-8">
        <span className="chip">{p.duration} · palier {MODULES[p.requires].num} requis</span>
        <h1 className="h1">{p.title}</h1>
        <p className="lead">{p.pitch}</p>
      </section>

      {showVideo ? (
        <VideoPlayer video={video} autoPlay />
      ) : (
        <button className="vposter" onClick={() => setShowVideo(true)}>
          <span className="vposter-play" aria-hidden>▶</span>
          <span className="stack-2">
            <strong>Vidéo du projet</strong>
            <span className="small">Toutes les étapes expliquées · {Math.round(videoMs(video) / 60000)} min · voix off</span>
          </span>
        </button>
      )}

      <section className="grid-2 proj-meta">
        <div className="card stack-8">
          <h2 className="h3">🎯 Tu vas construire</h2>
          <ul className="blist small">{p.build.map((b) => <li key={b}><Rich text={b} /></li>)}</ul>
        </div>
        <div className="card stack-8">
          <h2 className="h3">🧰 Prérequis</h2>
          <ul className="blist small">{p.prereq.map((b) => <li key={b}><Rich text={b} /></li>)}</ul>
        </div>
      </section>

      <ol className="steps">
        {p.steps.map((s, i) => {
          const k = String(i);
          const isDone = done.includes(k);
          return (
            <li key={k} className={`step card ${isDone ? "is-done" : ""} ${i === nextIdx ? "is-next" : ""}`}>
              <div className="row-12 step-head">
                <span className="step-num">{isDone ? "✓" : i + 1}</span>
                <h2 className="h3 fill">{s.title}</h2>
              </div>
              <p className="step-why"><strong>Pourquoi :</strong> <Rich text={s.why} /></p>
              {s.prompt && (
                <div className="prompt-box">
                  <span className="prompt-label">💬 Prompt à donner à Claude</span>
                  <CodeBlock title="prompt" text={s.prompt} />
                </div>
              )}
              {s.code?.map((c) => <CodeBlock key={c.title} title={c.title} text={c.text} />)}
              <aside className="callout callout-tip"><strong>✅ Point de contrôle</strong><span><Rich text={s.check} /></span></aside>
              <label className="check">
                <input type="checkbox" checked={isDone} onChange={() => toggle(k)} />
                <span>J'ai réussi cette étape</span>
              </label>
            </li>
          );
        })}
      </ol>

      <section className="card stack-8">
        <h2 className="h3">🚀 Pour aller plus loin</h2>
        <ul className="blist">{p.next.map((n) => <li key={n}><Rich text={n} /></li>)}</ul>
      </section>
      {done.length === p.steps.length && (
        <aside className="callout callout-tip"><strong>🎉 Projet terminé</strong><span>Note dans ton journal ce que tu as appris et ajoute les prompts qui ont marché à ta bibliothèque.</span></aside>
      )}
    </main>
  );
}
