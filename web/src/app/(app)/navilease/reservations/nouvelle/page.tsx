import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/app/kit";
import { BookingRequest } from "@/components/navilease/BookingRequest";

export const metadata: Metadata = { title: "Demande de réservation" };

export default function NouvelleReservationPage() {
  return <Suspense fallback={<Loading />}><BookingRequest /></Suspense>;
}
