import { domStyle } from "./Cards";
import type { Illus } from "@/lib/photos";

/** Variantes légères produites par scripts/variantes_images.py (160, 400, 640 et 840 px de large). */
const jeu = (src: string) => {
  const base = src.endsWith(".webp") ? src.slice(0, -".webp".length) : null;
  return base ? `${base}-160.webp 160w, ${base}-400.webp 400w, ${base}-640.webp 640w, ${src} 1000w` : undefined;
};

/** Photo d'illustration libre de droits (crédit au survol), ou pictogramme du domaine à défaut.
 * `sizes` : largeur d'affichage réelle (ex. « 40px », « (max-width: 640px) 100vw, 320px »). Dès qu'elle est
 * donnée, le navigateur charge la variante qui suffit au lieu de la photo pleine taille — c'est ce qui évite
 * de télécharger un mégaoctet de photos sur la liste des métiers. Sans `sizes`, la photo d'origine est servie. */
export function Illustration({ p, domaine, className = "", rounded = "", iconSize = 46, alt, sizes }: { p: Illus | null; domaine?: string; className?: string; rounded?: string; iconSize?: number; alt?: string; sizes?: string }) {
  if (p)
    return (
      <div className={`relative overflow-hidden bg-[#e8edfa] ${rounded} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.src} {...(sizes ? { srcSet: jeu(p.src), sizes } : {})} alt={alt ?? p.alt} title={`Photo : ${p.credit} · ${p.licence}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
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
