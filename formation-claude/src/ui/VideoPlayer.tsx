import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { beatMs, videoMs, type Scene, type Video } from "../video";
import { Rich } from "./Rich";

const fmt = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function frenchVoice(): SpeechSynthesisVoice | null {
  try {
    const vs = window.speechSynthesis?.getVoices() ?? [];
    return vs.find((v) => v.lang === "fr-FR" && /google|natural|premium|enhanced|amélie|thomas/i.test(v.name)) ?? vs.find((v) => v.lang.startsWith("fr")) ?? null;
  } catch {
    return null;
  }
}

/** Lecteur de vidéo animée : scènes + voix off (synthèse vocale) + sous-titres + chapitres */
export function VideoPlayer({ video, autoPlay = false }: { video: Video; autoPlay?: boolean }) {
  const flat = useMemo(() => video.scenes.flatMap((sc, si) => sc.beats.map((b, bi) => ({ si, bi, b }))), [video]);
  const total = useMemo(() => videoMs(video), [video]);
  const offsets = useMemo(() => {
    let acc = 0;
    return flat.map((f) => { const o = acc; acc += beatMs(f.b); return o; });
  }, [flat]);

  const [pos, setPos] = useState(0); // index dans flat
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [voice, setVoice] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [speed, setSpeed] = useState(1);
  const [subs, setSubs] = useState(true);
  const [beatStart, setBeatStart] = useState(0);
  const timer = useRef<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const token = useRef(0);

  const stopAll = useCallback(() => {
    token.current++;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    try { window.speechSynthesis?.cancel(); } catch { /* rien */ }
  }, []);

  useEffect(() => stopAll, [stopAll]);
  useEffect(() => { if (autoPlay) setPlaying(true); }, [autoPlay]);

  // Lecture d'un beat
  useEffect(() => {
    if (!playing) return;
    stopAll();
    const my = token.current;
    const cur = flat[pos];
    if (!cur) return;
    setBeatStart(performance.now());
    const dur = beatMs(cur.b) / speed;
    const advance = () => {
      if (my !== token.current) return;
      if (pos + 1 < flat.length) setPos(pos + 1);
      else { setPlaying(false); setEnded(true); }
    };
    let started = false;
    if (voice && "speechSynthesis" in window) {
      try {
        const u = new SpeechSynthesisUtterance(cur.b.say);
        u.lang = "fr-FR";
        u.rate = speed;
        const v = frenchVoice();
        if (v) u.voice = v;
        u.onstart = () => {
          started = true;
          // Filet de sécurité si la fin de la voix n'est jamais signalée
          if (timer.current) window.clearTimeout(timer.current);
          timer.current = window.setTimeout(advance, dur * 2.5 + 2000);
        };
        u.onend = () => advance();
        u.onerror = () => { if (started) advance(); };
        window.speechSynthesis.speak(u);
      } catch { /* repli minuterie */ }
    }
    // Sans voix disponible (ou si elle ne démarre pas), la vidéo suit la durée estimée
    timer.current = window.setTimeout(() => {
      if (started) return;
      try { window.speechSynthesis?.cancel(); } catch { /* rien */ }
      advance();
    }, dur);
    return () => { /* nettoyé par stopAll au prochain beat */ };
  }, [playing, pos, voice, speed, flat, stopAll]);

  const toggle = () => {
    if (ended) { setEnded(false); setPos(0); setPlaying(true); return; }
    if (playing) { stopAll(); setPlaying(false); } else setPlaying(true);
  };
  const jumpScene = (si: number) => {
    stopAll();
    setEnded(false);
    setPos(Math.max(0, flat.findIndex((f) => f.si === si)));
  };
  const cur = flat[Math.min(pos, flat.length - 1)];
  const scene = video.scenes[cur.si];
  const reveal = Math.max(0, ...scene.beats.slice(0, cur.bi + 1).map((b) => b.reveal ?? 999));
  const progress = ended ? 1 : offsets[pos] / total;

  const fullscreen = () => {
    const el = stage.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => {});
  };

  return (
    <figure className="vplayer" aria-label={`Vidéo : ${video.title}`}>
      <div className="vstage" ref={stage} onClick={toggle}>
        <SceneView key={cur.si} scene={scene} reveal={reveal} playing={playing} beatStart={beatStart} speed={speed} />
        {subs && (playing || pos > 0) && !ended && <div className="vsubs" aria-live="off">{cur.b.say}</div>}
        {!playing && (
          <button className="vbig" aria-label={ended ? "Revoir" : "Lecture"} onClick={(e) => { e.stopPropagation(); toggle(); }}>
            {ended ? "↻" : "▶"}
          </button>
        )}
      </div>
      <div className="vtrack" role="slider" aria-label="Progression" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <span className="vfill" style={{ width: `${progress * 100}%` }} />
        {video.scenes.map((_, si) => {
          const at = offsets[flat.findIndex((f) => f.si === si)] / total;
          return <button key={si} className={`vmark ${si === cur.si ? "is-on" : ""}`} style={{ left: `${at * 100}%` }} aria-label={`Chapitre ${si + 1}`} onClick={() => jumpScene(si)} />;
        })}
      </div>
      <div className="vctrl">
        <button onClick={toggle} aria-label={playing ? "Pause" : "Lecture"}>{playing ? "❚❚" : ended ? "↻" : "▶"}</button>
        <button className="v-hide-sm" onClick={() => jumpScene(Math.max(0, cur.si - 1))} aria-label="Scène précédente">⏮</button>
        <button onClick={() => jumpScene(Math.min(video.scenes.length - 1, cur.si + 1))} aria-label="Scène suivante">⏭</button>
        <span className="vtime mono">{fmt(offsets[pos])} / {fmt(total)}</span>
        <span className="fill" />
        <button className={voice ? "is-on" : ""} onClick={() => { stopAll(); setVoice(!voice); }} aria-label="Voix off" title="Voix off">{voice ? "🔊" : "🔇"}</button>
        <button className={subs ? "is-on" : ""} onClick={() => setSubs(!subs)} aria-label="Sous-titres" title="Sous-titres">CC</button>
        <button onClick={() => { stopAll(); setSpeed(speed === 1 ? 1.25 : speed === 1.25 ? 1.5 : 1); }} aria-label="Vitesse">{speed}×</button>
        <button className="v-hide-sm" onClick={fullscreen} aria-label="Plein écran">⛶</button>
      </div>
    </figure>
  );
}

