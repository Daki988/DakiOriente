import type { Metadata } from "next";
import { Dossier } from "@/components/etablissement/Dossier";

export const metadata: Metadata = { title: "Dossier candidat" };

export default function Page({ params }: { params: { id: string } }) {
  return <Dossier id={params.id} />;
}
