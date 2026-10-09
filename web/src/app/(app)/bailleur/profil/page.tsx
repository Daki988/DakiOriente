import type { Metadata } from "next";
import { LandlordKyc } from "@/components/navilease/landlord/Kyc";
import { getLandlordInfo } from "../landlord";

export const metadata: Metadata = { title: "Vérification & versements" };

export default async function BailleurProfilPage() {
  return <LandlordKyc info={await getLandlordInfo()} />;
}
