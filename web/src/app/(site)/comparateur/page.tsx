import type { Metadata } from "next";
import { Suspense } from "react";
import { Comparateur } from "@/components/sections/Comparateur";

export const metadata: Metadata = { title: "Comparateur", description: "Compare les écoles qui proposent la même formation ou mènent au même métier : coût total, admission, visa, logement." };

export default function ComparateurPage() {
  return <Suspense><Comparateur /></Suspense>;
}
