"use client";
import { motion } from "framer-motion";
import { Briefcase, Building2, GraduationCap, School } from "lucide-react";

const ICONS = [School, GraduationCap, Building2, Briefcase];
const BG = ["#6a3df0", "#1a47f5", "#0f8a46", "#f9a806"];

/** Chemin série → formations → écoles → métier, qui se dessine au scroll. */
export function ParcoursFlow({ steps }: { steps: [string, string][] }) {
  return (
    <div className="card flex flex-col gap-6 rounded-[26px] px-6 py-7 md:flex-row md:items-start md:gap-0 md:px-9">
      {steps.map(([t, s], k) => {
        const I = ICONS[k];
        return (
          <div key={k} className="flex flex-1 items-center gap-4 md:flex-col md:items-stretch md:gap-0">
            <div className="flex items-center md:w-full">
              <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: k * 0.25, type: "spring", stiffness: 200, damping: 14 }}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-[0_12px_30px_-12px_rgba(26,71,245,.5)] md:mx-auto" style={{ background: BG[k] }}><I size={28} /></motion.span>
            </div>
            <div className="relative flex flex-col gap-1 md:mt-3 md:items-center md:text-center">
              {k < steps.length - 1 && <motion.div className="absolute left-[calc(50%+44px)] top-[-46px] hidden h-[3px] origin-left bg-gradient-to-r from-brand-600 to-sun-400 md:block" style={{ width: "calc(100% - 88px + 2rem)" }} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ delay: k * 0.25 + 0.15, duration: 0.5 }} />}
              <b>{t}</b><span className="text-xs text-ink-mute">{s}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
