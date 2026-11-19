import type { Metadata } from "next";
import { AdminScolarite } from "@/components/admin/AdminScolarite";

export const metadata: Metadata = { title: "Back-office · Moyens de paiement des écoles" };
export default function Page() { return <AdminScolarite />; }
