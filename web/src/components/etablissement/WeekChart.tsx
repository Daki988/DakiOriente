"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useId, useMemo, useState } from "react";

const DAY = 86_400_000;
/** Lundi (UTC) de la semaine contenant d — même découpage que date_trunc('week') côté base. */
function monday(d: Date) {
  const t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const wd = (new Date(t).getUTCDay() + 6) % 7;
  return new Date(t - wd * DAY);
}
const key = (d: Date) => d.toISOString().slice(0, 10);

export function last12Weeks(rows: { semaine: string; n: number }[]) {
  const m = new Map(rows.map((r) => [r.semaine, r.n]));
  const start = monday(new Date()).getTime() - 11 * 7 * DAY;
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(start + i * 7 * DAY);
    return { d, n: m.get(key(d)) ?? 0 };
  });
}

const W = 600, H = 220, PAD_T = 10, PAD_B = 4;

/** Courbe des candidatures par semaine (aire + ligne tracée au chargement, infobulle au survol/focus). */
export function WeekChart({ rows }: { rows: { semaine: string; n: number }[] }) {
  const data = useMemo(() => last12Weeks(rows), [rows]);
  const reduce = useReducedMotion();
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(4, ...data.map((d) => d.n));
  const top = Math.ceil(max / 4) * 4;
  const x = (i: number) => (i / (data.length - 1)) * W;
  const y = (n: number) => PAD_T + (1 - n / top) * (H - PAD_T - PAD_B);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.n).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const total = data.reduce((s, d) => s + d.n, 0);
  const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", timeZone: "UTC" });

  return (
    <figure className="flex flex-col gap-2" aria-label={`Candidatures par semaine sur 12 semaines : ${total} au total`}>
      <div className="flex gap-3">
        <div className="flex h-[220px] flex-col justify-between py-[6px] text-right text-[11px] text-ink-mute" aria-hidden>
          {[top, (top * 3) / 4, top / 2, top / 4, 0].map((v) => <span key={v}>{Math.round(v)}</span>)}
        </div>
        <div className="relative h-[220px] flex-1" onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <defs>
              <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6a3df0" stopOpacity=".22" /><stop offset="100%" stopColor="#6a3df0" stopOpacity="0" /></linearGradient>
            </defs>
            {[0, 1, 2, 3, 4].map((k) => <line key={k} x1="0" x2={W} y1={PAD_T + (k / 4) * (H - PAD_T - PAD_B)} y2={PAD_T + (k / 4) * (H - PAD_T - PAD_B)} stroke="#eef1f8" vectorEffect="non-scaling-stroke" />)}
            <motion.path d={area} fill={`url(#g${gid})`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />
            <motion.path d={line} fill="none" stroke="#6a3df0" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"
              initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeInOut" }} />
          </svg>
          {data.map((d, i) => (
            <button key={i} type="button" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
              aria-label={`Semaine du ${fmt(d.d)} : ${d.n} candidature${d.n > 1 ? "s" : ""}`}
              className="absolute top-0 h-full -translate-x-1/2 focus:outline-none" style={{ left: `${(x(i) / W) * 100}%`, width: `${100 / data.length}%` }}>
              <span className={`absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#6a3df0] bg-white transition ${hover === i || i === data.length - 1 ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} style={{ top: `${(y(d.n) / H) * 100}%` }} />
            </button>
          ))}
          {hover !== null && (
            <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl bg-ink px-3 py-2 text-xs text-white shadow-lift"
              style={{ left: `${Math.min(92, Math.max(8, (x(hover) / W) * 100))}%`, top: `calc(${(y(data[hover].n) / H) * 100}% - 12px)` }}>
              <b className="block text-sm">{data[hover].n} candidature{data[hover].n > 1 ? "s" : ""}</b>semaine du {fmt(data[hover].d)}
            </div>
          )}
        </div>
      </div>
      <div className="ml-7 flex justify-between text-[11px] text-ink-mute" aria-hidden>
        {data.map((d, i) => <span key={i} className={i % 2 ? "hidden sm:inline" : ""}>S{i + 1}</span>)}
      </div>
      <figcaption className="sr-only">{data.map((d) => `${fmt(d.d)} : ${d.n}`).join(", ")}</figcaption>
    </figure>
  );
}
