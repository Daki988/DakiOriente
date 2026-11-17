import { exigerPro } from "@/lib/auth";
import { premier, type SP } from "@/lib/recherche";
import { OffreForm } from "@/components/OffreForm";
import { Alerte } from "@/components/ui";

export const metadata = { title: "Nouvelle offre", robots: { index: false } };

export default async function Nouvelle({ searchParams }: { searchParams: Promise<SP> }) {
  await exigerPro();
  const erreur = premier((await searchParams).erreur);
  return (
    <div className="conteneur max-w-3xl py-8">
      <h1 className="titre-page">Nouvelle offre</h1>
      {erreur && <div className="mt-4"><Alerte type="erreur">{erreur}</Alerte></div>}
      <div className="mt-6"><OffreForm /></div>
    </div>
  );
}
