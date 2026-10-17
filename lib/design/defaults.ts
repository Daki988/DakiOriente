import type { Measure } from "./layout.ts";
import { KINDS, kindFor, MONOGRAM, PREFERRED, familyFor, templatesFor } from "./templates.ts";
import type { Design, FontKey } from "./model.ts";

export type ProductFormat = { slug: string; categorySlug: string; wMm: number; hMm: number };

/** Modèles de la famille : conseillés pour le produit d'abord, puis ceux à motifs africains, puis les autres. */
export function orderedTemplates(p: ProductFormat) {
  const all = templatesFor(familyFor(p.wMm, p.hMm));
  const pref = PREFERRED[kindFor(p.categorySlug, p.slug)] ?? [];
  const rank = (t: (typeof all)[number]) => (pref.includes(t.id) ? pref.indexOf(t.id) : t.pattern ? pref.length : pref.length + 1);
  return [...all].sort((a, b) => rank(a) - rank(b));
}

/** Design de départ ; `variant` choisit un autre modèle parmi les premiers (variété du catalogue). */
export function newDesign(p: ProductFormat, variant = 0): Design {
  const list = orderedTemplates(p);
  const tpl = list[variant % Math.min(6, list.length)];
  const kind = kindFor(p.categorySlug, p.slug);
  return { template: tpl.id, palette: tpl.palette, fonts: tpl.fonts, fields: { ...KINDS[kind].defaults }, monogram: MONOGRAM[kind] };
}

/** Largeur moyenne d'un caractère par police (en fraction de la taille), un peu généreuse. */
const AVG: Record<FontKey, number> = { display: 0.62, sans: 0.54, "sans-bold": 0.58, serif: 0.58, geo: 0.7, "geo-medium": 0.62, script: 0.46 };
/** Mesure approchée, identique côté serveur et navigateur : pour les vignettes du catalogue. */
export const approxMeasure: Measure = (text, font, size) => text.length * size * AVG[font];
