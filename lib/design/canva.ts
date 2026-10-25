import type { Color, El, Family, Field, FontKey, Kind, Palette, Side, Template } from "./model.ts";

/*
 * Modèles « affiches » (façon Canva) : photos, typographies marquées, formes et dégradés.
 * Ils sont dessinés en pixels sur une planche de référence (comme la maquette), puis convertis
 * en coordonnées relatives. Les textes sont calés sur la ligne de base de la maquette HTML.
 */

/** Hauteur de ligne « normale » et ascendante des polices (en fraction de la taille), d'après les fichiers. */
const METRICS: Record<FontKey, [asc: number, normal: number]> = {
  display: [0.93, 1.2], sans: [0.992, 1.302], "sans-bold": [0.992, 1.302], serif: [1.082, 1.333], geo: [0.968, 1.219],
  "geo-medium": [0.968, 1.219], script: [0.851, 1.252], bebas: [0.9, 1.2], black: [0.878, 1.088], poppins: [1.05, 1.5],
  "poppins-semi": [1.05, 1.5], "poppins-xb": [1.05, 1.5], mont: [0.968, 1.219], "mont-semi": [0.968, 1.219], "serif-italic": [1.082, 1.333],
};
/** Ligne de base du moteur : 0,8 × la taille sous le haut du texte (voir layout.ts). */
const ENGINE_ASCENT = 0.8;

/** Photos des modèles (dossier public/modeles), avec leurs dimensions. */
const PH = {
  plat: [1600, 1067], beaute: [1600, 1067], maries: [1600, 2316], "portrait-homme": [1600, 2400], soiree: [1600, 1067],
  maison: [1600, 1063], "homme-costume": [1600, 2000], "femme-affaires": [1600, 2400], btp: [1600, 2133], conference: [1600, 2400],
} as const;
type PhotoId = keyof typeof PH;

/** Palettes propres aux modèles affiches (non listées dans l'onglet Couleurs, mais remplaçables). */
export const TEMPLATE_PALETTES: Palette[] = [
  { id: "c-marine", name: "Marine & or", bg: "#0f1e3d", ink: "#d9deea", primary: "#132650", accent: "#c9a24b", soft: "#ffffff" },
  { id: "c-orange", name: "Orange vif", bg: "#ffffff", ink: "#1b1209", primary: "#ff6b2c", accent: "#1b1209", soft: "#fff1e8" },
  { id: "c-jaune", name: "Jaune & noir", bg: "#ffd23f", ink: "#16141f", primary: "#16141f", accent: "#6b12ff", soft: "#ffffff" },
  { id: "c-rose", name: "Rose poudré", bg: "#f9e4e4", ink: "#5b2730", primary: "#7a2e3a", accent: "#efd6b8", soft: "#f2c6c2" },
  { id: "c-sante", name: "Santé", bg: "#ffffff", ink: "#0f2d3a", primary: "#0a9a92", accent: "#2f6bff", soft: "#e0f5f3" },
  { id: "c-kraft", name: "Kraft", bg: "#f3e6cc", ink: "#3a2414", primary: "#b5462a", accent: "#2d6a4f", soft: "#fffaf0" },
  { id: "c-resto", name: "Piment", bg: "#1d0f0a", ink: "#f1e6df", primary: "#d7261e", accent: "#ffd23f", soft: "#ffffff" },
  { id: "c-nuit", name: "Nuit néon", bg: "#120a2a", ink: "#e9ddff", primary: "#6b12ff", accent: "#ffd23f", soft: "#f0288c" },
  { id: "c-immo", name: "Vert immobilier", bg: "#ffffff", ink: "#4c5d57", primary: "#0a7d5a", accent: "#ffd23f", soft: "#e6f3ee" },
  { id: "c-soldes", name: "Soldes", bg: "#ffe14d", ink: "#16141f", primary: "#ff4f8b", accent: "#2f6bff", soft: "#ffffff" },
  { id: "c-mariage", name: "Ivoire & or", bg: "#fbf6ee", ink: "#5f4d36", primary: "#3b2a18", accent: "#c9a24b", soft: "#8a6d2b" },
  { id: "c-fete", name: "Confettis", bg: "#fff7ea", ink: "#4a4458", primary: "#ff6b2c", accent: "#6b12ff", soft: "#16141f" },
  { id: "c-forum", name: "Émeraude", bg: "#0b3b3a", ink: "#d8efe9", primary: "#14b8a6", accent: "#ffd23f", soft: "#ffffff" },
  { id: "c-violet", name: "Violet & jaune", bg: "#ffffff", ink: "#16141f", primary: "#6b12ff", accent: "#ffd23f", soft: "#f3efff" },
  { id: "c-street", name: "Rouge streetwear", bg: "#ffffff", ink: "#16141f", primary: "#d7261e", accent: "#ffd23f", soft: "#16141f" },
  { id: "c-bordeaux", name: "Bordeaux", bg: "#f6d6d3", ink: "#7a2e3a", primary: "#7a2e3a", accent: "#f6d6d3", soft: "#ffffff" },
  { id: "c-bleu", name: "Bleu entreprise", bg: "#ffffff", ink: "#16141f", primary: "#0a3d91", accent: "#ffd23f", soft: "#e8f0ff" },
  { id: "c-maquis", name: "Maquis", bg: "#1b1410", ink: "#f1e6df", primary: "#e8a33d", accent: "#d7261e", soft: "#2a201a" },
  { id: "c-mangue", name: "Mangue", bg: "#ffffff", ink: "#16141f", primary: "#ff8a1f", accent: "#ffd23f", soft: "#fff3e0" },
  { id: "c-ardoise", name: "Ardoise", bg: "#16141f", ink: "#ffffff", primary: "#6b12ff", accent: "#ffd23f", soft: "#2a2633" },
  { id: "c-gabon", name: "Gabon", bg: "#ffffff", ink: "#16141f", primary: "#009e60", accent: "#fcd116", soft: "#3a75c4" },
  { id: "c-ouverture", name: "Rouge ouverture", bg: "#d7261e", ink: "#ffffff", primary: "#d7261e", accent: "#ffd23f", soft: "#16141f" },
  { id: "c-chantier", name: "Chantier", bg: "#16141f", ink: "#d9d9df", primary: "#f5b301", accent: "#f5b301", soft: "#2a2a2e" },
  { id: "c-vitrine", name: "Vitrine chic", bg: "#ffffff", ink: "#16141f", primary: "#16141f", accent: "#b08d3c", soft: "#f3efe4" },
];

