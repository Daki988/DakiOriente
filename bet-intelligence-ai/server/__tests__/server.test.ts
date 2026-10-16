/** Tests sans réseau : un faux fetch reproduit les réponses d'API-Football. */
import { describe, expect, it } from 'vitest';
import { ApiFootballClient, ApiFootballError } from '../apiFootball';
import { createHandler } from '../http';
import { buildModel } from '../model';
import { currentSeason, MatchService, parseOdds, readSettings } from '../service';

const TEAMS: Record<number, string> = { 1: 'Alpha FC', 2: 'Beta United', 3: 'Gamma City', 4: 'Delta Town' };
function fx(id: number, h: number, a: number, hg: number | null, ag: number | null, ts = 0, status = 'FT', date = '2026-10-10T15:00:00+01:00') {
  return {
    fixture: { id, date, timestamp: ts, status: { short: status } },
    league: { id: 39, name: 'Premier League', country: 'England', season: 2026 },
    teams: { home: { id: h, name: TEAMS[h] }, away: { id: a, name: TEAMS[a] } },
    goals: { home: hg, away: ag },
    score: { fulltime: { home: hg, away: ag } },
  };
}
const BASE: [number, number, number, number][] = [[1, 2, 3, 0], [3, 4, 1, 1], [2, 3, 0, 2], [4, 1, 0, 2], [1, 3, 2, 1], [2, 4, 1, 1], [3, 1, 0, 1], [4, 2, 2, 2], [1, 4, 4, 1], [3, 2, 2, 0]];
const FINISHED = Array.from({ length: 5 }, () => BASE).flat().map(([h, a, hg, ag], i) => fx(100 + i, h, a, hg, ag, i));
const UPCOMING = [fx(900, 1, 2, null, null, 0, 'NS', '2026-10-18T15:00:00+01:00'), fx(901, 3, 4, null, null, 0, 'NS', '2026-10-18T18:00:00+01:00')];
const ODDS = [{
  fixture: { id: 900 },
  bookmakers: [
    { id: 8, name: 'Bet365', bets: [{ id: 1, name: 'Match Winner', values: [{ value: 'Home', odd: '1.40' }, { value: 'Draw', odd: '4.50' }, { value: 'Away', odd: '7.00' }] }] },
    { id: 11, name: '1xBet', bets: [
      { id: 1, name: 'Match Winner', values: [{ value: 'Home', odd: '1.45' }, { value: 'Draw', odd: '4.60' }, { value: 'Away', odd: '7.20' }] },
      { id: 5, name: 'Goals Over/Under', values: [{ value: 'Over 1.5', odd: '1.22' }, { value: 'Under 3.5', odd: '1.50' }] },
    ] },
  ],
}];

type Route = (url: URL) => { status?: number; body: unknown } | null;
function fakeFetch(override?: Route): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    expect((init?.headers as Record<string, string>)['x-apisports-key']).toBe('k');
    const o = override?.(url);
    const p = Object.fromEntries(url.searchParams);
    const body = o ? o.body
      : url.pathname === '/fixtures' && p.ids ? { response: [fx(900, 1, 2, 2, 1)] }
      : url.pathname === '/fixtures' && p.status ? { response: p.season === '2026' ? FINISHED : [] }
      : url.pathname === '/fixtures' ? { response: UPCOMING }
      : url.pathname === '/odds' ? { response: ODDS }
      : { response: [] };
    return new Response(JSON.stringify({ errors: [], paging: { total: 1 }, ...(body as object) }), {
      status: o?.status ?? 200,
      headers: { 'x-ratelimit-requests-limit': '100', 'x-ratelimit-requests-remaining': '95' },
    });
  }) as typeof fetch;
}
const settings = { ...readSettings(() => undefined), apiKey: 'k', baseUrl: 'https://x', leagues: [39], season: 2026 };
const svc = (f = fakeFetch()) => new MatchService(settings, new ApiFootballClient('k', 'https://x', f));

