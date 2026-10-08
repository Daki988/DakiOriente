import type { Metadata } from "next";
import { Suspense } from "react";
import { FormationSearch } from "@/components/sections/FormationSearch";

export const metadata: Metadata = { title: "Formations", description: "Recherche les formations au Gabon, au Maroc et au Sénégal, triées selon ton profil." };

export default function FormationsPage() {
  return <Suspense><FormationSearch /></Suspense>;
}
