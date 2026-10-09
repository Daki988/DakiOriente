import { requireRole } from "@/server/session-ui";

export const dynamic = "force-dynamic";
export default async function L({ children }: { children: React.ReactNode }) {
  await requireRole(["eleve", "etudiant", "parent", "etablissement", "bailleur", "conseiller", "admin"], "/notifications");
  return children;
}
