import { Hero } from "@/components/sections/Hero";
import { Categories, Communaute, Encarts, Etablissements, FormationsPopulaires, Parcours, StatsBand } from "@/components/sections/HomeSections";

export default function Home() {
  return (
    <>
      <Hero />
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
