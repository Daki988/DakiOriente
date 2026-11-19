import type { Metadata } from "next";
import { ScolariteEcole } from "@/components/etablissement/Scolarite";

export const metadata: Metadata = { title: "Scolarité et paiements" };
export default function Page() { return <ScolariteEcole />; }