describe('serveur Netlify', () => {
  it('saison courante', () => {
    expect(currentSeason(new Date('2026-10-16T00:00:00Z'))).toBe(2026);
    expect(currentSeason(new Date('2027-03-01T00:00:00Z'))).toBe(2026);
  });

  it('modèle : l’équipe dominante a plus de buts attendus', () => {
    const m = buildModel([
      { homeId: 1, awayId: 2, homeGoals: 3, awayGoals: 0, timestamp: 1, homeName: 'A', awayName: 'B' },
      { homeId: 2, awayId: 1, homeGoals: 0, awayGoals: 2, timestamp: 2, homeName: 'B', awayName: 'A' },
    ]);
    const xg = m.expectedGoals(1, 2);
    expect(xg.home).toBeGreaterThan(xg.away);
    expect(m.teams.get(1)!.recent[0].result).toBe('W');
  });

  it('cotes : 1xBet d’abord, repli sur le suivant', () => {
    const o = parseOdds(ODDS, [11, 8]).get(900)!;
    expect(o.get('HOME_WIN')).toEqual([1.45, '1xBet']);
    expect(o.has('BTTS_YES')).toBe(false);
    expect(parseOdds(ODDS, [8, 11]).get(900)!.get('HOME_WIN')).toEqual([1.4, 'Bet365']);
  });

  it('matchs au format du frontend, servis ensuite par le cache', async () => {
    const s = svc();
    const data = await s.matches(new Date('2026-10-16T08:00:00Z'));
    expect(data.errors).toEqual([]);
    expect(data.matches.map((m) => m.id)).toEqual(['900', '901']);
    const m = data.matches[0];
    expect(new Set(m.markets.map((o) => o.market))).toEqual(new Set(['HOME_WIN', 'DRAW', 'AWAY_WIN', 'OVER_1_5', 'UNDER_3_5']));
    expect(m.dataQuality).toBe('HIGH');
    expect(m.homeStats.xgFor).toBeNull();
    expect(m.homeStats.recent).toHaveLength(5);
    expect(data.matches[1].markets).toEqual([]);
    expect(data.quota.remaining).toBe(95);
    const calls = (s as unknown as { c: ApiFootballClient }).c.calls;
    await s.matches(new Date('2026-10-16T08:00:00Z'));
    expect((s as unknown as { c: ApiFootballClient }).c.calls).toBe(calls);
  });

  it('cotes refusées par le plan : matchs conservés sans cotes', async () => {
    const data = await svc(fakeFetch((u) => (u.pathname === '/odds' ? { body: { errors: { plan: 'Free plans do not have access to this season' } } } : null))).matches(
      new Date('2026-10-16T08:00:00Z'),
    );
    expect(data.matches).toHaveLength(2);
    expect(data.matches.every((m) => m.markets.length === 0)).toBe(true);
    expect(data.errors[0].message).toContain('plan');
  });

  it('résultats finaux', async () => {
    expect((await svc().results([900]))['900']).toEqual({ status: 'FT', finished: true, cancelled: false, home: 2, away: 1 });
  });

  it('erreur de clé remontée', async () => {
    const c = new ApiFootballClient('k', 'https://x', fakeFetch(() => ({ body: { errors: { token: 'Error/Missing application key.' } } })));
    await expect(c.get('/fixtures', { league: 39 }, 60)).rejects.toBeInstanceOf(ApiFootballError);
  });

  it('routes HTTP', async () => {
    const demo = createHandler(() => undefined);
    expect(await (await demo(new Request('https://s/api/health'))).json()).toMatchObject({ live: false });
    expect((await demo(new Request('https://s/api/matches'))).status).toBe(503);
    const env: Record<string, string> = { API_FOOTBALL_KEY: 'k', API_FOOTBALL_BASE_URL: 'https://x', LEAGUES: '39', SEASON: '2026' };
    const live = createHandler((k) => env[k], fakeFetch());
    expect(await (await live(new Request('https://s/api/health'))).json()).toMatchObject({ live: true, provider: 'API-Football' });
    const res = await live(new Request('https://s/api/results?ids=900'));
    expect(res.headers.get('Netlify-CDN-Cache-Control')).toContain('s-maxage');
    expect((await live(new Request('https://s/api/results?ids=abc'))).status).toBe(400);
  });
});
