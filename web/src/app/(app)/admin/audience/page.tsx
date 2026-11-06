import type { Metadata } from "next";
import { AdminAudience } from "@/components/admin/AdminAudience";

export const metadata: Metadata = { title: "Back-office · Audience" };

export default function Page() {
  return <AdminAudience />;
}
