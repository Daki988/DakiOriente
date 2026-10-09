import type { Metadata } from "next";
import { LandlordDashboard } from "@/components/navilease/landlord/Dashboard";
import { getLandlordInfo } from "./landlord";

export const metadata: Metadata = { title: "Espace bailleur" };

export default async function BailleurPage() {
  return <LandlordDashboard info={await getLandlordInfo()} />;
}
