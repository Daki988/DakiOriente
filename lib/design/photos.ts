import type { Quad } from "./perspective.ts";
import type { MockupKind } from "./templates.ts";

/** Zone de la photo où le design est plaqué (coins dans l'ordre HG, HD, BD, BG, en px de la photo). */
export type PhotoZone = { quad: Quad; side?: number; shade?: number };
export type MockupPhoto = {
  kind: MockupKind; src: string; w: number; h: number; alt: string; zones: PhotoZone[];
  /** Crédit facultatif (licences Unsplash et Pexels : usage commercial libre, attribution appréciée). */
  credit?: { author: string; site: string; url: string };
};

/** Photos de mise en scène disponibles, par type (vides tant qu'aucune photo n'est ajoutée). */
export const PHOTOS: MockupPhoto[] = [];

export const photoFor = (kind: MockupKind) => PHOTOS.find((p) => p.kind === kind);
