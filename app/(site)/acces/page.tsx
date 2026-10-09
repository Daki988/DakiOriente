import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { VisitBlock } from "@/components/VisitBlock";

export const metadata: Metadata = {
  title: "Accès & horaires",
  description: "Adresse, horaires, itinéraire et téléphone de Jackboy Bar-Restaurant 241, quartier Louis à Libreville.",
  alternates: { canonical: "/acces" },
};

export default function AccesPage() {
  return (
    <>
      <PageHero kicker="Nous trouver" title="Accès & horaires">
        Louis, Libreville — à environ 100 mètres de l&apos;ambassade de Côte d&apos;Ivoire.
      </PageHero>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <VisitBlock showHoursTable />
      </div>
    </>
  );
}
