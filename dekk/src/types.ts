export interface Point {
  lat: number;
  lon: number;
}

export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** Codes régionaux ISO 3166-2:SN (sans « SN- »). */
export type RegionCode =
  | "DK" | "DB" | "FK" | "KA" | "KL" | "KE" | "KD"
  | "LG" | "MT" | "SL" | "SE" | "TC" | "TH" | "ZG";

export interface Voie {
  /** Code officiel de la voie, ex. « SL-41 » ou « DK-123 ». */
  code: string;
  /** Type : Rue, Avenue, Boulevard, Allée… */
  type: string;
  /** Nom d'usage officiel s'il existe (ex. « Cheikh Anta Diop »). */
  nom?: string;
}

export interface Commune {
  /** Code Dëkk à 3 lettres, unique dans la région. */
  code: string;
  nom: string;
  region: RegionCode;
  departement: string;
  /** Emprise de la commune. À remplacer par le polygone officiel en production. */
  bbox: BBox;
  quartiers: string[];
  voies: Voie[];
}

export interface Adresse {
  commune: Commune;
  quartier?: string;
  /** Absente quand la rue n'est pas encore nommée/codifiée. */
  voie?: Voie;
  numero?: string;
  position: Point;
  code: string;
  repere?: string;
}
