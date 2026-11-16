import type { Metadata } from "next";
import { ListingForm } from "@/components/navilease/landlord/ListingForm";
import { getLandlordInfo } from "../../landlord";

export const metadata: Metadata = { title: "Modifier l'annonce" };

export default async function AnnoncePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <ListingForm id={params.id} info={await getLandlordInfo()} />;
}
