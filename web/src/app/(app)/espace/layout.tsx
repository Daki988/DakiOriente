import { requireRole } from "@/server/session-ui";

export const dynamic = "force-dynamic";

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["eleve", "etudiant"], "/espace");
  return children;
}
