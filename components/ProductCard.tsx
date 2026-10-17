import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { fcfa, unitLabel } from "@/lib/format";
import { fromPrice } from "@/lib/pricing";
import { ProductMockup } from "@/components/ProductMockup";

/** Visuel produit : le support mis en scène avec un modèle de l'éditeur. */
export function ProductVisual({ product, className = "", rounded = false }: { product: Product; className?: string; rounded?: boolean }) {
  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      <ProductMockup product={product} rounded={rounded} />
    </div>
  );
}

export function ProductCard({ product, badge }: { product: Product; badge?: string }) {
  const from = fromPrice(product);
  return (
    <Link
      href={`/produits/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(13,14,18,.35)]"
    >
      <div className="relative">
        <ProductVisual product={product} />
        {badge && <span className="absolute left-2.5 top-2.5 rounded-full bg-white px-2 py-1 text-[11px] font-semibold">{badge}</span>}
      </div>
      <div className="grid gap-1 px-3.5 pb-3.5 pt-3">
        <h3 className="font-sans text-base font-semibold leading-tight tracking-normal group-hover:text-brand">{product.name}</h3>
        <p className="tabular text-sm text-muted">
          Dès <b className="font-semibold text-ink">{fcfa(from.price)}</b>{product.unit === "m²" ? " / m²" : ` · ${unitLabel(product.unit, from.qty)}`}
        </p>
      </div>
    </Link>
  );
}
