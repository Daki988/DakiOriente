import type { Metadata } from "next";
import { GuidePlateforme } from "@/components/etablissement/Guide";

export const metadata: Metadata = { title: "Guide de la plateforme" };

export default function Page() {
  return <GuidePlateforme />;
}
