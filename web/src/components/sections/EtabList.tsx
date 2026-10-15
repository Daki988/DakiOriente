"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, RotateCcw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { EtabCard } from "@/components/ui/Cards";
import { useFiltres } from "@/hooks/useFiltres";
import { norm, villeHref } from "@/lib/catalogue";
import { LABELS, VILLES_ETUDES, villesOf, etablissements, type Etablissement } from "@/lib/data";

const TYPES = Array.from(new Set(etablissements.map((e) => e.type_libelle))).sort((a, b) => a.localeCompare(b, "fr"));
const DEFAUTS = { q: "", label: "", ville: "", type: "" };
const LABELS_PRESENTS = LABELS.filter((l) => etablissements.some((e) => e.label === l.id));
const ORDRE = (a: Etablissement, b: Etablissement) => b.photos.length - a.photos.length || Number(!!b.logo) - Number(!!a.logo) || b.filieres.length - a.filieres.length;

export function EtabList() {
  const { f, set, reset } = useFiltres(DEFAUTS);
  const [limit, setLimit] = useState(24);
  const passe = (e: Etablissement, sauf?: keyof typeof DEFAUTS) =>
    (sauf === "label" || !f.label || e.label === f.label) &&
    (sauf === "ville" || !f.ville || villesOf(e).includes(f.ville)) &&
    (sauf === "type" || !f.type || e.type_libelle === f.type) &&
    (!f.q || norm(`${e.nom} ${e.sigle} ${e.alias.join(" ")} ${villesOf(e).join(" ")} ${e.filieres.map((x) => x.intitule).join(" ")}`).includes(norm(f.q)));
  const list = useMemo(() => etablissements.filter((e) => passe(e)).sort(ORDRE), [f]); // eslint-disable-line react-hooks/exhaustive-deps
  const n = (k: keyof typeof DEFAUTS, v: string) => etablissements.filter((e) => passe(e, k) && (k === "label" ? !v || e.label === v : k === "ville" ? villesOf(e).includes(v) : e.type_libelle === v)).length;
  const actifs = [f.q, f.label, f.ville, f.type].filter(Boolean).length;
  const maj = (p: Partial<typeof DEFAUTS>) => { set(p); setLimit(24); };

  return (
    <div className="container flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-card focus-within:ring-4 focus-within:ring-brand-100 sm:px-5">
          <Search size={18} className="shrink-0 text-ink-mute" />
          <input value={f.q} onChange={(e) => maj({ q: e.target.value })} placeholder="Nom, sigle, ville ou filière (ex : EMSI, Rabat, kinésithérapie)" aria-label="Rechercher un établissement" className="w-full min-w-0 bg-transparent py-3.5 outline-none" />
          {f.q && <button onClick={() => maj({ q: "" })} aria-label="Effacer" className="flex h-10 w-10 shrink-0 items-center justify-center text-ink-mute"><X size={18} /></button>}
        </div>
        <div className="scrollbar-none flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-card" role="tablist" aria-label="Label">
          {([{ id: "", court: "Tous" }, ...LABELS_PRESENTS]).map((l) => (
            <button key={l.id} role="tab" aria-selected={f.label === l.id} onClick={() => maj({ label: l.id })} className={`relative min-h-[42px] shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold ${f.label === l.id ? "text-white" : "text-ink-mute"}`}>
              {f.label === l.id && <motion.span layoutId="etab-label" className="absolute inset-0 rounded-xl bg-brand-600" />}<span className="relative">{l.court} <span className="opacity-70">({n("label", l.id)})</span></span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={f.ville} onChange={(e) => maj({ ville: e.target.value })} aria-label="Ville" className="min-h-[42px] min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><option value="">Toutes les villes</option>{VILLES_ETUDES.map((v) => <option key={v} value={v}>{v} ({n("ville", v)})</option>)}</select>
        <select value={f.type} onChange={(e) => maj({ type: e.target.value })} aria-label="Type d'établissement" className="min-h-[42px] min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><option value="">Tous les types</option>{TYPES.map((t) => <option key={t} value={t}>{t} ({n("type", t)})</option>)}</select>
        {actifs > 0 && <button onClick={() => { reset(); setLimit(24); }} className="btn-ghost min-h-[42px] px-3.5 py-2"><RotateCcw size={15} /> Réinitialiser</button>}
      </div>
      {f.ville && <Link href={villeHref(f.ville)} className="flex items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm font-semibold text-brand-700">Étudier à {f.ville} : quartiers étudiants, transports, coût de la vie et logement <ChevronRight size={16} className="ml-auto shrink-0" /></Link>}
      <p className="text-sm text-ink-soft"><b className="text-ink">{list.length} établissement{list.length > 1 ? "s" : ""}</b> · établissements privés autorisés par le ministère. Le label indique si leurs diplômes sont homologués par l&apos;État (reconnu par l&apos;État, diplômes homologués) ou s&apos;il s&apos;agit de diplômes d&apos;établissement (autorisé).</p>
      <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.slice(0, limit).map((e, k) => <motion.div key={e.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(k, 12) * 0.03 } }} exit={{ opacity: 0, scale: 0.95 }}><EtabCard id={e.id} /></motion.div>)}
        </AnimatePresence>
      </motion.div>
      {!list.length && <div className="card p-10 text-center text-ink-mute">Aucun établissement ne correspond. <button onClick={reset} className="font-bold text-brand-600">Réinitialiser les filtres</button></div>}
      {limit < list.length && <button onClick={() => setLimit(limit + 24)} className="btn-ghost self-center">Afficher plus ({list.length - limit} restants)</button>}
    </div>
  );
}
