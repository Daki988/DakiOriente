import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import "../globals.css";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { DemoBanner } from "@/components/DemoBanner";
import { JsonLd } from "@/components/JsonLd";
import { CartProvider } from "@/components/cart";
import { CartButton } from "@/components/CartButton";
import { CartDrawer } from "@/components/CartDrawer";
import { settings, primaryPhone } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Jackboy Bar-Restaurant 241 — La nuit a son adresse | Libreville", template: "%s · Jackboy 241" },
  description:
    "Bar-restaurant à Louis, Libreville (à 100 m de l'ambassade de Côte d'Ivoire) : burgers, paninis, wings, cocktails, chicha, DJ Hamed. Ouvert dès 15 h. Menu, commande, itinéraire et appel en un clic.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "fr_FR", siteName: settings.name,
    title: "JACKBOY — Feel the night", description: `${settings.tagline} ${settings.taglineFr}`,
  },
  twitter: { card: "summary_large_image" },
  robots: settings.demoMode ? { index: false, follow: false } : { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#0a0c0b", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${anton.variable} ${inter.variable}`}>
      <body className="pb-nav">
        <CartProvider>
          <DemoBanner />
          <Header phone={primaryPhone.number} phoneDisplay={primaryPhone.display} />
          <main id="contenu">{children}</main>
          <Footer />
          <CartButton />
          <CartDrawer />
          <BottomNav phone={primaryPhone.number} />
        </CartProvider>
        <JsonLd />
      </body>
    </html>
  );
}
