import { requireRole } from "@/server/session-ui";

export const dynamic = "force-dynamic";

export default async function ReservationsLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["eleve", "etudiant", "parent", "bailleur", "admin"], "/navilease/reservations");
  return children;
}
