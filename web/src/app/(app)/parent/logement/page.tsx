import type { Metadata } from "next";
import { Logement } from "@/components/espace/Logement";

export const metadata: Metadata = { title: "Logement" };
export default function Page() { return <Logement title="Logement et garantie" />; }
