import local from "@/content/catalogue.json";
import type { PricingMode, ProductOption, Tier } from "@/lib/pricing";
import { hasSupabase, supabaseService } from "@/lib/supabase";

export type Product = {
  id?: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  color: string;
  description: string;
  unit: string;
  pricing: PricingMode;
  tiers: Tier[];
  options: ProductOption[];
  formatMm: number[] | null;
  customizable: boolean;
  visible: boolean;
  featured: boolean;
  sort: number;
};

type Row = {
  id: string; slug: string; name: string; category: string; category_slug: string; color: string;
  description: string; unit: string; pricing: PricingMode; tiers: Tier[]; options: ProductOption[];
  format_mm: number[] | null; customizable: boolean; visible: boolean; featured: boolean; sort: number;
};

const fromRow = (r: Row): Product => ({
  id: r.id, slug: r.slug, name: r.name, category: r.category, categorySlug: r.category_slug, color: r.color,
  description: r.description, unit: r.unit, pricing: r.pricing, tiers: r.tiers ?? [], options: r.options ?? [],
  formatMm: r.format_mm, customizable: r.customizable, visible: r.visible, featured: r.featured, sort: r.sort,
});

export const toRow = (p: Product) => ({
  slug: p.slug, name: p.name, category: p.category, category_slug: p.categorySlug, color: p.color,
  description: p.description, unit: p.unit, pricing: p.pricing, tiers: p.tiers, options: p.options,
  format_mm: p.formatMm, customizable: p.customizable, visible: p.visible, featured: p.featured, sort: p.sort,
});

const localProducts = local as Product[];

export async function getProducts({ includeHidden = false } = {}): Promise<Product[]> {
  if (!hasSupabase) return localProducts.filter((p) => includeHidden || p.visible);
  let q = supabaseService().from("products").select("*").order("sort");
  if (!includeHidden) q = q.eq("visible", true);
  const { data, error } = await q;
  if (error) throw new Error(`Catalogue indisponible : ${error.message}`);
  return (data as Row[]).map(fromRow);
}

export async function getProduct(slug: string, { includeHidden = false } = {}): Promise<Product | null> {
  if (!hasSupabase) return localProducts.find((p) => p.slug === slug && (includeHidden || p.visible)) ?? null;
  let q = supabaseService().from("products").select("*").eq("slug", slug);
  if (!includeHidden) q = q.eq("visible", true);
  const { data } = await q.maybeSingle();
  return data ? fromRow(data as Row) : null;
}

/** Catégories dans l'ordre d'apparition du catalogue. */
export function categories(products: Product[]) {
  const seen = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of products) {
    const c = seen.get(p.categorySlug) ?? { slug: p.categorySlug, name: p.category, count: 0 };
    c.count++;
    seen.set(p.categorySlug, c);
  }
  return [...seen.values()];
}
