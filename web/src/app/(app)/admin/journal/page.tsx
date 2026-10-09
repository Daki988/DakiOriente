import type { Metadata } from "next";
import { AdminJournal } from "@/components/admin/AdminJournal";

export const metadata: Metadata = { title: "Back-office · Journal" };

export default function Page() {
  return <AdminJournal />;
}
