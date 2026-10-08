import type { Metadata } from "next";
import { Suspense } from "react";
import { FormationDetail } from "@/components/sections/FormationDetail";
import { formationById, formations } from "@/lib/data";

export const generateStaticParams = () => formations.map((f) => ({ id: f.id }));
export const generateMetadata = ({ params }: { params: { id: string } }): Metadata => ({ title: formationById[params.id]?.intitule });

export default function FormationPage({ params }: { params: { id: string } }) {
  return <Suspense><FormationDetail id={params.id} /></Suspense>;
}
