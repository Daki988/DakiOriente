import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { categories, getProducts } from "@/lib/catalog";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Produits et prix",
  description: "Tous nos produits d’impression avec leurs prix en FCFA : cartes de visite, flyers, roll-up, bâches, stickers, textile.",
};

export default async function Produits() {
  const products = await getProducts();
  const cats = categories(products);
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-6 md:py-12">
      <header className="grid gap-2">
        <p className="text-sm text-muted">Catalogue</p>
        <h1 className="text-[40px] font-bold leading-[1.02] md:text-6xl">Tout ce qu’on <em className="accent">imprime</em>.</h1>
        <p className="max-w-xl text-muted">Prix TTC en FCFA. Le total exact (options, quantité, livraison) s’affiche sur chaque produit avant de commander.</p>
      </header>
      <nav aria-label="Catégories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {cats.map((c) => (
          <a key={c.slug} href={`#${c.slug}`} className="whitespace-nowrap rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold hover:border-brand hover:text-brand">
            {c.name} <span className="text-muted">· {c.count}</span>
          </a>
        ))}
      </nav>
      {cats.map((c) => (
        <section key={c.slug} id={c.slug} className="grid scroll-mt-24 gap-4">
          <h2 className="text-2xl font-bold md:text-3xl">{c.name}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {products.filter((p) => p.categorySlug === c.slug).map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
