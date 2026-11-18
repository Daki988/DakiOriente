import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { CHIFFRES } from "@/lib/catalogue";
import { PAYS_ACTIFS_TEXTE, stats } from "@/lib/data";
import { ChoixDestination } from "@/components/sections/ChoixDestination";
import { Categories, Communaute, Encarts, Etablissements, FormationsPopulaires, Parcours, StatsBand } from "@/components/sections/HomeSections";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <Hero chiffres={{ paysTexte: PAYS_ACTIFS_TEXTE, villes: CHIFFRES.villes, campus: CHIFFRES.campus, pays: stats.pays }} />
      <ChoixDestination />
      <Categories />
      <StatsBand />
      <Parcours />
      <Encarts />
      <FormationsPopulaires />
      <Communaute />
      <Etablissements />
    </>
  );
}
