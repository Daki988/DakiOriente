"use client";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

/** Suivi visuel d'une candidature : brouillon → soumise → paiement → vérification → décision. */
export const APP_STEPS = ["Brouillon", "Soumise", "Paiement", "Vérification", "Décision"];
const INDEX: Record<string, number> = { brouillon: 0, soumise: 2, paiement_confirme: 3, en_verification: 3, piece_demandee: 3, complet: 4, en_traitement: 4, liste_attente: 4, acceptee: 5, refusee: 5, desistee: 5 };

export function appStep(status: string, fee = true) {
  let i = INDEX[status] ?? 0;
  if (status === "soumise" && !fee) i = 3; // sans frais de dossier : directement en vérification
  return i;
}

export function AppProgress({ status, fee = true, compact = false }: { status: string; fee?: boolean; compact?: boolean }) {
  const cur = appStep(status, fee);
  const bad = status === "refusee" || status === "desistee";
  const warn = status === "piece_demandee";
  const labels = APP_STEPS.map((t, i) => (i === 4 ? (status === "acceptee" ? "Acceptée" : status === "refusee" ? "Refusée" : status === "desistee" ? "Désistement" : status === "liste_attente" ? "Liste d'attente" : t) : i === 2 && !fee ? "Sans frais" : i === 3 && warn ? "Pièce demandée" : t));
  return (
    <ol className="relative grid grid-cols-5" aria-label={`Avancement : ${labels[Math.min(cur, 4)]}`}>
      <span className={`absolute left-[10%] right-[10%] ${compact ? "top-[7px]" : "top-[11px]"} h-[2px] bg-[#e8edfa]`} aria-hidden />
      <motion.span className={`absolute left-[10%] ${compact ? "top-[7px]" : "top-[11px]"} h-[2px] ${bad && status === "refusee" ? "bg-[#d42a50]" : "bg-brand-600"}`} aria-hidden initial={{ width: 0 }} animate={{ width: `${(Math.min(cur, 4) / 4) * 80}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
      {labels.map((t, i) => {
        const done = i < cur, on = i === cur && cur < 5;
        const last = i === 4 && cur === 5;
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
