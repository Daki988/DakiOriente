import type { Family, Field, Kind, Template } from "./model.ts";
import { CANVA } from "./canva.ts";
export type { Kind } from "./model.ts";

/* Modèles. Coordonnées relatives à la zone finie (0 → 1) ; tailles de texte relatives au petit côté. */

const CARD: Template[] = [
  {
    id: "bandeau", name: "Bandeau", family: "card", palette: "neam", fonts: "moderne",
    sides: [
      { bg: "bg", els: [
        { t: "rect", x: 0, y: 0, w: 0.34, h: 1, fill: "primary" },
        { t: "logo", x: 0.05, y: 0.28, w: 0.24, h: 0.44, color: "onPrimary", on: "primary" },
        { t: "text", field: "titre", role: "head", color: "ink", x: 0.41, y: 0.17, w: 0.54, h: 0, size: 0.13 },
        { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.41, y: 0.35, w: 0.54, h: 0, size: 0.068 },
        { t: "rect", x: 0.41, y: 0.5, w: 0.1, h: 0.014, fill: "accent" },
        { t: "text", field: "l1", role: "body", color: "ink", x: 0.41, y: 0.6, w: 0.54, h: 0, size: 0.062 },
        { t: "text", field: "l2", role: "body", color: "ink", x: 0.41, y: 0.7, w: 0.54, h: 0, size: 0.062 },
        { t: "text", field: "l3", role: "body", color: "ink", x: 0.41, y: 0.8, w: 0.54, h: 0, size: 0.062 },
      ] },
      { bg: "primary", els: [
        { t: "logo", x: 0.3, y: 0.16, w: 0.4, h: 0.44, color: "onPrimary" },
        { t: "text", field: "texte", role: "head", color: "onPrimary", x: 0.08, y: 0.68, w: 0.84, h: 0, size: 0.1, align: "center" },
      ] },
    ],
  },
  {
    id: "centre", name: "Centré", family: "card", palette: "nuit", fonts: "elegant",
    sides: [
      { bg: "bg", els: [
        { t: "text", field: "titre", role: "head", color: "ink", x: 0.08, y: 0.25, w: 0.84, h: 0, size: 0.14, align: "center" },
        { t: "text", field: "sousTitre", role: "sub", color: "accent", x: 0.08, y: 0.45, w: 0.84, h: 0, size: 0.066, align: "center", upper: true },
        { t: "rect", x: 0.46, y: 0.58, w: 0.08, h: 0.01, fill: "accent" },
        { t: "text", field: "l1", role: "body", color: "ink", x: 0.08, y: 0.67, w: 0.84, h: 0, size: 0.06, align: "center" },
        { t: "text", field: "l2", role: "body", color: "ink", x: 0.08, y: 0.77, w: 0.84, h: 0, size: 0.06, align: "center" },
      ] },
      { bg: "primary", els: [
        { t: "logo", x: 0.32, y: 0.18, w: 0.36, h: 0.4, color: "accent" },
        { t: "text", field: "texte", role: "head", color: "accent", x: 0.08, y: 0.66, w: 0.84, h: 0, size: 0.1, align: "center" },
        { t: "rect", x: 0, y: 0.95, w: 1, h: 0.05, fill: "accent" },
      ] },
    ],
  },
  {
    id: "cercle", name: "Cercle", family: "card", palette: "gabon", fonts: "affiche",
    sides: [
      { bg: "bg", els: [
        { t: "ellipse", x: 0.6, y: -0.3, w: 0.75, h: 1.25, fill: "primary" },
        { t: "logo", x: 0.7, y: 0.25, w: 0.24, h: 0.42, color: "onPrimary", on: "primary" },
        { t: "text", field: "titre", role: "head", color: "ink", x: 0.07, y: 0.16, w: 0.52, h: 0, size: 0.12, lines: 2 },
        { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.07, y: 0.44, w: 0.52, h: 0, size: 0.064 },
        { t: "text", field: "l1", role: "body", color: "ink", x: 0.07, y: 0.62, w: 0.52, h: 0, size: 0.058 },
        { t: "text", field: "l2", role: "body", color: "ink", x: 0.07, y: 0.72, w: 0.52, h: 0, size: 0.058 },
        { t: "text", field: "l3", role: "body", color: "ink", x: 0.07, y: 0.82, w: 0.52, h: 0, size: 0.058 },
      ] },
      { bg: "soft", els: [
        { t: "ellipse", x: 0.33, y: 0.12, w: 0.34, h: 0.53, fill: "primary" },
        { t: "logo", x: 0.37, y: 0.2, w: 0.26, h: 0.37, color: "onPrimary", on: "primary" },
        { t: "text", field: "texte", role: "head", color: "ink", x: 0.08, y: 0.72, w: 0.84, h: 0, size: 0.09, align: "center" },
      ] },
    ],
  },
  {
    id: "sombre", name: "Sombre", family: "card", palette: "neam", fonts: "moderne",
    sides: [
      { bg: "ink", els: [
        { t: "logo", x: 0.07, y: 0.12, w: 0.2, h: 0.26, color: "accent", align: "left" },
        { t: "text", field: "titre", role: "head", color: "white", x: 0.07, y: 0.46, w: 0.86, h: 0, size: 0.13 },
        { t: "text", field: "sousTitre", role: "sub", color: "accent", x: 0.07, y: 0.63, w: 0.86, h: 0, size: 0.064 },
        { t: "rect", x: 0, y: 0.84, w: 1, h: 0.16, fill: "primary" },
        { t: "text", field: "l1", role: "strong", color: "onPrimary", x: 0.07, y: 0.885, w: 0.42, h: 0, size: 0.056 },
        { t: "text", field: "l2", role: "strong", color: "onPrimary", x: 0.5, y: 0.885, w: 0.43, h: 0, size: 0.056, align: "right" },
      ] },
      { bg: "primary", els: [
        { t: "logo", x: 0.3, y: 0.2, w: 0.4, h: 0.42, color: "onPrimary" },
        { t: "text", field: "texte", role: "head", color: "onPrimary", x: 0.08, y: 0.7, w: 0.84, h: 0, size: 0.09, align: "center" },
      ] },
    ],
  },
  {
    id: "socle", name: "Socle", family: "card", palette: "corail", fonts: "moderne",
    sides: [
      { bg: "bg", els: [
        { t: "logo", x: 0.72, y: 0.1, w: 0.21, h: 0.34, color: "primary", align: "right" },
        { t: "text", field: "titre", role: "head", color: "ink", x: 0.07, y: 0.14, w: 0.62, h: 0, size: 0.125, lines: 2 },
        { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.07, y: 0.46, w: 0.62, h: 0, size: 0.064 },
        { t: "rect", x: 0, y: 0.68, w: 1, h: 0.32, fill: "primary" },
        { t: "text", field: "l1", role: "strong", color: "onPrimary", x: 0.07, y: 0.74, w: 0.86, h: 0, size: 0.06 },
        { t: "text", field: "l2", role: "body", color: "onPrimary", x: 0.07, y: 0.84, w: 0.86, h: 0, size: 0.056 },
      ] },
      { bg: "soft", els: [
        { t: "logo", x: 0.3, y: 0.16, w: 0.4, h: 0.44, color: "primary" },
        { t: "text", field: "texte", role: "head", color: "ink", x: 0.08, y: 0.7, w: 0.84, h: 0, size: 0.09, align: "center" },
        { t: "text", field: "l3", role: "body", color: "primary", x: 0.08, y: 0.84, w: 0.84, h: 0, size: 0.055, align: "center" },
      ] },
    ],
  },
];

