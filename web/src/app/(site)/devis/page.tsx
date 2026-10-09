import type { Metadata } from "next";
import { Suspense } from "react";
import { DevisSimulateur } from "@/components/sections/DevisSimulateur";

export const metadata: Metadata = { title: "Devis études — parents", description: "Le coût total des études à l'étranger : scolarité, vie quotidienne, installation, visa et carte de séjour, sur toute la durée de la formation." };

export default function DevisPage() {
  return <Suspense><DevisSimulateur /></Suspense>;
}
