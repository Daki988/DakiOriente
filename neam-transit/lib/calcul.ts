import { MODES, type ModeCode } from "./referentiel";

export type Quantites = { poids?: number; volume?: number; quantite?: number };

export type OffreTarif = {
  mode: ModeCode;
  prix_xaf: number;
  minimum: number;
  frais_fixes_xaf: number;
  diviseur_vol: number;
};

export type Estimation = {
  /** Quantité facturée dans l'unité de l'offre (kg, m³, conteneur, véhicule). */
  facturable: number;
  /** Explication courte du calcul (poids réel, volumétrique, minimum…). */
  base: string;
  fret: number;
  frais: number;
  total: number;
};

/** Poids volumétrique aérien : volume (m³) × 1 000 000 / diviseur (6000 en général). */
export function poidsVolumetrique(volumeM3: number, diviseur = 6000): number {
  return (volumeM3 * 1_000_000) / diviseur;
}

export function volumeCartons(cartons: { l: number; w: number; h: number; n: number }[]): number {
  return cartons.reduce((s, c) => s + (c.l * c.w * c.h * c.n) / 1_000_000, 0);
}

/** Estime le coût total d'une offre pour un envoi. Renvoie null si les quantités manquent. */
export function estimer(o: OffreTarif, q: Quantites): Estimation | null {
  const unite = MODES[o.mode].unite;
  const poids = q.poids && q.poids > 0 ? q.poids : 0;
  const volume = q.volume && q.volume > 0 ? q.volume : 0;
  let facturable = 0;
  let base = "";

  if (unite === "kg") {
    if (!poids && !volume) return null;
    const vol = poidsVolumetrique(volume, o.diviseur_vol || 6000);
    facturable = Math.max(poids, vol, o.minimum);
    base = facturable === o.minimum && o.minimum > Math.max(poids, vol) ? `minimum ${o.minimum} kg` : vol > poids ? `poids volumétrique ${vol.toFixed(1)} kg` : `poids réel ${poids} kg`;
  } else if (unite === "cbm") {
    if (!poids && !volume) return null;
    const eq = poids / 1000; // règle « 1 tonne = 1 m³ »
    facturable = Math.max(volume, eq, o.minimum);
    base = facturable === o.minimum && o.minimum > Math.max(volume, eq) ? `minimum ${o.minimum} m³` : eq > volume ? `poids ${poids} kg ≈ ${eq.toFixed(2)} m³ (1 t = 1 m³)` : `volume ${volume} m³`;
  } else {
    facturable = Math.max(1, Math.floor(q.quantite || 1));
    base = `${facturable} ${unite === "conteneur" ? "conteneur(s)" : "véhicule(s)"}`;
  }
  const fret = facturable * o.prix_xaf;
  const frais = o.frais_fixes_xaf || 0;
  return { facturable, base, fret, frais, total: Math.round(fret + frais) };
}

export function mediane(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function percentile(xs: number[], p: number): number {
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1);
  return s[Math.max(0, i)];
}
