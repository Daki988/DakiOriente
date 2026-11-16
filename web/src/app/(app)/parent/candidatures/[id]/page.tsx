import type { Metadata } from "next";
import { Suspense } from "react";
import { CandidatureDetail } from "@/components/espace/CandidatureDetail";

export const metadata: Metadata = { title: "Candidature" };
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <Suspense><CandidatureDetail id={params.id} asParent /></Suspense>;
}
