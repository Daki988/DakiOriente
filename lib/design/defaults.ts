import type { Measure } from "./layout.ts";
import { KINDS, kindFor, MONOGRAM, PREFERRED, familyFor, templatesFor } from "./templates.ts";
import type { Design, Field, FontKey, Kind, Template } from "./model.ts";

export type ProductFormat = { slug: string; categorySlug: string; wMm: number; hMm: number };

/**
 * Modèles de la famille : les modèles « affiches » conçus pour ce type de produit d'abord, puis les autres
 * modèles affiches, puis les modèles conseillés, ceux à motifs africains, et enfin les autres.
 */
export function orderedTemplates(p: ProductFormat) {
  const all = templatesFor(familyFor(p.wMm, p.hMm));
  const kind = kindFor(p.categorySlug, p.slug);
  const pref = PREFERRED[kind] ?? [];
  const rank = (t: (typeof all)[number]) =>
    t.kinds?.includes(kind) ? 0 : t.kinds ? 1 : pref.includes(t.id) ? 2 + pref.indexOf(t.id) / 10 : t.pattern ? 3 : 4;
  return [...all].sort((a, b) => rank(a) - rank(b));
}

/** Textes de départ pour un modèle : ses propres exemples s'il en a, sinon ceux du type de produit. */
/** Textes d'exemple : ceux du modèle s'il est fait pour ce type de produit, sinon ceux du type. */
export const sampleFields = (tpl: Template, kind: Kind): Record<Field, string> =>
  ({ ...KINDS[kind].defaults, ...(!tpl.kinds || tpl.kinds.includes(kind) ? tpl.fields ?? {} : {}) });

/** Design de départ ; `variant` choisit un autre modèle parmi les premiers (variété du catalogue). */
export function newDesign(p: ProductFormat, variant = 0): Design {
  const list = orderedTemplates(p);
  const tpl = list[variant % Math.min(6, list.length)];
  const kind = kindFor(p.categorySlug, p.slug);
  return { template: tpl.id, palette: tpl.palette, fonts: tpl.fonts, fields: sampleFields(tpl, kind), monogram: MONOGRAM[kind] };
}

/** Largeur moyenne d'un caractère par police (en fraction de la taille), un peu généreuse. */
const AVG: Record<FontKey, number> = {
  display: 0.62, sans: 0.54, "sans-bold": 0.58, serif: 0.58, geo: 0.7, "geo-medium": 0.62, script: 0.46,
  bebas: 0.4, black: 0.68, poppins: 0.6, "poppins-semi": 0.62, "poppins-xb": 0.64, mont: 0.62, "mont-semi": 0.63, "serif-italic": 0.54,
};
/** Mesure approchée, identique côté serveur et navigateur : pour les vignettes du catalogue. */
export const approxMeasure: Measure = (text, font, size) => text.length * size * AVG[font];
