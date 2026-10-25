import type { RItem, RPrim, RSide } from "./layout.ts";
import type { Design, Side, Template } from "./model.ts";

/**
 * Profil d'édition de chaque support : faces, orientation, forme de découpe, dimensions libres,
 * patron (boîte), zones techniques (pied de roll-up, œillets, trous de fixation) et outils utiles.
 */
export type Orient = "portrait" | "paysage";
export type CutShape = "rect" | "arrondi" | "rond" | "ovale";
export type BoxDims = { L: number; l: number; H: number };
export type Tool = "texte" | "images" | "modeles" | "clipart" | "logo" | "qr";

export type Support = {
  id: string;
  /** Libellés des deux faces ; `verso` : toujours, selon l'option « Impression », ou jamais. */
  faces: [string, string];
  verso: "always" | "option" | "never";
  orient?: boolean;
  shapes?: CutShape[];
  /** Dimensions saisies (cm) pour le grand format. */
  custom?: { min: number; max: number };
  /** Boîte pliante : patron calculé depuis longueur × largeur × hauteur (mm). */
  box?: BoxDims;
  /** Rayon des coins (mm) quand la découpe est arrondie. */
  corner?: number;
  safe: number;
  tools: Tool[];
  note?: string;
};

const ALL: Tool[] = ["texte", "images", "modeles", "clipart", "logo", "qr"];
const base = (id: string, o: Partial<Support> = {}): Support => ({ id, faces: ["Recto", "Verso"], verso: "never", safe: 3, tools: ALL, ...o });

export function supportFor(categorySlug: string, slug: string): Support {
  if (categorySlug === "cartes-de-visite") return base("carte", { verso: "option", orient: true, corner: 3 });
  if (slug.startsWith("badge")) return base("badge", { orient: true, corner: 3, verso: "always" });
  if (categorySlug === "cartes-invitations") return base("invitation", { orient: true, verso: "always" });
  if (categorySlug === "flyers") return base("flyer", { verso: "option", orient: true });
  if (slug.startsWith("chemise")) return base("chemise", { faces: ["Face avant", "Dos"], verso: "always", safe: 5 });
  if (slug.startsWith("catalogue")) return base("catalogue", { faces: ["Couverture", "4e de couverture"], verso: "always", orient: true, safe: 5 });
  if (slug.startsWith("roll-up")) return base("rollup", { safe: 20, note: "Le bas (10 cm, hachuré) est caché dans le pied : n’y mettez rien d’important." });
  if (slug.includes("plaque")) return base("plaque", { orient: true, safe: 20, note: "Les 4 ronds marquent les trous de fixation (entretoises)." });
  if (slug.includes("urne")) return base("urne", { faces: ["Face avant", "Côté"], verso: "always", safe: 10, note: "Visuel collé sur la face avant ; la fente reste en haut." });
  if (slug.startsWith("bache")) return base("bache", { custom: { min: 30, max: 1000 }, safe: 30, note: "Les ronds marquent les œillets : gardez-les libres." });
  if (slug.includes("vinyle-adhesif")) return base("vinyle", { custom: { min: 10, max: 500 }, safe: 10 });
  if (slug.includes("lettrage")) return base("lettrage", { tools: ["texte", "modeles", "clipart", "logo"], safe: 10, note: "Lettrage découpé : seuls les textes et formes pleines sont découpés, d’une seule couleur. Le fond n’est pas imprimé." });
  if (slug.includes("stickers")) return base("sticker", { shapes: ["rond", "arrondi", "rect", "ovale"], corner: 5, safe: 3 });
  if (slug.includes("etiquettes")) return base("etiquette", { shapes: ["arrondi", "rect", "rond", "ovale"], corner: 4, safe: 2 });
  if (slug.includes("dtf")) return base("textile", { tools: ["texte", "images", "modeles", "clipart", "logo", "qr"], safe: 0, note: "Impression DTF : le fond de couleur est imprimé tel quel. Pour un t-shirt, préférez un fond blanc ou une photo détourée." });
  if (categorySlug === "packaging") return base("boite", { faces: ["Face avant", "Face arrière"], verso: "always", box: { L: 100, l: 50, H: 150 }, safe: 3 });
  return base("autre");
}

