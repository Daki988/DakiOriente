import type { Metadata } from "next";
import { AdminHomologations } from "@/components/admin/AdminHomologations";

export const metadata: Metadata = { title: "Back-office · Homologations" };

export default function Page() {
  return <AdminHomologations />;
}
