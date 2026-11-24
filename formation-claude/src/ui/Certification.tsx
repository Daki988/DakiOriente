import { useState } from "react";
import { MODULES } from "../content";
import { GRILLE, LEVELS, certId, downloadCertificate, fmtDate, levelOf } from "../cert";
import { FINAL_MINUTES, FINAL_SIZE, PASS, update, type Store } from "../engine";

/* ───────────────────────── Présentation de la certification ───────────────────────── */

export function CertIntro({
  store, onBack, onStart, onReview, onCertificate,
}: { store: Store; onBack: () => void; onStart: () => void; onReview: () => void; onCertificate: () => void }) {
  const f = store.final;
  const allPassed = MODULES.every((m) => store.mods[m.id].passed);
  const blocked = !f.passed && f.needReview;
  const lvl = levelOf(store);
  const hist = (f.history ?? []).slice(-5).reverse();

  return (
    <main className="screen">
      <header className="topbar">
        <button className="icon-btn" aria-label="Retour" onClick={onBack}>←</button>
        <span className="topbar-title fill">Certification</span>
      </header>

      <section className="cert-hero">
        <span className="seal" aria-hidden>🎓</span>
        <span className="kicker">Fin de formation</span>
        <h1 className="display center">Certification Claude&nbsp;Code</h1>
        <p className="muted center">Un examen unique sur l'ensemble du parcours, dans des conditions réelles, pour attester tes compétences.</p>
      </section>

      <section className="exam-facts">
        <div><strong>{FINAL_SIZE}</strong><span>questions sur les 10 modules</span></div>
        <div><strong>{FINAL_MINUTES} min</strong><span>chronométrées</span></div>
        <div><strong>{Math.round(PASS * 100)} %</strong><span>minimum requis</span></div>
      </section>

      <section className="card stack-10">
        <h2 className="h3">Règles de l'examen</h2>
        <ul className="blist">
          <li>Questions tirées au sort, réparties sur tous les modules : chaque tentative est différente.</li>
          <li><strong>Aucune correction pendant l'épreuve</strong> : tu peux naviguer et modifier tes réponses jusqu'à la remise.</li>
          <li>À la fin du temps, ta copie est remise automatiquement.</li>
          <li>Échec : une <strong>révision express réussie (70 %)</strong> est exigée avant une nouvelle tentative. Abandonner compte comme un échec.</li>
          <li>Une fois certifié·e, tu peux repasser l'examen pour améliorer ton niveau.</li>
        </ul>
      </section>

      <section className="stack-10">
        <h2 className="h3">Trois niveaux de certification</h2>
        {LEVELS.map((l) => (
          <div key={l.id} className={`level ${lvl?.id === l.id ? "is-mine" : ""}`} style={{ ["--lc" as string]: l.color }}>
            <span className="level-badge" aria-hidden>{l.id === "expert" ? "★★★" : l.id === "avance" ? "★★" : "★"}</span>
            <span className="stack-2 fill">
              <strong>{l.title}</strong>
              <span className="small muted">{l.rule}</span>
            </span>
            {lvl?.id === l.id && <span className="status status-passed">Obtenu</span>}
          </div>
        ))}
        <p className="small muted">Le niveau Expert exige aussi la grille pratique du module 9 : une vraie fonctionnalité livrée avec le pipeline complet. Tu la coches sur la page de ton certificat.</p>
      </section>

      {hist.length > 0 && (
        <section className="card stack-8">
          <h2 className="h3">Mes tentatives</h2>
          {hist.map((h) => (
            <div key={h.date} className="row-8 small">
              <span className="fill">{fmtDate(h.date)}</span>
              <span className="mono">{Math.floor(h.seconds / 60)} min</span>
              <strong className={h.score >= PASS ? "text-ok" : "text-ko"}>{Math.round(h.score * 100)} %</strong>
            </div>
          ))}
        </section>
      )}

      {blocked && (
        <aside className="callout callout-warn">
          <strong>Nouvelle tentative verrouillée</strong>
          <span>Réussis une révision express (70 % ou plus) sur les modules du parcours pour débloquer l'examen.</span>
        </aside>
      )}

      <div className="sticky-cta stack-10">
        {!allPassed ? (
          <button className="btn btn-primary" disabled>Valide les 10 paliers pour débloquer l'examen</button>
        ) : blocked ? (
          <button className="btn btn-primary" onClick={onReview}>Faire la révision express</button>
        ) : (
          <button className="btn btn-primary" onClick={() => confirm(`L'examen dure ${FINAL_MINUTES} minutes et le chrono démarre tout de suite. Prêt·e ?`) && onStart()}>
            {f.passed ? "Repasser l'examen pour améliorer mon niveau" : "Commencer l'examen"}
          </button>
        )}
        {f.passed && <button className="btn btn-ghost" onClick={onCertificate}>Voir mon certificat</button>}
      </div>
    </main>
  );
}

