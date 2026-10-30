import type { Metadata } from "next";
import { Suspense } from "react";
import { Comparateur } from "@/components/sections/Comparateur";

export const metadata: Metadata = { title: "Comparateur d'écoles au Maroc", description: "Compare les écoles du Maroc qui proposent la même formation ou mènent au même métier : coût total, admission, visa et logement.", alternates: { canonical: "/comparateur/" } };

export default function ComparateurPage() {
  return <Suspense><Comparateur /></Suspense>;
}
