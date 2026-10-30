import type { Metadata } from "next";
import { AdminOffres } from "@/components/admin/AdminOffres";

export const metadata: Metadata = { title: "Back-office · Offres et abonnements" };

export default function Page() {
  return <AdminOffres />;
}