const PORTRAIT: Template[] = [
  {
    id: "affiche", name: "Affiche", family: "portrait", palette: "neam", fonts: "affiche",
    sides: [{ bg: "primary", els: [
      { t: "ellipse", x: 0.42, y: -0.18, w: 0.9, h: 0.62, fill: "accent" },
      { t: "logo", x: 0.62, y: 0.04, w: 0.3, h: 0.12, color: "ink", align: "right", on: "accent" },
      { t: "text", field: "titre", role: "head", color: "onPrimary", x: 0.08, y: 0.19, w: 0.84, h: 0, size: 0.12, lines: 3, upper: true },
      { t: "text", field: "sousTitre", role: "sub", color: "accent", x: 0.08, y: 0.5, w: 0.84, h: 0, size: 0.06, lines: 2 },
      { t: "text", field: "texte", role: "body", color: "onPrimary", x: 0.08, y: 0.63, w: 0.84, h: 0, size: 0.042, lines: 3 },
      { t: "rect", x: 0, y: 0.83, w: 1, h: 0.17, fill: "bg" },
      { t: "text", field: "l1", role: "strong", color: "primary", x: 0.08, y: 0.86, w: 0.84, h: 0, size: 0.055 },
      { t: "text", field: "l2", role: "body", color: "ink", x: 0.08, y: 0.92, w: 0.44, h: 0, size: 0.038 },
      { t: "text", field: "l3", role: "strong", color: "ink", x: 0.55, y: 0.92, w: 0.37, h: 0, size: 0.038, align: "right" },
    ] }],
  },
  {
    id: "editorial", name: "Éditorial", family: "portrait", palette: "foret", fonts: "elegant",
    sides: [{ bg: "bg", els: [
      { t: "rect", x: 0, y: 0, w: 1, h: 0.46, fill: "soft" },
      { t: "logo", x: 0.08, y: 0.05, w: 0.3, h: 0.1, color: "primary", align: "left" },
      { t: "text", field: "titre", role: "head", color: "ink", x: 0.08, y: 0.19, w: 0.84, h: 0, size: 0.13, lines: 3 },
      { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.08, y: 0.51, w: 0.84, h: 0, size: 0.06, lines: 2 },
      { t: "text", field: "texte", role: "body", color: "ink", x: 0.08, y: 0.61, w: 0.84, h: 0, size: 0.042, lines: 5 },
      { t: "rect", x: 0.08, y: 0.81, w: 0.84, h: 0.08, fill: "primary", r: 0.04 },
      { t: "text", field: "l1", role: "strong", color: "onPrimary", x: 0.1, y: 0.833, w: 0.8, h: 0, size: 0.05, align: "center" },
      { t: "text", field: "l2", role: "body", color: "ink", x: 0.08, y: 0.915, w: 0.84, h: 0, size: 0.038, align: "center" },
      { t: "text", field: "l3", role: "strong", color: "primary", x: 0.08, y: 0.95, w: 0.84, h: 0, size: 0.038, align: "center" },
    ] }],
  },
  {
    id: "soiree", name: "Soirée", family: "portrait", palette: "nuit", fonts: "ceremonie",
    sides: [{ bg: "primary", els: [
      { t: "ellipse", x: -0.35, y: 0.6, w: 1.1, h: 0.75, fill: "accent", opacity: 0.18 },
      { t: "rect", x: 0.08, y: 0.08, w: 0.16, h: 0.006, fill: "accent" },
      { t: "text", field: "sousTitre", role: "sub", color: "accent", x: 0.08, y: 0.1, w: 0.84, h: 0, size: 0.05, upper: true },
      { t: "text", field: "titre", role: "head", color: "white", x: 0.08, y: 0.17, w: 0.84, h: 0, size: 0.13, lines: 2 },
      { t: "text", field: "l1", role: "strong", color: "accent", x: 0.08, y: 0.56, w: 0.84, h: 0, size: 0.07 },
      { t: "text", field: "l2", role: "body", color: "white", x: 0.08, y: 0.65, w: 0.84, h: 0, size: 0.046, lines: 2 },
      { t: "text", field: "texte", role: "body", color: "white", x: 0.08, y: 0.74, w: 0.84, h: 0, size: 0.04, lines: 2 },
      { t: "logo", x: 0.08, y: 0.87, w: 0.24, h: 0.08, color: "accent", align: "left" },
      { t: "text", field: "l3", role: "strong", color: "accent", x: 0.36, y: 0.9, w: 0.56, h: 0, size: 0.04, align: "right" },
    ] }],
  },
  {
    id: "tarifs", name: "Menu & tarifs", family: "portrait", palette: "corail", fonts: "moderne",
    sides: [{ bg: "bg", els: [
      { t: "rect", x: 0, y: 0, w: 1, h: 0.22, fill: "primary" },
      { t: "logo", x: 0.38, y: 0.025, w: 0.24, h: 0.07, color: "onPrimary", on: "primary" },
      { t: "text", field: "titre", role: "head", color: "onPrimary", x: 0.06, y: 0.1, w: 0.88, h: 0, size: 0.1, align: "center" },
      { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.08, y: 0.26, w: 0.84, h: 0, size: 0.055, align: "center", lines: 2 },
      { t: "rect", x: 0.44, y: 0.36, w: 0.12, h: 0.005, fill: "accent" },
      { t: "text", field: "texte", role: "body", color: "ink", x: 0.1, y: 0.4, w: 0.8, h: 0, size: 0.045, align: "center", lines: 9 },
      { t: "text", field: "l1", role: "strong", color: "primary", x: 0.08, y: 0.84, w: 0.84, h: 0, size: 0.05, align: "center" },
      { t: "text", field: "l2", role: "body", color: "ink", x: 0.08, y: 0.9, w: 0.84, h: 0, size: 0.04, align: "center" },
      { t: "text", field: "l3", role: "strong", color: "ink", x: 0.08, y: 0.94, w: 0.84, h: 0, size: 0.04, align: "center" },
    ] }],
  },
];

