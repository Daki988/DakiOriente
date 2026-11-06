"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";

/* eslint-disable @next/next/no-img-element */
type Photo = { src: string; credit: string };

/** Galerie d'une résidence : mosaïque (ordinateur), défilement au doigt (téléphone) et visionneuse plein écran de toutes les photos. */
export function GalerieResidence({ photos, nom }: { photos: Photo[]; nom: string }) {
  const [ouverte, setOuverte] = useState<number | null>(null);
  const n = photos.length;
  const aller = useCallback((d: number) => setOuverte((i) => (i == null ? i : (i + d + n) % n)), [n]);
  useEffect(() => {
    if (ouverte == null) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOuverte(null); if (e.key === "ArrowRight") aller(1); if (e.key === "ArrowLeft") aller(-1); };
    document.addEventListener("keydown", k);
    const o = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = o; };
  }, [ouverte, aller]);
  if (!n) return null;
  const bouton = n > 1 && <button type="button" onClick={() => setOuverte(0)} className="chip absolute bottom-3 right-3 bg-white px-3 py-2 text-[13px] text-ink shadow-card hover:bg-brand-50"><Images size={14} />Voir les {n} photos</button>;
  return (
    <>
      {/* Téléphone : défilement horizontal */}
      <div className="relative sm:hidden">
        <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4">
          {photos.map((p, k) => <button key={p.src} type="button" onClick={() => setOuverte(k)} className="w-[88%] shrink-0 snap-center overflow-hidden rounded-2xl"><img src={p.src} alt={`${nom} : photo ${k + 1} sur ${n}`} loading={k ? "lazy" : "eager"} className="h-64 w-full object-cover" /></button>)}
        </div>
        <span className="chip absolute bottom-3 right-6 bg-ink/70 text-white">{n} photos · fais glisser</span>
      </div>
      {/* Ordinateur : mosaïque */}
      <div className="relative hidden sm:block">
        <div className={`grid gap-2 overflow-hidden rounded-[22px] ${n >= 3 ? "grid-cols-[2fr_1fr_1fr] grid-rows-[180px_180px]" : "grid-cols-1"}`}>
          {photos.slice(0, n >= 5 ? 5 : n >= 3 ? 3 : 1).map((p, k) => (
            <button key={p.src} type="button" onClick={() => setOuverte(k)} className={`overflow-hidden ${k === 0 && n >= 3 ? "row-span-2" : ""} ${n >= 3 && n < 5 && k > 0 ? "col-span-2" : ""}`}>
              <img src={p.src} alt={`${nom} : photo ${k + 1}`} loading={k ? "lazy" : "eager"} className={`w-full object-cover transition duration-500 hover:scale-105 ${n >= 3 ? "h-full" : "h-[380px]"}`} />
            </button>
          ))}
        </div>
        {bouton}
      </div>
      {ouverte != null && (
        <div role="dialog" aria-modal="true" aria-label={`Photos de ${nom}`} className="fixed inset-0 z-[80] flex flex-col bg-ink/95 text-white" onClick={() => setOuverte(null)}>
          <div className="flex items-center justify-between p-4" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm font-bold">{ouverte + 1} / {n} · {nom}</span>
            <button type="button" onClick={() => setOuverte(null)} aria-label="Fermer" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><X size={22} /></button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16" onClick={(e) => e.stopPropagation()}>
            <img src={photos[ouverte].src} alt={`${nom} : photo ${ouverte + 1} sur ${n}`} className="max-h-full max-w-full rounded-xl object-contain" />
            {n > 1 && <>
              <button type="button" onClick={() => aller(-1)} aria-label="Photo précédente" className="absolute left-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 sm:left-4"><ChevronLeft size={26} /></button>
              <button type="button" onClick={() => aller(1)} aria-label="Photo suivante" className="absolute right-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 sm:right-4"><ChevronRight size={26} /></button>
            </>}
          </div>
          <div className="scrollbar-none flex gap-2 overflow-x-auto p-3" onClick={(e) => e.stopPropagation()}>
            {photos.map((p, k) => <button key={p.src} type="button" onClick={() => setOuverte(k)} aria-label={`Photo ${k + 1}`} className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 ${k === ouverte ? "ring-sun-400" : "ring-transparent opacity-60 hover:opacity-100"}`}><img src={p.src} alt="" loading="lazy" className="h-full w-full object-cover" /></button>)}
          </div>
          <p className="px-4 pb-3 text-center text-[11px] text-white/60">{photos[ouverte].credit} (site officiel de la résidence). Navigoal n&apos;en est pas propriétaire.</p>
        </div>
      )}
    </>
  );
}
