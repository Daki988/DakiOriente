/**
 * Couche d'accès aux matchs.
 * Aujourd'hui : données locales synthétiques. Demain : remplacer le corps de
 * `fetchMatches` par un appel au backend (ex. `fetch('/api/matches')`) renvoyant
 * des objets `Match` — le reste de l'application n'a pas à changer.
 */
import { MIN_SAMPLE_SIZE } from '../data/demoStatistics';
import type { Competition, Match, MarketId, Selection, Settings } from '../types';
import { VOLATILE_MARKETS } from '../utils/markets';
import { impliedProbability, round } from '../utils/math';
import { formatNumber, formatPct } from '../utils/format';
import { buildDemoMatches, demoCompetitions, expectedGoals } from './demoEngine';

export const DATA_SOURCE = { mode: 'demo' as const, label: 'Données synthétiques de démonstration' };

export async function fetchMatches(oddsSeed: number, reference = new Date()): Promise<Match[]> {
  // Simule une latence réseau légère pour exercer les états de chargement.
  await new Promise((r) => setTimeout(r, 250));
  return buildDemoMatches(oddsSeed, reference);
}

export async function fetchCompetitions(): Promise<Competition[]> {
  return demoCompetitions;
}

export function competitionName(competitions: Competition[], id: string): string {
  return competitions.find((c) => c.id === id)?.name ?? id;
}

export function hasSufficientData(match: Pick<Match, 'sampleSize' | 'dataQuality'>): boolean {
  return match.sampleSize >= MIN_SAMPLE_SIZE && match.dataQuality !== 'LOW';
}

/** Motif de sélection pré-rédigé, cohérent avec les statistiques simulées. */
export function selectionReason(match: Match, market: MarketId): string {
  const xg = expectedGoals(match.home.id, match.away.id);
  const h = match.homeStats;
  const a = match.awayStats;
  const total = formatNumber(xg.home + xg.away);
  switch (market) {
    case 'HOME_WIN':
      return `${match.home.name} génère ${formatNumber(xg.home)} buts attendus simulés contre ${formatNumber(xg.away)} pour ${match.away.name}.`;
    case 'AWAY_WIN':
      return `${match.away.name} domine le rapport de force simulé (${formatNumber(xg.away)} xG contre ${formatNumber(xg.home)}).`;
    case 'DRAW':
      return `Rapport de force équilibré : écart de buts attendus de ${formatNumber(Math.abs(xg.home - xg.away))}.`;
    case 'DOUBLE_CHANCE_1X':
      return `${match.home.name} n'a perdu que ${h.venueRecord.lost} de ses ${h.venueRecord.played} matchs simulés à domicile.`;
    case 'DOUBLE_CHANCE_X2':
      return `${match.away.name} n'a perdu que ${a.venueRecord.lost} de ses ${a.venueRecord.played} matchs simulés à l'extérieur.`;
    case 'OVER_1_5':
      return `Total de buts attendus simulé de ${total} pour cette rencontre.`;
    case 'OVER_2_5':
      return `Deux attaques productives : ${total} buts attendus simulés au total.`;
    case 'UNDER_3_5':
      return `Profil fermé : ${total} buts attendus simulés, ${formatPct(h.cleanSheetPct / 100)} de clean sheets pour ${match.home.name}.`;
    case 'BTTS_YES':
      return `Les deux équipes dépassent ${formatNumber(Math.min(xg.home, xg.away))} xG simulé et concèdent régulièrement.`;
  }
}

export function toSelections(matches: Match[], competitions: Competition[]): Selection[] {
  return matches.flatMap((m) =>
    m.markets.map((o) => {
      const implied = impliedProbability(o.odds);
      return {
        id: `${m.id}:${o.market}`,
        matchId: m.id,
        market: o.market,
        odds: o.odds,
        probability: o.probability,
        impliedProbability: round(implied, 4),
        edge: round(o.probability - implied, 4),
        dataQuality: m.dataQuality,
        homeName: m.home.name,
        awayName: m.away.name,
        competitionName: competitionName(competitions, m.competitionId),
        kickoff: m.kickoff,
        reason: selectionReason(m, o.market),
      };
    }),
  );
}

export interface EligibilityCheck {
  eligible: boolean;
  marketNotAllowed: boolean;
  lowProbability: boolean;
  oddsOutOfRange: boolean;
  insufficientData: boolean;
}

export const PRUDENT_MIN_PROBABILITY = 0.78;
export const PRUDENT_MAX_SELECTIONS = 3;

/**
 * Critères effectifs : le mode prudent durcit les règles configurées
 * (données de haute qualité uniquement, marchés volatils exclus,
 * probabilité minimale relevée, 3 sélections au plus).
 */
export function effectiveCriteria(settings: Settings) {
  const allowed = settings.prudentMode
    ? settings.allowedMarkets.filter((m) => !VOLATILE_MARKETS.includes(m))
    : settings.allowedMarkets;
  return {
    allowedMarkets: allowed,
    minProbability: settings.prudentMode ? Math.max(settings.minProbability, PRUDENT_MIN_PROBABILITY) : settings.minProbability,
    minOdds: settings.minOdds,
    maxOdds: settings.maxOdds,
    maxSelections: settings.prudentMode ? Math.min(settings.maxSelections, PRUDENT_MAX_SELECTIONS) : settings.maxSelections,
    requireHighQuality: settings.prudentMode,
  };
}

export function checkEligibility(
  sel: Selection,
  settings: Settings,
  sampleSizeByMatch: Map<string, number>,
  now = new Date(),
): EligibilityCheck {
  const c = effectiveCriteria(settings);
  const marketNotAllowed = !c.allowedMarkets.includes(sel.market);
  const lowProbability = sel.probability < c.minProbability;
  const oddsOutOfRange = sel.odds < c.minOdds || sel.odds > c.maxOdds;
  const sample = sampleSizeByMatch.get(sel.matchId) ?? 0;
  const insufficientData =
    !hasSufficientData({ sampleSize: sample, dataQuality: sel.dataQuality }) ||
    (c.requireHighQuality && sel.dataQuality !== 'HIGH') ||
    new Date(sel.kickoff) <= now;
  return {
    eligible: !marketNotAllowed && !lowProbability && !oddsOutOfRange && !insufficientData,
    marketNotAllowed,
    lowProbability,
    oddsOutOfRange,
    insufficientData,
  };
}

/** Sélections admissibles triées par probabilité puis par écart favorable. */
export function eligibleSelections(matches: Match[], selections: Selection[], settings: Settings, now = new Date()): Selection[] {
  const samples = new Map(matches.map((m) => [m.id, m.sampleSize]));
  return selections
    .filter((s) => checkEligibility(s, settings, samples, now).eligible)
    .sort((a, b) => b.probability - a.probability || b.edge - a.edge);
}

