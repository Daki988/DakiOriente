"use client";
import { ChevronDown, Download, List, Printer } from "lucide-react";
import { useEffect, useState } from "react";

/** Sommaire des pages légales : fixe sur ordinateur (section en cours surlignée), repliable sur téléphone. */
export function SommaireLegal({ toc, couleur, fond }: { toc: { t: string; id: string }[]; couleur: string; fond: string }) {
  const [actif, setActif] = useState(toc[0]?.id);
  useEffect(() => {
    const els = toc.map((x) => document.getElementById(x.id)).filter((x): x is HTMLElement => !!x);
    const obs = new IntersectionObserver((ent) => {
      const vis = ent.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setActif(vis.target.id);
    }, { rootMargin: "-120px 0px -65% 0px" });
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [toc]);
  const liens = toc.map((x, i) => (
    <a key={x.id} href={`#${x.id}`} className="flex gap-2.5 rounded-[10px] px-2.5 py-1.5 text-[13.5px] leading-snug transition hover:bg-slate-50"
      style={x.id === actif ? { background: fond, color: couleur, fontWeight: 800 } : { color: "#3b4566" }}>
      <span className="w-5 shrink-0 text-[#8a93a8]">{i + 1}.</span>{x.t}
    </a>
  ));
  return (
    <div className="min-w-0 lg:sticky lg:top-28 print:hidden">
      <details className="card rounded-2xl p-1 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3 py-2.5 text-sm font-extrabold"><List size={18} style={{ color: couleur }} />Sommaire ({toc.length} sections)<ChevronDown size={18} className="ml-auto text-ink-mute" /></summary>
        <nav className="flex flex-col gap-0.5 px-1 pb-2">{liens}</nav>
      </details>
      <aside className="card hidden max-h-[calc(100vh-8rem)] flex-col gap-0.5 overflow-y-auto rounded-[22px] p-4 lg:flex">
        <span className="mb-1.5 ml-2.5 text-xs font-extrabold tracking-wider text-[#8a93a8]">SOMMAIRE</span>
        {liens}
      </aside>
    </div>
  );
}

export function Imprimer() {
  return (
    <div className="flex flex-col gap-1 px-1">
      <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-bold text-ink-soft hover:bg-slate-50"><Printer size={15} />Imprimer</button>
      <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-bold text-ink-soft hover:bg-slate-50"><Download size={15} />Enregistrer en PDF</button>
    </div>
  );
}
