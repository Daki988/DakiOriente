import { Building2 } from "lucide-react";
import { mobilite, type Etablissement } from "@/lib/data";
import { photo } from "@/lib/photos";
import { srcsetPhoto } from "@/lib/photo-variantes";

/** Photo d'un établissement, ou visuel de remplacement en attendant celles fournies par l'école. */
/** prioritaire : photo en haut de page (souvent la plus grande, « LCP ») chargée tout de suite et en premier.
 *  sizes : largeur affichée, pour que le navigateur choisisse la variante 400 ou 840 px plutôt que l'original. */
export function EtabPhoto({ e, n = 0, className = "", rounded = "rounded-2xl", showCredit = false, prioritaire = false, sizes = "(max-width: 640px) 100vw, 420px" }: { e: Etablissement; n?: number; className?: string; rounded?: string; showCredit?: boolean; prioritaire?: boolean; sizes?: string }) {
  const charge = (src: string) => ({ src, srcSet: srcsetPhoto(src), sizes: srcsetPhoto(src) ? sizes : undefined, loading: prioritaire ? ("eager" as const) : ("lazy" as const), fetchPriority: prioritaire ? ("high" as const) : undefined, decoding: "async" as const });
  const p = e.photos[n];
  // Sans photo fournie : vue de la ville du campus principal (couverture harmonisée, Wikimedia Commons)
  const ville = n <= 0 && !e.photos.length ? mobilite[e.ville]?.couverture : undefined;
  if (!p && ville)
    return (
      <div className={`relative overflow-hidden ${rounded} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...charge(ville.src)} alt={`Vue de ${e.ville}`} className="h-full w-full object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
        {showCredit && <PhotoCredit p={ville} />}
      </div>
    );
  // Ni photo de l'école ni vue de la ville : photo d'étudiants (illustration libre de droits)
  const neutre = photo("communaute");
  if (!p && neutre)
    return (
      <div className={`relative overflow-hidden ${rounded} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...charge(neutre.src)} alt="" title={`Illustration : ${neutre.credit}`} className="h-full w-full object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
      </div>
    );
  if (!p)
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-brand-600 to-brand-300 ${rounded} ${className}`} aria-hidden>
        <Building2 size={56} strokeWidth={1.4} className="text-white/60" />
      </div>
    );
  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...charge(p.src)} alt={`${e.nom} — photo ${n + 1}`} className="h-full w-full object-cover" />
      {showCredit && <PhotoCredit p={p} />}
    </div>
  );
}

export const creditText = (p: Etablissement["photos"][number]) => `Photo : ${p.credit ?? "établissement"}${p.licence ? " · " + p.licence : ""}`;

export function PhotoCredit({ p }: { p: Etablissement["photos"][number] }) {
  return <span className="absolute bottom-3 left-3 max-w-[85%] truncate rounded-full bg-ink/65 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">{creditText(p)}</span>;
}
