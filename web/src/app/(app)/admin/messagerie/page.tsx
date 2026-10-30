import type { Metadata } from "next";
import { AdminMessagerie } from "@/components/admin/AdminRelais";

export const metadata: Metadata = { title: "Back-office · Messagerie" };

export default function Page() {
  return <AdminMessagerie />;
}
