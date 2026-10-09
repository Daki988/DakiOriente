import { requireRole } from "@/server/session-ui";

export const dynamic = "force-dynamic";

export default async function ConseillerLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["conseiller", "admin"], "/conseiller");
  return children;
}
