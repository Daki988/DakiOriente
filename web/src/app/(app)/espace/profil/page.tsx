import type { Metadata } from "next";
import { Profile } from "@/components/espace/Profile";
import { MesAttentes } from "@/components/espace/Attentes";

export const metadata: Metadata = { title: "Mon profil" };
export default function Page() { return <><Profile /><MesAttentes /></>; }
