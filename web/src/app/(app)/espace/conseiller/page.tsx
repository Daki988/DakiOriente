import type { Metadata } from "next";
import { Conseiller } from "@/components/espace/Conseiller";

export const metadata: Metadata = { title: "Conseiller" };
export default function Page() { return <Conseiller />; }
