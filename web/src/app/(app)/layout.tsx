import { AppShell } from "@/components/ui/AppShell";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { PiedSelonService } from "@/components/ui/Services";
import { getSessionUser } from "@/server/session-ui";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  // Visiteur non connecté (test d'orientation…) : même en-tête et même pied de page que le site public,
  // sans second menu latéral qui répète la navigation.
  if (!user) {
    return (
      <>
        <div className="print:hidden"><Header /></div>
        <main className="container py-8 sm:py-10">{children}</main>
        <div className="print:hidden"><PiedSelonService><Footer /></PiedSelonService></div>
      </>
    );
  }
  return <AppShell user={user}>{children}</AppShell>;
}
