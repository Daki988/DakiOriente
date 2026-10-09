import type { Metadata } from "next";
import { AdminUsers } from "@/components/admin/AdminUsers";

export const metadata: Metadata = { title: "Back-office · Utilisateurs" };

export default function Page() {
  return <AdminUsers />;
}
