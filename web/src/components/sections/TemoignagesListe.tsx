"use client";
import { useState } from "react";
import { TemoignageCarte } from "@/components/ui/Temoignages";
import { domaineById, metierById } from "@/lib/data";
import { temoignages } from "@/lib/temoignages";

// Témoignages d'Afrique d'abord (maquettes « temoignages », écran 3), puis filtre par domaine des métiers.
const AFRIQUE = /Maroc|Gabon|Burkina|Togo|Côte d'Ivoire|Cameroun|Zambie|Kenya|Sénégal|Mauritanie|Congo|Égypte|Guinée|Ghana|Afrique/;
const liste = [...temoignages].sort((a, b) => Number(AFRIQUE.test(b.lieu)) - Number(AFRIQUE.test(a.lieu)));
const domaines = Array.from(new Set(liste.map((t) => metierById[t.metier]?.domaine).filter(Boolean))) as string[];

export function TemoignagesListe() {
  const [d, setD] = useState<string | null>(null);
  const vus = d ? liste.filter((t) => metierById[t.metier]?.domaine === d) : liste;
  const chip = (actif: boolean) => `chip shrink-0 px-3.5 py-2 text-[13px] transition ${actif ? "bg-brand-600 text-white" : "border border-[#e6eaf3] bg-white text-ink-soft hover:border-brand-300"}`;
  return (
    <>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        <button type="button" onClick={() => setD(null)} className={chip(!d)}>Tous · {liste.length}</button>
        {domaines.map((x) => <button key={x} type="button" onClick={() => setD(x)} className={chip(d === x)}>{domaineById[x]?.libelle ?? x}</button>)}
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{vus.map((t) => <TemoignageCarte key={t.id} t={t} lienMetier />)}</div>
    </>
  );
}
