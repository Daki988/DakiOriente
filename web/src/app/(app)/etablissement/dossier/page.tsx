import type { Metadata } from "next";
import { ReglagesDossier } from "@/components/etablissement/ReglagesDossier";

export const metadata: Metadata = { title: "Dossier de candidature" };

export default function Page() {
  return <ReglagesDossier />;
}
