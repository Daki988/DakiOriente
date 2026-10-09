import type { Metadata } from "next";
import { Formations } from "@/components/etablissement/Formations";

export const metadata: Metadata = { title: "Formations" };

export default function Page() {
  return <Formations />;
}
