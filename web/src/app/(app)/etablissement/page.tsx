import type { Metadata } from "next";
import { Dashboard } from "@/components/etablissement/Dashboard";

export const metadata: Metadata = { title: "Tableau de bord établissement" };

export default function Page() {
  return <Dashboard />;
}
