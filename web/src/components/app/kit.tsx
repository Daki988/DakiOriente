"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronRight, Info, Loader2, X, type LucideIcon } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

// ---------------------------------------------------------------- Boutons
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "sun" | "danger" | "quiet"; loading?: boolean; icon?: LucideIcon; size?: "sm" | "md" };
export function Button({ variant = "primary", loading, icon: I, size = "md", className = "", children, disabled, ...p }: BtnProps) {
  const v = { primary: "btn-primary", ghost: "btn-ghost", sun: "btn-sun", danger: "btn bg-[#d42a50] text-white hover:bg-[#b81f43]", quiet: "btn text-ink-soft hover:bg-[#f1f4fd]" }[variant];
  return (
    <button {...p} disabled={disabled || loading} className={`${v} ${size === "sm" ? "px-3.5 py-2 text-[13px]" : ""} disabled:pointer-events-none disabled:opacity-60 ${className}`}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : I ? <I size={size === "sm" ? 15 : 17} /> : null}{children}
    </button>
  );
}

// ---------------------------------------------------------------- Mise en page
export function PageHeader({ title, sub, crumbs, actions, badge }: { title: ReactNode; sub?: ReactNode; crumbs?: [string, string?][]; actions?: ReactNode; badge?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div className="flex min-w-0 flex-col gap-1.5">
        {crumbs && <nav className="flex flex-wrap items-center gap-1 text-[13px] text-ink-mute">{crumbs.map(([t, h], i) => <span key={i} className="flex items-center gap-1">{i > 0 && <ChevronRight size={13} />}{h ? <Link href={h} className="hover:text-brand-600">{t}</Link> : <span>{t}</span>}</span>)}</nav>}
        <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-extrabold tracking-tight sm:text-[30px]">{title}</h1>{badge}</div>
        {sub && <p className="text-ink-mute">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

export function Panel({ title, icon: I, action, children, className = "", tone }: { title?: ReactNode; icon?: LucideIcon; action?: ReactNode; children: ReactNode; className?: string; tone?: "sun" | "blue" | "green" }) {
  const bg = tone === "sun" ? "bg-gradient-to-br from-white to-[#fff7dd]" : tone === "green" ? "border-[#bfe9cf] bg-gradient-to-br from-white to-[#effbf3]" : tone === "blue" ? "bg-gradient-to-br from-white to-brand-50" : "";
  return (
    <section className={`card flex flex-col gap-4 rounded-[22px] p-5 sm:p-6 ${bg} ${className}`}>
      {(title || action) && <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">{I && <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><I size={18} /></span>}<h2 className="text-[17px] font-extrabold">{title}</h2></div>
        {action}
      </div>}
      {children}
    </section>
  );
}

export function Kpi({ label, value, sub, icon: I, tone = "blue" }: { label: string; value: ReactNode; sub?: ReactNode; icon?: LucideIcon; tone?: "blue" | "sun" | "green" | "violet" | "rose" }) {
  const t = { blue: "bg-brand-50 text-brand-600", sun: "bg-sun-100 text-[#a55a00]", green: "bg-[#e8f8ef] text-[#0f8a46]", violet: "bg-[#f1edff] text-[#6a3df0]", rose: "bg-[#ffecef] text-[#d42a50]" }[tone];
  return (
    <div className="card flex flex-col gap-1.5 rounded-[20px] p-5">
      {I && <span className={`mb-1 flex h-10 w-10 items-center justify-center rounded-xl ${t}`}><I size={19} /></span>}
      <span className="text-xs font-bold uppercase text-ink-mute">{label}</span>
      <b className="text-[26px] leading-tight">{value}</b>
      {sub && <span className="text-xs text-ink-mute">{sub}</span>}
    </div>
  );
}

export function Empty({ icon: I = Info, title, text, action }: { icon?: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><I size={22} /></span>
      <b>{title}</b>{text && <p className="max-w-md text-sm text-ink-mute">{text}</p>}{action}
    </div>
  );
}

export function Loading({ label = "Chargement…" }: { label?: string }) {
  return <div className="flex items-center gap-2.5 py-10 text-sm text-ink-mute" role="status"><Loader2 size={18} className="animate-spin text-brand-600" />{label}</div>;
}

export function Alert({ tone = "info", title, children, action }: { tone?: "info" | "error" | "success" | "warn"; title?: ReactNode; children?: ReactNode; action?: ReactNode }) {
  const s = { info: ["bg-brand-50 border-brand-100 text-brand-800", Info], error: ["bg-[#fff1f3] border-[#ffd0d9] text-[#a3133b]", AlertCircle], success: ["bg-[#effbf3] border-[#bfe9cf] text-[#0b6b37]", CheckCircle2], warn: ["bg-[#fff7dd] border-[#f6dd9a] text-[#8a4b00]", AlertCircle] }[tone] as [string, LucideIcon];
  const I = s[1];
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${s[0]}`} role={tone === "error" ? "alert" : "status"}>
      <I size={20} className="shrink-0" />
      <div className="flex-1 text-sm">{title && <b className="block">{title}</b>}{children}</div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------- Statuts
const TONES = { blue: "bg-brand-50 text-brand-700", green: "bg-[#e8f8ef] text-[#0f8a46]", sun: "bg-sun-100 text-[#a55a00]", rose: "bg-[#ffecef] text-[#d42a50]", grey: "bg-[#eef1f8] text-ink-soft", violet: "bg-[#f1edff] text-[#6a3df0]" } as const;
export type Tone = keyof typeof TONES;
export const Chip = ({ tone = "blue", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) => <span className={`chip ${TONES[tone]} ${className}`}>{children}</span>;

const STATUS: Record<string, [string, Tone]> = {
  // candidatures
  brouillon: ["Brouillon", "grey"], soumise: ["Soumise", "blue"], paiement_confirme: ["Paiement confirmé", "blue"], en_verification: ["En vérification", "sun"], complet: ["Dossier complet", "violet"],
  en_traitement: ["En traitement", "violet"], piece_demandee: ["Pièce demandée", "rose"], acceptee: ["Acceptée", "green"], refusee: ["Refusée", "rose"], liste_attente: ["Liste d'attente", "sun"], desistee: ["Désistement", "grey"],
  // réservations
  demande: ["Demande envoyée", "blue"], attente_garant: ["Attente du garant", "sun"], paiement_sequestre: ["Payé · séquestre", "violet"], contrat_signe: ["Contrat signé", "violet"], entree: ["Entrée", "green"],
  fonds_verses: ["Fonds versés", "green"], en_cours: ["En cours", "green"], preavis: ["Préavis", "sun"], sortie: ["Sortie", "grey"], caution_restituee: ["Caution restituée", "grey"], annulee: ["Annulée", "grey"], litige: ["Litige", "rose"],
  // paiements
  initie: ["Initié", "grey"], en_attente: ["En attente", "sun"], reussi: ["Payé", "green"], echoue: ["Échoué", "rose"], rembourse: ["Remboursé", "grey"], annule: ["Annulé", "grey"],
  // annonces / comptes / divers
  en_moderation: ["En modération", "sun"], publie: ["Publiée", "green"], refuse: ["Refusée", "rose"], archive: ["Archivée", "grey"], actif: ["Actif", "green"], suspendu: ["Suspendu", "rose"],
  importe: ["Importé", "grey"], revendique: ["Revendiqué", "sun"], verifie: ["Vérifié", "green"], non_soumis: ["Non soumis", "grey"], en_revue: ["En revue", "sun"], valide: ["Validé", "green"],
  ouvert: ["Ouvert", "rose"], en_mediation: ["En médiation", "sun"], resolu: ["Résolu", "green"], clos: ["Clos", "grey"], confirme: ["Confirmé", "green"], termine: ["Terminé", "grey"],
  bloque: ["Séquestre", "violet"], libere: ["Versé", "green"], aucun: ["—", "grey"], depose: ["Déposé", "blue"],
};
export const statusLabel = (s: string) => STATUS[s]?.[0] ?? s;
export const StatusBadge = ({ status, label }: { status: string; label?: string }) => <Chip tone={STATUS[status]?.[1] ?? "grey"}>{label ?? statusLabel(status)}</Chip>;

// ---------------------------------------------------------------- Onglets, tableau, chronologie
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: [T, ReactNode][] }) {
  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#eef1f8] p-1" role="tablist">
      {items.map(([k, l]) => (
        <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)} className={`relative shrink-0 whitespace-nowrap rounded-[10px] px-3.5 py-2 text-[13px] font-bold ${value === k ? "text-brand-600" : "text-ink-mute hover:text-ink"}`}>
          {value === k && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-[10px] bg-white shadow-sm" />}<span className="relative">{l}</span>
        </button>
      ))}
    </div>
  );
}

export function Table<T>({ rows, cols, empty = "Aucun élément.", onRow, rowKey }: { rows: T[]; cols: { h: ReactNode; c: (r: T) => ReactNode; className?: string }[]; empty?: string; onRow?: (r: T) => void; rowKey: (r: T) => string }) {
  if (!rows.length) return <p className="py-8 text-center text-sm text-ink-mute">{empty}</p>;
  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead><tr className="border-b border-[#eef1f8] text-left text-[11px] font-extrabold uppercase text-ink-mute">{cols.map((c, i) => <th key={i} className={`px-5 py-2.5 sm:px-6 ${c.className ?? ""}`}>{c.h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} onClick={onRow ? () => onRow(r) : undefined} className={`border-b border-[#f1f4fb] last:border-0 ${onRow ? "cursor-pointer hover:bg-brand-50/50" : ""}`}>
              {cols.map((c, i) => <td key={i} className={`px-5 py-3 align-middle sm:px-6 ${c.className ?? ""}`}>{c.c(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Timeline({ steps }: { steps: { title: string; date?: string; note?: string | null; state: "done" | "current" | "todo" | "bad" }[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 18 }}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${s.state === "done" ? "bg-brand-600" : s.state === "bad" ? "bg-[#d42a50]" : s.state === "current" ? "bg-sun-400 text-ink" : "border-2 border-[#dbe3f7] bg-white"}`}>
              {s.state === "done" ? <CheckCircle2 size={15} /> : s.state === "bad" ? <X size={14} /> : null}
            </motion.span>
            {i < steps.length - 1 && <span className={`my-1 w-0.5 flex-1 ${s.state === "done" ? "bg-brand-600" : "bg-[#dbe3f7]"}`} />}
          </div>
          <div className="flex flex-1 flex-col pb-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><b className={`text-sm ${s.state === "todo" ? "text-ink-mute" : ""}`}>{s.title}</b>{s.date && <span className="text-xs text-ink-mute">{s.date}</span>}</div>
            {s.note && <span className="text-[13px] text-ink-mute">{s.note}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export const Avatar = ({ name, size = 40, className = "" }: { name: string; size?: number; className?: string }) => (
  <span className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sun-400 to-sun-500 font-extrabold text-ink ${className}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
    {name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
  </span>
);

// ---------------------------------------------------------------- Boîte de dialogue
export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-lift sm:rounded-3xl ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}>
            <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-extrabold">{title}</h2><button onClick={onClose} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f1f4fd]"><X size={18} /></button></div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------- Notifications éphémères
type Toast = { id: number; text: string; tone: "success" | "error" | "info" };
const ToastCtx = createContext<(text: string, tone?: Toast["tone"]) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, text, tone }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-[120] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2 lg:bottom-6" aria-live="polite">
        <AnimatePresence>{items.map((t) => (
          <motion.div key={t.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lift ${t.tone === "error" ? "bg-[#d42a50]" : t.tone === "info" ? "bg-ink" : "bg-[#0f8a46]"}`}>
            {t.tone === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}{t.text}
          </motion.div>
        ))}</AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

// ---------------------------------------------------------------- Formats
export const money = (n: number | null | undefined, cur?: string | null) => n == null ? "—" : `${Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ")} ${cur === "XAF" || cur === "XOF" ? "F CFA" : cur ?? ""}`.trim();
export const dateFr = (d: string | Date | null | undefined, withTime = false) => d ? new Date(d).toLocaleDateString("fr-FR", withTime ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const since = (d: string | Date) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 7 * 86400) return `il y a ${Math.floor(s / 86400)} j`;
  return dateFr(d);
};
