"use client";
import { ArrowRight, Building2, Globe2 } from "lucide-react";
import { useState } from "react";
import Link from "@/components/ui/Link";
import { BOURSES, paysEtudesLibelle, paysOrigineLibelle } from "@/lib/bourses";
import { nomPays } from "@/lib/pays-origine";

/** Bourses publiques (États, coopération), filtrées par pays d'origine. */
export function BoursesListe() {
  const pays = Array.from(new Set(BOURSES.flatMap((b) => b.pays_origine).filter((p) => p !== "*")));
  const [p, setP] = useState("");
  const liste = BOURSES.filter((b) => !p || b.pays_origine.includes(p) || b.pays_origine.includes("*"));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Pays d'origine">
        <span className="text-sm font-bold text-ink-soft">Je viens de :</span>
        {[["", "Tous les pays"], ...pays.map((c) => [c, nomPays(c)])].map(([c, l]) => (
          <button key={c} type="button" role="radio" aria-checked={p === c} onClick={() => setP(c)} className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold ${p === c ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white hover:border-brand-300"}`}>{l}</button>
        ))}
      </div>
      <ul className="grid gap-4 md:grid-cols-2">{liste.map((b) => (
        <li key={b.id}><Link href={`/bourses/${b.id}/`} className="card flex h-full flex-col gap-2 rounded-[22px] p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-600">{b.organisme}</span>
          <h2 className="text-lg font-extrabold">{b.nom}</h2>
          <p className="text-sm text-ink-soft">{b.pour}</p>
          <span className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-ink-mute"><span className="flex items-center gap-1"><Globe2 size={13} />{paysOrigineLibelle(b)} → {paysEtudesLibelle(b)}</span>
            <span className="flex items-center gap-1"><Building2 size={13} />{b.criteres.type_etablissement === "public" ? "Établissements publics seulement" : "Public et privé (selon l'organisme)"}</span></span>
          <span className="flex items-center gap-1 text-sm font-bold text-brand-600">Conditions et démarche <ArrowRight size={15} /></span>
        </Link></li>
      ))}</ul>
    </div>
  );
}
