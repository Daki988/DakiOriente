import Link from "next/link";

/** Logo Navigoal : un « N » tracé comme un itinéraire, du point de départ à l'objectif (point doré). */
export function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-400" style={{ width: size, height: size }} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M12.5 28V13.5L27.5 26.5V18" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="27.5" cy="11.6" r="5.4" stroke="#ffc21f" strokeWidth="1.4" opacity=".6" />
        <circle cx="27.5" cy="11.6" r="2.8" fill="#ffc21f" />
        <circle cx="12.5" cy="28" r="2.6" fill="#fff" />
      </svg>
    </span>
  );
}

export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Navigoal, accueil">
      <BrandMark />
      <span className={`text-[21px] font-extrabold tracking-tight ${dark ? "text-white" : "text-ink"}`}>
        Navi<span className="text-sun-500">goal</span>
      </span>
    </Link>
  );
}
