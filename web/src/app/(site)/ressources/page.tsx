import type { Metadata } from "next";
import { Suspense } from "react";
import { Ressources } from "@/components/sections/Ressources";
import { CtaBand } from "@/components/ui/CtaBand";
import { PHOTOS } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Ressources : guides, modèles et outils",
  description: "Guides pour étudier au Maroc (visa, séjour, logement, budget), modèles de CV et de lettre, checklist de candidature, calcul de moyenne et convertisseur.",
  alternates: { canonical: "/ressources/" },
};

export default function RessourcesPage() {
  return (
    <>
      <Suspense><Ressources /></Suspense>
      <CtaBand title={<>Accède à tout <span className="text-sun-400">gratuitement</span></>} sub="Crée ton compte pour enregistrer tes favoris, suivre tes candidatures et échanger avec un conseiller." />
      <section className="container mt-10">
        <details className="text-xs text-ink-mute">
          <summary className="cursor-pointer font-bold">Crédits photos</summary>
          <ul className="mt-2 flex flex-col gap-1">{Object.values(PHOTOS).map((p) => <li key={p.id}>{p.alt} : {p.credit}, <a href={p.page} target="_blank" rel="noopener noreferrer" className="underline">{p.licence}</a></li>)}</ul>
        </details>
      </section>
    </>
  );
}
