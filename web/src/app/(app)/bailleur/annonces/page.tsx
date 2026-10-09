import type { Metadata } from "next";
import { ListingsManager } from "@/components/navilease/landlord/Listings";

export const metadata: Metadata = { title: "Mes annonces" };

export default function AnnoncesPage() {
  return <ListingsManager />;
}
