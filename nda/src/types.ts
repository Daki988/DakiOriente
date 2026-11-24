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

/** Provinces du Gabon (abréviation Nda → code ISO 3166-2:GA). */
export const PROVINCES = {
  ES: { nom: "Estuaire", iso: "GA-1" },
  HO: { nom: "Haut-Ogooué", iso: "GA-2" },
  MO: { nom: "Moyen-Ogooué", iso: "GA-3" },
  NG: { nom: "Ngounié", iso: "GA-4" },
  NY: { nom: "Nyanga", iso: "GA-5" },
  OI: { nom: "Ogooué-Ivindo", iso: "GA-6" },
  OL: { nom: "Ogooué-Lolo", iso: "GA-7" },
  OM: { nom: "Ogooué-Maritime", iso: "GA-8" },
  WN: { nom: "Woleu-Ntem", iso: "GA-9" },
} as const;

export type ProvinceCode = keyof typeof PROVINCES;

export interface Voie {
  /** Identifiant dans le référentiel (stable, même si la voie est renommée). */
  id: string;
  /** Type : Rue, Avenue, Boulevard, Impasse, Place… */
  type: string;
  /** Nom officiel attribué par la commune. */
  nom: string;
}

/**
 * Zone d'adressage : un arrondissement pour les villes découpées
 * (Libreville), sinon la commune entière (Owendo, Akanda…).
 */
export interface Zone {
  /** Code à 3 caractères, unique dans la province, ex. « LB1 » = Libreville 1er arr. */
  code: string;
  commune: string;
  /** Libellé d'arrondissement, ex. « 1er arrondissement ». */
  arrondissement?: string;
  province: ProvinceCode;
  /** Emprise de la zone. À remplacer par le polygone officiel en production. */
  bbox: BBox;
  quartiers: string[];
  voies: Voie[];
}

export interface Adresse {
  zone: Zone;
  quartier?: string;
  /** Absente quand la voie n'est pas encore nommée. */
  voie?: Voie;
  numero?: string;
  position: Point;
  code: string;
  repere?: string;
}
