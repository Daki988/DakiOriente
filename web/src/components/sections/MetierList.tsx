"use client";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MetierCard, domStyle } from "@/components/ui/Cards";
import { domaines, metiers, riasec } from "@/lib/data";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function MetierList() {
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [dom, setDom] = useState<string>(params.get("domaine") ?? "");
  const [ria, setRia] = useState("");
  const list = useMemo(() => metiers.filter((m) => (!dom || m.domaine === dom) && (!ria || m.riasec.includes(ria)) && (!q || norm(m.nom + " " + m.description + " " + m.secteurs.join(" ")).includes(norm(q)))), [q, dom, ria]);
  const used = domaines.filter((d) => metiers.some((m) => m.domaine === d.id));
  return (
    <div className="container flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 shadow-card focus-within:ring-4 focus-within:ring-brand-100"><Search size={18} className="text-ink-mute" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un métier (ex : data, médecin, ingénieur…)" className="w-full bg-transparent py-3.5 outline-none" /></div>
        <div className="flex flex-wrap gap-1.5">{riasec.map((r) => <button key={r.code} title={r.profil} onClick={() => setRia(ria === r.code ? "" : r.code)} className={`chip px-3.5 py-2.5 text-sm ${ria === r.code ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-ink-soft"}`}>{r.code} · {r.profil.split(" / ")[0]}</button>)}</div>
      </div>
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
        <button onClick={() => setDom("")} className={`chip shrink-0 px-3.5 py-2 ${!dom ? "bg-ink text-white" : "border border-slate-200 bg-white text-ink-soft"}`}>Tous ({metiers.length})</button>
        {used.map((d) => { const s = domStyle(d.id); const I = s.icon; return (
          <button key={d.id} onClick={() => setDom(dom === d.id ? "" : d.id)} className={`chip shrink-0 px-3.5 py-2 transition ${dom === d.id ? "text-white" : "border border-slate-200 bg-white text-ink-soft"}`} style={dom === d.id ? { background: s.solid } : {}}><I size={14} />{d.libelle.split(",")[0]}</button>); })}
      </div>
      <b>{list.length} métiers</b>
      <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((m, k) => <motion.div key={m.id} layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1, transition: { delay: Math.min(k, 12) * 0.03 } }} exit={{ opacity: 0, scale: 0.94 }}><MetierCard m={m} /></motion.div>)}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
