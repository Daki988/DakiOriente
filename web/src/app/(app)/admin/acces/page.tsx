import type { Metadata } from "next";
import { AdminAcces } from "@/components/admin/AdminAcces";

export const metadata: Metadata = { title: "Back-office · Accès écoles" };

export default function Page() {
  return <AdminAcces />;
}
