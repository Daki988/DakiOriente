import type { Match, MarketId, MarketOffer } from '../types';
import { dayKey } from './format';

export type SortKey = 'kickoff' | 'probability' | 'odds';

export interface MatchFilterState {
  search: string;
  competitionId: string; // '' = toutes
  day: string; // '' = toutes, sinon AAAA-MM-JJ
  market: MarketId | '';
  minOdds: number | null;
  maxOdds: number | null;
  minProbability: number; // 0–1
  sort: SortKey;
  sortDir: 'asc' | 'desc';
}

export const DEFAULT_MATCH_FILTERS: MatchFilterState = {
  search: '',
  competitionId: '',
  day: '',
  market: '',
  minOdds: null,
  maxOdds: null,
  minProbability: 0,
  sort: 'kickoff',
  sortDir: 'asc',
};

const RESULT_MARKETS: MarketId[] = ['HOME_WIN', 'DRAW', 'AWAY_WIN'];

const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** Offre de référence d'un match pour l'affichage et le tri. */
export function referenceOffer(match: Match, f: Pick<MatchFilterState, 'market' | 'minOdds' | 'maxOdds' | 'minProbability'>): MarketOffer | null {
  const candidates = match.markets.filter(
    (o) =>
      (f.market ? o.market === f.market : RESULT_MARKETS.includes(o.market) || f.minProbability > 0 || f.minOdds != null || f.maxOdds != null) &&
      (f.minOdds == null || o.odds >= f.minOdds) &&
      (f.maxOdds == null || o.odds <= f.maxOdds) &&
      o.probability >= f.minProbability,
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((best, o) => (o.probability > best.probability ? o : best));
}

/** `offer` est null pour un match sans cote, conservé seulement quand aucun filtre de cote/marché/probabilité n'est actif. */
export function filterMatches(matches: Match[], competitionNames: Record<string, string>, f: MatchFilterState): { match: Match; offer: MarketOffer | null }[] {
  const offerFilter = Boolean(f.market) || f.minOdds != null || f.maxOdds != null || f.minProbability > 0;
  const q = normalize(f.search.trim());
  const rows = matches
    .filter((m) => !q || normalize(`${m.home.name} ${m.away.name}`).includes(q))
    .filter((m) => !f.competitionId || m.competitionId === f.competitionId)
    .filter((m) => !f.day || dayKey(m.kickoff) === f.day)
    .map((m) => ({ match: m, offer: referenceOffer(m, f) }))
    .filter((r) => r.offer !== null || (!offerFilter && r.match.markets.length === 0));

  const dir = f.sortDir === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    let d = 0;
    if (f.sort === 'kickoff') d = a.match.kickoff.localeCompare(b.match.kickoff);
    if (f.sort === 'probability') d = (a.offer?.probability ?? -1) - (b.offer?.probability ?? -1);
    if (f.sort === 'odds') d = (a.offer?.odds ?? 0) - (b.offer?.odds ?? 0);
    return d * dir || (competitionNames[a.match.competitionId] ?? '').localeCompare(competitionNames[b.match.competitionId] ?? '');
  });
  return rows;
}
