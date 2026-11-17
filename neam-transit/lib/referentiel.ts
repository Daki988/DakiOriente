/** Référentiels métier : pays et villes d'origine, villes du Gabon, modes de transport, marchandises. */

export type PaysCode = "CN" | "KR";

export const PAYS: Record<PaysCode, { nom: string; drapeau: string; villes: string[] }> = {
  CN: { nom: "Chine", drapeau: "🇨🇳", villes: ["Guangzhou", "Shenzhen", "Yiwu", "Foshan", "Shanghai", "Ningbo"] },
  KR: { nom: "Corée du Sud", drapeau: "🇰🇷", villes: ["Séoul", "Incheon", "Busan"] },
};

export const PAYS_CODES = Object.keys(PAYS) as PaysCode[];

/** Gabon : les 9 provinces et leurs principales villes. */
export const PROVINCES: { province: string; villes: string[] }[] = [
  { province: "Estuaire", villes: ["Libreville", "Owendo", "Akanda", "Ntoum", "Kango", "Cocobeach"] },
  { province: "Haut-Ogooué", villes: ["Franceville", "Moanda", "Mounana", "Okondja", "Léconi"] },
  { province: "Moyen-Ogooué", villes: ["Lambaréné", "Ndjolé"] },
  { province: "Ngounié", villes: ["Mouila", "Fougamou", "Ndendé", "Mbigou"] },
  { province: "Nyanga", villes: ["Tchibanga", "Mayumba"] },
  { province: "Ogooué-Ivindo", villes: ["Makokou", "Booué", "Mékambo"] },
  { province: "Ogooué-Lolo", villes: ["Koulamoutou", "Lastoursville"] },
  { province: "Ogooué-Maritime", villes: ["Port-Gentil", "Omboué", "Gamba"] },
  { province: "Woleu-Ntem", villes: ["Oyem", "Bitam", "Mitzic", "Minvoul"] },
];

export const VILLES_GABON = PROVINCES.flatMap((p) => p.villes);

/** Villes considérées comme le Grand Libreville (point d'arrivée habituel). */
export const GRAND_LIBREVILLE = ["Libreville", "Owendo", "Akanda"];

export type ModeCode = "aerien_groupage" | "express" | "maritime_lcl" | "fcl20" | "fcl40" | "roro";
export type Unite = "kg" | "cbm" | "conteneur" | "vehicule";
export type Famille = "aerien" | "maritime";

export const MODES: Record<ModeCode, { label: string; court: string; famille: Famille; unite: Unite; icone: string }> = {
  aerien_groupage: { label: "Aérien groupage", court: "Avion", famille: "aerien", unite: "kg", icone: "✈️" },
  express: { label: "Express porte-à-porte", court: "Express", famille: "aerien", unite: "kg", icone: "⚡" },
  maritime_lcl: { label: "Maritime groupage (LCL)", court: "Bateau", famille: "maritime", unite: "cbm", icone: "🚢" },
  fcl20: { label: "Conteneur complet 20'", court: "20 pieds", famille: "maritime", unite: "conteneur", icone: "📦" },
  fcl40: { label: "Conteneur complet 40'", court: "40 pieds", famille: "maritime", unite: "conteneur", icone: "📦" },
  roro: { label: "Véhicule (Ro-Ro)", court: "Véhicule", famille: "maritime", unite: "vehicule", icone: "🚗" },
};

export const MODE_CODES = Object.keys(MODES) as ModeCode[];

export const UNITE_LABEL: Record<Unite, string> = {
  kg: "kg",
  cbm: "m³ (CBM)",
  conteneur: "conteneur",
  vehicule: "véhicule",
};

/** Ce que l'utilisateur choisit dans le moteur de recherche. */
export type TypeEnvoi = "groupage" | "conteneur" | "vehicule";
export type Transport = "avion" | "bateau" | "tous";

export function modesPourRecherche(type: TypeEnvoi, transport: Transport): ModeCode[] {
  if (type === "conteneur") return ["fcl20", "fcl40"];
  if (type === "vehicule") return ["roro"];
  if (transport === "avion") return ["aerien_groupage", "express"];
  if (transport === "bateau") return ["maritime_lcl"];
  return ["aerien_groupage", "express", "maritime_lcl"];
}

export type MarchandiseCode =
  | "generale"
  | "textile"
  | "cosmetiques"
  | "electronique"
  | "batteries"
  | "liquides"
  | "alimentaire"
  | "pieces_auto"
  | "mobilier"
  | "vehicule";

export const MARCHANDISES: Record<MarchandiseCode, { label: string; sensible: boolean }> = {
  generale: { label: "Marchandise générale", sensible: false },
  textile: { label: "Vêtements, chaussures, textile", sensible: false },
  cosmetiques: { label: "Cosmétiques, parfums", sensible: true },
  electronique: { label: "Électronique (sans batterie seule)", sensible: false },
  batteries: { label: "Batteries lithium, power banks", sensible: true },
  liquides: { label: "Liquides, poudres, gels", sensible: true },
  alimentaire: { label: "Produits alimentaires", sensible: true },
  pieces_auto: { label: "Pièces automobiles", sensible: false },
  mobilier: { label: "Mobilier, matériaux", sensible: false },
  vehicule: { label: "Véhicule", sensible: false },
};

export const MARCHANDISE_CODES = Object.keys(MARCHANDISES) as MarchandiseCode[];

export const BADGES = {
  identite: { label: "Identité vérifiée", description: "Pièce d'identité du gérant contrôlée" },
  entreprise: { label: "Entreprise enregistrée", description: "RCCM et NIF contrôlés" },
  douane: { label: "Agréé en douane", description: "Agrément de commissionnaire en douane contrôlé" },
  entrepot_chine: { label: "Entrepôt Chine vérifié", description: "Adresse d'entrepôt ou de partenaire en Chine contrôlée" },
  entrepot_coree: { label: "Entrepôt Corée vérifié", description: "Adresse d'entrepôt ou de partenaire en Corée contrôlée" },
} as const;

export type BadgeCode = keyof typeof BADGES;
export const BADGE_CODES = Object.keys(BADGES) as BadgeCode[];

export function isPays(v: unknown): v is PaysCode {
  return typeof v === "string" && v in PAYS;
}
export function isMode(v: unknown): v is ModeCode {
  return typeof v === "string" && v in MODES;
}
export function isMarchandise(v: unknown): v is MarchandiseCode {
  return typeof v === "string" && v in MARCHANDISES;
}
export function isVilleGabon(v: unknown): v is string {
  return typeof v === "string" && VILLES_GABON.includes(v);
}
