/**
 * TODO: DONNÉE À CONFIRMER — logo provisoire.
 * Remplacer par le logo officiel HD (SVG) fourni par Jackboy : public/brand/logo.svg
 */
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

export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <CactusMark className="h-7 w-7 text-accent" />
      <span className="leading-none">
        <span className="block font-display text-xl tracking-wide">Jackboy</span>
        {!compact && <span className="block text-[10px] uppercase tracking-[0.3em] text-muted">Bar-Restaurant 241</span>}
      </span>
    </span>
  );
}