const TALL: Template[] = [
  {
    id: "vertical", name: "Vertical", family: "tall", palette: "neam", fonts: "moderne",
    sides: [{ bg: "bg", els: [
      { t: "logo", x: 0.2, y: 0.04, w: 0.6, h: 0.09, color: "primary" },
      { t: "text", field: "titre", role: "head", color: "ink", x: 0.08, y: 0.17, w: 0.84, h: 0, size: 0.15, align: "center", lines: 3 },
      { t: "rect", x: 0.4, y: 0.39, w: 0.2, h: 0.006, fill: "accent" },
      { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.08, y: 0.42, w: 0.84, h: 0, size: 0.075, align: "center", lines: 2 },
      { t: "text", field: "texte", role: "body", color: "ink", x: 0.1, y: 0.53, w: 0.8, h: 0, size: 0.05, align: "center", lines: 6 },
      { t: "rect", x: 0, y: 0.8, w: 1, h: 0.2, fill: "primary" },
      { t: "text", field: "l1", role: "head", color: "onPrimary", x: 0.06, y: 0.83, w: 0.88, h: 0, size: 0.075, align: "center" },
      { t: "text", field: "l2", role: "body", color: "onPrimary", x: 0.06, y: 0.9, w: 0.88, h: 0, size: 0.05, align: "center" },
      { t: "text", field: "l3", role: "strong", color: "onPrimary", x: 0.06, y: 0.94, w: 0.88, h: 0, size: 0.05, align: "center" },
    ] }],
  },
  {
    id: "vague", name: "Vague", family: "tall", palette: "gabon", fonts: "affiche",
    sides: [{ bg: "primary", els: [
      { t: "ellipse", x: -0.4, y: 0.56, w: 1.8, h: 0.8, fill: "bg" },
      { t: "text", field: "titre", role: "head", color: "onPrimary", x: 0.08, y: 0.07, w: 0.84, h: 0, size: 0.14, lines: 4, upper: true },
      { t: "text", field: "sousTitre", role: "sub", color: "accent", x: 0.08, y: 0.35, w: 0.84, h: 0, size: 0.07, lines: 2 },
      { t: "text", field: "texte", role: "body", color: "onPrimary", x: 0.08, y: 0.44, w: 0.84, h: 0, size: 0.048, lines: 4 },
      { t: "logo", x: 0.25, y: 0.64, w: 0.5, h: 0.1, color: "primary", on: "bg" },
      { t: "text", field: "l1", role: "head", color: "ink", x: 0.06, y: 0.79, w: 0.88, h: 0, size: 0.07, align: "center" },
      { t: "text", field: "l2", role: "body", color: "ink", x: 0.06, y: 0.86, w: 0.88, h: 0, size: 0.05, align: "center" },
      { t: "text", field: "l3", role: "strong", color: "primary", x: 0.06, y: 0.91, w: 0.88, h: 0, size: 0.05, align: "center" },
    ] }],
  },
  {
    id: "nocturne", name: "Nocturne", family: "tall", palette: "nuit", fonts: "elegant",
    sides: [{ bg: "primary", els: [
      { t: "rect", x: 0.06, y: 0.03, w: 0.88, h: 0.94, fill: "accent", opacity: 0.12, r: 0.03 },
      { t: "logo", x: 0.25, y: 0.07, w: 0.5, h: 0.09, color: "accent" },
      { t: "text", field: "sousTitre", role: "sub", color: "accent", x: 0.1, y: 0.21, w: 0.8, h: 0, size: 0.055, align: "center", upper: true, lines: 2 },
      { t: "text", field: "titre", role: "head", color: "white", x: 0.1, y: 0.28, w: 0.8, h: 0, size: 0.15, align: "center", lines: 3 },
      { t: "rect", x: 0.45, y: 0.52, w: 0.1, h: 0.004, fill: "accent" },
      { t: "text", field: "texte", role: "body", color: "white", x: 0.12, y: 0.56, w: 0.76, h: 0, size: 0.05, align: "center", lines: 5 },
      { t: "text", field: "l1", role: "strong", color: "accent", x: 0.1, y: 0.78, w: 0.8, h: 0, size: 0.065, align: "center" },
      { t: "text", field: "l2", role: "body", color: "white", x: 0.1, y: 0.85, w: 0.8, h: 0, size: 0.048, align: "center" },
      { t: "text", field: "l3", role: "strong", color: "white", x: 0.1, y: 0.9, w: 0.8, h: 0, size: 0.048, align: "center" },
    ] }],
  },
];

