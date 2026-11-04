import { Hero } from "@/components/sections/Hero";
import { ChoixDestination } from "@/components/sections/ChoixDestination";
import { Categories, Communaute, Encarts, Etablissements, FormationsPopulaires, Parcours, StatsBand } from "@/components/sections/HomeSections";

export default function Home() {
  return (
    <>
      <Hero />
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