/* ───────── Outils de saisie en pixels ───────── */

type PxEl = El & { lhPx?: number };
type Txt = Field | { text: string; id: string };
type TOpts = { align?: "left" | "center" | "right"; lines?: number; upper?: boolean; ls?: number; lh?: number; rot?: number };

const R = (x: number, y: number, w: number, h: number, fill: Color | undefined, o: Partial<Extract<El, { t: "rect" }>> = {}): PxEl =>
  ({ t: "rect", x, y, w, h, fill, ...o });
const E = (x: number, y: number, w: number, h: number, fill: Color | undefined, o: Partial<Extract<El, { t: "ellipse" }>> = {}): PxEl =>
  ({ t: "ellipse", x, y, w, h, fill, ...o });
const P = (id: PhotoId, x: number, y: number, w: number, h: number, o: { fx?: number; fy?: number; r?: number; arch?: boolean } = {}): PxEl =>
  ({ t: "photo", id: "photo", src: `/modeles/${id}.jpg`, iw: PH[id][0], ih: PH[id][1], x, y, w, h, ...o });
const L = (x: number, y: number, w: number, h: number, color: Color, on?: Color): PxEl => ({ t: "logo", x, y, w, h, color, on });
/**
 * Texte : `top` = haut de la boîte dans la maquette, `size` en px, `lhPx` = interligne CSS de la maquette (sinon « normal »).
 * `lh` (interligne du moteur) vaut lhPx / size quand il est donné.
 */
function T(what: Txt, x: number, top: number, w: number, size: number, font: FontKey, color: Color, o: TOpts & { lhPx?: number } = {}): PxEl {
  const [asc, normal] = METRICS[font];
  const css = o.lhPx ?? normal * size;
  const y = top + (css - normal * size) / 2 + (asc - ENGINE_ASCENT) * size;
  const src = typeof what === "string" ? { field: what } : what;
  const { lhPx, ...rest } = o;
  return { t: "text", ...src, x, y, w, h: 0, size, font, color, ...rest, lh: o.lh ?? (lhPx ? lhPx / size : undefined) };
}

/** Convertit une planche en pixels (W × H) en modèle (coordonnées relatives). */
function make(
  id: string, name: string, family: Family, [W, H]: [number, number],
  meta: { palette: string; kinds: Kind[]; fields: Partial<Record<Field, string>>; fonts?: string },
  sides: { bg: Color; els: PxEl[] }[],
): Template {
  const U = Math.min(W, H);
  const conv = (el: PxEl): El => {
    const { lhPx: _, ...e } = el as PxEl & { lhPx?: number };
    const box = { x: e.x / W, y: e.y / H, w: e.w / W, h: e.h / H };
    if (e.t === "text") return { ...e, ...box, size: e.size / U };
    if (e.t === "rect") return { ...e, ...box, r: e.r ? e.r / U : undefined, sw: e.sw ? e.sw / U : undefined, dash: e.dash ? e.dash / U : undefined };
    if (e.t === "ellipse") return { ...e, ...box, sw: e.sw ? e.sw / U : undefined, dash: e.dash ? e.dash / U : undefined };
    if (e.t === "photo") return { ...e, ...box, r: e.r ? e.r / U : undefined };
    return { ...e, ...box } as El;
  };
  return {
    id, name, family, palette: meta.palette, fonts: meta.fonts ?? "moderne", kinds: meta.kinds, fields: meta.fields, free: true,
    sides: sides.map((s): Side => ({ bg: s.bg, els: s.els.map(conv) })),
  };
}

const CARD: [number, number] = [510, 330];
const A5: [number, number] = [444, 630];
const ROLL: [number, number] = [255, 600];
const SQ: [number, number] = [360, 360];
const WIDE: [number, number] = [720, 360];

