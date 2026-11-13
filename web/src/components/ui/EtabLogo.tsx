import fonds from "@/data/logos_fond.json";
import type { Etablissement } from "@/lib/data";

/** Fond des logos : « sombre » pour un logo blanc ou très clair (invisible sur blanc), « plein » quand
 * l'image porte déjà son propre fond (pas de cadre blanc à ajouter). Généré par scripts/analyse_logos.py. */
const FONDS = fonds as Record<string, "sombre" | "plein">;
const identifiant = (logo: string) => logo.split("/").pop()!.replace(/\.[a-z0-9]+$/i, "");

export function EtabLogo({ e, size = 44, className = "" }: { e: Pick<Etablissement, "logo" | "sigle" | "nom">; size?: number; className?: string }) {
  if (e.logo) {
    const fond = FONDS[identifiant(e.logo)];
    const cadre = fond === "sombre" ? "border-[#1d2744] bg-[#101a33] p-1.5" : fond === "plein" ? "border-slate-200/80 bg-white" : "border-slate-200/80 bg-white p-1.5";
    return (
      <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border ${cadre} ${className}`} style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.logo} alt={`Logo ${e.nom}`} loading="lazy" className={`max-h-full max-w-full object-contain ${fond === "plein" ? "h-full w-full" : ""}`} />
      </div>
    );
  }
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
