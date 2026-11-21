import type { Metadata } from "next";
import { AccordsSalons } from "@/components/parent/AccordsSalons";

export const metadata: Metadata = { title: "Salons virtuels : accords" };
export default function Page() { return <AccordsSalons />; }
