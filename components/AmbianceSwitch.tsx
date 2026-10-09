"use client";
import { useState } from "react";
import { Placeholder } from "./Placeholder";

const MODES = {
  early: {
    tab: "Début de soirée",
    title: "Restauration, retrouvailles, moments entre amis.",
    text: "On s'installe, on partage un panini, on se retrouve. L'ambiance est conviviale et la musique accompagne la conversation.",
  },
  late: {
    tab: "À mesure que la nuit avance",
    title: "Musique, énergie, ambiance festive.",
    text: "Vers 23 h – minuit, la soirée change de rythme : amapiano, afrobeats, afritcham. L'ambiance varie selon les soirs et la programmation.",
  },
} as const;
type Mode = keyof typeof MODES;

/** Bascule « début de soirée / nuit » — transition en fondu, sans décalage de mise en page. */
export function AmbianceSwitch() {
  const [mode, setMode] = useState<Mode>("early");
  return (
    <div className="reveal overflow-hidden rounded-3xl border border-white/5">
      <div className="relative aspect-[4/5] sm:aspect-[16/9]">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <Placeholder
            key={m}
            mood={m}
            label={MODES[m].tab}
            className={`absolute inset-0 transition-opacity duration-700 ${mode === m ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pt-24 sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{MODES[mode].tab}</p>
          <p className="mt-2 max-w-xl font-display text-3xl sm:text-4xl">{MODES[mode].title}</p>
          <p className="mt-3 max-w-xl text-sm text-text/80 sm:text-base">{MODES[mode].text}</p>
        </div>
      </div>
      <div role="tablist" aria-label="Choisir l'ambiance" className="grid grid-cols-2 bg-surface p-1.5">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-12 rounded-2xl px-3 text-sm font-semibold transition ${mode === m ? "bg-secondary text-accent" : "text-muted hover:text-text"}`}
          >
            {m === "early" ? "☀︎ " : "☾ "}{MODES[m].tab}
          </button>
        ))}
      </div>
    </div>
  );
}
