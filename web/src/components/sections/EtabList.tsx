"use client";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EtabCard } from "@/components/ui/Cards";
import { LABELS, VILLES_ETUDES, etablissements, type Label } from "@/lib/data";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const TYPES = Array.from(new Set(etablissements.map((e) => e.type_libelle))).sort((a, b) => a.localeCompare(b, "fr"));
const count = (l: Label | "") => etablissements.filter((e) => !l || e.label === l).length;

export function EtabList() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [label, setLabel] = useState<Label | "">((params.get("label") as Label) ?? "");
  const [ville, setVille] = useState(params.get("ville") ?? "");
  const [type, setType] = useState("");
  const list = useMemo(() => etablissements.filter((e) =>
    (!label || e.label === label) && (!ville || e.ville === ville) && (!type || e.type_libelle === type) &&
    (!q || norm(`${e.nom} ${e.sigle} ${e.ville} ${e.filieres.map((f) => f.intitule).join(" ")}`).includes(norm(q)))
  ).sort((a, b) => b.photos.length - a.photos.length || Number(!!b.logo) - Number(!!a.logo) || b.filieres.length - a.filieres.length), [q, label, ville, type]);
  // Libellés présents dans le référentiel (« professionnel » n'apparaît qu'une fois attribué)
  const labels = LABELS.filter((l) => count(l.id) > 0);

  return (
    <div className="container flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 shadow-card focus-within:ring-4 focus-within:ring-brand-100"><Search size={18} className="text-ink-mute" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, sigle, ville ou filière (ex : EMSI, Rabat, kinésithérapie)" className="w-full bg-transparent py-3.5 outline-none" /></div>
        <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-card">
          {([{ id: "" as const, court: "Tous" }, ...labels]).map((l) => (
            <button key={l.id} onClick={() => setLabel(l.id)} className={`relative shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold ${label === l.id ? "text-white" : "text-ink-mute"}`}>
              {label === l.id && <motion.span layoutId="etab-label" className="absolute inset-0 rounded-xl bg-brand-600" />}<span className="relative">{l.court} <span className="opacity-70">({count(l.id)})</span></span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={ville} onChange={(e) => setVille(e.target.value)} aria-label="Ville" className="min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><option value="">Toutes les villes</option>{VILLES_ETUDES.map((v) => <option key={v}>{v}</option>)}</select>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type d'établissement" className="min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><option value="">Tous les types</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <p className="text-sm text-ink-soft"><b className="text-ink">{list.length} établissements</b> · seuls figurent les établissements privés dont les diplômes sont homologués par l&apos;État marocain, avec leurs filières accréditées.</p>
      <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((e, k) => <motion.div key={e.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(k, 12) * 0.03 } }} exit={{ opacity: 0, scale: 0.95 }}><EtabCard id={e.id} /></motion.div>)}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
