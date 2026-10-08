import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { EtabList } from "@/components/sections/EtabList";

export const metadata: Metadata = { title: "Établissements", description: "Universités, grandes écoles et instituts au Gabon, au Maroc et au Sénégal." };

export default function EtablissementsPage() {
  return (
    <>
      <PageHero crumb="Établissements" title="Universités, écoles" accent="et instituts" sub="120 établissements du supérieur au Gabon, au Maroc et au Sénégal : publics, privés et inter-États." hand="Compare avant de choisir !" />
      <Suspense><EtabList /></Suspense>
    </>
  );
}
