import type { Metadata } from "next";
import { ListingForm } from "@/components/navilease/landlord/ListingForm";
import { getLandlordInfo } from "../../landlord";

export const metadata: Metadata = { title: "Nouvelle annonce" };

export default async function NouvelleAnnoncePage() {
  return <ListingForm info={await getLandlordInfo()} />;
}
