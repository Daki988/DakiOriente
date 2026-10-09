import { requireRole } from "@/server/session-ui";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin"], "/admin");
  return children;
}
