"use client";
import { useState } from "react";
import { IconPin } from "./Icons";

/** Carte chargée à la demande (aucun script tiers tant que l'utilisateur ne clique pas). */
export function MapEmbed({ src, label }: { src: string; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/5 bg-surface sm:aspect-[16/9]">
      {show ? (
        <iframe title={`Carte — ${label}`} src={src} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <button onClick={() => setShow(true)} className="wood grain absolute inset-0 flex flex-col items-center justify-center gap-3 bg-secondary/40 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink"><IconPin className="h-6 w-6" /></span>
          <span className="font-semibold">Afficher la carte</span>
          <span className="px-6 text-xs text-muted">Repère : ambassade de Côte d&apos;Ivoire (Jackboy est à 100 m). Chargement à la demande pour économiser vos données.</span>
        </button>
      )}
    </div>
  );
}
