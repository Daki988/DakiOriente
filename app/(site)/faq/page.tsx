import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Faq } from "@/components/Faq";
import { LdJson, faqSchema, breadcrumbSchema } from "@/components/Schema";
import { VisitBlock } from "@/components/VisitBlock";

export const metadata: Metadata = {
  title: "Questions fréquentes — horaires, livraison, prix, chicha",
  description: "Où se trouve Jackboy à Libreville ? Horaires, livraison, prix des burgers, de la chicha, des bières et du whisky, musique, contact : toutes les réponses.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <LdJson data={faqSchema()} />
      <LdJson data={breadcrumbSchema([{ name: "Accueil", path: "/" }, { name: "FAQ", path: "/faq" }])} />
      <PageHero kicker="Bon à savoir" title="Questions fréquentes">
        Tout ce qu&apos;il faut savoir avant de passer chez Jackboy, à Louis (Libreville).
      </PageHero>
      <div className="mx-auto max-w-3xl px-4 py-12"><h2 className="sr-only">Réponses</h2><Faq /></div>
      <div className="mx-auto max-w-6xl px-4 pb-16"><VisitBlock /></div>
    </>
  );
}