/* ───────────────────────── Certificat ───────────────────────── */

export function Certificate({ store, onBack, onSave, onRetake }: { store: Store; onBack: () => void; onSave: () => void; onRetake: () => void }) {
  const [name, setName] = useState(store.final.name ?? "");
  const [grille, setGrille] = useState<string[]>(store.final.grille ?? []);
  const [copied, setCopied] = useState(false);
  if (!store.final.passed) return <main className="screen"><p>Certificat non encore obtenu.</p><button className="btn" onClick={onBack}>Retour</button></main>;

  const preview: Store = { ...store, final: { ...store.final, name, grille } };
  const lvl = levelOf(preview)!;
  const id = certId(preview);
  const saveName = () => { update((s) => { s.final.name = name.trim(); }); onSave(); };
  const shareText = `J'ai obtenu la certification « ${lvl.title} » (${Math.round(store.final.best * 100)} %) à l'issue de la formation Claude Code. Identifiant : ${id}`;

  return (
    <main className="screen">
      <header className="topbar no-print">
        <button className="icon-btn" aria-label="Retour" onClick={onBack}>←</button>
        <span className="topbar-title fill">Mon certificat</span>
      </header>

      <section className="certificate" style={{ ["--lc" as string]: lvl.color }}>
        <span className="logo logo-lg" aria-hidden>✳</span>
        <span className="kicker">Certificat de réussite</span>
        <h1 className="display center">Formation Claude Code</h1>
        <p className="muted center">décerné à</p>
        <p className="cert-name">{name.trim() || "Ton nom"}</p>
        <span className="cert-level">Niveau : {lvl.title}</span>
        <p className="center">pour avoir validé les 10 paliers du parcours et réussi l'examen de certification avec un score de <strong>{Math.round(store.final.best * 100)} %</strong>.</p>
        <div className="cert-foot">
          <div><strong>{fmtDate(store.final.date)}</strong><span>Date d'obtention</span></div>
          <div><strong className="mono">{id}</strong><span>Identifiant</span></div>
        </div>
      </section>

      <div className="no-print stack-16">
        <label className="stack-6">
          <span className="small strong">Ton nom tel qu'il apparaîtra sur le certificat</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} placeholder="Prénom Nom" />
        </label>

        <div className="grid-2">
          <button className="btn btn-primary" disabled={!name.trim()} onClick={() => { saveName(); void downloadCertificate(preview); }}>⬇ Télécharger (PNG)</button>
          <button className="btn btn-ghost" disabled={!name.trim()} onClick={() => { saveName(); window.print(); }}>🖨 Imprimer / PDF</button>
        </div>
        <button
          className="btn btn-ghost"
          onClick={async () => {
            try {
              if (navigator.share) await navigator.share({ title: "Certification Claude Code", text: shareText });
              else {
                await navigator.clipboard.writeText(shareText);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }
            } catch {
              /* partage annulé */
            }
          }}
        >
          {copied ? "Texte copié ✓" : "↗ Partager ma réussite"}
        </button>

        <section className="card stack-10">
          <div className="row-8">
            <h2 className="h3 fill">Grille pratique · niveau Expert</h2>
            <span className="mono small">{grille.filter((g) => GRILLE.includes(g)).length}/{GRILLE.length}</span>
          </div>
          <p className="small muted">
            {store.final.best >= 0.9
              ? "Ton score te place au niveau Avancé. Coche honnêtement les 6 critères du projet final pour devenir Expert."
              : "Le niveau Expert exige 90 % à l'examen et ces 6 critères. Repasse l'examen pour améliorer ton score."}
          </p>
          {GRILLE.map((g) => (
            <label key={g} className="check">
              <input
                type="checkbox"
                checked={grille.includes(g)}
                onChange={(e) => {
                  const next = e.target.checked ? [...grille, g] : grille.filter((x) => x !== g);
                  setGrille(next);
                  update((s) => { s.final.grille = next; });
                  onSave();
                }}
              />
              <span>{g}</span>
            </label>
          ))}
        </section>

        {lvl.id !== "expert" && <button className="btn btn-ghost" onClick={onRetake}>Repasser l'examen</button>}
      </div>
    </main>
  );
}
