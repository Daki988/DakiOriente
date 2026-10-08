"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PAYS_NOM, domaineById, metierById, series, type PaysCode } from "@/lib/data";
import orientationSeconde from "@/data/orientation_seconde.json";

export function SeriesExplorer() {
  const [pays, setPays] = useState<PaysCode>("GA");
  const list = series.filter((s) => s.pays === pays);
  const [sel, setSel] = useState<string>(list[3]?.id ?? list[0].id);
  const cur = series.find((s) => s.id === sel && s.pays === pays) ?? list[0];
  const orient = (orientationSeconde as Record<string, { examen: string; voies: string[] }>)[pays];
  return (
    <div id="series" className="card mt-8 flex scroll-mt-24 flex-col gap-6 rounded-[28px] p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><span className="text-[13px] font-extrabold uppercase tracking-[.16em] text-brand-600">Ma série au lycée</span><h2 className="text-2xl font-extrabold tracking-tight">Quelle série choisir après le {orient.examen.split(" (")[0]} ?</h2></div>
        <div className="flex gap-1 rounded-xl bg-[#f6f8fe] p-1 text-sm font-bold">
          {(["GA", "MA", "SN"] as const).map((p) => (
            <button key={p} onClick={() => { setPays(p); setSel(series.find((s) => s.pays === p)!.id); }} className={`relative rounded-lg px-4 py-2 ${pays === p ? "text-brand-600" : "text-ink-mute"}`}>
              {pays === p && <motion.span layoutId="pays-tab" className="absolute inset-0 rounded-lg bg-white shadow" />}<span className="relative">{PAYS_NOM[p]}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((s) => (
          <button key={s.id} onClick={() => setSel(s.id)} className={`chip border px-3.5 py-2 text-sm transition ${s.id === cur.id ? "border-brand-600 bg-brand-600 text-white shadow-glow" : "border-slate-200 bg-white text-ink-soft hover:border-brand-300"}`}>{s.code}</button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={cur.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <div className="text-xl font-extrabold">Série {cur.code}</div><div className="text-ink-soft">{cur.intitule}</div>
            <div className="text-xs font-bold uppercase text-ink-mute">Matières dominantes</div>
            <div className="flex flex-wrap gap-1.5">{cur.matieres_dominantes.map((m) => <span key={m} className="chip bg-brand-50 text-brand-700">{m}</span>)}</div>
            {cur.remarque && <p className="rounded-xl bg-sun-50 p-3 text-[13px] text-[#8a5a00]">{cur.remarque}</p>}
          </div>
          <div className="flex flex-col gap-3"><div className="text-xs font-bold uppercase text-ink-mute">Domaines d&apos;études ouverts</div>
            <div className="flex flex-wrap gap-1.5">{cur.domaines_ouverts.map((d) => <span key={d} className="chip bg-[#f6f8fe] text-ink-soft">{domaineById[d]?.libelle}</span>)}</div>
            <div className="text-sm text-ink-mute"><b className="text-ink">{cur.formations_accessibles.length}</b> formations accessibles sur Navigoal</div></div>
          <div className="flex flex-col gap-2"><div className="text-xs font-bold uppercase text-ink-mute">Exemples de métiers</div>
            {cur.metiers_exemples.slice(0, 6).map((m) => <Link key={m} href={`/metiers/${m}/`} className="flex items-center justify-between rounded-xl border border-[#eef1f8] px-3 py-2 text-sm font-semibold transition hover:border-brand-200 hover:text-brand-600">{metierById[m].nom}<span>→</span></Link>)}</div>
        </motion.div>
      </AnimatePresence>
      <div className="border-t border-[#eef1f8] pt-4 text-[13px] text-ink-mute"><b className="text-ink">Après le {orient.examen} :</b> {orient.voies.join(" · ")}</div>
    </div>
  );
}
