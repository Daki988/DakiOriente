import type { Metadata } from "next";
import { AdminReglagesPaiement } from "@/components/admin/AdminReglagesPaiement";

export const metadata: Metadata = { title: "Back-office · Réglages des paiements" };

export default function Page() {
  return <AdminReglagesPaiement />;
}
