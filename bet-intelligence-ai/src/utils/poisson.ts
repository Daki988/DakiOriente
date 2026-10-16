import type { MarketId } from '../types';

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function poissonPmf(k: number, lambda: number): number {
  return (Math.exp(-lambda) * lambda ** k) / factorial(k);
}

/** Matrice des scores exacts [buts domicile][buts extérieur] (modèle de Poisson indépendant). */
export function scoreMatrix(lambdaHome: number, lambdaAway: number, maxGoals = 10): number[][] {
  const m: number[][] = [];
  for (let h = 0; h <= maxGoals; h++) {
    m[h] = [];
    for (let a = 0; a <= maxGoals; a++) {
      m[h][a] = poissonPmf(h, lambdaHome) * poissonPmf(a, lambdaAway);
    }
  }
  return m;
}

/** Indique si un score donné valide le marché. */
export function marketWins(market: MarketId, home: number, away: number): boolean {
  const total = home + away;
  switch (market) {
    case 'HOME_WIN':
      return home > away;
    case 'DRAW':
      return home === away;
    case 'AWAY_WIN':
      return away > home;
    case 'DOUBLE_CHANCE_1X':
      return home >= away;
    case 'DOUBLE_CHANCE_X2':
      return away >= home;
    case 'OVER_1_5':
      return total >= 2;
    case 'OVER_2_5':
      return total >= 3;
    case 'UNDER_3_5':
      return total <= 3;
    case 'BTTS_YES':
      return home > 0 && away > 0;
  }
}

/** Probabilités de tous les marchés à partir des buts attendus. */
export function marketProbabilities(
  lambdaHome: number,
  lambdaAway: number,
  markets: MarketId[],
): Record<MarketId, number> {
  const m = scoreMatrix(lambdaHome, lambdaAway);
  const out = {} as Record<MarketId, number>;
  for (const market of markets) {
    let p = 0;
    for (let h = 0; h < m.length; h++) {
      for (let a = 0; a < m[h].length; a++) {
        if (marketWins(market, h, a)) p += m[h][a];
      }
    }
    out[market] = Math.min(1, p);
  }
  return out;
}
