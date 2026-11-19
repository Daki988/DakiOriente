import type { Metadata } from "next";
import { BoursesPourToi } from "@/components/espace/BoursesPourToi";

export const metadata: Metadata = { title: "Bourses pour toi" };
export default function Page() { return <BoursesPourToi />; }
