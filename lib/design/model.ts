import type { IconId, PatternId } from "./motifs.ts";

/** Modèle de données de l'éditeur en ligne : polices, palettes, éléments de modèle, design du client. */

export const FONT_KEYS = [
  "display", "sans", "sans-bold", "serif", "geo", "geo-medium", "script",
  // Polices des modèles « affiches » (façon Canva).
  "bebas", "black", "poppins", "poppins-semi", "poppins-xb", "mont", "mont-semi", "serif-italic",
] as const;
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
/** Couleur d'un élément : un rôle de la palette (suit la palette choisie) ou une couleur fixe « #rrggbb ». */
export type Color = ColorRole | `#${string}`;
export type Palette = { id: string; name: string; bg: string; ink: string; primary: string; accent: string; soft: string };

export const PALETTES: Palette[] = [
  { id: "neam", name: "Violet", bg: "#ffffff", ink: "#16141f", primary: "#6b12ff", accent: "#ffd23f", soft: "#efe6ff" },
  { id: "nuit", name: "Nuit dorée", bg: "#ffffff", ink: "#111114", primary: "#1c1c22", accent: "#d4af37", soft: "#f3efe4" },
  { id: "gabon", name: "Gabon", bg: "#ffffff", ink: "#10281b", primary: "#009e60", accent: "#fcd116", soft: "#e3f4ec" },
  { id: "ocean", name: "Océan", bg: "#ffffff", ink: "#0b2545", primary: "#0466c8", accent: "#00b4d8", soft: "#e2f1fb" },
  { id: "corail", name: "Corail", bg: "#fff8f3", ink: "#2b2321", primary: "#f2542d", accent: "#ffb703", soft: "#ffe4d6" },
  { id: "foret", name: "Forêt", bg: "#f7f4ea", ink: "#1b3a2b", primary: "#2d6a4f", accent: "#e9c46a", soft: "#e2eadf" },
  { id: "terre", name: "Terre", bg: "#fbf5ec", ink: "#2a1a12", primary: "#b5462a", accent: "#e8a33d", soft: "#f3e3cf" },
  { id: "orchidee", name: "Orchidée", bg: "#fff7f9", ink: "#2b1a22", primary: "#b0185a", accent: "#d4a73a", soft: "#fbe3ec" },
  { id: "chantier", name: "Chantier", bg: "#ffffff", ink: "#1d1d1f", primary: "#c97c00", accent: "#f5b301", soft: "#fff4cc" },
  { id: "royal", name: "Royal", bg: "#fbf8f2", ink: "#1e1b3a", primary: "#3b2a8f", accent: "#d4af37", soft: "#ece8f7" },
  { id: "ivoire", name: "Ivoire", bg: "#fffdf8", ink: "#3a2f28", primary: "#7d6233", accent: "#c9a96e", soft: "#f5efe3" },
  { id: "clinique", name: "Clinique", bg: "#ffffff", ink: "#0f2d3a", primary: "#0a9a92", accent: "#2f6bff", soft: "#e0f5f3" },
];

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function colorOf(p: Palette, role: Color): string {
  if (role.startsWith("#")) return role;
  if (role === "white") return "#ffffff";
  if (role === "onPrimary") return luminance(p.primary) > 0.45 ? p.ink : "#ffffff";
  return p[role as Exclude<ColorRole, "white" | "onPrimary">];
}

/** Champs de texte communs à tous les modèles ; leur libellé dépend du type de produit. */
export const FIELDS = ["titre", "sousTitre", "texte", "l1", "l2", "l3"] as const;
export type Field = (typeof FIELDS)[number];

