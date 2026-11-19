// Photos de couverture des actualités (novembre 2026) : photo saisie dans le back-office (champ « cover »), sinon photo
// créditée du site choisie pour l'article, sinon photo de sa catégorie. Jamais d'aplat de couleur sans image.
import { mobilite, type Photo } from "@/lib/data";
import { photo } from "@/lib/photos";

const PAR_ARTICLE: Record<string, string> = { "bourses-2026": "laptop", "choisir-sa-serie": "education", "premiere-annee": "social", "ia-education": "data", "metiers-btp": "btp" };
const PAR_CATEGORIE: Record<string, string> = { Bourses: "laptop", Orientation: "education", "Vie étudiante": "social", Innovation: "data", Métiers: "btp", International: "@Rabat" };

export type Couverture = { src: string; alt: string; credit: string | null; licence: string | null; page: string | null };

export function couverture(a: { slug: string; category: string; title: string; cover?: string | null }): Couverture {
  if (a.cover) return { src: a.cover, alt: a.title, credit: null, licence: null, page: null };
  const id = (a.slug === "etudier-au-maroc" ? "@Rabat" : PAR_ARTICLE[a.slug]) ?? PAR_CATEGORIE[a.category] ?? "communaute";
  if (id.startsWith("@")) {
    const v = mobilite[id.slice(1)]?.couverture as Photo | undefined;
    if (v) return { src: v.src, alt: `Vue de ${id.slice(1)}`, credit: v.credit, licence: v.licence, page: v.page };
  }
  const p = photo(id) ?? photo("communaute")!;
  return { src: p.src, alt: p.alt, credit: p.credit, licence: p.licence, page: p.page };
}

/** srcset des variantes produites par scripts/variantes_images.py (/images : 160 à 840 px ; /photos : 400 et 840 px). */
export function variantes(src: string) {
  if (/^\/images\/.+\.webp$/.test(src)) { const b = src.slice(0, -5); return `${b}-400.webp 400w, ${b}-640.webp 640w, ${b}-840.webp 840w, ${src} 1000w`; }
  if (/^\/photos\/.+\.(jpe?g|png)$/i.test(src)) { const b = src.replace(/\.[a-z]+$/i, ""); return `${b}-400.webp 400w, ${b}-840.webp 840w, ${src} 1600w`; }
  return undefined;
}
