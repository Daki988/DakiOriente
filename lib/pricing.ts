// Calcul des prix — utilisé à l'identique côté navigateur (affichage) et côté serveur
// (création de commande), pour qu'un client ne puisse jamais imposer son propre prix.

export type Tier = { qty: number; price: number };
export type OptionChoice = { label: string; pct: number };
export type ProductOption = { name: string; choices: OptionChoice[] };
/** pack : quantités fixes (100, 250…) · unit : prix à l'unité · area : prix au m² */
export type PricingMode = "pack" | "unit" | "area";

export type Priceable = { pricing: PricingMode; tiers: Tier[]; options: ProductOption[] };

export type Selection = {
  qty: number;
  widthCm?: number;
  heightCm?: number;
  choices?: Record<string, string>;
  design?: boolean;
};

export type Quote = {
  ok: true;
  base: number;
  optionsDelta: number;
  design: number;
  total: number;
  /** surface facturée en m² (mode area) */
  area?: number;
  choices: Record<string, string>;
} | { ok: false; error: string };

export const MAX_UNITS = 10000;
export const MIN_CM = 5;
export const MAX_CM = 5000;
/** surface minimale facturée (m²) */
export const MIN_AREA = 1;

const round50 = (n: number) => Math.ceil(n / 50) * 50;

/** Palier applicable : le plus grand palier dont la quantité est ≤ à la quantité demandée. */
export function tierFor(tiers: Tier[], amount: number): Tier {
  const sorted = [...tiers].sort((a, b) => a.qty - b.qty);
  let t = sorted[0];
  for (const x of sorted) if (x.qty <= amount) t = x;
  return t;
}

export function resolveChoices(options: ProductOption[], wanted: Record<string, string> = {}): Record<string, string> | string {
  const out: Record<string, string> = {};
  for (const o of options) {
    const label = wanted[o.name] ?? o.choices[0]?.label;
    if (!o.choices.some((c) => c.label === label)) return `Option invalide : ${o.name}`;
    out[o.name] = label;
  }
  return out;
}

export function quote(p: Priceable, sel: Selection, designFee = 0): Quote {
  if (!p.tiers.length) return { ok: false, error: "Ce produit n’a pas encore de prix." };
  const qty = Math.floor(Number(sel.qty));
  if (!Number.isFinite(qty) || qty < 1 || qty > MAX_UNITS) return { ok: false, error: "Quantité invalide." };

  let base: number;
  let area: number | undefined;

  if (p.pricing === "pack") {
    const t = p.tiers.find((x) => x.qty === qty);
    if (!t) return { ok: false, error: "Choisissez une des quantités proposées." };
    base = t.price;
  } else if (p.pricing === "unit") {
    const t = tierFor(p.tiers, qty);
    base = round50((qty * t.price) / t.qty);
  } else {
    const w = Number(sel.widthCm), h = Number(sel.heightCm);
    if (!(w >= MIN_CM && w <= MAX_CM && h >= MIN_CM && h <= MAX_CM)) {
      return { ok: false, error: `Indiquez des dimensions entre ${MIN_CM} et ${MAX_CM} cm.` };
    }
    area = Math.max(MIN_AREA, Math.round(((w * h) / 10000) * qty * 100) / 100);
    const t = tierFor(p.tiers, area);
    base = round50(area * t.price);
  }

  const choices = resolveChoices(p.options, sel.choices);
  if (typeof choices === "string") return { ok: false, error: choices };
  const pct = p.options.reduce((s, o) => s + (o.choices.find((c) => c.label === choices[o.name])?.pct ?? 0), 0);
  const optionsDelta = pct === 0 ? 0 : Math.sign(pct) * round50(Math.abs((base * pct) / 100));
  const design = sel.design ? designFee : 0;

  return { ok: true, base, optionsDelta, design, total: base + optionsDelta + design, area, choices };
}

/** Prix d'appel affiché sur les cartes produit (« dès … »). */
export function fromPrice(p: Priceable): { price: number; qty: number } {
  const t = [...p.tiers].sort((a, b) => a.qty - b.qty)[0];
  return { price: t?.price ?? 0, qty: t?.qty ?? 0 };
}
