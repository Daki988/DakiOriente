import { domStyle } from "./Cards";
import type { Illus } from "@/lib/photos";

/** Photo d'illustration libre de droits (crédit au survol), ou pictogramme du domaine à défaut. */
export function Illustration({ p, domaine, className = "", rounded = "", iconSize = 46, alt }: { p: Illus | null; domaine?: string; className?: string; rounded?: string; iconSize?: number; alt?: string }) {
  if (p)
    return (
      <div className={`relative overflow-hidden bg-[#e8edfa] ${rounded} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.src} alt={alt ?? p.alt} title={`Photo : ${p.credit} · ${p.licence}`} loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  const s = domStyle(domaine ?? "");
  const I = s.icon;
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${rounded} ${className}`} style={{ background: `linear-gradient(135deg, ${s.solid}, ${s.fg}aa)` }} aria-hidden>
      <span className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/10" />
      <I size={iconSize} strokeWidth={1.5} className="text-white/80" />
    </div>
  );
}
