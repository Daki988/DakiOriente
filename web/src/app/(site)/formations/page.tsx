import type { Metadata } from "next";
import { Suspense } from "react";
import { FormationSearch } from "@/components/sections/FormationSearch";

export const metadata: Metadata = { title: "Formations au Maroc : filières accréditées par l'État", description: "Ingénierie, commerce, santé, design, droit… Recherche les filières accréditées des écoles privées du Maroc selon ton profil, ta ville et ton budget.", alternates: { canonical: "/formations/" } };

export default function FormationsPage() {
  return <Suspense><FormationSearch /></Suspense>;
}
