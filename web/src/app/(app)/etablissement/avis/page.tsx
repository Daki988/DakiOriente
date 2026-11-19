import type { Metadata } from "next";
import { AvisEcoleEspace } from "@/components/etablissement/Avis";

export const metadata: Metadata = { title: "Avis d'étudiants" };
export default function Page() { return <AvisEcoleEspace />; }
