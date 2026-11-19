"use client";
import { BadgeCheck, Percent, Search } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "@/components/ui/Link";
import { EtabLogo } from "@/components/ui/EtabLogo";
import type { BourseEcole, Categorie } from "@/server/bourses-ecoles";

const FILTRES: [Categorie | "", string][] = [["", "Toutes"], ["cent", "Jusqu'à 100 %"], ["merite", "Mérite / excellence"], ["sociale", "Sociales"], ["pret", "Prêt étudiant"], ["reduction", "Réduction"]];
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const moisAnnee = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : null);

/** Bourses et réductions des écoles (relevées sur leurs sites officiels), filtrables. */
export function BoursesEcoles({ liste }: { liste: BourseEcole[] }) {
  const [f, setF] = useState<Categorie | "">("");
  const [q, setQ] = useState("");
  const [tout, setTout] = useState(false);
  const detaillees = useMemo(() => liste.filter((b) => b.detaille && (!f || b.categories.includes(f)) && (!q || norm(`${b.sigle} ${b.nom} ${b.ville}`).includes(norm(q)))), [liste, f, q]);
  const autres = liste.filter((b) => !b.detaille);
  const visibles = tout || f || q ? detaillees : detaillees.slice(0, 9);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Type de bourse">
          {FILTRES.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={f === k} onClick={() => setF(k)} className={`min-h-[40px] rounded-full px-4 text-sm font-bold ${f === k ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200" : "bg-[#eef1f8] text-ink-soft hover:bg-brand-50"}`}>{l}</button>)}
        </div>
        <label className="ml-auto flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:w-64"><Search size={16} className="text-ink-mute" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une école" className="w-full bg-transparent text-sm outline-none" aria-label="Rechercher une école" /></label>
      </div>
      {visibles.length ? (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{visibles.map((b) => (
          <li key={b.id} className="card flex flex-col gap-3 rounded-[22px] p-5">
            <div className="flex items-center gap-3">
              <EtabLogo e={{ logo: b.logo, sigle: b.sigle, nom: b.nom }} size={46} />
              <span className="min-w-0 flex-1"><b className="block truncate">{b.sigle}</b><span className="block truncate text-xs text-ink-mute">{b.ville}</span></span>
              {b.badge && <span className="chip shrink-0 bg-[#e8f8ef] text-[#0b7a3d]"><Percent size={12} />{b.badge}</span>}
            </div>
            <p className="text-[14px] leading-relaxed text-ink-soft">{b.texte}</p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1.5 text-xs text-ink-mute"><BadgeCheck size={14} className="text-[#0b7a3d]" />Relevé sur le site officiel{b.releve ? ` · ${moisAnnee(b.releve)}` : ""}</span>
              <Link href={`/etablissements/${b.id}/#frais`} className="text-[13px] font-bold text-brand-600">Voir l&apos;école →</Link>
            </div>
          </li>
        ))}</ul>
      ) : <p className="rounded-2xl bg-[#f6f8fe] p-4 text-sm text-ink-soft">Aucune école ne correspond à ce filtre.</p>}
      {!tout && !f && !q && detaillees.length > 9 && <button type="button" onClick={() => setTout(true)} className="btn-ghost min-h-[44px] self-center px-5">Voir les {detaillees.length} écoles</button>}
      {!!autres.length && !f && (
        <p className="text-sm text-ink-soft"><b>Annoncent aussi des bourses, sans en publier le détail :</b>{" "}
          {autres.map((b, i) => <span key={b.id}>{i ? ", " : ""}<Link href={`/etablissements/${b.id}/`} className="font-semibold text-brand-600 hover:underline">{b.sigle}</Link></span>)}.
        </p>
      )}
    </div>
  );
}
