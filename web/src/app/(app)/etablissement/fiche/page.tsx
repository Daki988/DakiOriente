import type { Metadata } from "next";
import { Fiche } from "@/components/etablissement/Fiche";

export const metadata: Metadata = { title: "Fiche établissement" };

export default function Page() {
  return <Fiche />;
}
