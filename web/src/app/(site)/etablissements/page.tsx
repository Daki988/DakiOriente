import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { EtabList } from "@/components/sections/EtabList";
import { etablissements, stats } from "@/lib/data";

export const metadata: Metadata = { title: "Écoles et universités privées au Maroc", description: "Compare les écoles et universités privées du Maroc : reconnaissance par l'État, filières accréditées, frais, campus et logement. Candidature en ligne.", alternates: { canonical: "/etablissements/" } };

export default function EtablissementsPage() {
  return (
    <>
      <PageHero crumb="Établissements" title="Écoles et universités" accent="du Maroc" sub={`${etablissements.length} établissements privés au Maroc, dont ${stats.homologues} aux diplômes homologués par l'État, qui accueillent les étudiants de toute l'Afrique.`} hand="Compare avant de choisir !" />
      <Suspense><EtabList /></Suspense>
    </>
  );
}
