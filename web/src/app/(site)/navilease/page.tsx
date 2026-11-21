import type { Metadata } from "next";
import { Navilease } from "@/components/sections/Navilease";
import { RangeeResidences } from "@/components/navilease/Residences";

export const metadata: Metadata = { title: "Logement étudiant au Maroc : studio, colocation", description: "Studios, colocations et résidences universitaires au Maroc (Casablanca, Rabat, Marrakech…) : loyers, bailleurs contrôlés, paiement protégé.", alternates: { canonical: "/navilease/" } };

export default function NavileasePage() {
  return <Navilease residences={<RangeeResidences />} />;
}
