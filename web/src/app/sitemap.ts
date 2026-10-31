import type { MetadataRoute } from "next";
import { etablissements, formations, metiers } from "@/lib/data";
import { ACTUALITES } from "@/lib/content";
import { VILLES, villeHref } from "@/lib/catalogue";
import { GUIDES, PAGES_OUTILS } from "@/lib/ressources";
import { SITE_URL } from "@/lib/site";

/** Plan du site pour les moteurs de recherche (pages publiques uniquement). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly") => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority });
  return [
    page("/", 1, "daily"),
    ...["/etablissements/", "/formations/", "/metiers/", "/pays/ma/", "/navilease/", "/devis/", "/parents/", "/comparateur/", "/pourquoi/", "/actualites/", "/villes/", "/ressources/", "/trouve-ta-voie/", "/temoignages/"].map((p) => page(p, 0.8)),
    page("/trouve-ta-voie/reglement/", 0.3, "monthly"),
    ...etablissements.map((e) => page(`/etablissements/${e.id}/`, 0.9)),
    ...formations.filter((f) => f.etablissements.length).map((f) => page(`/formations/${f.id}/`, 0.7)),
    ...VILLES.map((v) => page(villeHref(v.nom), 0.8)),
    ...GUIDES.map((g) => page(`/ressources/${g.slug}/`, 0.7, "monthly")),
    ...PAGES_OUTILS.map((s) => page(`/ressources/${s}/`, 0.5, "monthly")),
    ...metiers.map((m) => page(`/metiers/${m.id}/`, 0.6, "monthly")),
    ...ACTUALITES.map((a) => page(`/actualites/${a.slug}/`, 0.5, "monthly")),
  ];
}
