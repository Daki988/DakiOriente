import Link from "next/link";

export function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-400" style={{ width: size, height: size }} aria-hidden>
      <svg width={size * 0.7} height={size * 0.7} viewBox="8 6 24 24" fill="none">
        <path d="M20 8 L27 27 L20 23 L13 27 Z" fill="#fff" />
        <circle cx="20" cy="20" r="2.4" fill="#ffc21f" />
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
