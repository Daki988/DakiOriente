import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { EtabList } from "@/components/sections/EtabList";
import { etablissements } from "@/lib/data";

export const metadata: Metadata = { title: "Établissements", description: "Universités et écoles privées du Maroc aux diplômes homologués par l'État : labels, filières accréditées, villes." };

export default function EtablissementsPage() {
  return (
    <>
      <PageHero crumb="Établissements" title="Écoles et universités" accent="du Maroc" sub={`${etablissements.length} établissements privés au Maroc, reconnus par l'État ou aux diplômes homologués, qui accueillent les étudiants de toute l'Afrique.`} hand="Compare avant de choisir !" />
      <Suspense><EtabList /></Suspense>
    </>
  );
}
