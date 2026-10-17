import { Footer, Header, MobileBar } from "@/components/SiteChrome";
import { hasSupabase } from "@/lib/supabase";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-mobile-bar">
      {!hasSupabase && (
        <p className="border-b border-line bg-white px-4 py-1.5 text-center text-xs text-muted">
          Version de démonstration · les commandes passent par WhatsApp
        </p>
      )}
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
      <MobileBar />
    </div>
  );
}
