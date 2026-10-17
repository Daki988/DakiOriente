import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { fcfa, unitLabel } from "@/lib/format";
import { fromPrice } from "@/lib/pricing";

const BG: Record<string, string> = {
  yellow: "bg-yellow", magenta: "bg-magenta", cyan: "bg-cyan", blue: "bg-blue", brand: "bg-brand", ink: "bg-ink",
};

/** Visuel produit : une feuille au vrai rapport largeur/hauteur du produit, posée sur la couleur de sa catégorie. */
export function ProductVisual({ product, className = "aspect-[169/138]" }: { product: Product; className?: string }) {
  const [w, h] = product.formatMm ?? [100, 100];
  const ratio = Math.min(2.4, Math.max(0.42, w / h));
  const width = ratio >= 1 ? 58 : Math.round(58 * ratio * 0.9 + 12);
  const dark = product.color === "ink";
  return (
    <div className={`relative overflow-hidden ${BG[product.color] ?? "bg-yellow"} ${className}`} aria-hidden="true">
      <div
        className={`absolute left-1/2 top-1/2 rounded-[3px] ${dark ? "bg-yellow" : "bg-ink"}`}
        style={{ width: `${width}%`, aspectRatio: `${ratio}`, transform: "translate(-44%,-44%) rotate(6deg)" }}
      />
      <div
        className="absolute left-1/2 top-1/2 rounded-[3px] bg-white shadow-[0_10px_18px_rgba(0,0,0,.22)]"
        style={{ width: `${width}%`, aspectRatio: `${ratio}`, transform: "translate(-56%,-58%) rotate(-10deg)" }}
      />
    </div>
  );
}

export function ProductCard({ product, badge }: { product: Product; badge?: string }) {
  const from = fromPrice(product);
  return (
    <Link
      href={`/produits/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-[20px] border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(13,14,18,.45)]"
    >
      <div className="relative">
        <ProductVisual product={product} />
        {badge && <span className="absolute left-2.5 top-2.5 rounded-full bg-ink px-2 py-1 text-[11px] font-bold text-white">{badge}</span>}
      </div>
      <div className="grid gap-1 px-3.5 pb-3.5 pt-3">
        <h3 className="text-[17px] font-bold leading-tight group-hover:text-brand">{product.name}</h3>
        <p className="tabular text-[13px] font-semibold text-brand">
          Dès {fcfa(from.price)}{product.unit === "m²" ? " / m²" : ""}
        </p>
        <p className="text-xs text-muted">{product.unit === "m²" ? "Grand format sur mesure" : unitLabel(product.unit, from.qty)}</p>
      </div>
    </Link>
  );
}
