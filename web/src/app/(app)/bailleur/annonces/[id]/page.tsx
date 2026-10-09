import type { Metadata } from "next";
import { ListingForm } from "@/components/navilease/landlord/ListingForm";
import { getLandlordInfo } from "../../landlord";

export const metadata: Metadata = { title: "Modifier l'annonce" };

export default async function AnnoncePage({ params }: { params: { id: string } }) {
  return <ListingForm id={params.id} info={await getLandlordInfo()} />;
}
