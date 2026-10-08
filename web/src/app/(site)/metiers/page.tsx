import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { MetierList } from "@/components/sections/MetierList";

export const metadata: Metadata = { title: "Métiers", description: "96 fiches métiers : missions, compétences, formations et débouchés en Afrique." };

export default function MetiersPage() {
  return (
    <>
      <PageHero crumb="Métiers" title="Découvre les métiers" accent="qui te ressemblent" sub="Missions, compétences, profil d'intérêts, formations et employeurs : tout pour choisir en connaissance de cause." hand="Et toi, tu veux devenir quoi ?" />
      <Suspense><MetierList /></Suspense>
    </>
  );
}
