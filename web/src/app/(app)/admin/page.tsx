import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = { title: "Back-office · Tableau de bord" };

export default function Page() {
  return <AdminDashboard />;
}
