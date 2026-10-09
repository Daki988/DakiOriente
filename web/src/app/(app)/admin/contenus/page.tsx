import type { Metadata } from "next";
import { AdminContenus } from "@/components/admin/AdminContenus";

export const metadata: Metadata = { title: "Back-office · Contenus" };

export default function Page() {
  return <AdminContenus />;
}
