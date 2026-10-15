"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useId, useState } from "react";

/** Palette catégorielle validée (ordre fixe, jamais recyclé) ; « Autres » en gris. */
export const SERIES = ["#1a47f5", "#f59e0b", "#0f8a46", "#6a3df0", "#d42a50"];
export const OTHER = "#94a3b8";
const MOIS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];

/** Évolution mensuelle des candidatures (année en cours, année précédente en pointillés) avec infobulle. */
export function MonthChart({ rows, year }: { rows: { mois: number; n: number; prev: number }[]; year: number }) {
  const reduce = useReducedMotion();
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 230, L = 34, R = 10, T = 12, B = 26;
  const upto = new Date().getFullYear() === year ? new Date().getMonth() + 1 : 12;
  const max = Math.max(4, ...rows.map((r) => Math.max(r.n, r.prev)));
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const x = (i: number) => L + (i * (W - L - R)) / 11;
  const y = (v: number) => T + (H - T - B) * (1 - v / top);
  const cur = rows.slice(0, upto);
  const line = cur.map((r, i) => `${i ? "L" : "M"}${x(i)},${y(r.n)}`).join(" ");
  const area = cur.length ? `${line} L${x(cur.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : "";
  const prev = rows.map((r, i) => `${i ? "L" : "M"}${x(i)},${y(r.prev)}`).join(" ");
  const total = cur.reduce((s, r) => s + r.n, 0);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-4 text-xs text-ink-mute">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 rounded bg-[#1a47f5]" />{year} ({total})</span>
        <span className="flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dashed border-[#94a3b8]" />{year - 1}</span>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Candidatures par mois en ${year} : ${cur.map((r, i) => `${MOIS[i]} ${r.n}`).join(", ")}`} onMouseLeave={() => setHover(null)}>
          <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1a47f5" stopOpacity=".22" /><stop offset="1" stopColor="#1a47f5" stopOpacity="0" /></linearGradient></defs>
          {[0, 1, 2, 3, 4].map((k) => <g key={k}><line x1={L} x2={W - R} y1={y(k * step)} y2={y(k * step)} stroke="#eef1f8" /><text x={L - 8} y={y(k * step) + 4} textAnchor="end" fontSize="11" fill="#6b7493">{k * step}</text></g>)}
          {MOIS.map((m, i) => <text key={m} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="#6b7493" className={i % 2 ? "max-sm:hidden" : ""}>{m.replace(".", "")}</text>)}
          <path d={prev} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 5" />
          {area && <motion.path d={area} fill={`url(#${gid})`} initial={{ opacity: reduce ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />}
          {line && <motion.path d={line} fill="none" stroke="#1a47f5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: "easeOut" }} />}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#c7d2fe" />}
          {cur.map((r, i) => <circle key={i} cx={x(i)} cy={y(r.n)} r={hover === i ? 5 : 3.5} fill="#fff" stroke="#1a47f5" strokeWidth="2" />)}
          {rows.map((_, i) => <rect key={i} x={x(i) - (W - L - R) / 22} y={T} width={(W - L - R) / 11} height={H - T - B} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${MOIS[i]} : ${rows[i].n} candidature(s), ${rows[i].prev} l'an dernier`} />)}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-bold text-white shadow-lift" style={{ left: `${(x(hover) / W) * 100}%` }}>
            {MOIS[hover]} · {hover < upto ? `${rows[hover].n} en ${year}` : "à venir"} · {rows[hover].prev} en {year - 1}
          </div>
        )}
      </div>
    </div>
  );
}

/** Anneau de répartition (5 catégories au plus, puis « Autres »), légende avec pourcentages. */
export function Donut({ rows, label }: { rows: { name: string; n: number }[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = rows.reduce((s, r) => s + r.n, 0);
  const top = rows.slice(0, 5);
  const rest = rows.slice(5).reduce((s, r) => s + r.n, 0);
  const parts = [...top.map((r, i) => ({ ...r, c: SERIES[i] })), ...(rest ? [{ name: "Autres", n: rest, c: OTHER }] : [])];
  const R = 15.9, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90" role="img" aria-label={`${label} : ${parts.map((p) => `${p.name} ${Math.round((p.n / total) * 100)} %`).join(", ")}`}>
          <circle cx="21" cy="21" r={R} fill="none" stroke="#eef1f8" strokeWidth="6" />
          {parts.map((p, i) => {
            const len = (p.n / total) * C;
            const gap = parts.length > 1 ? Math.min(0.6, len / 3) : 0; // 2 px de séparation entre segments
            const el = <motion.circle key={p.name} cx="21" cy="21" r={R} fill="none" stroke={p.c} strokeWidth={hover === i ? 7.5 : 6} strokeDasharray={`${Math.max(0, len - gap)} ${C}`} strokeDashoffset={-acc}
              initial={{ opacity: 0 }} animate={{ opacity: hover === null || hover === i ? 1 : 0.45 }} transition={{ delay: i * 0.08 }} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />;
            acc += len;
            return el;
          })}
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center text-center"><b className="text-2xl leading-none">{hover !== null ? `${Math.round((parts[hover].n / total) * 100)} %` : total}</b><span className="mt-1 max-w-[90px] truncate text-[11px] text-ink-mute">{hover !== null ? parts[hover].name : "candidatures"}</span></span>
      </div>
      <ul className="flex w-full min-w-0 flex-col gap-2">
        {parts.map((p, i) => (
          <li key={p.name} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="flex items-center gap-2.5 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-[4px]" style={{ background: p.c }} />
            <span className="min-w-0 flex-1 truncate text-ink-soft" title={p.name}>{p.name}</span>
            <b className="shrink-0 tabular-nums">{Math.round((p.n / total) * 100)} %</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
