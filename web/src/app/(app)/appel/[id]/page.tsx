import type { Metadata } from "next";
import { Appel } from "@/components/shared/Appel";

export const metadata: Metadata = { title: "Appel", robots: { index: false } };
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <Appel id={id} />;
}
