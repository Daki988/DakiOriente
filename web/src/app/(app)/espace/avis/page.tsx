import type { Metadata } from "next";
import { MesAvis } from "@/components/espace/MesAvis";

export const metadata: Metadata = { title: "Mes avis" };
export default function Page() { return <MesAvis />; }
