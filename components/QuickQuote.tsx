"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { fcfa } from "@/lib/format";
import { ArrowRight } from "@/components/Icons";
import { CountUp } from "@/components/motion/CountUp";

/** Devis express de l'accueil (produits vendus par lots de quantités fixes). */
export function QuickQuote({ products }: { products: Product[] }) {
  const [pi, setPi] = useState(0);
  const p = products[pi];
  const [qi, setQi] = useState(Math.min(1, p.tiers.length - 1));
  const tier = p.tiers[Math.min(qi, p.tiers.length - 1)];

  const chip = (on: boolean) =>
    `rounded-full px-3.5 py-2 text-sm ${on ? "bg-ink font-bold text-white" : "border border-line bg-paper font-medium"}`;

  return (
    <div className="grid gap-5 rounded-2xl bg-white p-5 md:p-6">
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-[13px] font-semibold text-muted">Produit</legend>
        <div className="flex flex-wrap gap-2">
          {products.map((x, i) => (
            <button key={x.slug} type="button" aria-pressed={i === pi} className={chip(i === pi)} onClick={() => { setPi(i); setQi(Math.min(1, x.tiers.length - 1)); }}>
              {x.name}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-[13px] font-semibold text-muted">Quantité</legend>
        <div className="flex flex-wrap gap-2">
          {p.tiers.map((t, i) => (
            <button key={t.qty} type="button" aria-pressed={i === qi} className={`tabular ${chip(i === qi)}`} onClick={() => setQi(i)}>
              {t.qty.toLocaleString("fr-FR")}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex items-end justify-between border-t border-line pt-4">
        <div>
          <p className="text-[13px] text-muted">Total estimé</p>
          <p className="tabular font-display text-3xl font-extrabold tracking-tight" aria-live="polite"><CountUp value={tier.price} /></p>
        </div>
        <p className="text-right text-[13px] font-bold text-brand">{fcfa(Math.round(tier.price / tier.qty))} / ex.</p>
      </div>
      <Link href={`/produits/${p.slug}?q=${tier.qty}`} className="flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-4 font-bold text-white">
        Commander ce produit <ArrowRight />
      </Link>
    </div>
  );
}
