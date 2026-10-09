"use client";
import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/content";
import { ProductCard } from "./ProductCard";

/**
 * Menu interactif : puces de catégories défilables (collantes) + sections.
 * La catégorie active suit le défilement ; un clic fait défiler vers la section.
 */
export function MenuBrowser({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState(categories[0]?.slug);
  const chipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -55% 0px" },
    );
    categories.forEach((c) => { const el = document.getElementById(c.slug); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [categories]);

  useEffect(() => {
    const chip = chipsRef.current?.querySelector<HTMLElement>(`[data-slug="${active}"]`);
    chip?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <div>
      <div className="sticky top-14 z-30 -mx-4 border-b border-white/5 bg-bg/90 px-4 py-3 backdrop-blur md:top-16">
        <div ref={chipsRef} className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label="Catégories du menu">
          {categories.map((c) => (
            <a
              key={c.slug}
              href={`#${c.slug}`}
              data-slug={c.slug}
              role="tab"
              aria-selected={active === c.slug}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition ${
                active === c.slug ? "border-accent bg-accent text-accent-ink" : "border-white/15 text-text/80 hover:border-accent"
              }`}
            >
              {c.name}
            </a>
          ))}
        </div>
      </div>
      {categories.map((c) => (
        <section key={c.slug} id={c.slug} aria-labelledby={`h-${c.slug}`} className="scroll-mt-32 pt-10">
          <h2 id={`h-${c.slug}`} className="font-display text-3xl sm:text-4xl">{c.name}</h2>
          {c.intro && <p className="mt-2 text-sm text-muted">{c.intro}</p>}
          <ul className="mt-2">
            {c.products.map((p) => <ProductCard key={p.name} p={p} />)}
          </ul>
          <a href="#top" className="mt-4 inline-block text-xs uppercase tracking-widest text-muted hover:text-accent">↑ Catégories</a>
        </section>
      ))}
    </div>
  );
}
