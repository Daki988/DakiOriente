"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { id: string; name: string; variant?: string; price: number; qty: number };
type Ctx = {
  lines: CartLine[];
  count: number;
  total: number;
  add: (l: Omit<CartLine, "qty" | "id">) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  lastAdded: number;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "jackboy-cart-v1";

/** Panier persistant (localStorage du visiteur uniquement — rien n'est envoyé à un serveur). */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState(0);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setLines(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {}
  }, [lines]);

  const add = useCallback((l: Omit<CartLine, "qty" | "id">) => {
    const id = `${l.name}|${l.variant ?? ""}|${l.price}`;
    setLines((prev) => {
      const ex = prev.find((p) => p.id === id);
      return ex ? prev.map((p) => (p.id === id ? { ...p, qty: p.qty + 1 } : p)) : [...prev, { ...l, id, qty: 1 }];
    });
    setLastAdded(Date.now());
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) => (qty <= 0 ? prev.filter((p) => p.id !== id) : prev.map((p) => (p.id === id ? { ...p, qty } : p))));
  }, []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
    return { lines, count, total, add, setQty, clear, open, setOpen, lastAdded };
  }, [lines, add, setQty, clear, open, lastAdded]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart hors CartProvider");
  return c;
}
