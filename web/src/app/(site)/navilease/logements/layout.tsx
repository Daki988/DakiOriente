import { SessionProvider } from "@/components/app/Session";
import { ToastProvider } from "@/components/app/kit";
import { getSessionUser } from "@/server/session-ui";

export const dynamic = "force-dynamic";

// Pages publiques Navilease : session facultative (alertes, réservation) et notifications éphémères.
export default async function LogementsLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider user={await getSessionUser()}><ToastProvider>{children}</ToastProvider></SessionProvider>;
}
