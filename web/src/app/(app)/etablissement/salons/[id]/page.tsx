import type { Metadata } from "next";
import { BilanSalon } from "@/components/etablissement/Salons";

export const metadata: Metadata = { title: "Bilan du salon" };
export default async function Page(props: { params: Promise<{ id: string }> }) { const { id } = await props.params; return <BilanSalon id={id} />; }
