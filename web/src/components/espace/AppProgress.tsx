"use client";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

/** Suivi visuel d'une candidature (gratuite) : brouillon → envoyée → vérification → décision. */
export const APP_STEPS = ["Brouillon", "Envoyée", "Vérification", "Décision"];
const INDEX: Record<string, number> = { brouillon: 0, soumise: 2, paiement_confirme: 2, en_verification: 2, piece_demandee: 2, complet: 3, en_traitement: 3, liste_attente: 3, acceptee: 4, refusee: 4, desistee: 4 };

export const appStep = (status: string) => INDEX[status] ?? 0;

export function AppProgress({ status, compact = false }: { status: string; fee?: boolean; compact?: boolean }) {
  const cur = appStep(status);
  const bad = status === "refusee" || status === "desistee";
  const warn = status === "piece_demandee";
  const labels = APP_STEPS.map((t, i) => (i === 3 ? (status === "acceptee" ? "Acceptée" : status === "refusee" ? "Refusée" : status === "desistee" ? "Désistement" : status === "liste_attente" ? "Liste d'attente" : t) : i === 2 && warn ? "Pièce demandée" : t));
  return (
    <ol className="relative grid grid-cols-4" aria-label={`Avancement : ${labels[Math.min(cur, 3)]}`}>
      <span className={`absolute left-[12.5%] right-[12.5%] ${compact ? "top-[7px]" : "top-[11px]"} h-[2px] bg-[#e8edfa]`} aria-hidden />
      <motion.span className={`absolute left-[12.5%] ${compact ? "top-[7px]" : "top-[11px]"} h-[2px] ${bad && status === "refusee" ? "bg-[#d42a50]" : "bg-brand-600"}`} aria-hidden initial={{ width: 0 }} animate={{ width: `${(Math.min(cur, 3) / 3) * 75}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
      {labels.map((t, i) => {
        const done = i < cur, on = i === cur && cur < 4;
        const last = i === 3 && cur === 4;
        const cls = last ? (status === "acceptee" ? "bg-[#0f8a46] text-white" : "bg-[#d42a50] text-white")
          : done ? "bg-brand-600 text-white" : on ? (warn ? "bg-sun-400 ring-4 ring-sun-100" : "bg-white ring-[3px] ring-brand-600") : "border-2 border-[#dbe3f7] bg-white";
        return (
          <li key={i} className="relative flex flex-col items-center gap-1 text-center" aria-current={on ? "step" : undefined}>
            <span className={`flex items-center justify-center rounded-full ${compact ? "h-4 w-4" : "h-6 w-6"} ${cls}`}>
              {(done || (last && status === "acceptee")) && <Check size={compact ? 10 : 13} strokeWidth={3} />}{last && status !== "acceptee" && <X size={compact ? 10 : 13} strokeWidth={3} />}
            </span>
            <span lang="fr" className={`w-full hyphens-auto px-0.5 leading-tight [overflow-wrap:anywhere] ${compact ? "text-[9.5px] sm:text-[10.5px]" : "text-[10.5px] sm:text-xs"} font-bold ${done || on || last ? (on ? "text-brand-700" : "text-ink-soft") : "text-[#9aa3c0]"}`}>{t}</span>
          </li>
        );
      })}
    </ol>
  );
}
