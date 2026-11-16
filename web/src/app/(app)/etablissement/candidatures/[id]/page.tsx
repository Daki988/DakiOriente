import type { Metadata } from "next";
import { Dossier } from "@/components/etablissement/Dossier";

export const metadata: Metadata = { title: "Dossier candidat" };

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <Dossier id={params.id} />;
}
