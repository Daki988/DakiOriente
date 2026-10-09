import type { Metadata } from "next";
import { BookingDetail } from "@/components/navilease/BookingDetail";

export const metadata: Metadata = { title: "Réservation Navilease" };

export default function ReservationPage({ params }: { params: { id: string } }) {
  return <BookingDetail id={params.id} />;
}