function SceneView({ scene, reveal, playing, beatStart, speed }: { scene: Scene; reveal: number; playing: boolean; beatStart: number; speed: number }) {
  switch (scene.k) {
    case "title":
      return (
        <div className="vs vs-title">
          <span className="vs-logo" aria-hidden>✳</span>
          <span className="vs-kicker">{scene.kicker}</span>
          <h3 className="vs-h">{scene.title}</h3>
          {scene.sub && <span className="vs-sub">{scene.sub}</span>}
        </div>
      );
    case "end":
      return (
        <div className="vs vs-title vs-end">
          <span className="vs-logo" aria-hidden>🧠</span>
          <h3 className="vs-h">{scene.title}</h3>
          <span className="vs-sub">{scene.sub}</span>
        </div>
      );
    case "points": {
      const items = scene.items;
      const many = items.length > 4;
      return (
        <div className={`vs vs-points ${many ? "is-dense" : ""}`}>
          {scene.title && <span className="vs-kicker">{scene.title}</span>}
          <ul>
            {items.map((it, i) => (
              <li key={i} className={i < reveal ? "is-in" : ""} style={{ ["--d" as string]: i }}>
                <span className="vs-dot">{scene.ordered ? i + 1 : "•"}</span>
                <span><Rich text={it} /></span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case "flow":
      return (
        <div className="vs vs-flow">
          <span className="vs-kicker">{scene.title}</span>
          <div className={`flow ${scene.loop ? "is-loop" : ""} ${scene.steps.length > 5 ? "is-many" : ""}`}>
            {scene.steps.map((s, i) => (
              <div key={s} className={`flow-step ${i < reveal ? "is-in" : ""} ${i === reveal - 1 ? "is-hot" : ""}`}>
                <span className="flow-num">{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
          {scene.loop && reveal >= scene.steps.length && <span className="flow-loop">↺ et on recommence</span>}
        </div>
      );
    case "table":
      return (
        <div className="vs vs-table">
          <div className="vt-head">{scene.head.map((h) => <span key={h}>{h}</span>)}</div>
          <div className="vt-rows">
            {scene.rows.map((r, i) => (
              <div key={i} className={`vt-row ${i < reveal ? "is-in" : ""} ${i === reveal - 1 ? "is-hot" : ""}`} style={{ gridTemplateColumns: `repeat(${r.length}, 1fr)` }}>
                {r.map((c, j) => <span key={j}><Rich text={c} /></span>)}
              </div>
            ))}
          </div>
        </div>
      );
    case "callout":
      return (
        <div className={`vs vs-callout tone-${scene.tone}`}>
          <span className="vs-co-icon" aria-hidden>{scene.tone === "warn" ? "⚠️" : scene.tone === "tip" ? "✅" : "🔑"}</span>
          <h3 className="vs-h2">{scene.title}</h3>
          <p><Rich text={scene.text} /></p>
        </div>
      );
    case "compare":
      return (
        <div className="vs vs-compare">
          <div className={`vc vc-flou ${reveal >= 1 ? "is-in" : ""}`}><span>✗ Flou</span><p>{scene.flou}</p></div>
          <div className={`vc vc-precis ${reveal >= 2 ? "is-in" : ""}`}><span>✓ Précis</span><p>{scene.precis}</p></div>
        </div>
      );
    case "terminal":
      return <Terminal title={scene.title} lines={scene.lines} playing={playing} beatStart={beatStart} speed={speed} />;
  }
}

function Terminal({ title, lines, playing, speed }: { title: string; lines: string[]; playing: boolean; beatStart: number; speed: number }) {
  const full = lines.join("\n");
  const [n, setN] = useState(playing ? 0 : full.length);
  useEffect(() => {
    if (!playing) { setN(full.length); return; }
    let raf = 0;
    const t0 = performance.now();
    const cps = 45 * speed;
    const tick = () => {
      const c = Math.min(full.length, Math.floor(((performance.now() - t0) / 1000) * cps));
      setN(c);
      if (c < full.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, full, speed]);
  return (
    <div className="vs vs-term">
      <div className="vterm">
        <div className="vterm-bar"><i /><i /><i /><span>{title}</span></div>
        <pre>{full.slice(0, n)}<span className="caret">▋</span></pre>
      </div>
    </div>
  );
}
