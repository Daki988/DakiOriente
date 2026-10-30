import type { Metadata } from "next";
import { Prospection } from "@/components/etablissement/Premium";

export const metadata: Metadata = { title: "Prospection" };

export default function Page() {
  return <Prospection />;
}
