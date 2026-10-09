import type { Metadata } from "next";
import { PaymentPage } from "@/components/shared/PaymentPage";

export const metadata: Metadata = { title: "Paiement" };
export const dynamic = "force-dynamic";
export default function Page({ params }: { params: { ref: string } }) { return <PaymentPage reference={params.ref} />; }
