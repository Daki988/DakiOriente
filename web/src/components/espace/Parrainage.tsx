"use client";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useApi } from "@/hooks/useApi";

type Parrainage = { code: string; lien: string; filleuls: number; objectif: number; debloque: boolean };

const dur = "border-[3px] border-[#0A0A0A] shadow-[6px_6px_0_#0A0A0A]";

/** Encart « Parraine 2 amis » (campagne Trouve ta voie). */
export function ParrainageCard() {
  const { data } = useApi<Parrainage>("/moi/parrainage");
  const [copie, setCopie] = useState(false);
  if (!data) return null;
  const message = `Je prépare mes études au Maroc avec Navigoal : test d'orientation gratuit, écoles vérifiées, budget en F CFA. Inscris-toi avec mon code ${data.code} : ${data.lien}`;
  const copier = async () => {
    try { await navigator.clipboard.writeText(data.lien); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch { /* presse-papiers indisponible */ }
  };
  const pct = Math.min(100, Math.round((data.filleuls / data.objectif) * 100));
  return (
    <section className={`${dur} rounded-[22px] bg-[#1A47F5] p-5 text-white sm:p-7`} aria-labelledby="parrainage-titre">
      <h2 id="parrainage-titre" className="font-display text-3xl uppercase sm:text-4xl">Parraine {data.objectif} amis</h2>
      <p className="mt-2 max-w-xl text-brand-100">
        {data.debloque
          ? "Bravo : ton entretien prioritaire avec un conseiller Navigoal est débloqué. Il te contacte très vite."
          : `Avec ${data.objectif} amis inscrits grâce à ton code, tu obtiens un entretien prioritaire avec un conseiller Navigoal.`}
      </p>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-[#0A0A0A]">
        <b className="flex-1 truncate text-xl tracking-[.12em] sm:text-2xl">{data.code}</b>
        <button type="button" onClick={copier} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-extrabold text-brand-600">
          {copie ? <><Check size={16} />Lien copié</> : <><Copy size={16} />Copier le lien</>}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={`${dur} rounded-xl bg-[#FFE14D] px-4 py-2.5 text-sm font-extrabold text-[#0A0A0A]`}>Partager sur WhatsApp</a>
        <a href={`sms:?&body=${encodeURIComponent(message)}`} className={`${dur} rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-[#0A0A0A]`}>Envoyer par SMS</a>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={data.filleuls} aria-valuemin={0} aria-valuemax={data.objectif} aria-label="Amis inscrits">
          <div className="h-full rounded-full bg-[#FFE14D] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <b className="whitespace-nowrap text-sm">{Math.min(data.filleuls, data.objectif)} / {data.objectif} amis inscrits</b>
      </div>
    </section>
  );
}
