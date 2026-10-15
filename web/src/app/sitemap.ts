import type { MetadataRoute } from "next";
import { etablissements, formations, metiers } from "@/lib/data";
import { ACTUALITES } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

/** Plan du site pour les moteurs de recherche (pages publiques uniquement). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly") => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority });
  return [
    page("/", 1, "daily"),
    ...["/etablissements/", "/formations/", "/metiers/", "/pays/ma/", "/navilease/", "/devis/", "/comparateur/", "/pourquoi/", "/actualites/"].map((p) => page(p, 0.8)),
    ...etablissements.map((e) => page(`/etablissements/${e.id}/`, 0.9)),
    ...formations.filter((f) => f.etablissements.length).map((f) => page(`/formations/${f.id}/`, 0.7)),
    ...metiers.map((m) => page(`/metiers/${m.id}/`, 0.6, "monthly")),
    ...ACTUALITES.map((a) => page(`/actualites/${a.slug}/`, 0.5, "monthly")),
  ];
}
