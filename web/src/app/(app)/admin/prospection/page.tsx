import type { Metadata } from "next";
import { AdminProspection } from "@/components/admin/AdminRelais";

export const metadata: Metadata = { title: "Back-office · Prospection des écoles" };

export default function Page() {
  return <AdminProspection />;
}
