import type { Metadata } from "next";
import { AdminPaiements } from "@/components/admin/AdminPaiements";

export const metadata: Metadata = { title: "Back-office · Paiements" };

export default function Page() {
  return <AdminPaiements />;
}