/** Coordonnées relatives (0 → 1) à la zone finie du support. Tailles de texte relatives au petit côté. */
type Box = { x: number; y: number; w: number; h: number };
/** Rotation en degrés autour du centre de l'élément. */
type Turn = { rot?: number };
/** Contour : couleur, épaisseur (relative au petit côté), tirets (relatifs au petit côté). */
type Stroke = { stroke?: Color; sw?: number; dash?: number };
/** Dégradé linéaire de la couleur de remplissage (opacité de l'élément) vers `to` (opacité `op`), vertical par défaut. */
export type Grad = { to: Color; op?: number; dir?: "v" | "h" };
export type El =
  | (Box & Turn & Stroke & { t: "rect"; fill?: Color; r?: number; opacity?: number; grad?: Grad })
  | (Box & Turn & Stroke & { t: "ellipse"; fill?: Color; opacity?: number })
  /**
   * Texte : un champ du produit (`field`) ou un texte propre au modèle (`text`, modifiable via son `id`).
   * `font` impose une police précise ; sinon c'est le rôle dans le duo de polices choisi.
   * `ls` : espacement des lettres (en fraction de la taille), `lh` : interligne.
   */
  | (Box & Turn & {
      t: "text"; field?: Field; text?: string; id?: string; role?: Role; font?: FontKey; color: Color; size: number;
      align?: "left" | "center" | "right"; lines?: number; upper?: boolean; ls?: number; lh?: number;
    })
  /** Photo du modèle (remplaçable par le client via son `id`) : recadrée pour remplir la zone, coins arrondis ou arche. */
  | (Box & { t: "photo"; id?: string; src: string; iw: number; ih: number; fx?: number; fy?: number; r?: number; arch?: boolean })
  /** `on` : couleur sous le logo (sert aux découpes du pictogramme de remplacement). */
  | (Box & { t: "logo"; color: Color; align?: "left" | "center" | "right"; on?: Color })
  /** Motif répété dans la zone ; « auto » = motif choisi par le client. `tile` relatif au petit côté. */
  | (Box & { t: "pattern"; pattern: PatternId | "auto"; tile: number; colors: [ColorRole, ColorRole, ColorRole]; opacity?: number })
  /** Pictogramme du secteur choisi (rien si aucun). */
  | (Box & { t: "icon"; color: ColorRole; cut: ColorRole; align?: "left" | "center" | "right" });

export type Side = { bg: Color; els: El[] };
export type Family = "card" | "portrait" | "tall" | "square" | "wide";
/** Type de produit : fixe les libellés des champs et les exemples de texte. */
export type Kind = "carte" | "evenement" | "promo" | "marque";
/**
 * Modèle. `kinds` : produits pour lesquels il est conçu (proposé en premier) ; `fields` : ses textes d'exemple ;
 * `free` : composition libre (les textes peuvent se chevaucher, aucun n'est décalé).
 */
export type Template = {
  id: string; name: string; family: Family; sides: Side[]; palette: string; fonts: string; pattern?: PatternId;
  kinds?: Kind[]; fields?: Partial<Record<Field, string>>; free?: boolean;
};

export type Logo = { src: string; w: number; h: number };
/** `monogram` : champ dont les initiales remplacent le logo absent (aucune si non défini). */
export type Design = {
  template: string; palette: string; fonts: string; fields: Record<Field, string>; logo?: Logo; monogram?: Field;
  /** Motif africain des zones « auto », pictogramme du métier, secteur d'activité choisi. */
  pattern?: PatternId; icon?: IconId; sector?: string;
  /** Ajouts du client : position du logo, slogan en bandeau, photo de fond (avec voile de 0 à 0,9). */
  logoPos?: LogoPos; slogan?: string; sloganPos?: "haut" | "bas"; bgImage?: Logo; bgVeil?: number;
  /** Textes propres au modèle et photos remplacées par le client, par identifiant « modèle:élément ». */
  texts?: Record<string, string>; photos?: Record<string, Logo>;
  /** Taille des textes (1 = celle du modèle), cliparts posés librement, code QR. */
  textScale?: number; clips?: Clip[]; qr?: Qr;
};
/** Clipart posé : `side` = face (0 recto), centre (x, y) et taille `s` relatifs à la zone finie. */
export type Clip = { art: string; side: number; x: number; y: number; s: number; color: Color };
/** Code QR : contenu encodé, face et coin choisis. */
export type Qr = { text: string; side: number; pos: Exclude<LogoPos, "modele">; color?: Color };
export type LogoPos = "modele" | "hg" | "hd" | "bg" | "bd" | "centre";

/** Gabarit d'impression : 3 mm de fond perdu autour de la zone finie. */
export const BLEED_MM = 3;
