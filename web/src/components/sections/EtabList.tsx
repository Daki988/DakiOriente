"use client";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EtabCard } from "@/components/ui/Cards";
import { PAYS_NOM, etablissements, type PaysCode } from "@/lib/data";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const TYPES = Array.from(new Set(etablissements.map((e) => e.type_libelle)));

export function EtabList() {
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [pays, setPays] = useState<PaysCode | "">((params.get("pays") as PaysCode) ?? "");
  const [type, setType] = useState("");
  const [statut, setStatut] = useState("");
  const list = useMemo(() => etablissements.filter((e) =>
    (!pays || e.pays === pays) && (!type || e.type_libelle === type) &&
    (!statut || (statut === "public" ? !e.statut.startsWith("prive") : e.statut.startsWith("prive"))) &&
    (!q || norm(`${e.nom} ${e.sigle} ${e.ville}`).includes(norm(q)))
  ).sort((a, b) => Number(!!b.logo) - Number(!!a.logo) || b.formations.length - a.formations.length), [q, pays, type, statut]);

  return (
    <div className="container flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 shadow-card focus-within:ring-4 focus-within:ring-brand-100"><Search size={18} className="text-ink-mute" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, sigle ou ville (ex : UCAD, EMI, Libreville)" className="w-full bg-transparent py-3.5 outline-none" /></div>
        <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-card">
          {(["", "GA", "MA", "SN"] as const).map((p) => (
            <button key={p} onClick={() => setPays(p)} className={`relative rounded-xl px-4 py-2.5 text-sm font-bold ${pays === p ? "text-white" : "text-ink-mute"}`}>
              {pays === p && <motion.span layoutId="etab-pays" className="absolute inset-0 rounded-xl bg-brand-600" />}<span className="relative">{p ? PAYS_NOM[p] : "Tous"}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><option value="">Tous les types</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <select value={statut} onChange={(e) => setStatut(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><option value="">Public et privé</option><option value="public">Public / inter-États</option><option value="prive">Privé</option></select>
      </div>
      <b>{list.length} établissements</b>
      <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((e, k) => <motion.div key={e.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(k, 12) * 0.03 } }} exit={{ opacity: 0, scale: 0.95 }}><EtabCard id={e.id} /></motion.div>)}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
