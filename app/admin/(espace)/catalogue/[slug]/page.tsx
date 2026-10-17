import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { ChevronLeft } from "@/components/Icons";
import { CATALOG_ROLES, requireAdmin } from "@/lib/admin";
import { categories, getProduct, getProducts, type Product } from "@/lib/catalog";
import { optionsToText } from "@/lib/options-text";

const EMPTY: Product = {
  slug: "", name: "", category: "", categorySlug: "", color: "yellow", description: "", unit: "ex.", pricing: "pack",
  tiers: [], options: [], formatMm: null, customizable: true, visible: true, featured: false, sort: 100,
};

export default async function EditProduct({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ cree?: string }> }) {
  await requireAdmin(CATALOG_ROLES);
  const [{ slug }, { cree }] = await Promise.all([params, searchParams]);
  const isNew = slug === "nouveau";
  const product = isNew ? EMPTY : await getProduct(slug, { includeHidden: true });
  if (!product) notFound();
  const cats = categories(await getProducts({ includeHidden: true })).map((c) => c.name);

  return (
    <div className="grid max-w-3xl gap-5">
      <Link href="/admin/catalogue" className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ChevronLeft className="size-4" /> Catalogue</Link>
      <h1 className="text-[28px] font-extrabold">{isNew ? "Nouveau produit" : product.name}</h1>
      {cree && <p className="rounded-xl bg-ok-soft p-3 text-sm text-ok">Produit créé.</p>}
      <ProductForm product={product} isNew={isNew} optionsText={optionsToText(product.options)} categories={cats} />
    </div>
  );
}
