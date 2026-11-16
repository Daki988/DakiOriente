import type { Metadata } from "next";
import { BookingDetail } from "@/components/navilease/BookingDetail";

export const metadata: Metadata = { title: "Réservation Navilease" };

export default async function ReservationPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <BookingDetail id={params.id} />;
}
