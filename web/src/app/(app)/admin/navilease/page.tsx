import type { Metadata } from "next";
import { AdminNavilease } from "@/components/admin/AdminNavilease";

export const metadata: Metadata = { title: "Back-office · Navilease" };

export default function Page() {
  return <AdminNavilease />;
}
