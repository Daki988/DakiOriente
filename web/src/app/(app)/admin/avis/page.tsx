import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminAvis } from "@/components/admin/AdminAvis";

export const metadata: Metadata = { title: "Back-office · Avis et témoignages" };

export default function Page() {
  return <Suspense><AdminAvis /></Suspense>;
}
