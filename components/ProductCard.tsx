import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { fcfa, unitLabel } from "@/lib/format";
import { fromPrice } from "@/lib/pricing";

/** Fond teinté (léger) + feuille arrière dans la couleur pleine de la catégorie. */
const BG: Record<string, string> = {
  yellow: "bg-yellow/25", magenta: "bg-magenta/12", cyan: "bg-cyan/12", blue: "bg-blue/12", brand: "bg-brand/10", ink: "bg-ink/8",
};
const SHEET: Record<string, string> = {
  yellow: "bg-yellow", magenta: "bg-magenta", cyan: "bg-cyan", blue: "bg-blue", brand: "bg-brand", ink: "bg-ink",
};

/** Visuel produit : une feuille au vrai rapport largeur/hauteur du produit, posée sur la couleur de sa catégorie. */
export function ProductVisual({ product, className = "aspect-[169/138]" }: { product: Product; className?: string }) {
  const [w, h] = product.formatMm ?? [100, 100];
  const ratio = Math.min(2.4, Math.max(0.42, w / h));
  const width = ratio >= 1 ? 58 : Math.round(58 * ratio * 0.9 + 12);
  return (
    <div className={`relative overflow-hidden ${BG[product.color] ?? "bg-yellow"} ${className}`} aria-hidden="true">
      <div
        className={`absolute left-1/2 top-1/2 rounded-[3px] ${SHEET[product.color] ?? "bg-ink"}`}
        style={{ width: `${width}%`, aspectRatio: `${ratio}`, transform: "translate(-44%,-44%) rotate(6deg)" }}
      />
      <div
        className="absolute left-1/2 top-1/2 rounded-[3px] bg-white shadow-[0_10px_18px_-6px_rgba(13,14,18,.25)]"
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
