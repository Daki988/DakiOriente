/**
 * Moteur DÉTERMINISTE de démonstration.
 * Il ne s'agit pas d'un modèle d'intelligence artificielle : les probabilités sont
 * obtenues par un modèle de Poisson appliqué à des profils de force fictifs, et les
 * cotes sont fabriquées à partir de ces probabilités (marge + bruit pseudo-aléatoire).
 */
import { DEMO_COMPETITIONS, DEMO_FIXTURES, DEMO_TEAMS, type DemoFixture } from '../data/demoMatches';
import {
  AWAY_FACTOR,
  DEMO_MARGIN,
  DEMO_STRENGTHS,
  HOME_ADVANTAGE,
  LEAGUE_AVG_GOALS,
  SAMPLE_SIZE_BY_QUALITY,
  type StrengthProfile,
} from '../data/demoStatistics';
import type { Match, MarketOffer, RecentMatch, Team, TeamStats } from '../types';
import { ALL_MARKET_IDS } from '../utils/markets';
import { clamp, round } from '../utils/math';
import { marketProbabilities } from '../utils/poisson';
import { hashString, mulberry32, samplePoisson } from '../utils/random';

const teamById = new Map(DEMO_TEAMS.map((t) => [t.id, t]));

function teamOf(id: string): Team {
  const t = teamById.get(id);
  if (!t) throw new Error(`Équipe de démonstration inconnue : ${id}`);
  return t;
}

function strengthOf(id: string): StrengthProfile {
  return DEMO_STRENGTHS[id] ?? { attack: 1, defense: 1, possession: 50 };
}

/** Buts attendus simulés pour une rencontre. */
export function expectedGoals(homeId: string, awayId: string): { home: number; away: number } {
  const h = strengthOf(homeId);
  const a = strengthOf(awayId);
  return {
    home: LEAGUE_AVG_GOALS * h.attack * a.defense * HOME_ADVANTAGE,
    away: LEAGUE_AVG_GOALS * a.attack * h.defense * AWAY_FACTOR,
  };
}

function buildRecent(teamId: string, rand: () => number): RecentMatch[] {
  const me = strengthOf(teamId);
  const others = DEMO_TEAMS.filter((t) => t.id !== teamId);
  const recent: RecentMatch[] = [];
  for (let i = 0; i < 5; i++) {
    const opp = others[Math.floor(rand() * others.length)];
    const o = strengthOf(opp.id);
    const atHome = rand() < 0.5;
    const lf = LEAGUE_AVG_GOALS * me.attack * o.defense * (atHome ? HOME_ADVANTAGE : AWAY_FACTOR);
    const la = LEAGUE_AVG_GOALS * o.attack * me.defense * (atHome ? AWAY_FACTOR : HOME_ADVANTAGE);
    const gf = samplePoisson(lf, rand);
    const ga = samplePoisson(la, rand);
    recent.push({
      opponent: opp.name,
      venue: atHome ? 'DOM' : 'EXT',
      goalsFor: gf,
      goalsAgainst: ga,
      result: gf > ga ? 'W' : gf === ga ? 'D' : 'L',
    });
  }
  return recent;
}

function buildStats(teamId: string, isHome: boolean, sampleSize: number, rand: () => number): TeamStats {
  const s = strengthOf(teamId);
  const venue = isHome ? HOME_ADVANTAGE : AWAY_FACTOR;
  const jitter = () => 1 + (rand() - 0.5) * 0.12;
  const xgFor = LEAGUE_AVG_GOALS * s.attack * venue * jitter();
  const xgAgainst = LEAGUE_AVG_GOALS * s.defense * (isHome ? AWAY_FACTOR : HOME_ADVANTAGE) * jitter();
  const goalsScoredAvg = xgFor * jitter();
  const goalsConcededAvg = xgAgainst * jitter();
  const shotsPerMatch = 8 + s.attack * 6 * jitter();
  // Bilan à domicile/extérieur cohérent avec le rapport de force moyen.
  const played = Math.max(2, Math.round(sampleSize / 2));
  const avg = marketProbabilities(xgFor, xgAgainst, ['HOME_WIN', 'DRAW']);
  const won = Math.round(played * avg.HOME_WIN);
  const drawn = Math.min(played - won, Math.round(played * avg.DRAW));
  return {
    goalsScoredAvg: round(goalsScoredAvg),
    goalsConcededAvg: round(goalsConcededAvg),
    xgFor: round(xgFor),
    xgAgainst: round(xgAgainst),
    shotsPerMatch: round(shotsPerMatch, 1),
    shotsOnTargetPerMatch: round(shotsPerMatch * (0.3 + s.attack * 0.05), 1),
    possessionPct: Math.round(clamp(s.possession + (rand() - 0.5) * 4, 30, 70)),
    cleanSheetPct: Math.round(clamp(Math.exp(-xgAgainst) * 100, 3, 70)),
    venueRecord: { played, won, drawn, lost: played - won - drawn },
    recent: buildRecent(teamId, rand),
  };
}

function kickoffFor(f: DemoFixture, reference: Date): string {
  const d = new Date(reference);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1 + f.dayOffset);
  d.setHours(f.hour, f.minute, 0, 0);
  return d.toISOString();
}

/** Fabrique les cotes de démonstration à partir des probabilités (marge + bruit). */
function buildOffers(probs: Record<string, number>, rand: () => number): MarketOffer[] {
  return ALL_MARKET_IDS.map((market) => {
    const p = probs[market];
    const noise = (rand() - 0.5) * 0.14; // ±7 %
    const odds = clamp(round((1 / (p * (1 + DEMO_MARGIN))) * (1 + noise)), 1.01, 25);
    return { market, odds, probability: round(p, 4) };
  });
}

/**
 * Construit l'ensemble des matchs de démonstration.
 * @param oddsSeed graine des variations de cotes (modifiée par « Actualiser »)
 * @param reference date de référence pour positionner les rencontres
 */
export function buildDemoMatches(oddsSeed: number, reference: Date = new Date()): Match[] {
  return DEMO_FIXTURES.map((f) => {
    const statsRand = mulberry32(hashString(`stats:${f.id}`));
    const oddsRand = mulberry32(hashString(`odds:${f.id}:${oddsSeed}`));
    const sampleSize = SAMPLE_SIZE_BY_QUALITY[f.dataQuality];
    const xg = expectedGoals(f.homeId, f.awayId);
    const probs = marketProbabilities(xg.home, xg.away, ALL_MARKET_IDS);
    return {
      id: f.id,
      competitionId: f.competitionId,
      kickoff: kickoffFor(f, reference),
      home: teamOf(f.homeId),
      away: teamOf(f.awayId),
      homeStats: buildStats(f.homeId, true, sampleSize, statsRand),
      awayStats: buildStats(f.awayId, false, sampleSize, statsRand),
      dataQuality: f.dataQuality,
      sampleSize,
      markets: buildOffers(probs, oddsRand),
      expectedGoals: { home: xg.home, away: xg.away },
      source: 'demo' as const,
    };
  });
}

export const demoCompetitions = DEMO_COMPETITIONS;
