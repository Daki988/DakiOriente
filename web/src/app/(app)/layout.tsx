import { AppShell } from "@/components/ui/AppShell";
import { getSessionUser } from "@/server/session-ui";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell user={await getSessionUser()}>{children}</AppShell>;
}
