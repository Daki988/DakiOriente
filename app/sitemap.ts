import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/menu", "/ambiance", "/acces", "/evenements", "/loft", "/mentions-legales", "/confidentialite"].map((p) => ({
    url: `${SITE_URL}${p}`, lastModified: new Date(), changeFrequency: p === "/evenements" ? "weekly" : "monthly", priority: p === "" ? 1 : 0.7,
  }));
}
