import { formatPrice, type Product } from "@/lib/content";
import { Media } from "./Media";

export function ProductCard({ p, large = false, category }: { p: Product; large?: boolean; category?: string }) {
  if (large) {
    return (
      <article className="reveal group overflow-hidden rounded-3xl border border-white/5 bg-surface">
        <Media src={p.image} alt={p.name} mood="food" className="aspect-[4/3] transition duration-500 group-hover:scale-[1.02]" sizes="(min-width:768px) 33vw, 85vw" />
        <div className="p-5">
          {category && <p className="text-[11px] uppercase tracking-[0.25em] text-gold">{category}</p>}
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <h3 className="font-display text-2xl">{p.name}</h3>
            <span className="shrink-0 text-sm font-semibold text-accent">{formatPrice(p.price)}</span>
          </div>
          <p className="mt-2 text-sm text-muted">{p.description}</p>
        </div>
      </article>
    );
  }
  return (
    <li className={`flex gap-4 border-b border-white/5 py-4 ${p.available ? "" : "opacity-50"}`}>
      {p.image && <Media src={p.image} alt={p.name} className="h-20 w-20 shrink-0 rounded-xl" sizes="80px" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-semibold">
            {p.name}
            {p.featured && <span className="ml-2 align-middle text-[10px] uppercase tracking-widest text-gold">Signature</span>}
            {p.isNew && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 align-middle text-[10px] font-bold uppercase text-accent-ink">Nouveau</span>}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-accent">
            {p.available ? formatPrice(p.price) : "Indisponible"}
          </span>
        </div>
        {p.description && <p className="mt-1 text-sm text-muted">{p.description}</p>}
      </div>
    </li>
  );
}
