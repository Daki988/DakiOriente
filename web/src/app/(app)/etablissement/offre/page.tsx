import type { Metadata } from "next";
import { MonOffre } from "@/components/etablissement/MonOffre";

export const metadata: Metadata = { title: "Mon offre" };

export default function Page() {
  return <MonOffre />;
}
