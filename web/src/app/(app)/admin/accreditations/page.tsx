import type { Metadata } from "next";
import { AdminAccreditations } from "@/components/admin/AdminAccreditations";

export const metadata: Metadata = { title: "Back-office · Accréditations" };

export default function Page() {
  return <AdminAccreditations />;
}
