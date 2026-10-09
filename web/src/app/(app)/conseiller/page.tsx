import type { Metadata } from "next";
import { Conseiller } from "@/components/admin/Conseiller";

export const metadata: Metadata = { title: "Espace conseiller" };

export default function Page() {
  return <Conseiller />;
}
