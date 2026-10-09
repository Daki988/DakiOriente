import type { Metadata } from "next";
import { ParentHome } from "@/components/parent/Parent";

export const metadata: Metadata = { title: "Espace parent" };
export default function Page() { return <ParentHome />; }
