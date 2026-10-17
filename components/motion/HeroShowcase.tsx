"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductMockup } from "@/components/ProductMockup";

export type ShowcaseItem = { slug: string; name: string; categorySlug: string; formatMm: number[] | null; from: string };

/** Pile de produits mis en scène qui défilent en 3D, sur fond d'encres CMJ qui flottent. */
export function HeroShowcase({ items }: { items: ShowcaseItem[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;

  useEffect(() => {
    if (paused || n < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!document.hidden) setI((x) => (x + 1) % n); }, 3400);
    return () => clearInterval(t);
  }, [paused, n]);

  const pose = (offset: number): React.CSSProperties => {
    if (offset === 0) return { transform: "translate3d(0,0,0) rotate(-3deg) scale(1)", opacity: 1, zIndex: 30 };
    if (offset === 1) return { transform: "translate3d(16%,-9%,0) rotate(5deg) scale(.86)", opacity: 0.85, zIndex: 20 };
    if (offset === 2) return { transform: "translate3d(28%,-17%,0) rotate(11deg) scale(.74)", opacity: 0.5, zIndex: 10 };
    if (offset === n - 1) return { transform: "translate3d(-38%,12%,0) rotate(-16deg) scale(.9)", opacity: 0, zIndex: 40 };
    return { transform: "translate3d(30%,-20%,0) rotate(12deg) scale(.7)", opacity: 0, zIndex: 0 };
  };
  const cur = items[i];

  return (
    <div className="relative mx-auto w-[86%] max-w-[360px] md:w-full md:max-w-[460px]" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <div className="pointer-events-none absolute inset-[-12%]" aria-hidden="true">
        <span className="ink-light ink-float left-[0%] top-[4%] bg-cyan" style={{ width: "58%" }} />
        <span className="ink-light ink-float right-[0%] top-[0%] bg-magenta" style={{ width: "52%" }} />
        <span className="ink-light ink-float bottom-[0%] left-[22%] bg-yellow" style={{ width: "56%" }} />
      </div>
      <div className="relative aspect-[4/3]">
        {items.map((it, k) => {
          const offset = (k - i + n) % n;
          return (
            <Link key={it.slug} href={`/produits/${it.slug}`} tabIndex={offset === 0 ? 0 : -1} aria-hidden={offset !== 0}
              className="absolute inset-0 block overflow-hidden rounded-2xl shadow-[0_30px_60px_-24px_rgba(13,14,18,.45)] transition-[transform,opacity] duration-[900ms] ease-[cubic-bezier(.2,.75,.15,1)]"
              style={pose(offset)}>
              <ProductMockup product={it} rounded />
            </Link>
          );
        })}
      </div>
      <div className="relative mt-5 flex items-center justify-between gap-3">
        <p key={cur.slug} className="fade-in min-w-0 text-sm" aria-live="polite">
          <b className="block truncate font-semibold">{cur.name}</b>
          <span className="text-muted">Dès {cur.from}</span>
        </p>
        <div className="flex gap-1.5" role="tablist" aria-label="Produits présentés">
          {items.map((it, k) => (
            <button key={it.slug} type="button" role="tab" aria-selected={k === i} aria-label={it.name} onClick={() => setI(k)}
              className={`h-2 rounded-full transition-all duration-500 ${k === i ? "w-6 bg-ink" : "w-2 bg-ink/25"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
