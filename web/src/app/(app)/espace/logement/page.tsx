import type { Metadata } from "next";
import { Logement } from "@/components/espace/Logement";

export const metadata: Metadata = { title: "Mon logement" };
export default function Page() { return <Logement />; }
