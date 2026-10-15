import type { Metadata } from "next";
import { Suspense } from "react";
import { FormationDetail } from "@/components/sections/FormationDetail";
import { formationById, formations } from "@/lib/data";

export const generateStaticParams = () => formations.map((f) => ({ id: f.id }));
export const generateMetadata = ({ params }: { params: { id: string } }): Metadata => {
  const f = formationById[params.id];
  if (!f) return {};
  const n = f.etablissements.length;
  return {
    title: `${f.intitule} au Maroc : écoles, diplôme, admission et débouchés`,
    description: `${f.intitule} (${f.diplome}, ${f.duree_annees} an${f.duree_annees > 1 ? "s" : ""}) : ${n} établissement${n > 1 ? "s" : ""} au Maroc aux filières accréditées, conditions d'admission, frais et métiers visés. Candidature en ligne depuis toute l'Afrique.`,
    alternates: { canonical: `/formations/${f.id}/` },
  };
};

export default function FormationPage({ params }: { params: { id: string } }) {
  return <Suspense><FormationDetail id={params.id} /></Suspense>;
}
