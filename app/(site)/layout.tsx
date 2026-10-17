import { Footer, Header, MobileBar } from "@/components/SiteChrome";
import { hasSupabase } from "@/lib/supabase";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-mobile-bar">
      {!hasSupabase && (
        <p className="bg-yellow px-4 py-2 text-center text-sm font-semibold">
          Version de démonstration : la commande en ligne s’active dès que la base de données est branchée.
        </p>
      )}
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
      <MobileBar />
    </div>
  );
}
