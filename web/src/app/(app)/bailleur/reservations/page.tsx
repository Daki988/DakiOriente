import type { Metadata } from "next";
import { LandlordBookings } from "@/components/navilease/landlord/Bookings";

export const metadata: Metadata = { title: "Demandes & réservations" };

export default function BailleurReservationsPage() {
  return <LandlordBookings />;
}