/* ───────── Géométrie (mm) ───────── */

const f = (n: number) => Math.round(n * 100) / 100;
export function rectD(x: number, y: number, w: number, h: number, r = 0) {
  r = Math.min(r, w / 2, h / 2);
  if (!r) return `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;
  return `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`;
}
export function ellipseD(x: number, y: number, w: number, h: number) {
  const rx = w / 2, ry = h / 2, cx = x + rx;
  return `M${f(cx)} ${f(y)}A${f(rx)} ${f(ry)} 0 1 1 ${f(cx)} ${f(y + h)}A${f(rx)} ${f(ry)} 0 1 1 ${f(cx)} ${f(y)}Z`;
}

/**
 * Repères d'une face : contour de coupe, zone de sécurité, plis, trous, zones hachurées.
 * `shaped` : la coupe n'est pas le rectangle fini (on grise ce qui tombe hors de la forme).
 */
export type Cut = {
  d: string; safe?: string; shaped?: boolean;
  folds?: [number, number, number, number][]; holes?: { cx: number; cy: number; r: number }[];
  hatch?: { d: string; label?: string; box: Rect }[];
  /** Panneau mis en avant (face en cours d'édition d'un patron). */
  focus?: { x: number; y: number; w: number; h: number };
};

export function cutFor(s: Support, d: Design, w: number, h: number, opts: { rounded?: boolean; eyelets?: boolean } = {}): Cut {
  const shape = s.shapes ? d.shape ?? s.shapes[0] : opts.rounded ? "arrondi" : "rect";
  const m = s.safe;
  const cut: Cut = { d: rectD(0, 0, w, h), safe: m ? rectD(m, m, w - 2 * m, h - 2 * m) : undefined };
  if (shape === "arrondi") {
    const r = s.corner ?? 3;
    cut.d = rectD(0, 0, w, h, r);
    cut.safe = rectD(m, m, w - 2 * m, h - 2 * m, Math.max(r - m, 0));
    cut.shaped = true;
  } else if (shape === "rond" || shape === "ovale") {
    cut.d = ellipseD(0, 0, w, h);
    cut.safe = ellipseD(m, m, w - 2 * m, h - 2 * m);
    cut.shaped = true;
  }
  if (s.id === "rollup") {
    const foot = Math.min(100, h * 0.08);
    cut.hatch = [{ d: rectD(0, h - foot, w, foot), label: "Pied (caché)", box: { x: 0, y: h - foot, w, h: foot } }];
  }
  if (s.id === "plaque") {
    const i = Math.min(15, Math.min(w, h) * 0.08), r = Math.min(5, i * 0.4);
    cut.holes = [[i, i], [w - i, i], [i, h - i], [w - i, h - i]].map(([cx, cy]) => ({ cx, cy, r }));
  }
  if (s.id === "bache" && opts.eyelets) {
    // Œillets tous les 50 cm environ, à 2,5 cm du bord, coins compris.
    const i = 25, r = 6;
    const along = (len: number) => { const n = Math.max(1, Math.round((len - 2 * i) / 500)); return Array.from({ length: n + 1 }, (_, k) => i + (k * (len - 2 * i)) / n); };
    const xs = along(w), ys = along(h);
    const holes = [...xs.flatMap((x) => [{ cx: x, cy: i, r }, { cx: x, cy: h - i, r }]), ...ys.slice(1, -1).flatMap((y) => [{ cx: i, cy: y, r }, { cx: w - i, cy: y, r }])];
    cut.holes = holes;
  }
  if (s.id === "urne") {
    // Fente de l'urne, en haut et au centre de la face avant.
    const sh = Math.min(12, h * 0.06);
    cut.hatch = [{ d: rectD(w * 0.3, 0, w * 0.4, sh, 2), label: "Fente", box: { x: w * 0.3, y: 0, w: w * 0.4, h: sh } }];
  }
  return cut;
}

/* ───────── Boîte pliante (patron à plat) ───────── */

export type Net = {
  w: number; h: number; cut: Cut;
  panels: { front: Rect; back: Rect; side1: Rect; side2: Rect; lidTop: Rect; lidBottom: Rect };
};
type Rect = { x: number; y: number; w: number; h: number };

/** Patron d'une boîte à rabats : côté | face avant | côté | face arrière (couvercles) | patte de collage. */
export function boxNet({ L, l, H }: BoxDims): Net {
  const t = Math.min(l * 0.8, H * 0.4, 40);       // languette rentrante
  const df = Math.min(l * 0.9, L * 0.9);           // rabats anti-poussière
  const s = df * 0.25;                              // biais des rabats
  const g = Math.min(15, Math.max(8, l * 0.4));     // patte de collage
  const rr = Math.min(t * 0.9, L / 2);
  const T = l + t;
  const a = 0, b = l, c = l + L, e = 2 * l + L, fx = 2 * l + 2 * L, gx = fx + g;
  const top = T, bot = T + H;
  const P = (pts: (string | number)[]) => pts.map((v) => (typeof v === "number" ? f(v) : v)).join(" ");
  const d = P([
    "M", a, top - df, "L", b - s, top - df, "L", b, top, "L", c, top,
    "L", c + s, top - df, "L", e, top - df, "L", e, top,
    "L", e, top - l, "L", e, top - l - t + rr, "A", rr, rr, 0, 0, 1, e + rr, top - l - t, "L", fx - rr, top - l - t, "A", rr, rr, 0, 0, 1, fx, top - l - t + rr, "L", fx, top,
    "L", gx, top + g, "L", gx, bot - g, "L", fx, bot,
    "L", fx, bot + l + t - rr, "A", rr, rr, 0, 0, 1, fx - rr, bot + l + t, "L", e + rr, bot + l + t, "A", rr, rr, 0, 0, 1, e, bot + l + t - rr, "L", e, bot,
    "L", e, bot + df, "L", c + s, bot + df, "L", c, bot, "L", b, bot, "L", b - s, bot + df, "L", a, bot + df, "Z",
  ]);
  const folds: Cut["folds"] = [
    [b, top, b, bot], [c, top, c, bot], [e, top, e, bot], [fx, top, fx, bot],
    [a, top, b, top], [a, bot, b, bot], [c, top, e, top], [c, bot, e, bot],
    [e, top, fx, top], [e, bot, fx, bot], [e, top - l, fx, top - l], [e, bot + l, fx, bot + l],
  ];
  const glue = P(["M", fx, top, "L", gx, top + g, "L", gx, bot - g, "L", fx, bot, "Z"]);
  return {
    w: gx, h: 2 * T + H,
    cut: { d, folds, hatch: [{ d: glue, label: "Colle", box: { x: fx, y: top, w: g, h: H } }], shaped: true },
    panels: {
      side1: { x: a, y: top, w: l, h: H }, front: { x: b, y: top, w: L, h: H }, side2: { x: c, y: top, w: l, h: H },
      back: { x: e, y: top, w: L, h: H }, lidTop: { x: e, y: top - l, w: L, h: l }, lidBottom: { x: e, y: bot, w: L, h: l },
    },
  };
}

/** Décale un élément dessiné de (dx, dy) mm. */
export function shiftItem(it: RItem, dx: number, dy: number): RItem {
  const turn = <T extends { rot?: { deg: number; cx: number; cy: number } }>(o: T) => (o.rot ? { rot: { ...o.rot, cx: o.rot.cx + dx, cy: o.rot.cy + dy } } : {});
  const box = <T extends { x: number; y: number; w: number; h: number }>(c: T) => ({ ...c, x: c.x + dx, y: c.y + dy });
  if (it.t === "rect") return { ...it, x: it.x + dx, y: it.y + dy, ...turn(it) };
  if (it.t === "ellipse") return { ...it, cx: it.cx + dx, cy: it.cy + dy, ...turn(it) };
  if (it.t === "text") return { ...it, x: it.x + dx, lines: it.lines.map((l) => ({ ...l, y: l.y + dy })), ...turn(it) };
  if (it.t === "image") return { ...it, x: it.x + dx, y: it.y + dy, clip: it.clip && box(it.clip) };
  return {
    ...it, clip: it.clip && box(it.clip),
    prims: it.prims.map((p): RPrim => {
      if (p.k === "rect") return { ...p, x: p.x + dx, y: p.y + dy };
      if (p.k === "poly") return { ...p, pts: p.pts.map((v, i) => v + (i % 2 ? dy : dx)) };
      return { ...p, cx: p.cx + dx, cy: p.cy + dy };
    }),
  };
}

/**
 * Patron imprimé : face avant et face arrière posées sur leurs panneaux, côtés et couvercles
 * à la couleur de fond. Une seule planche, avec son tracé de découpe et ses plis.
 */
export function composeBox(faces: RSide[], net: Net, focus = 0): RSide {
  const { panels } = net;
  const items: RItem[] = [];
  const back = faces[1] ?? faces[0];
  // Le dos, ses couvercles et la patte prennent la couleur de la face arrière.
  items.push({ t: "rect", x: panels.back.x, y: -3, w: net.w - panels.back.x + 3, h: net.h + 6, r: 0, fill: back.bg, opacity: 1 });
  const place = (side: RSide, p: Rect) => side.items.forEach((it) => items.push(shiftItem(it, p.x, p.y)));
  place(faces[0], panels.front);
  place(back, panels.back);
  const p = focus ? panels.back : panels.front;
  return { w: net.w, h: net.h, bleed: 3, bg: faces[0].bg, items, cut: { ...net.cut, focus: p } };
}

/* ───────── Verso générique (supports dont le modèle n'a qu'une face) ───────── */

/** Verso sobre : logo (ou initiales), nom, sous-titre et coordonnées, sur la couleur principale. */
export const GENERIC_VERSO: Side = {
  bg: "primary",
  els: [
    { t: "logo", x: 0.38, y: 0.12, w: 0.24, h: 0.2, color: "onPrimary", on: "primary" },
    { t: "text", field: "titre", x: 0.08, y: 0.4, w: 0.84, h: 0.12, size: 0.085, role: "head", color: "onPrimary", align: "center", lines: 2 },
    { t: "text", field: "sousTitre", x: 0.1, y: 0.58, w: 0.8, h: 0.06, size: 0.045, role: "sub", color: "onPrimary", align: "center" },
    { t: "rect", x: 0.44, y: 0.68, w: 0.12, h: 0.006, fill: "accent" },
    { t: "text", field: "l1", x: 0.08, y: 0.74, w: 0.84, h: 0.05, size: 0.04, role: "body", color: "onPrimary", align: "center" },
    { t: "text", field: "l2", x: 0.08, y: 0.8, w: 0.84, h: 0.05, size: 0.04, role: "body", color: "onPrimary", align: "center" },
    { t: "text", field: "l3", x: 0.08, y: 0.86, w: 0.84, h: 0.05, size: 0.04, role: "body", color: "onPrimary", align: "center" },
  ],
};

/** Modèle complété d'un verso générique quand le support en demande un et que le modèle n'en a pas. */
export const withVerso = (tpl: Template): Template => (tpl.sides.length > 1 ? tpl : { ...tpl, sides: [...tpl.sides, GENERIC_VERSO] });
