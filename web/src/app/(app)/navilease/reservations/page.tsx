import type { Metadata } from "next";
import { MyBookings } from "@/components/navilease/MyBookings";

export const metadata: Metadata = { title: "Mes réservations Navilease" };

export default function ReservationsPage() {
  return <MyBookings />;
}
