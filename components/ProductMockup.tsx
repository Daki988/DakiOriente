"use client";

import { useMemo } from "react";
import { Mockup } from "@/components/editor/Mockup";
import { approxMeasure, newDesign } from "@/lib/design/defaults";
import { resolveDesign } from "@/lib/design/layout";
import { hasVerso, mockupFor, TEMPLATES } from "@/lib/design/templates";

type P = { slug: string; categorySlug: string; formatMm: number[] | null };

/** Petit nombre stable tiré du nom du produit, pour varier les modèles du catalogue. */
const hash = (s: string) => [...s].reduce((h, c) => (h * 131 + c.charCodeAt(0)) % 1000003, 7);

/** Vignette réaliste du produit : un vrai modèle de l'éditeur, mis en scène selon le support. */
export function ProductMockup({ product, rounded = false }: { product: P; rounded?: boolean }) {
  const sides = useMemo(() => {
    const [wMm, hMm] = product.formatMm?.length === 2 ? product.formatMm : [2000, 1000];
    const f = { slug: product.slug, categorySlug: product.categorySlug, wMm, hMm };
    const d = newDesign(f, hash(product.slug));
    const tpl = TEMPLATES.find((t) => t.id === d.template)!;
    return resolveDesign(tpl, d, wMm, hMm, hasVerso(product.categorySlug), approxMeasure);
  }, [product.slug, product.categorySlug, product.formatMm]);
  return <Mockup kind={mockupFor(product.categorySlug, product.slug)} sides={sides} rounded={rounded} />;
}
