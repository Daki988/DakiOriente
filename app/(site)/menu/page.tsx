import type { Metadata } from "next";
import { getCategories, getSignatureProducts, primaryPhone, settings, getComposerPools } from "@/lib/content";
import { MenuDownload } from "@/components/MenuDownload";
import { DrinksShowcase } from "@/components/DrinksShowcase";
import { TakeawayBanner } from "@/components/TakeawayBanner";
import { SoireeComposer } from "@/components/SoireeComposer";
import { LdJson, menuSchema, breadcrumbSchema } from "@/components/Schema";
import { PageHero } from "@/components/PageHero";
import { MenuBrowser } from "@/components/MenuBrowser";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/Button";
import { IconPhone } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Menu & prix — burgers, cocktails, bières, whisky, chicha",
  description: "Menu complet et prix en FCFA de Jackboy à Libreville : burgers dès 2 000 FCFA, paninis 1 500 FCFA, wings, brochettes, nems, cocktails, bières, whisky, vins, chicha. Menu PDF à télécharger, commande WhatsApp.",
  alternates: { canonical: "/menu" },
};

export default function MenuPage() {
  const categories = getCategories();
  const signatures = getSignatureProducts(6);
  return (
    <>
      <LdJson data={menuSchema()} />
      <LdJson data={breadcrumbSchema([{ name: "Accueil", path: "/" }, { name: "Menu", path: "/menu" }])} />
      <PageHero kicker="La carte · Prix en FCFA" title="Le menu Jackboy">
        Fast food gourmet & bar : burgers, paninis, wings, cocktails, spiritueux, chicha.
        {settings.ordering.enabled && " Ajoutez vos produits au panier puis envoyez votre commande par WhatsApp — sur place, à emporter ou en livraison."}
      </PageHero>
      <div className="mx-auto max-w-6xl px-4">
        <div className="pt-6"><MenuDownload compact /></div>
        {signatures.length > 0 && (
          <section aria-labelledby="sig" className="pt-10">
            <h2 id="sig" className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-gold">Signatures Jackboy</h2>
            <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:px-0">
              {signatures.map((p) => (
                <div key={p.name} className="w-[78%] shrink-0 snap-start md:w-auto"><ProductCard p={p} large category={p.category} /></div>
              ))}
            </div>
          </section>
        )}
        <div className="mt-8 max-w-3xl">
          <MenuBrowser categories={categories} />
        </div>
        <div className="mt-20"><DrinksShowcase /></div>
        {settings.ordering.enabled && <div className="mt-16"><TakeawayBanner /></div>}
        {settings.ordering.enabled && <div className="mt-6"><SoireeComposer pools={getComposerPools()} /></div>}
        <div className="mt-8"><MenuDownload /></div>
        <aside className="my-14 flex flex-col items-start gap-4 rounded-3xl border border-white/5 bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl">Une question sur la carte ?</p>
            <p className="text-sm text-muted">Allergies, disponibilités, groupes : appelez-nous.</p>
          </div>
          <Button href={`tel:${primaryPhone.number}`}><IconPhone className="h-4 w-4" /> Appeler Jackboy</Button>
        </aside>
      </div>
    </>
  );
}
