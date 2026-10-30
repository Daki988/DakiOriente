import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getCategories, loft, MENU_PDF, gallery, posters, getUpcomingEvents } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const u = (p: string) => `${SITE_URL}${p}`;
  const pages: MetadataRoute.Sitemap = [
    { url: u("/"), priority: 1, changeFrequency: "weekly", images: [u("/images/ambiance/plateau-aperitif-jackboy-libreville.webp"), u("/brand/logo-dark.png")] },
    { url: u("/menu"), priority: 0.95, changeFrequency: "weekly", images: MENU_PDF.pages.map((p) => u(p.src)) },
    ...getCategories().map((c) => ({
      url: u(`/menu/${c.slug}`), priority: 0.85, changeFrequency: "monthly" as const, ...(c.image ? { images: [u(c.image)] } : {}),
    })),
    { url: u("/acces"), priority: 0.9, changeFrequency: "monthly" },
    { url: u("/faq"), priority: 0.7, changeFrequency: "monthly" },
    { url: u("/ambiance"), priority: 0.7, changeFrequency: "weekly", images: [...gallery.filter((g) => g.src).map((g) => u(g.src as string)), ...posters.map((p) => u(p.src))] },
    { url: u("/evenements"), priority: 0.85, changeFrequency: "daily", images: getUpcomingEvents().filter((e) => e.poster).map((e) => u(e.poster as string)) },
    ...(loft.visible ? [{ url: u("/loft"), priority: 0.6, changeFrequency: "monthly" as const }] : []),
    { url: u(MENU_PDF.href), priority: 0.6, changeFrequency: "monthly" },
    { url: u("/mentions-legales"), priority: 0.2, changeFrequency: "yearly" },
    { url: u("/confidentialite"), priority: 0.2, changeFrequency: "yearly" },
  ];
  return pages.map((p) => ({ lastModified: now, ...p }));
}

export const dynamic = "force-static";
