import type { Metadata } from "next";
import { Suspense } from "react";
import { MetierList } from "@/components/sections/MetierList";
import { metiers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Métiers : missions, compétences et formations au Maroc",
  description: `${metiers.length} fiches métiers : missions, compétences, niveau d'études, secteurs qui recrutent et formations pour y accéder dans les écoles privées du Maroc.`,
  alternates: { canonical: "/metiers/" },
};

export default function MetiersPage() {
  return <Suspense><MetierList /></Suspense>;
}
