import type { Metadata } from "next";
import { AdminAccesPays } from "@/components/admin/AdminAccesPays";

export const metadata: Metadata = { title: "Back-office · Accès par pays" };

export default function Page() {
  return <AdminAccesPays />;
}
