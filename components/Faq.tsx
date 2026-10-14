import { faq } from "@/lib/content";

/** FAQ accessible (<details> natif, zéro JS). Le balisage FAQPage est ajouté par la page. */
export function Faq({ limit }: { limit?: number }) {
  const items = limit ? faq.slice(0, limit) : faq;
  return (
    <div className="divide-y divide-white/10 rounded-3xl border border-white/10 bg-surface">
      {items.map((f) => (
        <details key={f.q} className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold">
            <h3 className="text-base">{f.q}</h3>
            <span aria-hidden="true" className="text-xl text-accent transition group-open:rotate-45">+</span>
          </summary>
          <p className="pb-4 text-sm leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