const SQUARE: Template[] = [
  {
    id: "rond", name: "Rond", family: "square", palette: "neam", fonts: "affiche",
    sides: [{ bg: "bg", els: [
      { t: "ellipse", x: 0.03, y: 0.03, w: 0.94, h: 0.94, fill: "primary" },
      { t: "logo", x: 0.32, y: 0.14, w: 0.36, h: 0.28, color: "onPrimary", on: "primary" },
      { t: "text", field: "titre", role: "head", color: "onPrimary", x: 0.14, y: 0.46, w: 0.72, h: 0, size: 0.13, align: "center", lines: 2 },
      { t: "text", field: "sousTitre", role: "sub", color: "accent", x: 0.2, y: 0.74, w: 0.6, h: 0, size: 0.065, align: "center" },
    ] }],
  },
  {
    id: "cadre", name: "Cadre", family: "square", palette: "foret", fonts: "elegant",
    sides: [{ bg: "primary", els: [
      { t: "rect", x: 0.07, y: 0.07, w: 0.86, h: 0.86, fill: "bg", r: 0.06 },
      { t: "logo", x: 0.3, y: 0.14, w: 0.4, h: 0.26, color: "primary", on: "bg" },
      { t: "text", field: "titre", role: "head", color: "ink", x: 0.12, y: 0.45, w: 0.76, h: 0, size: 0.12, align: "center", lines: 2 },
      { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.12, y: 0.7, w: 0.76, h: 0, size: 0.06, align: "center" },
      { t: "text", field: "texte", role: "body", color: "ink", x: 0.12, y: 0.79, w: 0.76, h: 0, size: 0.05, align: "center" },
    ] }],
  },
  {
    id: "etiquette", name: "Étiquette", family: "square", palette: "corail", fonts: "moderne",
    sides: [{ bg: "soft", els: [
      { t: "rect", x: 0, y: 0, w: 1, h: 0.3, fill: "primary" },
      { t: "text", field: "titre", role: "head", color: "onPrimary", x: 0.06, y: 0.08, w: 0.88, h: 0, size: 0.12, align: "center" },
      { t: "logo", x: 0.3, y: 0.36, w: 0.4, h: 0.3, color: "primary" },
      { t: "text", field: "sousTitre", role: "sub", color: "ink", x: 0.06, y: 0.72, w: 0.88, h: 0, size: 0.07, align: "center" },
      { t: "text", field: "texte", role: "body", color: "primary", x: 0.06, y: 0.84, w: 0.88, h: 0, size: 0.055, align: "center" },
    ] }],
  },
];

const WIDE: Template[] = [
  {
    id: "banderole", name: "Banderole", family: "wide", palette: "neam", fonts: "affiche",
    sides: [{ bg: "primary", els: [
      { t: "text", field: "titre", role: "head", color: "onPrimary", x: 0.05, y: 0.1, w: 0.6, h: 0, size: 0.23, lines: 2, upper: true },
      { t: "text", field: "sousTitre", role: "sub", color: "accent", x: 0.05, y: 0.72, w: 0.6, h: 0, size: 0.1 },
      { t: "rect", x: 0.69, y: 0, w: 0.31, h: 1, fill: "bg" },
      { t: "logo", x: 0.73, y: 0.1, w: 0.23, h: 0.45, color: "primary", on: "bg" },
      { t: "text", field: "l1", role: "head", color: "ink", x: 0.71, y: 0.64, w: 0.27, h: 0, size: 0.1, align: "center" },
      { t: "text", field: "l2", role: "body", color: "ink", x: 0.71, y: 0.8, w: 0.27, h: 0, size: 0.07, align: "center" },
    ] }],
  },
  {
    id: "clair", name: "Clair", family: "wide", palette: "gabon", fonts: "moderne",
    sides: [{ bg: "bg", els: [
      { t: "logo", x: 0.04, y: 0.12, w: 0.2, h: 0.56, color: "primary" },
      { t: "text", field: "titre", role: "head", color: "ink", x: 0.28, y: 0.1, w: 0.68, h: 0, size: 0.22, lines: 2 },
      { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.28, y: 0.66, w: 0.68, h: 0, size: 0.1 },
      { t: "rect", x: 0, y: 0.84, w: 1, h: 0.16, fill: "accent" },
      { t: "text", field: "l1", role: "strong", color: "ink", x: 0.04, y: 0.875, w: 0.92, h: 0, size: 0.08, align: "center" },
    ] }],
  },
  {
    id: "contraste", name: "Contraste", family: "wide", palette: "nuit", fonts: "elegant",
    sides: [{ bg: "primary", els: [
      { t: "rect", x: 0, y: 0, w: 0.012, h: 1, fill: "accent" },
      { t: "text", field: "sousTitre", role: "sub", color: "accent", x: 0.05, y: 0.12, w: 0.9, h: 0, size: 0.09, upper: true },
      { t: "text", field: "titre", role: "head", color: "white", x: 0.05, y: 0.26, w: 0.7, h: 0, size: 0.22, lines: 2 },
      { t: "text", field: "l1", role: "strong", color: "accent", x: 0.05, y: 0.82, w: 0.6, h: 0, size: 0.08 },
      { t: "logo", x: 0.76, y: 0.72, w: 0.2, h: 0.2, color: "accent", align: "right" },
    ] }],
  },
];

