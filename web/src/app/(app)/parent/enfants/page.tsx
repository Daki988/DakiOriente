import type { Metadata } from "next";
import { ParentChildren } from "@/components/parent/Parent";

export const metadata: Metadata = { title: "Mes enfants" };
export default function Page() { return <ParentChildren />; }
