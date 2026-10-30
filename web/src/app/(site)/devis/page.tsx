import type { Metadata } from "next";
import { Suspense } from "react";
import { DevisSimulateur } from "@/components/sections/DevisSimulateur";
import { QuestionWhatsApp } from "@/components/ui/QuestionWhatsApp";

export const metadata: Metadata = { title: "Devis : le coût des études au Maroc", description: "Coût total des études au Maroc, en dirhams et dans votre monnaie : scolarité, vie quotidienne, installation, visa et séjour, année par année.", alternates: { canonical: "/devis/" } };

export default function DevisPage() {
  return (
    <>
      <Suspense><DevisSimulateur /></Suspense>
      <QuestionWhatsApp sujet="le coût des études au Maroc" />
    </>
  );
}