/* Modèles à motifs africains (création Neam Print). */
const MOTIF: Template[] = [
  {
    id: "wax", name: "Wax", family: "card", palette: "terre", fonts: "moderne", pattern: "wax",
    sides: [
      { bg: "bg", els: [
        { t: "pattern", x: 0, y: 0, w: 0.3, h: 1, pattern: "auto", tile: 0.2, colors: ["primary", "accent", "bg"] },
        { t: "text", field: "titre", role: "head", color: "ink", x: 0.37, y: 0.15, w: 0.58, h: 0, size: 0.12, lines: 2 },
        { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.37, y: 0.42, w: 0.58, h: 0, size: 0.062 },
        { t: "rect", x: 0.37, y: 0.53, w: 0.1, h: 0.014, fill: "accent" },
        { t: "text", field: "l1", role: "body", color: "ink", x: 0.37, y: 0.61, w: 0.58, h: 0, size: 0.058 },
        { t: "text", field: "l2", role: "body", color: "ink", x: 0.37, y: 0.71, w: 0.58, h: 0, size: 0.058 },
        { t: "text", field: "l3", role: "body", color: "ink", x: 0.37, y: 0.81, w: 0.58, h: 0, size: 0.058 },
      ] },
      { bg: "primary", els: [
        { t: "pattern", x: 0, y: 0, w: 1, h: 1, pattern: "auto", tile: 0.2, colors: ["primary", "accent", "bg"] },
        { t: "rect", x: 0.2, y: 0.16, w: 0.6, h: 0.68, fill: "bg", r: 0.06 },
        { t: "logo", x: 0.36, y: 0.23, w: 0.28, h: 0.3, color: "primary", on: "bg" },
        { t: "text", field: "texte", role: "head", color: "ink", x: 0.23, y: 0.6, w: 0.54, h: 0, size: 0.075, align: "center" },
      ] },
    ],
  },
  {
    id: "kente", name: "Kente", family: "card", palette: "gabon", fonts: "affiche", pattern: "kente",
    sides: [
      { bg: "bg", els: [
        { t: "logo", x: 0.07, y: 0.1, w: 0.16, h: 0.24, color: "primary", align: "left" },
        { t: "text", field: "titre", role: "head", color: "ink", x: 0.07, y: 0.4, w: 0.86, h: 0, size: 0.115 },
        { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.07, y: 0.55, w: 0.86, h: 0, size: 0.058 },
        { t: "text", field: "l1", role: "strong", color: "ink", x: 0.07, y: 0.67, w: 0.42, h: 0, size: 0.05 },
        { t: "text", field: "l2", role: "body", color: "ink", x: 0.5, y: 0.67, w: 0.43, h: 0, size: 0.05, align: "right" },
        { t: "pattern", x: 0, y: 0.82, w: 1, h: 0.18, pattern: "auto", tile: 0.18, colors: ["primary", "accent", "ink"] },
      ] },
      { bg: "primary", els: [
        { t: "pattern", x: 0, y: 0, w: 1, h: 0.16, pattern: "auto", tile: 0.16, colors: ["primary", "accent", "ink"] },
        { t: "pattern", x: 0, y: 0.84, w: 1, h: 0.16, pattern: "auto", tile: 0.16, colors: ["primary", "accent", "ink"] },
        { t: "logo", x: 0.32, y: 0.24, w: 0.36, h: 0.32, color: "onPrimary", on: "primary" },
        { t: "text", field: "texte", role: "head", color: "onPrimary", x: 0.08, y: 0.62, w: 0.84, h: 0, size: 0.085, align: "center" },
      ] },
    ],
  },
  {
    id: "bogolan", name: "Bogolan", family: "card", palette: "terre", fonts: "elegant", pattern: "bogolan",
    sides: [
      { bg: "bg", els: [
        { t: "pattern", x: 0.64, y: 0, w: 0.36, h: 1, pattern: "auto", tile: 0.2, colors: ["ink", "soft", "accent"] },
        { t: "text", field: "titre", role: "head", color: "ink", x: 0.07, y: 0.16, w: 0.53, h: 0, size: 0.12, lines: 2 },
        { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.07, y: 0.44, w: 0.53, h: 0, size: 0.06 },
        { t: "text", field: "l1", role: "body", color: "ink", x: 0.07, y: 0.62, w: 0.53, h: 0, size: 0.055 },
        { t: "text", field: "l2", role: "body", color: "ink", x: 0.07, y: 0.72, w: 0.53, h: 0, size: 0.055 },
        { t: "text", field: "l3", role: "body", color: "ink", x: 0.07, y: 0.82, w: 0.53, h: 0, size: 0.055 },
      ] },
      { bg: "ink", els: [
        { t: "pattern", x: 0, y: 0, w: 1, h: 0.76, pattern: "auto", tile: 0.2, colors: ["ink", "soft", "accent"] },
        { t: "ellipse", x: 0.34, y: 0.1, w: 0.32, h: 0.5, fill: "bg" },
        { t: "logo", x: 0.39, y: 0.18, w: 0.22, h: 0.34, color: "primary", on: "bg" },
        { t: "rect", x: 0, y: 0.76, w: 1, h: 0.24, fill: "primary" },
        { t: "text", field: "texte", role: "head", color: "onPrimary", x: 0.08, y: 0.81, w: 0.84, h: 0, size: 0.08, align: "center" },
      ] },
    ],
  },
  {
    id: "pagne", name: "Pagne", family: "portrait", palette: "terre", fonts: "moderne", pattern: "wax",
    sides: [{ bg: "bg", els: [
      { t: "pattern", x: 0, y: 0, w: 1, h: 0.36, pattern: "auto", tile: 0.16, colors: ["primary", "accent", "bg"] },
      { t: "ellipse", x: 0.37, y: 0.26, w: 0.26, h: 0.26 * 148 / 210, fill: "bg" },
      { t: "logo", x: 0.41, y: 0.285, w: 0.18, h: 0.12, color: "primary", on: "bg" },
      { t: "text", field: "titre", role: "head", color: "ink", x: 0.08, y: 0.47, w: 0.84, h: 0, size: 0.1, align: "center", lines: 2 },
      { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.08, y: 0.62, w: 0.84, h: 0, size: 0.052, align: "center", lines: 2 },
      { t: "text", field: "texte", role: "body", color: "ink", x: 0.1, y: 0.7, w: 0.8, h: 0, size: 0.038, align: "center", lines: 3 },
      { t: "text", field: "l1", role: "strong", color: "primary", x: 0.08, y: 0.81, w: 0.84, h: 0, size: 0.045, align: "center" },
      { t: "text", field: "l2", role: "body", color: "ink", x: 0.08, y: 0.86, w: 0.42, h: 0, size: 0.032 },
      { t: "text", field: "l3", role: "strong", color: "ink", x: 0.5, y: 0.86, w: 0.42, h: 0, size: 0.032, align: "right" },
      { t: "pattern", x: 0, y: 0.92, w: 1, h: 0.08, pattern: "kente", tile: 0.1, colors: ["primary", "accent", "ink"] },
    ] }],
  },
  {
    id: "cadre-motif", name: "Cadre motif", family: "portrait", palette: "royal", fonts: "elegant", pattern: "losanges",
    sides: [{ bg: "primary", els: [
      { t: "pattern", x: 0, y: 0, w: 1, h: 1, pattern: "auto", tile: 0.1, colors: ["primary", "accent", "soft"] },
      { t: "rect", x: 0.07, y: 0.05, w: 0.86, h: 0.9, fill: "bg", r: 0.02 },
      { t: "logo", x: 0.35, y: 0.08, w: 0.3, h: 0.08, color: "primary" },
      { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.12, y: 0.19, w: 0.76, h: 0, size: 0.045, align: "center", upper: true, lines: 2 },
      { t: "text", field: "titre", role: "head", color: "ink", x: 0.12, y: 0.26, w: 0.76, h: 0, size: 0.11, align: "center", lines: 3 },
      { t: "rect", x: 0.45, y: 0.55, w: 0.1, h: 0.005, fill: "accent" },
      { t: "text", field: "texte", role: "body", color: "ink", x: 0.14, y: 0.58, w: 0.72, h: 0, size: 0.04, align: "center", lines: 4 },
      { t: "text", field: "l1", role: "strong", color: "primary", x: 0.12, y: 0.75, w: 0.76, h: 0, size: 0.05, align: "center" },
      { t: "text", field: "l2", role: "body", color: "ink", x: 0.12, y: 0.82, w: 0.76, h: 0, size: 0.036, align: "center" },
      { t: "text", field: "l3", role: "strong", color: "ink", x: 0.12, y: 0.87, w: 0.76, h: 0, size: 0.036, align: "center" },
    ] }],
  },
  {
    id: "totem", name: "Totem", family: "tall", palette: "gabon", fonts: "moderne", pattern: "kente",
    sides: [{ bg: "bg", els: [
      { t: "pattern", x: 0, y: 0, w: 1, h: 0.2, pattern: "auto", tile: 0.2, colors: ["primary", "accent", "ink"] },
      { t: "ellipse", x: 0.3, y: 0.12, w: 0.4, h: 0.17, fill: "bg" },
      { t: "logo", x: 0.36, y: 0.145, w: 0.28, h: 0.11, color: "primary", on: "bg" },
      { t: "text", field: "titre", role: "head", color: "ink", x: 0.08, y: 0.32, w: 0.84, h: 0, size: 0.13, align: "center", lines: 3 },
      { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.08, y: 0.52, w: 0.84, h: 0, size: 0.065, align: "center", lines: 2 },
      { t: "text", field: "texte", role: "body", color: "ink", x: 0.1, y: 0.61, w: 0.8, h: 0, size: 0.045, align: "center", lines: 4 },
      { t: "text", field: "l1", role: "head", color: "primary", x: 0.06, y: 0.76, w: 0.88, h: 0, size: 0.065, align: "center" },
      { t: "text", field: "l2", role: "body", color: "ink", x: 0.06, y: 0.82, w: 0.88, h: 0, size: 0.045, align: "center" },
      { t: "pattern", x: 0, y: 0.88, w: 1, h: 0.12, pattern: "auto", tile: 0.2, colors: ["primary", "accent", "ink"] },
    ] }],
  },
  {
    id: "colonne", name: "Colonne", family: "tall", palette: "terre", fonts: "affiche", pattern: "dents",
    sides: [{ bg: "ink", els: [
      { t: "pattern", x: 0, y: 0, w: 0.16, h: 1, pattern: "auto", tile: 0.16, colors: ["primary", "accent", "soft"] },
      { t: "logo", x: 0.22, y: 0.05, w: 0.4, h: 0.08, color: "accent", align: "left" },
      { t: "text", field: "titre", role: "head", color: "white", x: 0.22, y: 0.18, w: 0.72, h: 0, size: 0.13, lines: 4, upper: true },
      { t: "text", field: "sousTitre", role: "sub", color: "accent", x: 0.22, y: 0.45, w: 0.72, h: 0, size: 0.065, lines: 2 },
      { t: "text", field: "texte", role: "body", color: "white", x: 0.22, y: 0.55, w: 0.72, h: 0, size: 0.045, lines: 5 },
      { t: "rect", x: 0.16, y: 0.8, w: 0.84, h: 0.2, fill: "primary" },
      { t: "text", field: "l1", role: "head", color: "onPrimary", x: 0.22, y: 0.83, w: 0.72, h: 0, size: 0.06 },
      { t: "text", field: "l2", role: "body", color: "onPrimary", x: 0.22, y: 0.89, w: 0.72, h: 0, size: 0.042 },
      { t: "text", field: "l3", role: "strong", color: "onPrimary", x: 0.22, y: 0.93, w: 0.72, h: 0, size: 0.042 },
    ] }],
  },
  {
    id: "medaillon", name: "Médaillon", family: "square", palette: "terre", fonts: "moderne", pattern: "wax",
    sides: [{ bg: "primary", els: [
      { t: "pattern", x: 0, y: 0, w: 1, h: 1, pattern: "auto", tile: 0.25, colors: ["primary", "accent", "bg"] },
      { t: "ellipse", x: 0.13, y: 0.13, w: 0.74, h: 0.74, fill: "bg" },
      { t: "logo", x: 0.36, y: 0.2, w: 0.28, h: 0.2, color: "primary", on: "bg" },
      { t: "text", field: "titre", role: "head", color: "ink", x: 0.2, y: 0.45, w: 0.6, h: 0, size: 0.1, align: "center", lines: 2 },
      { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.24, y: 0.69, w: 0.52, h: 0, size: 0.05, align: "center" },
    ] }],
  },
  {
    id: "cauris", name: "Cauris", family: "square", palette: "ocean", fonts: "elegant", pattern: "cauris",
    sides: [{ bg: "bg", els: [
      { t: "pattern", x: 0, y: 0, w: 1, h: 0.28, pattern: "auto", tile: 0.28, colors: ["primary", "bg", "accent"] },
      { t: "logo", x: 0.32, y: 0.33, w: 0.36, h: 0.24, color: "primary" },
      { t: "text", field: "titre", role: "head", color: "ink", x: 0.08, y: 0.62, w: 0.84, h: 0, size: 0.11, align: "center" },
      { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.08, y: 0.78, w: 0.84, h: 0, size: 0.06, align: "center" },
      { t: "text", field: "texte", role: "body", color: "ink", x: 0.08, y: 0.88, w: 0.84, h: 0, size: 0.05, align: "center" },
    ] }],
  },
  {
    id: "frise", name: "Frise", family: "wide", palette: "gabon", fonts: "affiche", pattern: "kente",
    sides: [{ bg: "bg", els: [
      { t: "pattern", x: 0, y: 0, w: 1, h: 0.14, pattern: "auto", tile: 0.14, colors: ["primary", "accent", "ink"] },
      { t: "logo", x: 0.04, y: 0.24, w: 0.18, h: 0.5, color: "primary" },
      { t: "text", field: "titre", role: "head", color: "ink", x: 0.26, y: 0.22, w: 0.7, h: 0, size: 0.19, lines: 2, upper: true },
      { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.26, y: 0.68, w: 0.7, h: 0, size: 0.08 },
      { t: "pattern", x: 0, y: 0.86, w: 1, h: 0.14, pattern: "auto", tile: 0.14, colors: ["primary", "accent", "ink"] },
    ] }],
  },
  {
    id: "tapis", name: "Tapis", family: "wide", palette: "royal", fonts: "elegant", pattern: "losanges",
    sides: [{ bg: "primary", els: [
      { t: "pattern", x: 0, y: 0, w: 1, h: 1, pattern: "auto", tile: 0.2, colors: ["primary", "accent", "soft"] },
      { t: "rect", x: 0.18, y: 0.1, w: 0.64, h: 0.8, fill: "bg", r: 0.04 },
      { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.22, y: 0.17, w: 0.56, h: 0, size: 0.07, align: "center", upper: true },
      { t: "text", field: "titre", role: "head", color: "ink", x: 0.22, y: 0.3, w: 0.56, h: 0, size: 0.17, align: "center", lines: 2 },
      { t: "text", field: "l1", role: "strong", color: "primary", x: 0.22, y: 0.74, w: 0.56, h: 0, size: 0.075, align: "center" },
    ] }],
  },
  {
    id: "dents", name: "Dents de scie", family: "card", palette: "chantier", fonts: "affiche", pattern: "dents",
    sides: [
      { bg: "ink", els: [
        { t: "pattern", x: 0, y: 0.8, w: 1, h: 0.2, pattern: "auto", tile: 0.2, colors: ["ink", "primary", "soft"] },
        { t: "logo", x: 0.72, y: 0.1, w: 0.21, h: 0.3, color: "primary", align: "right", on: "ink" },
        { t: "text", field: "titre", role: "head", color: "white", x: 0.07, y: 0.12, w: 0.62, h: 0, size: 0.115, lines: 2 },
        { t: "text", field: "sousTitre", role: "sub", color: "primary", x: 0.07, y: 0.42, w: 0.86, h: 0, size: 0.06 },
        { t: "text", field: "l1", role: "strong", color: "white", x: 0.07, y: 0.56, w: 0.86, h: 0, size: 0.055 },
        { t: "text", field: "l2", role: "body", color: "white", x: 0.07, y: 0.66, w: 0.86, h: 0, size: 0.052 },
      ] },
      { bg: "primary", els: [
        { t: "logo", x: 0.3, y: 0.14, w: 0.4, h: 0.42, color: "ink", on: "primary" },
        { t: "text", field: "texte", role: "head", color: "ink", x: 0.08, y: 0.62, w: 0.84, h: 0, size: 0.085, align: "center" },
        { t: "pattern", x: 0, y: 0.84, w: 1, h: 0.16, pattern: "auto", tile: 0.16, colors: ["primary", "ink", "soft"] },
      ] },
    ],
  },
];

