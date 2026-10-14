import Image from "next/image";
import cactus from "@/public/brand/cactus.png";
import logoDark from "@/public/brand/logo-dark.png";

/** Cactus stylisé (SVG) — usage décoratif uniquement (fonds, filigranes). */
export function CactusMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className} fill="currentColor">
      <path d="M21 44V10a5 5 0 0 1 10 0v34h-10Z" />
      <path d="M21 30h-6a6 6 0 0 1-6-6v-9a3 3 0 0 1 6 0v8h6v7Z" />
      <path d="M31 25h5v-7a3 3 0 0 1 6 0v8a6 6 0 0 1-6 6h-5v-7Z" />
      <rect x="6" y="43" width="36" height="3" rx="1.5" />
    </svg>
  );
}

/** Logo officiel complet (version pour fond sombre, générée depuis le logo fourni). */
export function FullLogo({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return <Image src={logoDark} alt="Jack Boy — Bar-Resto 241" className={className} priority={priority} sizes="(min-width:768px) 280px, 200px" />;
}

/** Version compacte pour l'en-tête : cactus du logo + nom. */
export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image src={cactus} alt="" className="h-9 w-auto" sizes="32px" priority />
      <span className="leading-none">
        <span className="block font-display text-xl tracking-wide">Jack Boy</span>
        {!compact && <span className="block text-[10px] uppercase tracking-[0.3em] text-muted">Bar-Resto 241</span>}
      </span>
    </span>
  );
}
