import type { Metadata } from "next";
import { AdminReactivite } from "@/components/admin/AdminReactivite";

export const metadata: Metadata = { title: "Back-office · Réactivité des écoles" };

export default function Page() {
  return <AdminReactivite />;
}
