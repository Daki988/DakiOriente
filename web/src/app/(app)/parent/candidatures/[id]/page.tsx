import type { Metadata } from "next";
import { Suspense } from "react";
import { CandidatureDetail } from "@/components/espace/CandidatureDetail";

export const metadata: Metadata = { title: "Candidature" };
export default function Page({ params }: { params: { id: string } }) { return <Suspense><CandidatureDetail id={params.id} asParent /></Suspense>; }
