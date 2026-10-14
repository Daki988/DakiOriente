"use client";
import { useEffect, useState } from "react";
import { TIMEZONE } from "@/lib/hours";

/**
 * « Le pouls de la soirée » : frise 15 h → nuit, avec un marqueur en temps réel (heure de Libreville).
 * Ne promet rien après minuit : la fin de soirée dépend des soirs.
 */
const STEPS = [
  { at: 15, label: "15 h", title: "Ouverture", text: "Les premiers verres, un panini, on se pose." },
  { at: 18, label: "18 h", title: "Afterwork", text: "Bières fraîches, cocktails, on se retrouve entre amis." },
  { at: 20, label: "20 h", title: "Dîner", text: "Burgers, wings, brochettes : la cuisine tourne à plein." },
  { at: 23, label: "23 h", title: "La nuit monte", text: "Amapiano, afrobeats, afrotcham : le son monte, la piste aussi." },
];
const START = 15, END = 25; // l'échelle s'étend jusqu'à 1 h du matin

function nowInLibreville() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { h, m, label: `${h} h ${String(m).padStart(2, "0")}` };
}

export function NightPulse() {
  const [now, setNow] = useState<ReturnType<typeof nowInLibreville> | null>(null);
  useEffect(() => {
    const t = () => setNow(nowInLibreville());
    t();
    const id = setInterval(t, 60_000);
    return () => clearInterval(id);
  }, []);

  // position du marqueur sur l'échelle 15 h → 1 h
  let pos: number | null = null;
  let current = -1;
  if (now) {
    const hh = now.h < 6 ? now.h + 24 : now.h;
    const v = hh + now.m / 60;
    if (v >= START) {
      pos = Math.min(1, (v - START) / (END - START));
      current = STEPS.reduce((acc, s, i) => (v >= s.at ? i : acc), -1);
    }
  }
  const pct = (h: number) => `${((h - START) / (END - START)) * 100}%`;

  return (
    <div className="spotlight reveal rounded-3xl border border-white/10 bg-surface p-5 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Le pouls de la soirée</p>
        <p className="text-sm text-muted" aria-live="polite">
          {now ? (
            pos === null ? <>Il est {now.label} à Libreville — on vous attend dès 15 h.</> : <>Il est <span className="font-semibold text-text">{now.label}</span> à Libreville</>
          ) : "Heure de Libreville"}
        </p>
      </div>

      {/* Frise */}
      <div className="relative mt-8 h-2 rounded-full bg-white/10" role="presentation">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold/70 via-accent to-[#7c4dff]" style={{ width: pos !== null ? `${pos * 100}%` : "0%", transition: "width 1s" }} />
        {STEPS.map((s, i) => (
          <span key={s.at} className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${i <= current ? "border-accent bg-accent" : "border-white/30 bg-bg"}`} style={{ left: pct(s.at) }} />
        ))}
        {pos !== null && (
          <span className="ping absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text shadow-[0_0_20px_rgba(255,255,255,.7)]" style={{ left: `${pos * 100}%` }} aria-hidden="true" />
        )}
      </div>
      <ol className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.at} className={`rounded-2xl p-3 transition ${i === current ? "bg-secondary/60 ring-1 ring-accent/40" : ""}`}>
            <p className={`font-display text-2xl ${i === current ? "text-accent" : "text-text/60"}`}>{s.label}</p>
            <p className="mt-1 text-sm font-semibold">{s.title}{i === current && <span className="ml-2 text-[10px] uppercase tracking-widest text-accent">maintenant</span>}</p>
            <p className="mt-1 text-xs text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-muted">L&apos;ambiance varie selon les soirs et la programmation.</p>
    </div>
  );
}
