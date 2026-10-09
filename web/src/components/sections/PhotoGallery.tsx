"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EtabPhoto, creditText } from "@/components/ui/EtabPhoto";
import type { Etablissement } from "@/lib/data";

/** Galerie de l'établissement : mosaïque, zoom au survol, visionneuse plein écran (clavier et swipe). */
export function PhotoGallery({ e }: { e: Etablissement }) {
  const [open, setOpen] = useState<number | null>(null);
  const n = e.photos.length;
  const go = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + n) % n)), [n]);
  useEffect(() => {
    if (open === null) return;
    const onKey = (k: KeyboardEvent) => { if (k.key === "Escape") setOpen(null); if (k.key === "ArrowRight") go(1); if (k.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);
  const tile = (k: number, cls: string) => (
    <button type="button" onClick={() => n && setOpen(Math.min(k, n - 1))} className={`group relative overflow-hidden rounded-3xl ${cls}`} aria-label={n ? `Agrandir la photo ${k + 1}` : undefined} disabled={!n}>
      <EtabPhoto e={e} n={k < n ? k : -1} rounded="rounded-3xl" className="h-full w-full transition duration-700 group-hover:scale-105" />
    </button>
  );
  return (
    <>
      {n <= 1 ? (
        <div className={`relative ${n ? "h-[300px] sm:h-[400px]" : "h-[160px] sm:h-[190px]"}`}>
          {tile(0, "h-full w-full")}
          <span className={`pointer-events-none absolute bottom-4 left-4 max-w-[80%] truncate rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur ${n ? "bg-ink/65 text-white" : "bg-white/90 font-bold text-ink-soft"}`}>{n ? creditText(e.photos[0]) : "Photos bientôt fournies par l'établissement"}</span>
        </div>
      ) : (
      <div className="grid h-[300px] grid-cols-1 grid-rows-1 gap-3 sm:h-[420px] sm:grid-cols-[1.6fr_1fr]">
        <div className="relative">
          {tile(0, "h-full w-full")}
          {<span className="pointer-events-none absolute bottom-4 left-4 max-w-[80%] truncate rounded-full bg-ink/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">{creditText(e.photos[0])}</span>}
        </div>
        <div className="hidden grid-rows-2 gap-3 sm:grid">
          {tile(1, "h-full w-full")}
          <div className="relative">
            {tile(2, "h-full w-full")}
            {n > 0 && <button type="button" onClick={() => setOpen(0)} className="absolute inset-0 flex items-center justify-center gap-2 rounded-3xl bg-ink/45 font-extrabold text-white transition hover:bg-ink/55"><Images size={22} /> Voir {n > 1 ? `les ${n} photos` : "la photo"}</button>}
          </div>
        </div>
      </div>
      )}
      <AnimatePresence>
        {open !== null && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label={`Photos de ${e.nom}`}>
            <button className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Fermer"><X /></button>
            {n > 1 && <button onClick={(ev) => { ev.stopPropagation(); go(-1); }} className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Photo précédente"><ChevronLeft /></button>}
            {n > 1 && <button onClick={(ev) => { ev.stopPropagation(); go(1); }} className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Photo suivante"><ChevronRight /></button>}
            <motion.figure key={open} className="flex max-h-full max-w-5xl flex-col gap-3" initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, i) => { if (i.offset.x < -60) go(1); if (i.offset.x > 60) go(-1); }} onClick={(ev) => ev.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.photos[open].src} alt={`${e.nom} — photo ${open + 1}`} className="max-h-[78vh] rounded-2xl object-contain" draggable={false} />
              <figcaption className="flex justify-between gap-4 text-sm text-white/80"><span>{creditText(e.photos[open])}</span><span>{open + 1} / {n}</span></figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
