import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DemoBanner } from "@/components/DemoBanner";
import { SITE_URL } from "@/lib/format";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Neam Transit — Comparez les transitaires Chine et Corée vers le Gabon", template: "%s · Neam Transit" },
  description:
    "Comparez les prix tout compris et les délais réels des transitaires vérifiés, de la Chine et de la Corée du Sud vers tout le Gabon, en avion ou en bateau. Contact direct, sans paiement en ligne.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#0b2545", width: "device-width", initialScale: 1 };

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
          Aller au contenu
        </a>
        <DemoBanner />
        <Header />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
