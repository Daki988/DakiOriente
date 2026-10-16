import type { MarketId } from '../types';

export const MARKETS: { id: MarketId; label: string; short: string }[] = [
  { id: 'HOME_WIN', label: 'Victoire domicile (1)', short: '1' },
  { id: 'DRAW', label: 'Match nul (X)', short: 'X' },
  { id: 'AWAY_WIN', label: 'Victoire extérieur (2)', short: '2' },
  { id: 'DOUBLE_CHANCE_1X', label: 'Double chance 1X', short: '1X' },
  { id: 'DOUBLE_CHANCE_X2', label: 'Double chance X2', short: 'X2' },
  { id: 'OVER_1_5', label: 'Plus de 1,5 but', short: '+1,5' },
  { id: 'OVER_2_5', label: 'Plus de 2,5 buts', short: '+2,5' },
  { id: 'UNDER_3_5', label: 'Moins de 3,5 buts', short: '−3,5' },
  { id: 'BTTS_YES', label: 'Les deux équipes marquent', short: 'BTTS' },
];

export const ALL_MARKET_IDS: MarketId[] = MARKETS.map((m) => m.id);

const byId = new Map(MARKETS.map((m) => [m.id, m]));
export const marketLabel = (id: MarketId): string => byId.get(id)?.label ?? id;
export const marketShort = (id: MarketId): string => byId.get(id)?.short ?? id;

/** Marchés jugés plus volatils, exclus en mode prudent. */
export const VOLATILE_MARKETS: MarketId[] = ['DRAW', 'BTTS_YES', 'OVER_2_5'];
