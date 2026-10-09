"use client";
import { paysOrigine } from "@/lib/pays-origine";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Alert, Button, Dialog, type Tone } from "@/components/app/kit";
import { FormError } from "@/components/app/form";
import type { ApiError } from "@/lib/api";

// ---------------------------------------------------------------- Libellés communs
export const ROLE_LABEL: Record<string, string> = { eleve: "Élève", etudiant: "Étudiant·e", parent: "Parent", etablissement: "Établissement", bailleur: "Bailleur", conseiller: "Conseiller", admin: "Administrateur" };
export const ROLE_TONE: Record<string, Tone> = { eleve: "blue", etudiant: "blue", parent: "sun", etablissement: "violet", bailleur: "green", conseiller: "green", admin: "grey" };
export const ROLE_OPTS: [string, string][] = Object.entries(ROLE_LABEL);
export const PAYS: Record<string, string> = Object.fromEntries(paysOrigine.map((p) => [p.id, p.nom]));
export const PAYS_OPTS: [string, string][] = paysOrigine.map((p) => [p.id, p.nom]);
const FLAG: Record<string, string> = { GA: "🇬🇦", MA: "🇲🇦", SN: "🇸🇳", CI: "🇨🇮", CM: "🇨🇲", CG: "🇨🇬", FR: "🇫🇷" };
export const Flag = ({ code, withName }: { code: string | null | undefined; withName?: boolean }) =>
  code ? <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><span aria-hidden>{FLAG[code] ?? "🏳️"}</span>{withName ? <span>{PAYS[code] ?? code}</span> : <span className="sr-only">{PAYS[code] ?? code}</span>}</span> : <span className="text-ink-mute">—</span>;
export const nf = (n: number | null | undefined) => (n == null ? "—" : Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " "));
export const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : "—");

// ---------------------------------------------------------------- En-tête du back-office
export function AdminHeader({ title, sub, actions, eyebrow = "Back-office" }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-[30px]">{title}</h1>
        {sub && <p className="text-ink-mute">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

/** Apparition discrète (fondu + glissement), décalée par index. */
export const Reveal = ({ children, i = 0, className = "", as = "div" }: { children: ReactNode; i?: number; className?: string; as?: "div" | "li" }) => {
  const M = as === "li" ? motion.li : motion.div;
  return <M className={className} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.35, ease: "easeOut" }}>{children}</M>;
};

export function LoadError({ error, reload }: { error: ApiError | null; reload: () => void }) {
  if (!error) return null;
  return <Alert tone="error" title="Chargement impossible" action={<Button size="sm" variant="ghost" icon={RefreshCw} onClick={reload}>Réessayer</Button>}>{error.message}</Alert>;
}

/** Valeur différée (recherche au fil de la frappe). */
export function useDebounced<T>(v: T, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

export const qs = (o: Record<string, string | number | undefined | null>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export function Pager({ page, total, size, onPage }: { page: number; total: number; size: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  const from = total ? (page - 1) * size + 1 : 0;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f8] pt-4 text-sm text-ink-mute">
      <span>{from}–{Math.min(page * size, total)} sur {nf(total)}</span>
      <div className="flex items-center gap-1.5">
        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Page précédente"><ChevronLeft size={16} /></button>
        <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-ink px-3 font-bold text-white" aria-current="page">{page}</span>
        <span className="px-1">/ {pages}</span>
        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 disabled:opacity-40" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Page suivante"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

/** Boîte de confirmation pour les actions sensibles. */
export function Confirm({ open, onClose, title, children, confirm, tone = "primary", onConfirm, pending, error }: {
  open: boolean; onClose: () => void; title: string; children?: ReactNode; confirm: string; tone?: "primary" | "danger"; onConfirm: () => void; pending?: boolean; error?: string | null;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        {children && <div className="text-sm text-ink-soft">{children}</div>}
        <FormError error={error ?? null} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="quiet" onClick={onClose} type="button">Annuler</Button>
          <Button variant={tone} loading={pending} onClick={onConfirm} type="button">{confirm}</Button>
        </div>
      </div>
    </Dialog>
  );
}

/** Barre horizontale animée (entonnoir, répartitions). */
export function Bar({ value, max, className = "bg-brand-600", delay = 0, label }: { value: number; max: number; className?: string; delay?: number; label?: string }) {
  const w = max > 0 ? Math.max(value > 0 ? 3 : 0, (value / max) * 100) : 0;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#eef1f8]" role="img" aria-label={label}>
      <motion.div className={`h-full rounded-full ${className}`} initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ delay, duration: 0.7, ease: "easeOut" }} />
    </div>
  );
}

/** Interrupteur accessible (role=switch). */
export function Toggle({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${on ? "bg-[#0f8a46]" : "bg-[#d5dbea]"}`}>
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${on ? "right-1" : "left-1"}`} />
    </button>
  );
}

