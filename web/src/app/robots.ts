import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Seuls les robots de Google et de Bing sont admis (décision de novembre 2026) ; tous les autres sont priés de ne rien
// parcourir. Les robots qui ignorent ce fichier sont de toute façon refusés par le serveur (deploiement/app.js).
const PRIVE = ["/api/", "/espace/", "/etablissement/", "/admin/", "/parent/", "/bailleur/", "/compte/", "/conseiller/", "/messages/", "/notifications/", "/orientation/", "/connexion", "/inscription", "/mot-de-passe-oublie", "/paiement"];
export const ROBOTS_ADMIS = ["Googlebot", "Googlebot-Image", "Googlebot-Video", "Googlebot-News", "Storebot-Google", "Google-InspectionTool", "GoogleOther", "AdsBot-Google", "Mediapartners-Google", "Bingbot", "msnbot", "BingPreview"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ROBOTS_ADMIS, allow: "/", disallow: PRIVE },
      { userAgent: "*", disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
