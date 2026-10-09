import type { Metadata } from "next";
import { Suspense } from "react";
import { FormationSearch } from "@/components/sections/FormationSearch";

export const metadata: Metadata = { title: "Formations", description: "Recherche les filières homologuées des établissements privés du Maroc, triées selon ton profil." };

export default function FormationsPage() {
  return <Suspense><FormationSearch /></Suspense>;
}
