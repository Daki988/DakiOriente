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
import { SpotlightTracker } from "@/components/Spotlight";
import { settings, primaryPhone, seo } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: seo.home.title, template: "%s | Jackboy 241 Libreville" },
  description: seo.home.description,
  applicationName: "Jackboy 241",
  category: "restaurant",
  keywords: [
    "bar Libreville", "restaurant Libreville", "fast food Libreville", "burger Libreville", "panini Libreville",
    "chicha Libreville", "cocktails Libreville", "bar à chicha Libreville", "bar quartier Louis", "Louis Libreville",
    "sortir à Libreville", "bar ambiance Libreville", "amapiano Libreville", "livraison burger Libreville",
    "whisky prix Libreville", "Regab", "Jackboy", "Jack Boy 241",
  ],
  alternates: { canonical: "/" },
  formatDetection: { telephone: true, address: true },
  openGraph: {
    type: "website", locale: "fr_FR", siteName: "Jackboy Bar-Resto 241", url: "/",
    title: "JACKBOY — Feel the night · Bar, fast food & chicha à Libreville", description: seo.home.description,
  },
  other: {
    "geo.region": "GA-1",
    "geo.placename": "Libreville",
    "format-detection": "telephone=yes",
  },
  twitter: { card: "summary_large_image" },
  robots: settings.demoMode ? { index: false, follow: false } : { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#0a0c0b", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${anton.variable} ${inter.variable}`}>
      <body className="pb-nav">
        <div aria-hidden="true" className="scroll-progress fixed inset-x-0 top-0 z-[60] h-0.5 bg-gradient-to-r from-gold via-accent to-accent" />
        <CartProvider>
          <DemoBanner />
          <Header phone={primaryPhone.number} phoneDisplay={primaryPhone.display} />
          <main id="contenu">{children}</main>
          <Footer />
          <CartButton />
          <CartDrawer />
          <BottomNav phone={primaryPhone.number} />
          <SpotlightTracker />
        </CartProvider>
        <JsonLd />
      </body>
    </html>
  );
}
