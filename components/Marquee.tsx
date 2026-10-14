/** Bandeau défilant (CSS pur, en pause au survol, figé si mouvement réduit). */
export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <li key={i} className="flex items-center whitespace-nowrap px-5 font-display text-2xl uppercase tracking-wide sm:text-3xl">
          {t}
          <span aria-hidden="true" className="ml-10 text-accent">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`marquee overflow-hidden border-y border-white/5 bg-secondary/30 py-4 ${className}`}>
      <div className="marquee-track flex">{row(false)}{row(true)}</div>
    </div>
  );
}
