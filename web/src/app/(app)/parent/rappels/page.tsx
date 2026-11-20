import type { Metadata } from "next";
import { RappelsPaiement } from "@/components/espace/RappelsPaiement";

export const metadata: Metadata = { title: "Rappels de paiement" };
export default function Page() { return <RappelsPaiement />; }
