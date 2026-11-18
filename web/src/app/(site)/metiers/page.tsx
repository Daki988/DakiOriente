import type { Metadata } from "next";
import { MetierList } from "@/components/sections/MetierList";
import { metiers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Quel métier choisir ? 96 fiches métiers et études",
  description: `${metiers.length} fiches métiers : missions, compétences, niveau d'études, secteurs qui recrutent et formations pour y accéder au Maroc.`,
  alternates: { canonical: "/metiers/" },
};

export default function MetiersPage() {
  return <MetierList />;
}
