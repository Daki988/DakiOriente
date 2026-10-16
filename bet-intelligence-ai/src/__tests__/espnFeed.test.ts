import { describe, expect, it } from 'vitest';
import { alexandriaBlocks, buildFromFeed, estimatedCredits, feedDates, leagueFromBlocks, leagueRequest, MODEL_BOOKMAKER, type EspnFeed } from '../services/espnFeed';

// Extraits au format exact renvoyé par Firecrawl (fournisseur espn-com), valeurs réduites.
const stat = (name: string, value: number) => ({ name, value, display_value: String(value) });
const entry = (id: string, name: string, abbr: string, gp: number, w: number, d: number, l: number, gf: number, ga: number) => ({
  team_id: id, display_name: name, abbreviation: abbr,
  stats: [stat('gamesPlayed', gp), stat('wins', w), stat('ties', d), stat('losses', l), stat('pointsFor', gf), stat('pointsAgainst', ga)],
});
const standings = { league: { name: 'English Premier League' }, tables: [{ entries: [
  entry('382', 'Manchester City', 'MNC', 6, 6, 0, 0, 16, 5), entry('373', 'Ipswich Town', 'IPS', 6, 3, 0, 3, 9, 12),
  entry('368', 'Everton', 'EVE', 6, 2, 4, 0, 8, 5), entry('363', 'Chelsea', 'CHE', 6, 3, 1, 2, 15, 13),
] }] };
const comp = (id: string, side: 'home' | 'away', form: string, score: number | null) => ({ team_id: id, home_away: side, form, score_value: score, score: score == null ? null : String(score) });
const scoreboardSat = { events: [
  { event_id: '401879259', start_time: '2026-10-17T14:00Z', status: { state: 'pre', completed: false, name: 'STATUS_SCHEDULED' }, competitors: [comp('382', 'home', 'DWWWW', null), comp('373', 'away', 'DLLWL', null)] },
] };
const scoreboardThu = { events: [
  { event_id: '401870000', start_time: '2026-10-15T19:00Z', status: { state: 'post', completed: true, name: 'STATUS_FULL_TIME' }, competitors: [comp('368', 'home', 'DWWDD', 1), comp('363', 'away', 'DLDWL', 1)] },
] };
const payload = { success: true, data: { alexandria: [
  { provider: 'espn-com', capability: 'sports-data/standings', data: standings },
  { provider: 'espn-com', capability: 'sports-data/scoreboard', data: scoreboardThu },
  { provider: 'espn-com', capability: 'sports-data/scoreboard', data: scoreboardSat },
  { provider: 'espn-com', capability: 'sports-data/scoreboard', error: { code: 'not_found', message: 'not_found' } },
] } };
const NOW = new Date('2026-10-16T12:00:00Z');

describe('données ESPN via Firecrawl', () => {
  it('requête groupée : classement + 6 jours (≤ 10 capacités)', () => {
    const req = leagueRequest('eng.1', NOW);
    expect(req).toHaveLength(7);
    expect(req.length).toBeLessThanOrEqual(10);
    expect(feedDates(NOW)).toEqual(['20261015', '20261016', '20261017', '20261018', '20261019', '20261020']);
    expect(estimatedCredits(5)).toBe(5 * 7 * 5);
  });

  const { league, errors } = leagueFromBlocks('eng.1', 'Premier League (Angleterre)', alexandriaBlocks(payload));
  it('lit classement, matchs, formes et erreurs partielles', () => {
    expect(league.teams).toHaveLength(4);
    expect(league.teams.find((t) => t.id === '382')).toMatchObject({ gp: 6, gf: 16, ga: 5, form: 'DWWWW' });
    expect(league.events).toHaveLength(2);
    expect(errors).toHaveLength(1);
  });

  it('construit des matchs à venir avec cotes du modèle clairement marquées', () => {
    const feed: EspnFeed = { version: 1, fetchedAt: NOW.toISOString(), leagues: [league], errors };
    const built = buildFromFeed(feed, NOW);
    expect(built.matches).toHaveLength(1);
    const m = built.matches[0];
    expect(m.home.name).toBe('Manchester City');
    expect(m.kickoff).toBe('2026-10-17T14:00:00.000Z');
    expect(m.source).toBe('live');
    expect(m.dataQuality).toBe('MEDIUM'); // 6 matchs joués
    expect(m.expectedGoals.home).toBeGreaterThan(m.expectedGoals.away);
    for (const o of m.markets) {
      expect(o.bookmaker).toBe(MODEL_BOOKMAKER);
      expect(o.odds).toBeCloseTo(1 / o.probability, 1);
    }
    expect(m.homeStats.recent.map((r) => r.result).join('')).toBe('DWWWW');
    expect(m.homeStats.recent[0].goalsFor).toBeNull();
    expect(built.results['401870000']).toEqual({ finished: true, cancelled: false, home: 1, away: 1 });
    expect(built.competitions).toEqual([{ id: 'eng.1', name: 'Premier League (Angleterre)' }]);
  });

  it('ignore les matchs déjà commencés', () => {
    const feed: EspnFeed = { version: 1, fetchedAt: NOW.toISOString(), leagues: [league], errors: [] };
    expect(buildFromFeed(feed, new Date('2026-10-18T00:00:00Z')).matches).toHaveLength(0);
  });
});
