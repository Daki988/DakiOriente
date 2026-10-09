"use client";
import { useState } from "react";
import { IconPin } from "./Icons";

/**
 * Carte chargée à la demande (aucun script tiers tant que l'utilisateur ne clique pas).
 * OpenStreetMap : pas de clé d'API, léger.
 */
export function MapEmbed({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const [show, setShow] = useState(false);
  const d = 0.006;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/5 bg-surface sm:aspect-[16/9]">
      {show ? (
        <iframe title={`Carte — ${label}`} src={src} className="h-full w-full" loading="lazy" style={{ filter: "invert(.9) hue-rotate(180deg) saturate(.6)" }} />
      ) : (
        <button onClick={() => setShow(true)} className="wood grain absolute inset-0 flex flex-col items-center justify-center gap-3 bg-secondary/40 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink"><IconPin className="h-6 w-6" /></span>
          <span className="font-semibold">Afficher la carte</span>
          <span className="text-xs text-muted">Chargement à la demande pour économiser vos données</span>
        </button>
      )}
    </div>
  );
}
