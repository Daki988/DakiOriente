import type { Metadata } from "next";
import { Calculateur } from "@/components/Calculateur";

export const metadata: Metadata = { title: "Calculateur de volume (CBM) et poids volumétrique" };

export default function Page() {
  return (
    <div className="conteneur py-8">
      <h1 className="titre-page">Calculateur de volume et de poids volumétrique</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Saisissez les dimensions de vos cartons : on calcule le volume (m³) pour le bateau et le poids volumétrique pour l&apos;avion.
      </p>
      <div className="mt-6"><Calculateur /></div>
    </div>
  );
}
