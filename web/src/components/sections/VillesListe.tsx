"use client";
// Liste des villes d'études avec recherche (nom de ville, d'école) et filtre par pays dès qu'il y a plusieurs destinations.
import Image from "next/image";
import Link from "@/components/ui/Link";
import { ArrowRight, Building2, GraduationCap, MapPin, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Drapeau } from "@/components/ui/Drapeau";
import { VILLES, norm, villeHref } from "@/lib/catalogue";
import { DESTINATIONS_ACTIVES, paysDetailById } from "@/lib/data";

const PROFILS = Object.fromEntries(Object.values(paysDetailById).flatMap((p) => p.villes).map((v) => [v.nom.replace("Benguerir", "Ben Guérir"), v.profil]));

export function VillesListe() {
  const [q, setQ] = useState("");
  const [pays, setPays] = useState("");
  const list = useMemo(() => {
    const t = norm(q).split(/\s+/).filter(Boolean);
    return VILLES.filter((v) => (!pays || v.pays === pays) && (!t.length || t.every((x) => norm([v.nom, PROFILS[v.nom] ?? "", ...v.etabs.map((e) => `${e.nom} ${e.sigle ?? ""}`)].join(" ")).includes(x))));
  }, [q, pays]);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-[48px] min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 focus-within:ring-4 focus-within:ring-brand-100 sm:max-w-md">
          <Search size={18} className="shrink-0 text-ink-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher une ville ou une école (ex : Rabat, EMSI…)" aria-label="Chercher une ville" className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none" />
          {q && <button type="button" onClick={() => setQ("")} aria-label="Effacer" className="text-ink-mute"><X size={17} /></button>}
        </label>
        {DESTINATIONS_ACTIVES.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Pays">
            <button onClick={() => setPays("")} aria-pressed={!pays} className={`chip min-h-[40px] px-3.5 text-[13px] ${!pays ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-ink-soft"}`}>Tous les pays</button>
            {DESTINATIONS_ACTIVES.map((d) => <button key={d.code} onClick={() => setPays(pays === d.code ? "" : d.code)} aria-pressed={pays === d.code} className={`chip min-h-[40px] gap-1.5 px-3.5 text-[13px] ${pays === d.code ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-ink-soft"}`}><Drapeau code={d.code} taille={14} />{d.nom}</button>)}
          </div>
        )}
        <span className="text-sm text-ink-mute">{list.length} ville{list.length > 1 ? "s" : ""}</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v) => {
          const nf = new Set(v.offres.map((o) => o.f.id)).size;
          return (
            <Link key={v.slug} href={villeHref(v.nom)} className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-brand-700 to-brand-400">
                {v.photo ? <Image src={v.photo.src} alt={`Vue de ${v.nom}`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" /> : <MapPin size={64} strokeWidth={1.3} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40" />}
                <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <b className="absolute bottom-3 left-4 flex items-center gap-2 text-2xl font-extrabold text-white"><Drapeau code={v.pays} taille={16} />{v.nom}</b>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                {PROFILS[v.nom] && <p className="text-[13px] leading-relaxed text-ink-soft">{PROFILS[v.nom]}</p>}
                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold text-ink-soft">
                  <span className="flex items-center gap-1.5"><Building2 size={15} className="text-brand-600" />{v.etabs.length} établissement{v.etabs.length > 1 ? "s" : ""}</span>
                  <span className="flex items-center gap-1.5"><GraduationCap size={15} className="text-brand-600" />{nf} formation{nf > 1 ? "s" : ""}</span>
                </div>
                <span className="flex items-center gap-1.5 text-sm font-bold text-brand-600">Étudier à {v.nom} <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
              </div>
            </Link>
          );
        })}
      </div>
      {!list.length && <div className="card p-10 text-center text-ink-mute">Aucune ville ne correspond. <button onClick={() => { setQ(""); setPays(""); }} className="font-bold text-brand-600">Tout afficher</button></div>}
    </div>
  );
}
