import { useMemo, useState } from "react";
import { CHEATSHEET, GLOSSARY, MODULES } from "../content";
import { REVIEW_SIZE, shuffle, update, type Store } from "../engine";

type Tab = "memo" | "glossaire" | "cartes";
type Card = { id: string; front: string; back: string; cat: string };

const CARDS: Card[] = [
  ...GLOSSARY.map(([t, d], i) => ({ id: `g${i}`, front: t, back: d, cat: "Glossaire" })),
  ...CHEATSHEET.flatMap((sec, j) => sec.rows.map(([k, v], i) => ({ id: `c${j}-${i}`, front: k, back: v, cat: sec.title }))),
];

export function Toolbox({ store, onBack, onReview, onChange }: { store: Store; onBack: () => void; onReview: () => void; onChange: () => void }) {
  const [tab, setTab] = useState<Tab>("memo");
  const passed = MODULES.filter((m) => store.mods[m.id].passed).length;

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Retour" onClick={onBack}>←</button>
        <span className="topbar-title fill">Boîte à outils</span>
      </header>
      <h1 className="h1">Réviser et retrouver l'essentiel</h1>

      <button className="review-cta" disabled={passed === 0} onClick={onReview}>
        <span className="big-emoji" aria-hidden>🔁</span>
        <span className="stack-2 fill">
          <strong>Révision express · jusqu'à {REVIEW_SIZE} questions</strong>
          <span className="small">{passed === 0 ? "Disponible dès ton premier palier validé" : `Tirées des ${passed} palier${passed > 1 ? "s" : ""} validé${passed > 1 ? "s" : ""} : pour ne rien oublier`}</span>
        </span>
        <span aria-hidden>→</span>
      </button>

      <div className="tabs" role="tablist">
        {([["memo", "Aide-mémoire"], ["glossaire", "Glossaire"], ["cartes", "Flashcards"]] as [Tab, string][]).map(([t, l]) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {tab === "memo" && CHEATSHEET.map((sec) => (
        <section key={sec.title} className="card stack-8">
          <h2 className="h3">{sec.title}</h2>
          <dl className="kv">
            {sec.rows.map(([k, v]) => (
              <div key={k}><dt><code className="ic">{k}</code></dt><dd>{v}</dd></div>
            ))}
          </dl>
        </section>
      ))}

      {tab === "glossaire" && (
        <section className="card">
          <dl className="glossary">
            {GLOSSARY.map(([t, d]) => (<div key={t}><dt>{t}</dt><dd>{d}</dd></div>))}
          </dl>
        </section>
      )}

      {tab === "cartes" && <Flashcards store={store} onChange={onChange} />}
    </main>
  );
}

function Flashcards({ store, onChange }: { store: Store; onChange: () => void }) {
  const [onlyNew, setOnlyNew] = useState(false);
  const [seed, setSeed] = useState(0);
  const deck = useMemo(() => shuffle(CARDS.filter((c) => !onlyNew || !store.flashKnown.includes(c.id))), [onlyNew, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pos, setPos] = useState(0);
  const [flip, setFlip] = useState(false);
  const known = store.flashKnown.length;
  const card = deck[pos];

  const answer = (k: boolean) => {
    update((s) => {
      const set = new Set(s.flashKnown);
      if (k) set.add(card.id);
      else set.delete(card.id);
      s.flashKnown = [...set];
    });
    onChange();
    setFlip(false);
    setPos(pos + 1);
  };

  return (
    <section className="stack-16">
      <div className="row-8">
        <span className="small muted fill">{known}/{CARDS.length} cartes sues · commandes, raccourcis et notions</span>
        <button className="pill-btn" onClick={() => { setOnlyNew(!onlyNew); setPos(0); setFlip(false); setSeed(seed + 1); }}>{onlyNew ? "Toutes" : "À revoir"}</button>
      </div>
      {card ? (
        <>
          <button className={`flash ${flip ? "is-flipped" : ""}`} onClick={() => setFlip(!flip)}>
            <span className="flash-inner">
              <span className="flash-face"><span className="kicker">{card.cat}</span><span className="flash-front">{card.front}</span><span className="small muted">Que fait / qu'est-ce que c'est ? Touche pour retourner</span></span>
              <span className="flash-face flash-back"><span className="kicker">Réponse</span><span className="flash-text">{card.back}</span></span>
            </span>
          </button>
          <span className="small muted center">{pos + 1} / {deck.length}</span>
          {flip ? (
            <div className="row-8">
              <button className="btn btn-ghost" onClick={() => answer(false)}>🔁 À revoir</button>
              <button className="btn btn-primary" onClick={() => answer(true)}>✓ Je savais</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setFlip(true)}>Retourner la carte</button>
          )}
        </>
      ) : (
        <div className="card stack-12 center">
          <span className="big-emoji" aria-hidden>🎉</span>
          <strong>Paquet terminé</strong>
          <button className="btn btn-primary" onClick={() => { setPos(0); setSeed(seed + 1); }}>Recommencer</button>
        </div>
      )}
    </section>
  );
}
