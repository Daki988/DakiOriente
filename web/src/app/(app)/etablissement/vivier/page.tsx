import type { Metadata } from "next";
import { VivierCandidats } from "@/components/etablissement/Premium";

export const metadata: Metadata = { title: "Vivier de candidats" };

export default function Page() {
  return <VivierCandidats />;
}
