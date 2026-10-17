import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { SITE_URL, settings } from "@/lib/site";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-bricolage", display: "swap" });
const dm = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-dm", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Neam Print · Imprimerie en ligne à Libreville", template: "%s · Neam Print" },
  description:
    "Cartes de visite, flyers, roll-up, bâches, stickers, textile : commandez vos impressions en ligne à Libreville. Prix immédiat, paiement Airtel Money ou Moov Money, retrait ou livraison.",
  applicationName: settings.name,
  openGraph: { type: "website", locale: "fr_FR", siteName: settings.name },
  icons: { icon: "/brand/logo.svg" },
};

export const viewport: Viewport = { themeColor: "#0d0e12", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${dm.variable}`}>
      <body>{children}</body>
    </html>
  );
}
