import { Building2 } from "lucide-react";
import { mobilite, type Etablissement } from "@/lib/data";

/** Photo d'un établissement, ou visuel de remplacement en attendant celles fournies par l'école. */
export function EtabPhoto({ e, n = 0, className = "", rounded = "rounded-2xl", showCredit = false }: { e: Etablissement; n?: number; className?: string; rounded?: string; showCredit?: boolean }) {
  const p = e.photos[n];
  // Sans photo fournie : vue de la ville du campus principal (couverture harmonisée, Wikimedia Commons)
  const ville = n <= 0 && !e.photos.length ? mobilite[e.ville]?.couverture : undefined;
  if (!p && ville)
    return (
      <div className={`relative overflow-hidden ${rounded} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ville.src} alt={`Vue de ${e.ville}`} loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
        {showCredit && <PhotoCredit p={ville} />}
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
      <img src={p.src} alt={`${e.nom} — photo ${n + 1}`} loading="lazy" className="h-full w-full object-cover" />
      {showCredit && <PhotoCredit p={p} />}
    </div>
  );
}

export const creditText = (p: Etablissement["photos"][number]) => `Photo : ${p.credit ?? "établissement"}${p.licence ? " · " + p.licence : ""}`;

export function PhotoCredit({ p }: { p: Etablissement["photos"][number] }) {
  return <span className="absolute bottom-3 left-3 max-w-[85%] truncate rounded-full bg-ink/65 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">{creditText(p)}</span>;
}
