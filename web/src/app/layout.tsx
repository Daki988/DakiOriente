import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ScrollProgress } from "@/components/motion/ScrollProgress";

export const metadata: Metadata = {
  title: { default: "Navigoal — Oriente-toi, forme-toi, installe-toi", template: "%s · Navigoal" },
  description: "Orientation, candidature et logement étudiant (Navilease) pour étudier au Maroc dans des établissements privés aux diplômes homologués par l'État, depuis toute l'Afrique.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#1a47f5" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <MotionProvider>
          <ScrollProgress />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
