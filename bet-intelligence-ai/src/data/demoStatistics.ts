/**
 * Profils de force FICTIFS utilisés par le moteur déterministe de démonstration.
 * attack / defense : 1 = niveau moyen ; attack > 1 = plus offensif ; defense < 1 = plus solide.
 * Ces valeurs ne décrivent aucune équipe réelle.
 */
export interface StrengthProfile {
  attack: number;
  defense: number;
  possession: number; // pourcentage moyen
}

export const LEAGUE_AVG_GOALS = 1.35;
export const HOME_ADVANTAGE = 1.12;
export const AWAY_FACTOR = 0.9;
/** Marge moyenne appliquée pour fabriquer les cotes de démonstration. */
export const DEMO_MARGIN = 0.055;

export const DEMO_STRENGTHS: Record<string, StrengthProfile> = {
  horizon: { attack: 1.62, defense: 0.62, possession: 61 },
  mirage: { attack: 1.18, defense: 0.92, possession: 53 },
  nova: { attack: 1.55, defense: 0.7, possession: 58 },
  cobalt: { attack: 1.22, defense: 0.84, possession: 54 },
  delta: { attack: 1.05, defense: 1.02, possession: 49 },
  boreal: { attack: 0.78, defense: 1.24, possession: 44 },
  zenith: { attack: 1.7, defense: 0.66, possession: 63 },
  prisme: { attack: 1.48, defense: 0.74, possession: 57 },
  quartz: { attack: 0.82, defense: 1.3, possession: 42 },
  lagune: { attack: 0.74, defense: 1.36, possession: 41 },
  basalte: { attack: 0.9, defense: 1.14, possession: 46 },
  savane: { attack: 1.44, defense: 0.72, possession: 56 },
  opale: { attack: 0.86, defense: 1.28, possession: 43 },
  phenix: { attack: 1.32, defense: 1.08, possession: 52 },
  granit: { attack: 1.1, defense: 0.98, possession: 50 },
  golfe: { attack: 1.0, defense: 1.12, possession: 47 },
  cristal: { attack: 0.8, defense: 1.22, possession: 45 },
  aurore: { attack: 1.26, defense: 1.18, possession: 50 },
  meridien: { attack: 1.58, defense: 0.68, possession: 60 },
  tempete: { attack: 0.88, defense: 1.2, possession: 45 },
  sequoia: { attack: 1.15, defense: 1.06, possession: 51 },
  onyx: { attack: 1.02, defense: 1.1, possession: 48 },
  atlas: { attack: 1.5, defense: 0.76, possession: 58 },
  vega: { attack: 0.76, defense: 1.26, possession: 43 },
  emeraude: { attack: 1.36, defense: 1.12, possession: 52 },
  cyclone: { attack: 1.3, defense: 1.2, possession: 49 },
  titan: { attack: 1.4, defense: 0.8, possession: 56 },
  lumiere: { attack: 0.84, defense: 1.18, possession: 44 },
};

/** Taille d'échantillon simulée selon la qualité de données. */
export const SAMPLE_SIZE_BY_QUALITY = { HIGH: 18, MEDIUM: 10, LOW: 4 } as const;

/** Seuil en dessous duquel les données sont jugées insuffisantes pour une sélection. */
export const MIN_SAMPLE_SIZE = 6;
