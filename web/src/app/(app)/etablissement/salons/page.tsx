import type { Metadata } from "next";
import { SalonsEcole } from "@/components/etablissement/Salons";

export const metadata: Metadata = { title: "Salons virtuels" };
export default function Page() { return <SalonsEcole />; }
