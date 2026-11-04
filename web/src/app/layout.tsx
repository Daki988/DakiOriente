import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { SITE_URL } from "@/lib/site";
import { DeviseProvider } from "@/components/ui/Devise";
import { DESTINATIONS_ACTIVES } from "@/lib/data";
import { DestinationProvider } from "@/components/ui/Destination";
import { AcquisitionTracker } from "@/components/campagne/AcquisitionTracker";
import { Navi } from "@/components/ui/Navi";

const DESCRIPTION = `Étudier ${DESTINATIONS_ACTIVES.map((d) => d.prep).join(" ou ")} depuis toute l'Afrique : orientation, écoles privées reconnues par l'État, frais, candidature en ligne et logement étudiant.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `Navigoal — Étudier ${DESTINATIONS_ACTIVES.map((d) => d.prep).join(" ou ")} : écoles, candidature, logement`, template: "%s · Navigoal" },
  description: DESCRIPTION,
  applicationName: "Navigoal",
  keywords: ["étudier au Maroc", "école privée Maroc", "université privée Maroc", "établissement reconnu par l'État", "diplôme homologué Maroc", "étudiant africain Maroc", "orientation post-bac", "candidature en ligne", "logement étudiant Casablanca", "logement étudiant Rabat", "visa étudiant Maroc", "étudier au Sénégal", "école privée Dakar", "ANAQ-Sup", "étudiant africain Dakar"],
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
  openGraph: { type: "website", locale: "fr_FR", siteName: "Navigoal", title: "Navigoal — Étudier en Afrique", description: DESCRIPTION, url: SITE_URL, images: [{ url: "/og.png", width: 1200, height: 630, alt: "Navigoal — Étudier en Afrique" }] },
  twitter: { card: "summary_large_image", title: "Navigoal — Étudier en Afrique", description: DESCRIPTION, images: ["/og.png"] },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

const ORGANISATION = {
  "@context": "https://schema.org", "@type": "Organization", name: "Navigoal", url: SITE_URL, logo: `${SITE_URL}/brand/navigoal-logo.png`,
  description: DESCRIPTION, areaServed: ["Africa", ...DESTINATIONS_ACTIVES.map((d) => d.code)], knowsLanguage: "fr",
  potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/recherche/?q={q}`, "query-input": "required name=q" },
};

export const viewport: Viewport = { themeColor: "#1a47f5" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANISATION).replace(/</g, "\\u003c") }} />
        <MotionProvider>
          <DeviseProvider>
           <DestinationProvider>
            <ScrollProgress />
            <AcquisitionTracker />
            {children}
            <Navi />
           </DestinationProvider>
          </DeviseProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
