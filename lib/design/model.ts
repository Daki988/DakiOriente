/** Modèle de données de l'éditeur en ligne : polices, palettes, éléments de modèle, design du client. */

export const FONT_KEYS = ["display", "sans", "sans-bold", "serif", "geo", "geo-medium", "script"] as const;
export type FontKey = (typeof FONT_KEYS)[number];

/** Rôle typographique d'un texte : la police réelle dépend du duo de polices choisi. */
export type Role = "head" | "sub" | "body" | "strong";
export type FontPair = { id: string; name: string } & Record<Role, FontKey>;

export const FONT_PAIRS: FontPair[] = [
  { id: "moderne", name: "Moderne", head: "display", sub: "sans-bold", body: "sans", strong: "sans-bold" },
  { id: "elegant", name: "Élégant", head: "serif", sub: "sans-bold", body: "sans", strong: "sans-bold" },
  { id: "affiche", name: "Affiche", head: "geo", sub: "geo-medium", body: "geo-medium", strong: "geo" },
  { id: "ceremonie", name: "Cérémonie", head: "script", sub: "serif", body: "sans", strong: "sans-bold" },
];

/** Couleurs d'un modèle, par rôle. `onPrimary` est calculée (texte lisible sur la couleur principale). */
export type ColorRole = "bg" | "ink" | "primary" | "accent" | "soft" | "onPrimary" | "white";
export type Palette = { id: string; name: string; bg: string; ink: string; primary: string; accent: string; soft: string };

export const PALETTES: Palette[] = [
  { id: "neam", name: "Violet", bg: "#ffffff", ink: "#16141f", primary: "#6b12ff", accent: "#ffd23f", soft: "#efe6ff" },
  { id: "nuit", name: "Nuit dorée", bg: "#ffffff", ink: "#111114", primary: "#1c1c22", accent: "#d4af37", soft: "#f3efe4" },
  { id: "gabon", name: "Gabon", bg: "#ffffff", ink: "#10281b", primary: "#009e60", accent: "#fcd116", soft: "#e3f4ec" },
  { id: "ocean", name: "Océan", bg: "#ffffff", ink: "#0b2545", primary: "#0466c8", accent: "#00b4d8", soft: "#e2f1fb" },
  { id: "corail", name: "Corail", bg: "#fff8f3", ink: "#2b2321", primary: "#f2542d", accent: "#ffb703", soft: "#ffe4d6" },
  { id: "foret", name: "Forêt", bg: "#f7f4ea", ink: "#1b3a2b", primary: "#2d6a4f", accent: "#e9c46a", soft: "#e2eadf" },
];

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function colorOf(p: Palette, role: ColorRole): string {
  if (role === "white") return "#ffffff";
  if (role === "onPrimary") return luminance(p.primary) > 0.45 ? p.ink : "#ffffff";
  return p[role];
}

/** Champs de texte communs à tous les modèles ; leur libellé dépend du type de produit. */
export const FIELDS = ["titre", "sousTitre", "texte", "l1", "l2", "l3"] as const;
export type Field = (typeof FIELDS)[number];

/** Coordonnées relatives (0 → 1) à la zone finie du support. Tailles de texte relatives au petit côté. */
type Box = { x: number; y: number; w: number; h: number };
export type El =
  | (Box & { t: "rect"; fill: ColorRole; r?: number; opacity?: number })
  | (Box & { t: "ellipse"; fill: ColorRole; opacity?: number })
  | (Box & { t: "text"; field: Field; role: Role; color: ColorRole; size: number; align?: "left" | "center" | "right"; lines?: number; upper?: boolean })
  | (Box & { t: "logo"; color: ColorRole; align?: "left" | "center" | "right" });

export type Side = { bg: ColorRole; els: El[] };
export type Family = "card" | "portrait" | "tall" | "square" | "wide";
export type Template = { id: string; name: string; family: Family; sides: Side[]; palette: string; fonts: string };

export type Logo = { src: string; w: number; h: number };
/** `monogram` : champ dont les initiales remplacent le logo absent (aucune si non défini). */
export type Design = { template: string; palette: string; fonts: string; fields: Record<Field, string>; logo?: Logo; monogram?: Field };

/** Gabarit d'impression : 3 mm de fond perdu autour de la zone finie. */
export const BLEED_MM = 3;
