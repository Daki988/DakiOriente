import type { Metadata } from "next";
import { AgendaRdv } from "@/components/shared/RendezVous";

export const metadata: Metadata = { title: "Rendez-vous" };
export default function Page() { return <AgendaRdv />; }
