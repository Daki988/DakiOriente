import type { Metadata } from "next";
import { HousingPage } from "@/components/navilease/Listing";

export const metadata: Metadata = { title: "Logement Navilease" };

export default function LogementPage({ params }: { params: { id: string } }) {
  return <HousingPage id={params.id} />;
}
