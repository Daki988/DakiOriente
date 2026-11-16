import type { Metadata } from "next";
import { HousingPage } from "@/components/navilease/Listing";

export const metadata: Metadata = { title: "Logement Navilease" };

export default async function LogementPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <HousingPage id={params.id} />;
}
