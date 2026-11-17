import { notFound } from "next/navigation";
import { exigerPro } from "@/lib/auth";
import { getOffre } from "@/lib/queries";
import { premier, type SP } from "@/lib/recherche";
import { OffreForm } from "@/components/OffreForm";
import { Alerte } from "@/components/ui";

export const metadata = { title: "Modifier une offre", robots: { index: false } };

export default async function Modifier({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const tid = await exigerPro();
  const o = getOffre(Number((await params).id));
  if (!o || o.transitaire_id !== tid || o.statut !== "valide") notFound();
  const erreur = premier((await searchParams).erreur);
  return (
    <div className="conteneur max-w-3xl py-8">
      <h1 className="titre-page">Modifier l&apos;offre</h1>
      {erreur && <div className="mt-4"><Alerte type="erreur">{erreur}</Alerte></div>}
      <div className="mt-6"><OffreForm offre={o} /></div>
    </div>
  );
}
