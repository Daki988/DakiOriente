import type { Metadata } from "next";
import { Candidatures } from "@/components/espace/Candidatures";

export const metadata: Metadata = { title: "Mes candidatures" };
export default function Page() { return <Candidatures />; }
