import { type Doc, type Shape, type TextShape, type RectShape, type EllipseShape, uid } from "./types";

export interface Format {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const FORMATS: Format[] = [
  { id: "affiche", label: "Affiche (A3)", width: 1240, height: 1754 },
  { id: "flyer", label: "Flyer (A5)", width: 874, height: 1240 },
  { id: "post", label: "Post Instagram", width: 1080, height: 1080 },
  { id: "story", label: "Story / Statut", width: 1080, height: 1920 },
  { id: "youtube", label: "Miniature YouTube", width: 1280, height: 720 },
  { id: "carte", label: "Carte de visite", width: 1050, height: 600 },
];

const base = { rotation: 0, opacity: 1, visible: true };

export const makeText = (p: Partial<TextShape> & { text: string; x: number; y: number; width: number }): TextShape => ({
  ...base,
  id: uid(),
  type: "text",
  name: p.text.split("\n")[0].slice(0, 30),
  fontSize: 48,
  fontFamily: "Inter",
  fontStyle: "normal",
  fill: "#1d1b2e",
  align: "left",
  letterSpacing: 0,
  ...p,
});

export const makeRect = (p: Partial<RectShape> & { x: number; y: number; width: number; height: number }): RectShape => ({
  ...base,
  id: uid(),
  type: "rect",
  name: "Rectangle",
  fill: "#6c4cf5",
  cornerRadius: 0,
  ...p,
});

export const makeEllipse = (p: Partial<EllipseShape> & { x: number; y: number; radiusX: number; radiusY: number }): EllipseShape => ({
  ...base,
  id: uid(),
  type: "ellipse",
  name: "Cercle",
  fill: "#ff6b8b",
  ...p,
});

export function blankDoc(f: Format, name = "Sans titre"): Doc {
  return { id: uid(), name, width: f.width, height: f.height, background: { kind: "color", color: "#ffffff" }, shapes: [] };
}

export interface Template {
  id: string;
  label: string;
  format: string;
  preview: [string, string];
  build: () => Doc;
}

const fmt = (id: string) => FORMATS.find((f) => f.id === id)!;

function doc(formatId: string, name: string, from: string, to: string, shapes: Shape[]): Doc {
  const f = fmt(formatId);
  return { id: uid(), name, width: f.width, height: f.height, background: { kind: "gradient", from, to }, shapes };
}

export const TEMPLATES: Template[] = [
  {
    id: "soiree",
    label: "Affiche soirée",
    format: "affiche",
    preview: ["#2a1a5e", "#c2366b"],
    build: () =>
      doc("affiche", "Affiche soirée", "#2a1a5e", "#c2366b", [
        makeEllipse({ x: 1050, y: 260, radiusX: 300, radiusY: 300, fill: "#ffd23f", opacity: 0.25, name: "Lune" }),
        makeText({ text: "SAMEDI 31 OCTOBRE", x: 100, y: 140, width: 1040, fontSize: 44, fill: "#ffffff", letterSpacing: 10, fontStyle: "bold" }),
        makeText({ text: "AFRO\nHALLOWEEN\nPARTY", x: 100, y: 420, width: 1040, fontSize: 210, fontFamily: "Anton", fill: "#ffffff" }),
        makeText({ text: "DJ · Costumes · Cocktails\n22h — 5h", x: 100, y: 1440, width: 1040, fontSize: 52, fill: "#ffd23f", fontStyle: "bold" }),
      ]),
  },
  {
    id: "promo",
    label: "Post promo",
    format: "post",
    preview: ["#ffb347", "#ff5f6d"],
    build: () =>
      doc("post", "Post promo", "#ffb347", "#ff5f6d", [
        makeRect({ x: 90, y: 90, width: 900, height: 900, fill: "#ffffff", opacity: 0.18, cornerRadius: 40, name: "Cadre" }),
        makeText({ text: "-30 %", x: 90, y: 300, width: 900, fontSize: 260, fontFamily: "Anton", fill: "#ffffff", align: "center" }),
        makeText({ text: "SUR TOUTE LA BOUTIQUE", x: 90, y: 640, width: 900, fontSize: 56, fill: "#ffffff", align: "center", fontStyle: "bold", letterSpacing: 4 }),
        makeText({ text: "Ce week-end seulement", x: 90, y: 760, width: 900, fontSize: 44, fontFamily: "Pacifico", fill: "#1d1b2e", align: "center" }),
      ]),
  },
  {
    id: "flyer",
    label: "Flyer événement",
    format: "flyer",
    preview: ["#43cea2", "#185a9d"],
    build: () =>
      doc("flyer", "Flyer événement", "#43cea2", "#185a9d", [
        makeText({ text: "Journée", x: 70, y: 150, width: 734, fontSize: 90, fontFamily: "Pacifico", fill: "#ffffff" }),
        makeText({ text: "PORTES\nOUVERTES", x: 70, y: 320, width: 734, fontSize: 130, fontFamily: "Bebas Neue", fill: "#ffffff" }),
        makeRect({ x: 70, y: 720, width: 300, height: 8, fill: "#ffffff", name: "Trait" }),
        makeText({ text: "Samedi 14 novembre · 10h – 18h\nEntrée libre", x: 70, y: 780, width: 734, fontSize: 40, fill: "#ffffff" }),
      ]),
  },
  {
    id: "carte",
    label: "Carte de visite",
    format: "carte",
    preview: ["#f7f0e1", "#d9c7a3"],
    build: () =>
      doc("carte", "Carte de visite", "#f7f0e1", "#d9c7a3", [
        makeText({ text: "Prénom Nom", x: 80, y: 180, width: 890, fontSize: 72, fontFamily: "Playfair Display", fontStyle: "bold", fill: "#2b2418" }),
        makeText({ text: "Graphiste indépendant", x: 80, y: 280, width: 890, fontSize: 36, fill: "#6b5a3e" }),
        makeText({ text: "06 00 00 00 00  ·  contact@exemple.fr", x: 80, y: 460, width: 890, fontSize: 30, fill: "#2b2418" }),
      ]),
  },
  {
    id: "youtube",
    label: "Miniature YouTube",
    format: "youtube",
    preview: ["#141e30", "#4b6cb7"],
    build: () =>
      doc("youtube", "Miniature YouTube", "#141e30", "#4b6cb7", [
        makeRect({ x: 60, y: 470, width: 620, height: 150, fill: "#ffd23f", cornerRadius: 12, name: "Bandeau" }),
        makeText({ text: "MON TITRE\nCHOC", x: 60, y: 90, width: 1160, fontSize: 170, fontFamily: "Anton", fill: "#ffffff" }),
        makeText({ text: "ÉPISODE 1", x: 90, y: 500, width: 560, fontSize: 90, fontFamily: "Bebas Neue", fill: "#141e30" }),
      ]),
  },
];

export const FONTS = ["Inter", "Montserrat", "Anton", "Bebas Neue", "Playfair Display", "Pacifico", "Arial", "Georgia"];
