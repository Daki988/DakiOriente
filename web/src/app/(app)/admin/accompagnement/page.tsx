import type { Metadata } from "next";
import { AdminAccompagnement } from "@/components/admin/AdminRelais";

export const metadata: Metadata = { title: "Back-office · Mode accompagné" };

export default function Page() {
  return <AdminAccompagnement />;
}
