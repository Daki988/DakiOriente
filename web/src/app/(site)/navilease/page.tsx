import type { Metadata } from "next";
import { Navilease } from "@/components/sections/Navilease";
import { CtaBand } from "@/components/ui/CtaBand";
import { RangeeResidences } from "@/components/navilease/Residences";

export const metadata: Metadata = { title: "Logement étudiant au Maroc : studio, colocation", description: "Studios, colocations et résidences universitaires au Maroc (Casablanca, Rabat, Marrakech…) : loyers, bailleurs contrôlés, paiement protégé.", alternates: { canonical: "/navilease/" } };

export default function NavileasePage() {
  return (
    <>
      <Navilease residences={<RangeeResidences />} />
      <CtaBand title={<>Prêt·e à <span className="text-sun-400">t&apos;installer</span> ?</>} sub="Navilease est intégré à ton parcours Navigoal : dès ton admission, on te propose les logements proches de ton établissement." />
    </>
  );
}
