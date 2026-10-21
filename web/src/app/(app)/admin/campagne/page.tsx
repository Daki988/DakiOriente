import type { Metadata } from "next";
import { AdminCampagne } from "@/components/admin/AdminCampagne";

export const metadata: Metadata = { title: "Back-office · Campagne" };

export default function Page() {
  return <AdminCampagne />;
}
