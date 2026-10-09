import type { Metadata } from "next";
import { AdminEtablissements } from "@/components/admin/AdminEtablissements";

export const metadata: Metadata = { title: "Back-office · Établissements" };

export default function Page() {
  return <AdminEtablissements />;
}
