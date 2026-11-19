import type { ReactNode } from "react";

export function TopBar({ title, right, onBack }: { title: string; right?: ReactNode; onBack: () => void }) {
  return (
    <div className="topbar">
      <button className="icon-btn" onClick={onBack} aria-label="Retour">
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
          <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="topbar-title">{title}</span>
      {right}
    </div>
  );
}

export function Segments({ n, done }: { n: number; done: number }) {
  return (
    <div className="segments" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={i < done ? "on" : ""} />
      ))}
    </div>
  );
}

export function Chevron() {
  return (
    <svg className="chev" width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Ring({ value, size = 64, label }: { value: number; size?: number; label?: string }) {
  const pct = Math.round(value * 100);
  return (
    <span className="ring" style={{ width: size, height: size, ["--p" as string]: value }} aria-label={`${pct} %`}>
      <span>{label ?? `${pct}%`}</span>
    </span>
  );
}

export function Meter({ value, tone }: { value: number; tone?: "success" | "amber" | "error" | "accent" }) {
  const t = tone ?? (value >= 0.75 ? "success" : value >= 0.4 ? "amber" : value > 0 ? "error" : "accent");
  return (
    <div className="meter">
      <span className={`bg-${t}`} style={{ width: `${Math.max(value * 100, value > 0 ? 3 : 0)}%` }} />
    </div>
  );
}

export const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));
export const fmtNum = (n: number) =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/ | /g, " ");
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
