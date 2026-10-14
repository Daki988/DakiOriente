"use client";
import { useCart } from "./cart";
import { formatPrice } from "@/lib/content";
import { IconBag } from "./Icons";

/** Bouton panier flottant : visible uniquement quand le panier contient des articles. */
export function CartButton() {
  const { count, total, setOpen } = useCart();
  if (!count) return null;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="fixed inset-x-4 z-40 mx-auto flex min-h-13 max-w-md items-center justify-between gap-3 rounded-full bg-accent px-5 text-accent-ink shadow-[0_10px_30px_rgba(0,0,0,.5)] md:inset-x-auto md:right-6 md:bottom-6 md:w-80"
      style={{ bottom: "calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 14px)" }}
    >
      <span className="flex items-center gap-2 text-sm font-bold">
        <IconBag className="h-5 w-5" /> Ma commande
        <span className="rounded-full bg-accent-ink px-2 py-0.5 text-xs text-accent">{count}</span>
      </span>
      <span className="text-sm font-bold">{formatPrice(total)}</span>
    </button>
  );
}