export const TEMPLATES: Template[] = [...CANVA, ...CARD, ...PORTRAIT, ...TALL, ...SQUARE, ...WIDE, ...MOTIF];

/** Famille de modèles selon les proportions du support. */
export function familyFor(wMm: number, hMm: number): Family {
  const r = wMm / hMm;
  if (r >= 1.9) return "wide";
  if (r >= 1.2) return "card";
  if (r > 0.85) return "square";
  if (r >= 0.52) return "portrait";
  return "tall";
}

export const templatesFor = (f: Family) => TEMPLATES.filter((t) => t.family === f);

/* Libellés et exemples de texte selon le type de produit. */
type KindInfo = { labels: Record<Field, string>; defaults: Record<Field, string> };

export const KINDS: Record<Kind, KindInfo> = {
  carte: {
    labels: { titre: "Nom et prénom", sousTitre: "Fonction", texte: "Entreprise (verso)", l1: "Téléphone", l2: "E-mail", l3: "Adresse ou site web" },
    defaults: { titre: "Aïcha Nzé", sousTitre: "Directrice commerciale", texte: "Okoumé Conseil", l1: "+241 77 00 00 00", l2: "aicha@okoume.ga", l3: "Glass, Libreville" },
  },
  evenement: {
    labels: { titre: "Titre", sousTitre: "Accroche", texte: "Message", l1: "Date et heure", l2: "Lieu", l3: "Contact / RSVP" },
    defaults: { titre: "Les 30 ans de Marc", sousTitre: "Vous êtes invités", texte: "Venez fêter avec nous une soirée inoubliable.", l1: "Samedi 14 décembre · 19 h", l2: "Hôtel Le Cristal, Libreville", l3: "RSVP +241 77 00 00 00" },
  },
  promo: {
    labels: { titre: "Titre principal", sousTitre: "Accroche", texte: "Description", l1: "Date ou offre", l2: "Adresse", l3: "Téléphone / site" },
    defaults: {
      titre: "Grande promo de fin d’année", sousTitre: "Jusqu’à –30 % sur tout le magasin",
      texte: "Profitez de nos meilleurs prix sur une sélection de produits, tout le mois de décembre.",
      l1: "Du 1er au 31 décembre", l2: "Boulevard Triomphal, Libreville", l3: "+241 77 00 00 00",
    },
  },
  marque: {
    labels: { titre: "Nom de la marque", sousTitre: "Slogan", texte: "Précision (contenance, goût…)", l1: "Contact", l2: "Adresse", l3: "Autre ligne" },
    defaults: { titre: "Saveurs d’Owendo", sousTitre: "Jus 100 % naturel", texte: "Bouteille 50 cl", l1: "+241 77 00 00 00", l2: "Owendo, Gabon", l3: "" },
  },
};

