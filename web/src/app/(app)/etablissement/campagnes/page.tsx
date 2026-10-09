import type { Metadata } from "next";
import { Campagnes } from "@/components/etablissement/Campagnes";

export const metadata: Metadata = { title: "Campagnes" };

export default function Page() {
  return <Campagnes />;
}
