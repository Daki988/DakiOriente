"use client";

import { useEffect, useRef, useState } from "react";
import type { RSide } from "@/lib/design/layout";
import { matrix3d } from "@/lib/design/perspective";
import type { MockupPhoto } from "@/lib/design/photos";
import { DesignSvg } from "./DesignSvg";

/** Largeur (px) à laquelle le design est dessiné avant d'être déformé : assez pour rester net. */
const BOX = 900;

/**
 * Mise en scène photo : le design est plaqué sur chaque zone de la photo en respectant la perspective,
 * puis la photo est reposée par-dessus en « produit » pour garder ombres, plis et grain.
 */
export function PhotoMockup({ photo, sides }: { photo: MockupPhoto; sides: RSide[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / photo.w));
    ro.observe(el);
    return () => ro.disconnect();
  }, [photo.w]);

  return (
    <figure ref={ref} className="relative w-full overflow-hidden" style={{ aspectRatio: `${photo.w} / ${photo.h}` }} aria-label={photo.alt}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: photo.w, height: photo.h, transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt="" width={photo.w} height={photo.h} className="absolute inset-0 size-full select-none" draggable={false} />
        {photo.zones.map((z, i) => {
          const side = sides[Math.min(z.side ?? 0, sides.length - 1)];
          const bw = BOX, bh = (BOX * side.h) / side.w;
          const clip = `polygon(${z.quad.map(([x, y]) => `${x}px ${y}px`).join(",")})`;
          return (
            <div key={i}>
              <div className="absolute left-0 top-0 origin-top-left" style={{ width: bw, height: bh, transform: matrix3d(bw, bh, z.quad) }}>
                <DesignSvg side={side} trim className="block size-full" />
              </div>
              {/* Ombres et texture de la photo par-dessus le design */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.src} alt="" width={photo.w} height={photo.h} className="pointer-events-none absolute inset-0 size-full mix-blend-multiply" style={{ clipPath: clip, opacity: z.shade ?? 0.9 }} />
            </div>
          );
        })}
      </div>
      {photo.credit && (
        <figcaption className="absolute bottom-1.5 right-2 rounded bg-black/35 px-1.5 py-0.5 text-[9px] text-white/90">
          Photo : {photo.credit.author} · {photo.credit.site}
        </figcaption>
      )}
    </figure>
  );
}
