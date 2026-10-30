import type { Metadata } from "next";
import { AdminCandidatures } from "@/components/admin/AdminRelais";

export const metadata: Metadata = { title: "Back-office · Candidatures" };

export default function Page() {
  return <AdminCandidatures />;
}
