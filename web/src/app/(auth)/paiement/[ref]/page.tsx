import type { Metadata } from "next";
import { PaymentPage } from "@/components/shared/PaymentPage";
import { SessionProvider } from "@/components/app/Session";
import { requireRole } from "@/server/session-ui";

export const metadata: Metadata = { title: "Paiement", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: { ref: string } }) {
  const user = await requireRole(["eleve", "etudiant", "parent", "etablissement", "bailleur", "conseiller", "admin"], `/paiement/${params.ref}`);
  return <SessionProvider user={user}><PaymentPage reference={params.ref} /></SessionProvider>;
}
