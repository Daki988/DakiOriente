"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Category } from "@/lib/content";
import { ProductCard } from "./ProductCard";
import { Media } from "./Media";
import { IconSearch, IconClose } from "./Icons";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Menu interactif : recherche instantanée + puces de catégories collantes qui suivent le défilement.
 */
export function MenuBrowser({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState(categories[0]?.slug);
  const [q, setQ] = useState("");
  const chipsRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return categories;
    return categories
      .map((c) => ({
        ...c,
        products: norm(c.name).includes(n) ? c.products : c.products.filter((p) => norm(`${p.name} ${p.description}`).includes(n)),
      }))
      .filter((c) => c.products.length);
  }, [q, categories]);
  const count = filtered.reduce((s, c) => s + c.products.length, 0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-160px 0px -55% 0px" },
    );
    filtered.forEach((c) => { const el = document.getElementById(c.slug); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [filtered]);

  useEffect(() => {
    const chip = chipsRef.current?.querySelector<HTMLElement>(`[data-slug="${active}"]`);
    if (!chip || !chipsRef.current) return;
    const box = chipsRef.current;
    box.scrollTo({ left: chip.offsetLeft - box.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  return (
    <div>
      <div className="sticky top-14 z-30 -mx-4 border-b border-white/5 bg-bg/90 px-4 pb-3 pt-3 backdrop-blur md:top-16">
        <label className="relative block">
          <span className="sr-only">Rechercher dans le menu</span>
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Burger, mojito, Jack Daniel's, chicha…"
            className="min-h-11 w-full rounded-full border border-white/10 bg-surface pl-11 pr-11 text-sm placeholder:text-muted/70 focus:border-accent focus:outline-none"
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full hover:bg-white/5" aria-label="Effacer la recherche">
              <IconClose className="h-4 w-4" />
            </button>
          )}
        </label>
        <div ref={chipsRef} className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" aria-label="Catégories du menu">
          {filtered.map((c) => (
            <a
              key={c.slug}
              href={`#${c.slug}`}
              data-slug={c.slug}
              aria-current={active === c.slug ? "true" : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition ${
                active === c.slug ? "border-accent bg-accent text-accent-ink" : "border-white/15 text-text/80 hover:border-accent"
              }`}
            >
              {c.name}
            </a>
          ))}
        </div>
      </div>

      {q && (
        <p className="pt-6 text-sm text-muted" aria-live="polite">
          {count ? `${count} résultat${count > 1 ? "s" : ""} pour « ${q} »` : `Aucun résultat pour « ${q} ». Essayez « burger », « bière » ou « whisky ».`}
        </p>
      )}

      {filtered.map((c) => (
        <section key={c.slug} id={c.slug} aria-labelledby={`h-${c.slug}`} className="scroll-mt-44 pt-10">
          <div className="flex items-center gap-4">
            {c.image && <Media src={c.image} alt={c.name} className="h-16 w-16 shrink-0 rounded-2xl sm:h-20 sm:w-20" sizes="80px" />}
            <div>
              <h2 id={`h-${c.slug}`} className="font-display text-3xl sm:text-4xl">
                <Link href={`/menu/${c.slug}`} className="hover:text-accent">{c.name}</Link>
              </h2>
              {c.intro && <p className="mt-1 text-sm text-muted">{c.intro}</p>}
            </div>
          </div>
          {c.note && <p className="mt-3 rounded-xl border border-accent/30 bg-secondary/30 px-3 py-2 text-xs text-accent">N.B. : {c.note}</p>}
          <ul className="mt-2">
            {c.products.map((p) => <ProductCard key={p.name} p={p} />)}
          </ul>
          <a href="#top" className="mt-4 inline-block text-xs uppercase tracking-widest text-muted hover:text-accent">↑ Haut du menu</a>
        </section>
      ))}
    </div>
  );
}
