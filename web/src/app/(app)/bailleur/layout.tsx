import { requireRole } from "@/server/session-ui";

export const dynamic = "force-dynamic";

export default async function BailleurLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["bailleur", "admin"], "/bailleur");
  return children;
}
