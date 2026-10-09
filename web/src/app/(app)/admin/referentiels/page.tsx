import type { Metadata } from "next";
import { AdminReferentiels } from "@/components/admin/AdminReferentiels";

export const metadata: Metadata = { title: "Back-office · Référentiels" };

export default function Page() {
  return <AdminReferentiels />;
}
