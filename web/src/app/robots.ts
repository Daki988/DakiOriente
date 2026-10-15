import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/espace/", "/etablissement/", "/admin/", "/parent/", "/bailleur/", "/compte/", "/conseiller/", "/messages/", "/notifications/", "/orientation/", "/connexion", "/inscription", "/mot-de-passe-oublie", "/paiement"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
