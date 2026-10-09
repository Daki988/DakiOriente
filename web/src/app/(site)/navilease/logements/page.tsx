import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/app/kit";
import { NavileaseSearch } from "@/components/navilease/Search";

export const metadata: Metadata = { title: "Logements étudiants Navilease", description: "Studios, colocations et résidences vérifiés près de ton établissement au Gabon, au Maroc et au Sénégal. Paiement protégé en séquestre." };

export default function LogementsPage() {
  return <Suspense fallback={<div className="mx-auto max-w-[1280px] px-6"><Loading /></div>}><NavileaseSearch /></Suspense>;
}