/** Verso commun des cartes : logo (ou initiales) et nom de l'entreprise, centrés. */
const versoCarte = (bg: Color, ink: Color, font: FontKey, size = 26): { bg: Color; els: PxEl[] } => ({
  bg,
  els: [L(205, 92, 100, 90, ink, bg), T("texte", 30, 206, 450, size, font, ink, { align: "center" })],
});

export const CANVA: Template[] = [
  /* ───────── Cartes (cartes de visite, badges, plaques, étiquettes de boîte) ───────── */
  make("c-cabinet", "Cabinet", "card", CARD, {
    palette: "c-marine", kinds: ["carte"], fonts: "elegant",
    fields: { titre: "Sandrine Obame", sousTitre: "Avocate au barreau du Gabon", texte: "Cabinet Obame & Associés", l1: "+241 77 12 34 56", l2: "s.obame@cabinet-obame.ga", l3: "Boulevard Triomphal, Libreville" },
  }, [
    { bg: "bg", els: [
      R(0, 0, 150, 330, "primary"),
      E(38, 110, 74, 74, undefined, { stroke: "accent", sw: 2 }),
      L(50, 128, 50, 38, "accent", "primary"),
      T("titre", 186, 72, 300, 32, "serif", "white"),
      T("sousTitre", 188, 120, 300, 10.5, "mont-semi", "accent", { upper: true, ls: 0.24 }),
      R(188, 152, 60, 2, "accent"),
      T("l1", 188, 182, 300, 13, "mont", "ink", { lhPx: 24 }),
      T("l2", 188, 206, 300, 13, "mont", "ink", { lhPx: 24 }),
      T("l3", 188, 230, 300, 13, "mont", "ink", { lhPx: 24 }),
    ] },
    versoCarte("bg", "accent", "serif"),
  ]),
  make("c-portrait", "Portrait", "card", CARD, {
    palette: "c-orange", kinds: ["carte"], fonts: "moderne",
    fields: { titre: "Jean-Paul Mba Ndong", sousTitre: "Consultant en stratégie", texte: "Mba Conseil", l1: "+241 66 45 78 90", l2: "jp.mba@conseil.ga", l3: "Quartier Louis, Libreville" },
  }, [
    { bg: "bg", els: [
      P("portrait-homme", 0, 0, 205, 330, { fy: 0.2 }),
      R(205, 0, 305, 330, "primary"),
      T("titre", 236, 58, 250, 30, "poppins-xb", "white", { lines: 2, lhPx: 32 }),
      T("sousTitre", 238, 134, 250, 13, "poppins-semi", "ink"),
      T("l1", 238, 196, 250, 12.5, "poppins", "white", { lhPx: 23 }),
      T("l2", 238, 219, 250, 12.5, "poppins", "white", { lhPx: 23 }),
      T("l3", 238, 242, 180, 12.5, "poppins", "white", { lhPx: 23 }),
      E(430, 262, 48, 48, "ink"),
      L(438, 274, 32, 24, "primary", "ink"),
    ] },
    versoCarte("primary", "white", "poppins-xb", 24),
  ]),
  make("c-studio", "Studio", "card", CARD, {
    palette: "c-jaune", kinds: ["carte"], fonts: "affiche",
    fields: { titre: "Kombila Design", sousTitre: "Graphisme · Logos · Web", texte: "Kombila Design", l1: "+241 74 00 11 22", l2: "hello@kombila.design", l3: "Libreville" },
  }, [
    { bg: "bg", els: [
      E(300, -90, 300, 300, "primary"),
      E(390, 190, 170, 170, "accent"),
      R(250, 230, 90, 90, "soft", { rot: 45 }),
      T("titre", 34, 46, 250, 38, "black", "ink", { upper: true, lines: 2, lhPx: 38 }),
      T("sousTitre", 36, 140, 250, 12, "mont-semi", "ink", { upper: true, ls: 0.25 }),
      T("l1", 36, 228, 220, 12.5, "mont", "ink", { lhPx: 22 }),
      T("l2", 36, 250, 220, 12.5, "mont", "ink", { lhPx: 22 }),
      T("l3", 36, 272, 220, 12.5, "mont", "ink", { lhPx: 22 }),
    ] },
    { bg: "primary", els: [
      E(-60, 200, 220, 220, "accent"),
      E(420, -50, 160, 160, "bg"),
      L(205, 82, 100, 90, "bg", "primary"),
      T("texte", 30, 200, 450, 30, "black", "bg", { align: "center", upper: true }),
    ] },
  ]),
  make("c-institut", "Institut", "card", CARD, {
    palette: "c-rose", kinds: ["carte"], fonts: "ceremonie",
    fields: { titre: "Belle d'Ébène", sousTitre: "Institut de beauté · Onglerie · Coiffure", texte: "Belle d'Ébène", l1: "+241 62 33 44 55 · Akanda, Libreville", l2: "", l3: "" },
  }, [
    { bg: "bg", els: [
      E(-60, 190, 260, 260, "soft"),
      E(360, -80, 220, 220, "accent"),
      T("titre", 30, 96, 450, 58, "script", "primary", { align: "center" }),
      T("sousTitre", 30, 178, 450, 11, "mont-semi", "primary", { align: "center", upper: true, ls: 0.45 }),
      R(185, 206, 140, 1, "primary"),
      T("l1", 30, 222, 450, 12, "mont", "ink", { align: "center" }),
      T("l2", 30, 242, 450, 12, "mont", "ink", { align: "center" }),
    ] },
    versoCarte("primary", "white", "script", 40),
  ]),
  make("c-cabinet-medical", "Plaque médicale", "card", CARD, {
    palette: "c-sante", kinds: ["marque"], fonts: "elegant",
    fields: { titre: "Cabinet médical Saint-Michel", sousTitre: "Médecine générale · Pédiatrie", texte: "Du lundi au samedi, de 8 h à 18 h", l1: "+241 77 55 66 77", l2: "Glass, Libreville", l3: "" },
  }, [
    { bg: "bg", els: [
      R(0, 0, 170, 330, "primary"),
      E(30, 90, 110, 110, undefined, { stroke: "white", sw: 2 }),
      L(45, 105, 80, 80, "white", "primary"),
      T("titre", 200, 70, 290, 30, "serif", "ink", { lines: 2, lhPx: 34 }),
      R(200, 152, 50, 3, "primary"),
      T("sousTitre", 200, 170, 290, 13, "mont-semi", "primary", { upper: true, ls: 0.12 }),
      T("texte", 200, 205, 290, 12.5, "mont", "ink", { lines: 2, lhPx: 20 }),
      T("l1", 200, 262, 290, 15, "geo", "ink"),
      T("l2", 200, 286, 290, 12, "mont", "ink"),
    ] },
  ]),
  make("c-boite", "Boîte gourmande", "card", CARD, {
    palette: "c-kraft", kinds: ["marque"], fonts: "elegant",
    fields: { titre: "Saveurs d'Owendo", sousTitre: "Confiseries artisanales", texte: "Coco · Arachide · Gingembre", l1: "Fabriqué au Gabon", l2: "Owendo", l3: "" },
  }, [
    { bg: "bg", els: [
      R(0, 0, 510, 26, "primary"),
      R(0, 304, 510, 26, "primary"),
      E(30, 56, 218, 218, "primary"),
      E(44, 70, 190, 190, undefined, { stroke: "soft", sw: 1.5, dash: 5 }),
      L(84, 110, 110, 110, "soft", "primary"),
      T("titre", 270, 78, 220, 40, "script", "ink", { lines: 2, lhPx: 44 }),
      T("sousTitre", 272, 176, 220, 11, "mont-semi", "primary", { upper: true, ls: 0.2 }),
      T("texte", 272, 204, 220, 13, "serif-italic", "ink", { lines: 2, lhPx: 18 }),
      R(272, 252, 120, 26, "accent", { r: 13 }),
      T("l1", 272, 258, 120, 10, "mont-semi", "white", { align: "center", upper: true }),
    ] },
  ]),

  /* ───────── Portrait (flyers, invitations, chemises, catalogues, textile) ───────── */
  make("c-restaurant", "Restaurant", "portrait", A5, {
    palette: "c-resto", kinds: ["promo"],
    fields: {
      titre: "Chez Maman Rose", sousTitre: "Cuisine maison · À emporter",
      texte: "Poulet braisé, riz jollof, poisson à l'odika, bananes plantains. Ouvert tous les jours de 11 h à 22 h.",
      l1: "3 500 F", l2: "Nzeng-Ayong, Libreville", l3: "077 45 12 89",
    },
  }, [
    { bg: "bg", els: [
      P("plat", 0, 0, 444, 400),
      R(-20, 330, 484, 140, "primary", { rot: -6 }),
      T("titre", 24, 360, 400, 64, "bebas", "white", { rot: -6, lhPx: 58 }),
      E(300, 40, 118, 118, "accent", { rot: 10 }),
      T({ text: "Le plat", id: "badge" }, 300, 66, 118, 12, "geo", "bg", { align: "center", upper: true }),
      T("l1", 306, 82, 106, 42, "bebas", "bg", { align: "center", lhPx: 38 }),
      T("sousTitre", 28, 480, 388, 30, "bebas", "accent"),
      T("texte", 28, 524, 388, 13, "mont", "ink", { lines: 3, lhPx: 21 }),
      T("l3", 28, 584, 180, 15, "geo", "white"),
      T("l2", 210, 586, 206, 13, "mont", "ink", { align: "right" }),
    ] },
  ]),
  make("c-soiree", "Soirée", "portrait", A5, {
    palette: "c-nuit", kinds: ["evenement"],
    fields: {
      titre: "Afro Night", sousTitre: "DJ Kassav' · Live Ndombolo · Entrée 5 000 F", texte: "",
      l1: "Samedi 14 décembre · 22 h", l2: "Le Patio, Glass", l3: "Réservations : 066 77 88 99",
    },
  }, [
    { bg: "bg", els: [
      P("soiree", 0, 0, 444, 630),
      R(0, 0, 444, 630, "primary", { opacity: 0.35, grad: { to: "soft", op: 0.55 } }),
      R(0, 315, 444, 315, "bg", { opacity: 0, grad: { to: "bg", op: 0.95 } }),
      T("l1", 28, 34, 388, 13, "geo", "white", { upper: true, ls: 0.46 }),
      T("titre", 22, 300, 400, 150, "bebas", "white", { upper: true, lines: 2, lhPx: 122 }),
      T("sousTitre", 28, 556, 388, 14, "mont-semi", "accent"),
      T("l2", 28, 584, 190, 12, "mont", "ink"),
      T("l3", 220, 584, 196, 12, "mont", "ink", { align: "right" }),
      E(340, 100, 80, 80, undefined, { stroke: "accent", sw: 3 }),
      T({ text: "VIP", id: "badge" }, 340, 122, 80, 30, "bebas", "accent", { align: "center", rot: -12 }),
    ] },
  ]),
  make("c-immobilier", "Immobilier", "portrait", A5, {
    palette: "c-immo", kinds: ["promo"], fonts: "elegant",
    fields: { titre: "Villa moderne avec jardin", sousTitre: "Angondjé, Akanda · Titre foncier", texte: "", l1: "185 000 000 F", l2: "", l3: "074 22 33 44" },
  }, [
    { bg: "bg", els: [
      P("maison", 0, 0, 444, 330),
      R(24, 290, 154, 48, "primary"),
      T({ text: "À vendre", id: "badge" }, 24, 299, 154, 26, "black", "white", { align: "center", upper: true }),
      T("titre", 28, 368, 390, 28, "serif", "#0f2d24", { lhPx: 32 }),
      T("sousTitre", 28, 410, 390, 13, "mont", "ink"),
      R(28, 450, 122, 66, "soft", { r: 10 }), R(160, 450, 122, 66, "soft", { r: 10 }), R(292, 450, 122, 66, "soft", { r: 10 }),
      T({ text: "4", id: "n1" }, 28, 459, 122, 22, "black", "primary", { align: "center" }),
      T({ text: "3", id: "n2" }, 160, 459, 122, 22, "black", "primary", { align: "center" }),
      T({ text: "600 m²", id: "n3" }, 292, 459, 122, 22, "black", "primary", { align: "center" }),
      T({ text: "chambres", id: "t1" }, 28, 489, 122, 11, "mont", "#0f2d24", { align: "center" }),
      T({ text: "salles de bain", id: "t2" }, 160, 489, 122, 11, "mont", "#0f2d24", { align: "center" }),
      T({ text: "terrain", id: "t3" }, 292, 489, 122, 11, "mont", "#0f2d24", { align: "center" }),
      R(0, 548, 444, 82, "#0f2d24"),
      T({ text: "Prix", id: "prix" }, 28, 562, 120, 12, "mont-semi", "#9fd8c3", { upper: true }),
      T("l1", 28, 578, 230, 28, "black", "white"),
      T("l3", 262, 584, 160, 15, "geo", "accent", { align: "right" }),
    ] },
  ]),
  make("c-soldes", "Soldes", "portrait", A5, {
    palette: "c-soldes", kinds: ["promo"],
    fields: { titre: "-50%", sousTitre: "Grandes soldes", texte: "Du 1er au 31 décembre · Boutique Mode Mbolo", l1: "Sur tout le magasin", l2: "Louis, Libreville", l3: "077 12 12 12" },
  }, [
    { bg: "bg", els: [
      E(-80, -60, 320, 320, "primary"),
      E(250, 430, 300, 300, "accent"),
      E(300, 60, 70, 70, "ink"),
      T("sousTitre", 20, 150, 404, 40, "black", "ink", { align: "center", upper: true }),
      T("titre", 10, 200, 424, 146, "black", "ink", { align: "center", lhPx: 170 }),
      R(82, 388, 280, 40, "ink"),
      T("l1", 82, 398, 280, 16, "geo", "bg", { align: "center", upper: true, ls: 0.12 }),
      T("texte", 30, 450, 384, 14, "mont-semi", "ink", { align: "center", lines: 2, lhPx: 20 }),
      T("l3", 28, 560, 230, 15, "geo", "ink"),
      T("l2", 290, 560, 140, 15, "geo", "white"),
    ] },
  ]),
  make("c-mariage", "Mariage", "portrait", A5, {
    palette: "c-mariage", kinds: ["evenement"], fonts: "ceremonie",
    fields: {
      titre: "Aïcha & Karim", sousTitre: "Nous nous marions", texte: "Suivi d'une réception à l'Hôtel Le Cristal",
      l1: "Samedi 20 juin 2026 à 15 h", l2: "Mairie du 1er arrondissement, Libreville", l3: "RSVP · 077 00 11 22",
    },
  }, [
    { bg: "bg", els: [
      R(14, 14, 416, 602, undefined, { stroke: "accent", sw: 1 }),
      P("maries", 102, 46, 240, 300, { arch: true, fy: 0.25 }),
      T("sousTitre", 30, 366, 384, 11, "mont-semi", "soft", { align: "center", upper: true, ls: 0.45 }),
      T("titre", 30, 388, 384, 54, "script", "primary", { align: "center" }),
      T("l1", 30, 470, 384, 18, "serif-italic", "primary", { align: "center" }),
      T("l2", 40, 500, 364, 12.5, "mont", "ink", { align: "center", lhPx: 20 }),
      T("texte", 40, 520, 364, 12.5, "mont", "ink", { align: "center", lhPx: 20 }),
      T("l3", 30, 566, 384, 11, "mont-semi", "soft", { align: "center", upper: true, ls: 0.27 }),
    ] },
  ]),
  make("c-anniversaire", "Anniversaire", "portrait", A5, {
    palette: "c-fete", kinds: ["evenement"],
    fields: { titre: "30", sousTitre: "Venez fêter", texte: "ans de Murielle", l1: "Vendredi 6 mars · 19 h", l2: "Résidence Les Palmiers, Owendo", l3: "RSVP · 066 00 00 00" },
  }, [
    { bg: "bg", els: [
      E(40, 40, 18, 18, "primary"), E(370, 70, 26, 26, "accent"),
      R(90, 120, 14, 40, "#2fbf8f", { r: 7, rot: 35 }), R(330, 180, 14, 40, "#ffd23f", { r: 7, rot: -30 }),
      R(60, 500, 22, 22, "#ff4f8b", { rot: 20 }), E(360, 520, 16, 16, "#2f6bff"),
      R(40, 300, 12, 34, "accent", { r: 6, rot: -20 }), E(392, 380, 20, 20, "#2fbf8f"),
      T("sousTitre", 20, 150, 404, 14, "geo", "accent", { align: "center", upper: true, ls: 0.43 }),
      T("titre", 20, 178, 404, 160, "black", "primary", { align: "center", lhPx: 160 }),
      T("texte", 20, 336, 404, 52, "script", "soft", { align: "center" }),
      T("l1", 20, 420, 404, 15, "mont-semi", "soft", { align: "center" }),
      T("l2", 20, 446, 404, 13, "mont", "ink", { align: "center" }),
      T("l3", 20, 470, 404, 12, "mont", "ink", { align: "center" }),
    ] },
  ]),
  make("c-forum", "Forum", "portrait", A5, {
    palette: "c-forum", kinds: ["evenement", "promo"], fonts: "elegant",
    fields: {
      titre: "Osez entreprendre au Gabon", sousTitre: "Forum de l'entrepreneuriat",
      texte: "Conférences, ateliers et rencontres avec les acteurs qui font bouger l'économie gabonaise.",
      l1: "12 & 13 mars 2026", l2: "Palais des congrès, Libreville", l3: "Inscription gratuite : 077 20 30 40",
    },
  }, [
    { bg: "bg", els: [
      P("conference", 0, 0, 444, 380, { fy: 0.3 }),
      R(-30, 300, 504, 140, "bg", { rot: -7 }),
      R(0, 360, 444, 270, "bg"),
      R(28, 318, 40, 4, "accent"),
      T("sousTitre", 28, 332, 390, 12, "geo", "accent", { upper: true, ls: 0.25 }),
      T("titre", 28, 356, 390, 36, "serif", "white", { lines: 2, lhPx: 40 }),
      T("texte", 28, 450, 388, 13, "mont", "ink", { lines: 3, lhPx: 20 }),
      R(28, 528, 200, 40, "primary", { r: 20 }),
      T("l1", 28, 539, 200, 14, "geo", "white", { align: "center" }),
      T("l2", 28, 580, 388, 12, "mont-semi", "ink"),
      T("l3", 28, 600, 388, 12, "mont", "ink"),
    ] },
  ]),
  make("c-catalogue", "Catalogue", "portrait", A5, {
    palette: "c-violet", kinds: ["promo"], fonts: "affiche",
    fields: {
      titre: "Okoumé Conseil", sousTitre: "Catalogue produits", texte: "Solutions d'impression et de communication pour les entreprises.",
      l1: "2026", l2: "", l3: "www.okoume.ga",
    },
  }, [
    { bg: "bg", els: [
      P("femme-affaires", 0, 0, 444, 420, { fy: 0.18 }),
      R(0, 380, 444, 250, "primary"),
      E(330, 330, 92, 92, "accent"),
      T("l1", 330, 359, 92, 26, "black", "ink", { align: "center" }),
      T("sousTitre", 28, 410, 290, 12, "geo", "accent", { upper: true, ls: 0.3 }),
      T("titre", 28, 434, 390, 40, "black", "white", { lines: 2, lhPx: 42 }),
      T("texte", 28, 532, 388, 13, "mont", "white", { lines: 2, lhPx: 20 }),
      T("l3", 28, 590, 388, 12, "geo", "accent"),
    ] },
  ]),
  make("c-streetwear", "Streetwear", "portrait", A5, {
    palette: "c-street", kinds: ["marque"],
    fields: { titre: "Libreville", sousTitre: "Est. 2026", texte: "Made in Gabon", l1: "", l2: "", l3: "" },
  }, [
    { bg: "bg", els: [
      E(72, 90, 300, 300, "primary"),
      E(92, 110, 260, 260, undefined, { stroke: "accent", sw: 3, dash: 10 }),
      T("titre", 10, 196, 424, 84, "bebas", "ink", { align: "center", upper: true }),
      R(132, 300, 180, 34, "ink"),
      T("sousTitre", 132, 308, 180, 15, "geo", "accent", { align: "center", upper: true, ls: 0.3 }),
      T("texte", 20, 420, 404, 48, "script", "ink", { align: "center" }),
    ] },
  ]),

  /* ───────── Format allongé (roll-up, dépliant DL) ───────── */
  make("c-rollup-beaute", "Roll-up beauté", "tall", ROLL, {
    palette: "c-bordeaux", kinds: ["promo"], fonts: "ceremonie",
    fields: { titre: "Belle d'Ébène", sousTitre: "Institut de beauté", texte: "Maquillage · Tresses Onglerie · Soins", l1: "", l2: "Akanda, Libreville", l3: "062 33 44 55" },
  }, [
    { bg: "bg", els: [
      P("beaute", 0, 150, 255, 300, { fx: 0.55 }),
      R(0, 0, 255, 150, "primary"),
      T("titre", 10, 34, 235, 40, "script", "white", { align: "center" }),
      T("sousTitre", 10, 96, 235, 8.5, "mont-semi", "accent", { align: "center", upper: true, ls: 0.35 }),
      T("texte", 15, 466, 225, 20, "serif", "primary", { align: "center", lines: 2, lhPx: 24 }),
      R(52, 534, 150, 30, "primary", { r: 15 }),
      T("l3", 52, 542, 150, 11, "geo", "white", { align: "center" }),
      T("l2", 10, 576, 235, 9, "mont", "primary", { align: "center" }),
    ] },
  ]),
  make("c-rollup-entreprise", "Roll-up entreprise", "tall", ROLL, {
    palette: "c-bleu", kinds: ["promo"], fonts: "affiche",
    fields: {
      titre: "Votre partenaire télécoms", sousTitre: "Okoumé Télécom", texte: "Fibre, téléphonie et réseaux pour les entreprises, partout au Gabon.",
      l1: "", l2: "", l3: "077 30 40 50",
    },
  }, [
    { bg: "bg", els: [
      P("femme-affaires", 0, 0, 255, 330, { fy: 0.2 }),
      R(0, 300, 255, 300, "primary"),
      R(0, 290, 120, 20, "accent"),
      L(20, 330, 60, 40, "white", "primary"),
      T("sousTitre", 20, 384, 215, 9, "geo", "accent", { upper: true, ls: 0.3 }),
      T("titre", 20, 402, 215, 28, "black", "white", { lines: 3, lhPx: 30 }),
      T("texte", 20, 498, 215, 10.5, "mont", "white", { lines: 3, lhPx: 16 }),
      R(20, 552, 215, 30, "accent", { r: 15 }),
      T("l3", 20, 559, 215, 12, "geo", "ink", { align: "center" }),
    ] },
  ]),
  make("c-menu", "Menu", "tall", ROLL, {
    palette: "c-maquis", kinds: ["promo"], fonts: "elegant",
    fields: { titre: "Menu", sousTitre: "Maquis Le Baobab", texte: "Ouvert tous les jours de 11 h à 23 h · Livraison possible", l1: "", l2: "Akébé, Libreville", l3: "066 12 34 56" },
  }, [
    { bg: "bg", els: [
      R(12, 12, 231, 576, undefined, { stroke: "primary", sw: 1 }),
      T("titre", 20, 40, 215, 56, "bebas", "primary", { align: "center", upper: true }),
      T("sousTitre", 20, 104, 215, 16, "serif-italic", "white", { align: "center" }),
      R(102, 136, 50, 2, "primary"),
      ...([["Poulet braisé", "3 500"], ["Poisson à l'odika", "4 000"], ["Nyembwe de poulet", "4 500"], ["Brochettes (x5)", "2 000"], ["Jus de bissap", "1 000"]] as const)
        .flatMap(([n, p], i): PxEl[] => [
          T({ text: n, id: `plat${i + 1}` }, 26, 164 + i * 50, 150, 13, "mont-semi", "white"),
          T({ text: p, id: `prix${i + 1}` }, 170, 164 + i * 50, 59, 13, "geo", "primary", { align: "right" }),
          R(26, 190 + i * 50, 203, 1, "soft"),
        ]),
      T("texte", 26, 430, 203, 11, "mont", "ink", { align: "center", lines: 3, lhPx: 17 }),
      R(52, 506, 150, 32, "accent", { r: 16 }),
      T("l3", 52, 514, 150, 13, "geo", "white", { align: "center" }),
      T("l2", 20, 552, 215, 10, "mont", "ink", { align: "center" }),
    ] },
  ]),

  /* ───────── Carré (étiquettes, stickers, urnes) ───────── */
  make("c-etiquette-ronde", "Étiquette ronde", "square", SQ, {
    palette: "c-mangue", kinds: ["marque"],
    fields: { titre: "Saveurs d'Owendo", sousTitre: "100 % naturel · 50 cl", texte: "Mangue", l1: "", l2: "", l3: "" },
  }, [
    { bg: "white", els: [
      E(0, 0, 360, 360, "primary"),
      E(18, 18, 324, 324, undefined, { stroke: "soft", sw: 2, dash: 6 }),
      E(110, 44, 140, 140, "accent"),
      E(152, 26, 30, 50, "#2fbf8f", { rot: -25 }),
      T("texte", 20, 178, 320, 40, "black", "white", { align: "center", upper: true }),
      T("titre", 30, 226, 300, 30, "script", "ink", { align: "center" }),
      T("sousTitre", 40, 276, 280, 12, "mont-semi", "soft", { align: "center", upper: true, ls: 0.25 }),
    ] },
  ]),
  make("c-sticker-badge", "Badge", "square", SQ, {
    palette: "c-ardoise", kinds: ["marque"], fonts: "affiche",
    fields: { titre: "Kombila", sousTitre: "Studio créatif", texte: "Libreville · Gabon", l1: "", l2: "", l3: "" },
  }, [
    { bg: "bg", els: [
      E(30, 30, 300, 300, "soft"),
      E(46, 46, 268, 268, undefined, { stroke: "accent", sw: 3 }),
      L(130, 70, 100, 80, "accent", "soft"),
      T("titre", 50, 160, 260, 54, "bebas", "white", { align: "center", upper: true }),
      T("sousTitre", 60, 222, 240, 13, "mont-semi", "accent", { align: "center", upper: true, ls: 0.3 }),
      T("texte", 60, 262, 240, 11, "mont", "ink", { align: "center" }),
    ] },
  ]),
  make("c-urne", "Urne", "square", SQ, {
    palette: "c-gabon", kinds: ["marque"], fonts: "affiche",
    fields: { titre: "Boîte à idées", sousTitre: "Votre avis compte", texte: "Glissez vos suggestions ici, merci !", l1: "", l2: "", l3: "" },
  }, [
    { bg: "bg", els: [
      R(0, 300, 360, 20, "primary"), R(0, 320, 360, 20, "accent"), R(0, 340, 360, 20, "soft"),
      L(140, 40, 80, 60, "primary", "bg"),
      T("titre", 20, 116, 320, 46, "black", "ink", { align: "center", lines: 2, lhPx: 48 }),
      R(150, 222, 60, 4, "accent"),
      T("sousTitre", 20, 236, 320, 14, "geo", "primary", { align: "center", upper: true, ls: 0.2 }),
      T("texte", 30, 262, 300, 12, "mont", "ink", { align: "center", lines: 2 }),
    ] },
  ]),

  /* ───────── Large (bâches, vinyles, lettrage) ───────── */
  make("c-ouverture", "Grande ouverture", "wide", WIDE, {
    palette: "c-ouverture", kinds: ["promo"],
    fields: { titre: "Grande ouverture", sousTitre: "Quincaillerie Moderne Ndong & Fils", texte: "", l1: "Le 15 janvier", l2: "", l3: "-20 % le jour J · 077 88 99 00" },
  }, [
    { bg: "bg", els: [
      P("homme-costume", 0, 0, 300, 360, { fy: 0.3 }),
      R(270, -40, 80, 440, "primary", { rot: 8 }),
      T("l1", 340, 44, 360, 16, "geo", "accent", { upper: true, ls: 0.37 }),
      T("titre", 336, 72, 370, 96, "bebas", "white", { upper: true, lines: 2, lhPx: 84 }),
      T("sousTitre", 340, 250, 360, 17, "mont-semi", "white"),
      R(340, 286, 330, 36, "accent"),
      T("l3", 340, 294, 330, 15, "geo", "soft", { align: "center" }),
    ] },
  ]),
  make("c-chantier", "Chantier", "wide", WIDE, {
    palette: "c-chantier", kinds: ["promo"], fonts: "affiche",
    fields: {
      titre: "Ndong Construction", sousTitre: "Bâtiment · Travaux publics", texte: "Gros œuvre, rénovation, routes et ouvrages. Devis gratuit sous 48 h.",
      l1: "", l2: "", l3: "077 66 55 44",
    },
  }, [
    { bg: "bg", els: [
      P("btp", 430, 0, 290, 360, { fy: 0.25 }),
      R(400, -40, 60, 440, "accent", { rot: 10 }),
      R(370, -40, 20, 440, "accent", { rot: 10, opacity: 0.5 }),
      T("sousTitre", 40, 50, 340, 14, "geo", "accent", { upper: true, ls: 0.3 }),
      T("titre", 40, 80, 340, 50, "black", "white", { upper: true, lines: 2, lhPx: 52 }),
      T("texte", 40, 200, 320, 14, "mont", "ink", { lines: 3, lhPx: 21 }),
      R(40, 280, 230, 44, "accent", { r: 22 }),
      T("l3", 40, 291, 230, 18, "geo", "bg", { align: "center" }),
    ] },
  ]),
  make("c-vitrine", "Vitrine", "wide", WIDE, {
    palette: "c-vitrine", kinds: ["marque"], fonts: "elegant",
    fields: { titre: "Maison Nzé", sousTitre: "Prêt-à-porter · Accessoires", texte: "Du lundi au samedi · 9 h – 19 h", l1: "", l2: "", l3: "" },
  }, [
    { bg: "bg", els: [
      R(30, 30, 660, 300, undefined, { stroke: "accent", sw: 2 }),
      L(320, 56, 80, 56, "accent", "bg"),
      T("titre", 40, 120, 640, 80, "serif", "ink", { align: "center" }),
      R(330, 232, 60, 2, "accent"),
      T("sousTitre", 40, 246, 640, 16, "mont-semi", "accent", { align: "center", upper: true, ls: 0.4 }),
      T("texte", 40, 282, 640, 13, "mont", "ink", { align: "center" }),
    ] },
  ]),
];
