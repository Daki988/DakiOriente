"use client";
import { useMemo, useState } from "react";
import { useCart } from "./cart";
import { formatPrice } from "@/lib/content";
import { IconDice, IconBag } from "./Icons";

export type Pick = { name: string; variant?: string; price: number };
export type Pools = { food: Pick[]; side: Pick[]; drink: Pick[]; soft: Pick[]; share: Pick[]; bottle: Pick[] };

type Vibe = "chill" | "food" | "night";
const VIBES: { id: Vibe; label: string; hint: string }[] = [
  { id: "chill", label: "Chill", hint: "un verre, une chicha, on discute" },
  { id: "food", label: "Gourmand", hint: "on vient surtout pour manger" },
  { id: "night", label: "Grosse soirée", hint: "on partage, on danse" },
];

/** Petit générateur pseudo-aléatoire reproductible (même graine → même proposition). */
function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function compose(pools: Pools, budget: number, people: number, vibe: Vibe, seed: number) {
  const rand = rng(seed);
  let left = budget;
  const lines = new Map<string, Pick & { qty: number }>();
  const take = (pool: Pick[], qty = 1) => {
    const ok = pool.filter((p) => p.price * qty <= left);
    if (!ok.length) return false;
    const p = ok[Math.floor(rand() * ok.length)];
    const k = `${p.name}|${p.variant ?? ""}`;
    const ex = lines.get(k);
    lines.set(k, { ...p, qty: (ex?.qty ?? 0) + qty });
    left -= p.price * qty;
    return true;
  };
  const each = (pool: Pick[]) => { for (let i = 0; i < people; i++) take(pool); };

  if (vibe === "food") {
    each(pools.food);
    each([...pools.drink, ...pools.soft]);
    for (let i = 0; i < Math.ceil(people / 2); i++) take(pools.side);
  } else if (vibe === "chill") {
    each(pools.drink);
    take(pools.share.filter((p) => /chicha/i.test(p.name)));
    each(pools.food.filter((p) => p.price <= 2000));
  } else {
    if (!take(pools.bottle)) take(pools.share.filter((p) => /plateau/i.test(p.name)));
    each(pools.drink);
    take(pools.share.filter((p) => /chicha/i.test(p.name)));
    each(pools.food);
  }
  // reste du budget : une tournée de plus si possible
  if (left >= budget * 0.25) each(pools.drink);

  const items = [...lines.values()];
  return { items, total: budget - left };
}

/** « Ta soirée pour X FCFA » : propose un panier cohérent selon le budget, le nombre de personnes et l'humeur. */
export function SoireeComposer({ pools }: { pools: Pools }) {
  const { add, setOpen } = useCart();
  const [budget, setBudget] = useState(15000);
  const [people, setPeople] = useState(2);
  const [vibe, setVibe] = useState<Vibe>("food");
  const [seed, setSeed] = useState(7);
  const [added, setAdded] = useState(false);

  const res = useMemo(() => compose(pools, budget, people, vibe, seed), [pools, budget, people, vibe, seed]);
  const fill = ((budget - 2000) / (150000 - 2000)) * 100;

  const addAll = () => {
    res.items.forEach((it) => { for (let i = 0; i < it.qty; i++) add({ name: it.name, variant: it.variant, price: it.price }); });
    setAdded(true);
    setTimeout(() => { setAdded(false); setOpen(true); }, 500);
  };

  return (
    <div className="spotlight reveal overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-secondary/50 via-surface to-surface p-5 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Composer ma soirée</p>
      <h3 className="mt-2 font-display text-3xl sm:text-4xl">Ta soirée pour <span className="text-accent">{formatPrice(budget)}</span></h3>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <label className="block">
            <span className="mb-3 flex justify-between text-sm text-muted"><span>Budget total</span><span className="font-semibold text-text">{formatPrice(budget)}</span></span>
            <input
              type="range" min={2000} max={150000} step={500} value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="jb-range w-full" style={{ ["--fill" as string]: `${fill}%` }}
              aria-label="Budget total en FCFA"
            />
          </label>
          <div>
            <span className="mb-2 block text-sm text-muted">Combien vous êtes ?</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Nombre de personnes">
              {[1, 2, 3, 4, 6, 8].map((n) => (
                <button key={n} role="radio" aria-checked={people === n} onClick={() => setPeople(n)}
                  className={`h-11 w-11 rounded-full border text-sm font-bold transition ${people === n ? "border-accent bg-accent text-accent-ink" : "border-white/15 hover:border-accent"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-2 block text-sm text-muted">L&apos;humeur du jour</span>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Humeur">
              {VIBES.map((v) => (
                <button key={v.id} role="radio" aria-checked={vibe === v.id} onClick={() => setVibe(v.id)}
                  className={`min-h-16 rounded-2xl border p-2 text-left transition ${vibe === v.id ? "border-accent bg-secondary/70" : "border-white/10 hover:border-white/30"}`}>
                  <span className={`block text-sm font-bold ${vibe === v.id ? "text-accent" : ""}`}>{v.label}</span>
                  <span className="block text-[11px] leading-tight text-muted">{v.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-white/10 bg-bg/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Notre proposition</p>
          {res.items.length ? (
            <ul className="mt-3 flex-1 space-y-2" aria-live="polite">
              {res.items.map((it) => (
                <li key={it.name + it.variant} className="flex items-baseline justify-between gap-3 text-sm">
                  <span><span className="font-bold text-accent">{it.qty}×</span> {it.name}{it.variant && <span className="text-muted"> ({it.variant})</span>}</span>
                  <span className="shrink-0 text-muted">{formatPrice(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex-1 text-sm text-muted">Augmentez un peu le budget pour une proposition.</p>
          )}
          <p className="mt-4 flex justify-between border-t border-white/10 pt-3 font-bold">
            <span>Total</span><span className="text-accent">{formatPrice(res.total)}</span>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setSeed((s) => s + 1)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 text-sm font-semibold transition hover:border-accent hover:text-accent">
              <IconDice className="h-4 w-4" /> Autre idée
            </button>
            <button onClick={addAll} disabled={!res.items.length} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent text-sm font-bold text-accent-ink transition hover:brightness-110 disabled:opacity-40">
              <IconBag className="h-4 w-4" /> {added ? "Ajouté ✓" : "Je prends"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
