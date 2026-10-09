"use client";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useRef } from "react";

/** Frise horizontale des étapes (défilable sur mobile). `current` = index de l'étape en cours ; `bad` marque un arrêt (refus, annulation, litige). */
export function Stepper({ steps, current, done = false, bad = false }: { steps: string[]; current: number; done?: boolean; bad?: boolean }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const ol = ref.current, li = ol?.children[current] as HTMLElement | undefined;
    if (ol && li && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = Math.max(0, li.offsetLeft - ol.offsetLeft - 48);
  }, [current]);
  return (
    <ol ref={ref} className="card flex items-center gap-2 overflow-x-auto rounded-[22px] px-4 py-3.5 sm:px-5" aria-label="Étapes de la réservation">
      {steps.map((s, i) => {
        const state = i < current || (done && i === current) ? "done" : i === current ? (bad ? "bad" : "current") : "todo";
        return (
          <li key={s} className="flex shrink-0 items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
            <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.06, type: "spring", stiffness: 280, damping: 18 }}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-extrabold ${state === "done" ? "bg-[#0f8a46] text-white" : state === "current" ? "bg-brand-600 text-white" : state === "bad" ? "bg-[#d42a50] text-white" : "border-2 border-[#dbe3f7] text-ink-mute"}`}>
              {state === "current" && <motion.span className="absolute inset-0 rounded-full bg-brand-600/30" animate={{ scale: [1, 1.45, 1], opacity: [0.7, 0, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />}
              {state === "done" ? <Check size={16} /> : state === "bad" ? <X size={15} /> : i + 1}
            </motion.span>
            <span className={`whitespace-nowrap text-[13px] font-bold ${state === "todo" ? "text-ink-mute" : ""}`}>{s}</span>
            {i < steps.length - 1 && <span className={`mx-1 h-0.5 w-6 rounded sm:w-10 ${i < current ? "bg-[#0f8a46]" : "bg-[#dbe3f7]"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
