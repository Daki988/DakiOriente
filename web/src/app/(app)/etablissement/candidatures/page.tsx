import type { Metadata } from "next";
import { Candidatures } from "@/components/etablissement/Candidatures";

export const metadata: Metadata = { title: "Candidatures reçues" };

export default function Page() {
  return <Candidatures />;
}