export function kindFor(categorySlug: string, slug: string): Kind {
  if (categorySlug === "cartes-de-visite" || slug.startsWith("badge")) return "carte";
  if (categorySlug === "cartes-invitations") return "evenement";
  if (["stickers-etiquettes", "packaging", "textile"].includes(categorySlug) || slug.includes("plaque") || slug.includes("urne")) return "marque";
  return "promo";
}

/** Modèle proposé en premier selon le type de produit, et champ servant de monogramme sans logo. */
export const PREFERRED: Partial<Record<Kind, string[]>> = { evenement: ["soiree", "centre", "nocturne", "contraste"], marque: ["rond", "socle", "etiquette"] };
export const MONOGRAM: Record<Kind, Field | undefined> = { carte: "texte", marque: "titre", evenement: undefined, promo: undefined };

/** Le verso n'est proposé que pour les cartes de visite. */
export const hasVerso = (categorySlug: string) => categorySlug === "cartes-de-visite";

/** Mise en scène de l'aperçu réaliste selon le produit. */
export type MockupKind =
  | "cards" | "invite" | "paper" | "poster" | "rollup" | "wall" | "banner" | "sticker" | "tshirt" | "box"
  | "lanyard" | "bottle" | "vehicle" | "window" | "folder" | "brochure" | "plaque";

