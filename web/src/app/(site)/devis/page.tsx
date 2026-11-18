import type { Metadata } from "next";
import { DevisSimulateur } from "@/components/sections/DevisSimulateur";
import { QuestionWhatsApp } from "@/components/ui/QuestionWhatsApp";

export const metadata: Metadata = { title: "Combien coûtent les études au Maroc ? Le devis", description: "Coût total des études au Maroc ou au Sénégal, dans la monnaie du pays et dans la vôtre : scolarité, vie quotidienne, installation, visa et séjour, année par année.", alternates: { canonical: "/devis/" } };

export default function DevisPage() {
  return (
    <>
      <DevisSimulateur />
      <QuestionWhatsApp sujet="le coût des études" />
    </>
  );
}
