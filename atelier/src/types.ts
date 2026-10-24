export type Background =
  | { kind: "color"; color: string }
  | { kind: "gradient"; from: string; to: string };

interface Base {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  visible: boolean;
}

export interface TextShape extends Base {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "bold" | "italic" | "italic bold";
  fill: string;
  align: "left" | "center" | "right";
  width: number;
  letterSpacing: number;
}

export interface RectShape extends Base {
  type: "rect";
  width: number;
  height: number;
  fill: string;
  cornerRadius: number;
}

export interface EllipseShape extends Base {
  type: "ellipse";
  radiusX: number;
  radiusY: number;
  fill: string;
}

export interface ImageFilters {
  brightness: number; // -100..100
  contrast: number; // -100..100
  saturation: number; // -100..100
  blur: number; // 0..40
  grayscale: boolean;
}

export interface ImageShape extends Base {
  type: "image";
  src: string; // data URL
  width: number;
  height: number;
  filters: ImageFilters;
}

export interface LineShape extends Base {
  type: "line";
  points: number[];
  stroke: string;
  strokeWidth: number;
}

export type Shape = TextShape | RectShape | EllipseShape | ImageShape | LineShape;

export interface Doc {
  id: string;
  name: string;
  width: number;
  height: number;
  background: Background;
  shapes: Shape[];
}

export interface ProjectRecord {
  id: string;
  name: string;
  updatedAt: number;
  thumb: string;
  doc: Doc;
}

export type Tool = "select" | "text" | "rect" | "ellipse" | "image" | "brush";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const NO_FILTERS: ImageFilters = { brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: false };
