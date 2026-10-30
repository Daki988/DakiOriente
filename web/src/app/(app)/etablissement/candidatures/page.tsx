import type { Metadata } from "next";
import { Candidatures } from "@/components/etablissement/Candidatures";
import { VueCandidatures } from "@/components/etablissement/Premium";

export const metadata: Metadata = { title: "Candidatures reçues" };

export default function Page() {
  return <VueCandidatures liste={<Candidatures />} />;
}
