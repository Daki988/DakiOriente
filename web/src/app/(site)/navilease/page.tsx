import type { Metadata } from "next";
import { Navilease } from "@/components/sections/Navilease";
import { CtaBand } from "@/components/ui/CtaBand";

export const metadata: Metadata = { title: "Navilease — logement étudiant", description: "Logements étudiants vérifiés, paiement protégé, contrat numérique. Gabon, Maroc, Sénégal." };

export default function NavileasePage() {
  return (
    <>
      <Navilease />
      <CtaBand title={<>Prêt·e à <span className="text-sun-400">t&apos;installer</span> ?</>} sub="Navilease est intégré à ton parcours Navigoal : dès ton admission, on te propose les logements proches de ton établissement." />
    </>
  );
}
