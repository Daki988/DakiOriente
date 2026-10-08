import type { Etablissement } from "@/lib/data";

export function EtabLogo({ e, size = 44, className = "" }: { e: Pick<Etablissement, "logo" | "sigle" | "nom">; size?: number; className?: string }) {
  if (e.logo)
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white p-1.5 ${className}`} style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.logo} alt={`Logo ${e.nom}`} loading="lazy" className="max-h-full max-w-full object-contain" />
      </div>
    );
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 font-extrabold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.27 }}
      aria-label={e.nom}
    >
      {e.sigle.slice(0, 5)}
    </div>
  );
}
