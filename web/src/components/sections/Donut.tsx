"use client";
import { motion } from "framer-motion";

export const DONUT_COLORS = ["#1a47f5", "#ffc21f", "#0f8a46", "#6a3df0", "#d42a50"];

/** Anneau de répartition (valeurs max) qui se dessine à l'apparition. */
export function Donut({ values, size = 220 }: { values: number[]; size?: number }) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const r = 80, c = size / 2, L = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
      <circle cx={c} cy={c} r={r} stroke="#eef1f8" strokeWidth="34" fill="none" />
      {values.map((v, k) => {
        const frac = v / total;
        const off = acc;
        acc += frac;
        return <motion.circle key={k} cx={c} cy={c} r={r} fill="none" stroke={DONUT_COLORS[k]} strokeWidth="34" strokeDashoffset={-off * L}
          initial={{ strokeDasharray: `0 ${L}` }} animate={{ strokeDasharray: `${frac * L} ${L}` }} transition={{ duration: 0.9, delay: k * 0.12, ease: [0.16, 1, 0.3, 1] }} />;
      })}
    </svg>
  );
}