export const MOCKUP_LABELS: Record<MockupKind, string> = {
  cards: "Sur le bureau", invite: "Avec l’enveloppe", paper: "Sur la table", poster: "Au mur", rollup: "En salon",
  wall: "Au mur", banner: "En façade", sticker: "Sur un ordinateur", tshirt: "Sur un t-shirt", box: "En boîte",
  lanyard: "Au cordon", bottle: "Sur une bouteille", vehicle: "Sur un véhicule", window: "En vitrine",
  folder: "Chemise", brochure: "En éventail", plaque: "À l’entrée",
};

/** Mises en scène disponibles pour un produit, la plus parlante en premier. */
export function mockupsFor(categorySlug: string, slug: string): MockupKind[] {
  if (categorySlug === "cartes-de-visite") return ["cards"];
  if (slug.startsWith("badge")) return ["lanyard", "cards"];
  if (categorySlug === "cartes-invitations") return ["invite", "paper"];
  if (slug.startsWith("roll-up")) return ["rollup"];
  if (slug.startsWith("bache")) return ["banner"];
  if (slug.includes("plaque")) return ["plaque"];
  if (slug.includes("vinyle")) return ["vehicle", "window"];
  if (slug.includes("lettrage")) return ["window", "vehicle"];
  if (slug.includes("urne")) return ["box"];
  if (slug.includes("chemise")) return ["folder"];
  if (slug.includes("catalogue") || slug.includes("brochure")) return ["brochure", "paper"];
  if (slug.includes("etiquette")) return ["bottle", "sticker"];
  if (categorySlug === "stickers-etiquettes") return ["sticker", "bottle"];
  if (categorySlug === "textile") return ["tshirt"];
  if (categorySlug === "packaging") return ["box"];
  if (categorySlug === "flyers") return ["paper", "poster"];
  return ["paper", "poster"];
}
export const mockupFor = (categorySlug: string, slug: string) => mockupsFor(categorySlug, slug)[0];
