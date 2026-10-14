import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getCategory, seo, settings, minPrice, formatPrice, primaryPhone } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { ProductCard } from "@/components/ProductCard";
import { Media } from "@/components/Media";
import { MenuDownload } from "@/components/MenuDownload";
import { Button } from "@/components/Button";
import { LdJson, breadcrumbSchema, menuSchema } from "@/components/Schema";
import { IconArrow, IconPhone, IconPin } from "@/components/Icons";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCategory(slug);
  const s = seo.categories[slug];
  if (!c) return {};
  return {
    title: { absolute: s?.title ?? `${c.name} à Libreville | Jackboy 241` },
    description: s?.description ?? c.intro,
    alternates: { canonical: `/menu/${slug}` },
    openGraph: { title: s?.title, description: s?.description, images: c.image ? [{ url: c.image }] : undefined },
  };
}

/** Page catégorie : ciblée sur une recherche locale (« burger Libreville », « chicha Libreville »…). */
export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const c = getCategory(slug);
  if (!c) notFound();
  const s = seo.categories[slug];
  const others = getCategories().filter((x) => x.slug !== slug);
  const prices = c.products.filter((p) => p.available).map(minPrice).filter(Boolean);
  const from = prices.length ? Math.min(...prices) : 0;

  return (
    <>
      <LdJson data={breadcrumbSchema([{ name: "Accueil", path: "/" }, { name: "Menu", path: "/menu" }, { name: c.name, path: `/menu/${slug}` }])} />
      <LdJson data={menuSchema(slug)} />
      <PageHero kicker={`Menu Jackboy · ${c.name}`} title={s?.h1 ?? `${c.name} à Libreville`}>
        {s?.intro ?? c.intro}
      </PageHero>
      <nav aria-label="Fil d'Ariane" className="mx-auto max-w-6xl px-4 pt-4 text-xs text-muted">
        <ol className="flex flex-wrap gap-1">
          <li><Link href="/" className="hover:text-accent">Accueil</Link> /</li>
          <li><Link href="/menu" className="hover:text-accent">Menu</Link> /</li>
          <li aria-current="page" className="text-text">{c.name}</li>
        </ol>
      </nav>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 md:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap gap-3 text-sm">
            {from > 0 && <span className="rounded-full bg-secondary/60 px-4 py-2 font-semibold text-accent">À partir de {formatPrice(from)}</span>}
            <span className="rounded-full border border-white/10 px-4 py-2">{c.products.length} référence{c.products.length > 1 ? "s" : ""}</span>
            <span className="rounded-full border border-white/10 px-4 py-2">Quartier Louis · Libreville</span>
          </div>
          {c.note && <p className="mt-4 rounded-xl border border-accent/30 bg-secondary/30 px-3 py-2 text-xs text-accent">N.B. : {c.note}</p>}
          <h2 className="mt-8 font-display text-2xl">Carte & prix — {c.name}</h2>
          <ul className="mt-2">{c.products.map((p) => <ProductCard key={p.name} p={p} />)}</ul>
        </div>
        <aside className="space-y-4 md:sticky md:top-24 md:self-start">
          {c.image && <Media src={c.image} alt={`${c.name} chez Jackboy à Libreville`} className="aspect-[4/3] rounded-3xl border border-white/10" sizes="320px" />}
          <div className="rounded-3xl border border-white/10 bg-surface p-5 text-sm">
            <p className="font-display text-2xl">Envie de {c.name.toLowerCase()} ?</p>
            <p className="mt-2 text-muted">
              Sur place, à emporter{settings.ordering.enabled ? " ou en livraison : ajoutez au panier et commandez par WhatsApp." : "."} Ouvert tous les jours dès 15 h.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button href={`tel:${primaryPhone.number}`}><IconPhone className="h-4 w-4" /> Appeler</Button>
              <Button href="/acces" variant="ghost"><IconPin className="h-4 w-4" /> Itinéraire</Button>
            </div>
          </div>
        </aside>
      </div>
      <section className="mx-auto max-w-6xl px-4 pb-6" aria-labelledby="autres">
        <h2 id="autres" className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted">Le reste de la carte</h2>
        <ul className="flex flex-wrap gap-2">
          {others.map((o) => (
            <li key={o.slug}>
              <Link href={`/menu/${o.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-sm hover:border-accent hover:text-accent">
                {seo.categories[o.slug]?.h1 ?? o.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/menu" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent hover:underline">
          Tout le menu <IconArrow className="h-4 w-4" />
        </Link>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-10"><MenuDownload compact /></div>
    </>
  );
}
