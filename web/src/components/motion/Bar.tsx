"use client";
import { motion } from "framer-motion";

/** Barre de fourchette (min → max) qui se remplit à l'apparition. */
export function RangeBar({ from, to, max, delay = 0 }: { from: number; to: number; max: number; delay?: number }) {
  return (
    <div className="relative h-3 rounded-full bg-[#e8edfa]">
      <motion.div className="absolute h-full rounded-full bg-gradient-to-r from-brand-600 to-sun-400" style={{ left: `${(from / max) * 100}%` }}
        initial={{ width: 0 }} whileInView={{ width: `${((to - from) / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }} />
    </div>
  );
}

export function ScoreBar({ value, delay = 0 }: { value: number; delay?: number }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8edfa]">
      <motion.div className="h-full rounded-full bg-gradient-to-r from-[#0f8a46] to-[#34d399]" initial={{ width: 0 }} whileInView={{ width: `${value}%` }} viewport={{ once: true }} transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }} />
    </div>
  );
}
