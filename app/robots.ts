import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { settings } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  // En mode démo, le site n'est pas indexé (évite de référencer des données provisoires).
  if (settings.demoMode) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/keystatic", "/api/"] }, sitemap: `${SITE_URL}/sitemap.xml` };
}
