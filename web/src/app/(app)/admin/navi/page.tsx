import type { Metadata } from "next";
import { AdminNavi } from "@/components/admin/AdminNavi";

export const metadata: Metadata = { title: "Back-office · Navi" };

export default function Page() {
  return <AdminNavi />;
}
