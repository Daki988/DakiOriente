"use client";
import { useState } from "react";
import { useCart } from "./cart";
import { formatPrice, type Product } from "@/lib/content";

/** Boutons d'ajout : un par variante (Shoot / Verre / Bouteille…), sinon un seul « + ». */
export function AddToCart({ p }: { p: Product }) {
  const { add } = useCart();
  const [flash, setFlash] = useState<string | null>(null);
  if (!p.available) return null;

  const options = p.variants?.length ? p.variants : p.price ? [{ label: "", price: p.price }] : [];
  if (!options.length) return null;

  const onAdd = (label: string, price: number) => {
    add({ name: p.name, variant: label || undefined, price });
    setFlash(label + price);
    setTimeout(() => setFlash(null), 900);
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((o, i) => {
        const k = o.label + o.price;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onAdd(o.label, o.price)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition active:scale-95 ${
              flash === k ? "border-accent bg-accent text-accent-ink" : "border-white/15 hover:border-accent hover:text-accent"
            }`}
          >
            <span aria-hidden="true" className="text-base leading-none">{flash === k ? "✓" : "+"}</span>
            {o.label && <span className="sr-only">Ajouter {p.name} au panier : </span>}
            {o.label ? (
              <><span className="text-muted">{o.label}</span>{" "}<span>{formatPrice(o.price)}</span></>
            ) : (
              <span>{flash === k ? "Ajouté" : "Ajouter"}<span className="sr-only"> {p.name} au panier — {formatPrice(o.price)}</span></span>
            )}
          </button>
        );
      })}
    </div>
  );
}
