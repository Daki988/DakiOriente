import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Sparkle } from "@/components/Icons";
import { OrderFlow } from "@/components/OrderFlow";
import { ProductVisual } from "@/components/ProductCard";
import { getProduct } from "@/lib/catalog";
import { fcfa } from "@/lib/format";
import { fromPrice } from "@/lib/pricing";
import { settings } from "@/lib/site";
import { hasSupabase } from "@/lib/supabase";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string; creer?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const from = fromPrice(p);
  return { title: `${p.name} à Libreville`, description: `${p.description} Dès ${fcfa(from.price)}. Commande en ligne, retrait ou livraison.` };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ slug }, { q, creer }] = await Promise.all([params, searchParams]);
  const p = await getProduct(slug);
  if (!p) notFound();
  const from = fromPrice(p);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[1fr_1.15fr] md:gap-10 md:px-6 md:py-10">
      <div className="grid content-start gap-4 md:sticky md:top-24">
        <Link href={`/produits#${p.categorySlug}`} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
          <ChevronLeft className="size-4" /> {p.category}
        </Link>
        <ProductVisual product={p} className="rounded-2xl" />
        <div className="grid gap-2">
          <h1 className="text-[34px] font-bold leading-[1.05] md:text-5xl">{p.name}</h1>
          <p className="tabular font-semibold text-brand">Dès {fcfa(from.price)}{p.unit === "m²" ? " le m²" : ` les ${from.qty.toLocaleString("fr-FR")} ${p.unit}`}</p>
          <p className="text-muted">{p.description}</p>
          {p.formatMm && p.pricing !== "area" && (
            <p className="text-sm text-muted">Format : <b className="text-ink">{p.formatMm[0]} × {p.formatMm[1]} mm</b> · prévoyez 3 mm de fond perdu</p>
          )}
          {p.customizable && (
            <Link href={`/produits/${p.slug}?creer=1#commande`} scroll={false} className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-5 py-3 font-semibold text-white hover:bg-brand">
              <Sparkle className="size-5" /> Créer mon design en ligne
            </Link>
          )}
        </div>
      </div>
      <div id="commande" className="scroll-mt-24">
      <OrderFlow
        key={`${q ?? ""}-${creer ?? ""}`}
        startDesign={creer === "1"}
        product={p}
        initialQty={q ? Number(q) : undefined}
        online={hasSupabase}
        settings={{
          whatsapp: settings.whatsapp, designFee: settings.designFee, deliveryFee: settings.delivery.libreville_fee,
          pickupLabel: settings.delivery.pickup, deliveryLabel: settings.delivery.libreville,
        }}
      />
      </div>
    </div>
  );
}
