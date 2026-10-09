import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { EtabList } from "@/components/sections/EtabList";

export const metadata: Metadata = { title: "Établissements", description: "Universités, grandes écoles et instituts au Gabon, au Maroc et au Sénégal." };

export default function EtablissementsPage() {
  return (
    <>
      <PageHero crumb="Établissements" title="Écoles et universités" accent="privées" sub="79 établissements privés et inter-États qui accueillent les étudiants internationaux au Gabon, au Maroc et au Sénégal." hand="Compare avant de choisir !" />
      <Suspense><EtabList /></Suspense>
    </>
  );
}
