import { requireRole } from "@/server/session-ui";

export const dynamic = "force-dynamic";

export default async function BailleurLayout({ children }: { children: React.ReactNode }) {
  // Espace propre au bailleur : l'administrateur gère Navilease depuis /admin/navilease (ses API refusent l'admin).
  await requireRole(["bailleur"], "/bailleur");
  return children;
}
