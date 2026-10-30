import type { Metadata } from "next";
import { Invitations } from "@/components/espace/Attentes";

export const metadata: Metadata = { title: "Invitations des écoles" };
export default function Page() { return <Invitations />; }
