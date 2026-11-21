import type { Metadata } from "next";
import { AdminSalons } from "@/components/admin/AdminSalons";

export const metadata: Metadata = { title: "Salons virtuels" };
export default function Page() { return <AdminSalons />; }
