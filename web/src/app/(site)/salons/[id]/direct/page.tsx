import type { Metadata } from "next";
import { SalleSalon } from "@/components/sections/Salons";

export const metadata: Metadata = { title: "Salon en direct", robots: { index: false } };
export default async function Page(props: { params: Promise<{ id: string }> }) { const { id } = await props.params; return <SalleSalon id={id} />; }
