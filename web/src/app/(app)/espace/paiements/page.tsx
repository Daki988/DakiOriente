import type { Metadata } from "next";
import { Payments } from "@/components/espace/Payments";

export const metadata: Metadata = { title: "Paiements" };
export default function Page() { return <Payments />; }
