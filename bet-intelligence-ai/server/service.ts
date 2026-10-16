/** Assemble les matchs à venir au format `Match` du frontend. Équivalent TypeScript de api/_bia/service.py. */
import type { Competition, MarketId, MarketOffer, Match, TeamStats } from '../src/types';
import { ALL_MARKET_IDS } from '../src/utils/markets';
import { marketProbabilities } from '../src/utils/poisson';
import type { ApiFootballClient } from './apiFootball';
import { buildModel, type LeagueModel, type Result } from './model';

const FINISHED = 'FT-AET-PEN';
const TTL_FINISHED = 6 * 3600;
const TTL_UPCOMING = 3600;
const TTL_ODDS = 3 * 3600; // cotes pré-match rafraîchies toutes les 3 h côté fournisseur
const TTL_RESULTS = 15 * 60;

/** Ligues : Premier League, Liga, Serie A, Bundesliga, Ligue 1. Bookmakers : 1xBet, Bet365, Pinnacle, Unibet. */
export const DEFAULT_LEAGUES = [39, 140, 135, 78, 61];
export const DEFAULT_BOOKMAKERS = [11, 8, 4, 16];

export interface ServerSettings {
  apiKey: string | null;
  baseUrl: string;
  leagues: number[];
  bookmakers: number[];
  season: number | null;
  timezone: string;
  daysAhead: number;
}

const intList = (raw: string | undefined, fallback: number[]) => {
  const v = (raw ?? '').split(',').map((x) => Number(x.trim())).filter((n) => Number.isInteger(n) && n > 0);
  return v.length ? v : [...fallback];
};

export function readSettings(env: (key: string) => string | undefined): ServerSettings {
  return {
    apiKey: env('API_FOOTBALL_KEY') || null,
    baseUrl: env('API_FOOTBALL_BASE_URL') || 'https://v3.football.api-sports.io',
    leagues: intList(env('LEAGUES'), DEFAULT_LEAGUES),
    bookmakers: intList(env('BOOKMAKERS'), DEFAULT_BOOKMAKERS),
    season: env('SEASON') ? Number(env('SEASON')) : null,
    timezone: env('TIMEZONE') || 'Africa/Libreville',
    daysAhead: Number(env('DAYS_AHEAD') || 7),
  };
}

/** Saison API-Football = année de début ; les championnats européens démarrent en juillet-août. */
export function currentSeason(d = new Date()): number {
  return d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
}

const BET_MAP: Record<string, MarketId> = {
  'Match Winner|Home': 'HOME_WIN',
  'Match Winner|Draw': 'DRAW',
  'Match Winner|Away': 'AWAY_WIN',
  'Double Chance|Home/Draw': 'DOUBLE_CHANCE_1X',
  'Double Chance|Draw/Away': 'DOUBLE_CHANCE_X2',
  'Goals Over/Under|Over 1.5': 'OVER_1_5',
  'Goals Over/Under|Over 2.5': 'OVER_2_5',
  'Goals Over/Under|Under 3.5': 'UNDER_3_5',
  'Both Teams Score|Yes': 'BTTS_YES',
};

/* eslint-disable @typescript-eslint/no-explicit-any -- réponses JSON du fournisseur */
type Fx = any;

export function toResults(fixtures: Fx[]): Result[] {
  return fixtures
    .filter((f) => f.goals?.home != null && f.goals?.away != null)
    .map((f) => ({
      homeId: f.teams.home.id,
      awayId: f.teams.away.id,
      homeGoals: Number(f.goals.home),
      awayGoals: Number(f.goals.away),
      timestamp: Number(f.fixture.timestamp ?? 0),
      homeName: f.teams.home.name,
      awayName: f.teams.away.name,
    }));
}

/** fixture id → marché → [cote, bookmaker], en prenant pour chaque marché le bookmaker préféré disponible. */
export function parseOdds(items: Fx[], preference: number[]): Map<number, Map<MarketId, [number, string]>> {
  const rank = (id: number) => {
    const i = preference.indexOf(id);
    return i >= 0 ? i : preference.length + id;
  };
  const out = new Map<number, Map<MarketId, [number, string]>>();
  for (const item of items) {
    const fid = item?.fixture?.id;
    if (fid == null) continue;
    let markets = out.get(fid);
    if (!markets) out.set(fid, (markets = new Map()));
    const books = [...(item.bookmakers ?? [])].sort((a, b) => rank(a.id) - rank(b.id));
    for (const book of books) {
      for (const bet of book.bets ?? []) {
        for (const v of bet.values ?? []) {
          const m = BET_MAP[`${bet.name}|${v.value}`];
          const odd = Number(v.odd);
          if (m && !markets.has(m) && odd > 1) markets.set(m, [odd, book.name ?? '']);
        }
      }
    }
  }
  return out;
}

const quality = (sample: number) => (sample >= 8 ? 'HIGH' : sample >= 4 ? 'MEDIUM' : 'LOW');

function shortName(name: string): string {
  return (name.toUpperCase().replace(/[^\p{L}]/gu, '').slice(0, 3) || '???');
}

function teamStats(model: LeagueModel, teamId: number, venue: 'home' | 'away'): TeamStats {
  const p = model.teams.get(teamId);
  const v = p?.[venue];
  const n = v?.played ?? 0;
  const r2 = (x: number) => Math.round(x * 100) / 100;
  return {
    goalsScoredAvg: n ? r2(v!.scored / n) : 0,
    goalsConcededAvg: n ? r2(v!.conceded / n) : 0,
    // Non fournis par ce flux : affichés « — » par l'interface.
    xgFor: null,
    xgAgainst: null,
    shotsPerMatch: null,
    shotsOnTargetPerMatch: null,
    possessionPct: null,
    cleanSheetPct: n ? Math.round((100 * v!.cleanSheets) / n) : 0,
    venueRecord: { played: n, won: v?.won ?? 0, drawn: v?.drawn ?? 0, lost: v?.lost ?? 0 },
    recent: p?.recent ?? [],
  };
}

export function buildMatch(f: Fx, model: LeagueModel, odds: Map<MarketId, [number, string]> | undefined): Match {
  const h = f.teams.home;
  const a = f.teams.away;
  const xg = model.expectedGoals(h.id, a.id);
  const probs = marketProbabilities(xg.home, xg.away, ALL_MARKET_IDS);
  const sample = Math.min(model.played(h.id), model.played(a.id));
  const markets: MarketOffer[] = ALL_MARKET_IDS.filter((m) => odds?.has(m)).map((m) => ({
    market: m,
    odds: odds!.get(m)![0],
    probability: Math.round(probs[m] * 10000) / 10000,
    bookmaker: odds!.get(m)![1],
  }));
  return {
    id: String(f.fixture.id),
    competitionId: String(f.league.id),
    kickoff: f.fixture.date,
    home: { id: String(h.id), name: h.name, shortName: shortName(h.name) },
    away: { id: String(a.id), name: a.name, shortName: shortName(a.name) },
    homeStats: teamStats(model, h.id, 'home'),
    awayStats: teamStats(model, a.id, 'away'),
    dataQuality: markets.length ? quality(sample) : 'LOW',
    sampleSize: sample,
    markets,
    expectedGoals: { home: Math.round(xg.home * 1000) / 1000, away: Math.round(xg.away * 1000) / 1000 },
    source: 'live',
  };
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export class MatchService {
  constructor(
    private s: ServerSettings,
    private c: ApiFootballClient,
  ) {}

  async leagueModel(league: number, season: number): Promise<LeagueModel> {
    let res = toResults(await this.c.get('/fixtures', { league, season, status: FINISHED }, TTL_FINISHED));
    if (res.length < 40) {
      // Début de saison : on complète avec la saison précédente.
      res = res.concat(toResults(await this.c.get('/fixtures', { league, season: season - 1, status: FINISHED }, TTL_FINISHED)));
    }
    return buildModel(res);
  }

  async matches(today = new Date()) {
    const season = this.s.season ?? currentSeason(today);
    const from = isoDay(today);
    const to = isoDay(new Date(today.getTime() + this.s.daysAhead * 86400_000));
    const competitions: Competition[] = [];
    const matches: Match[] = [];
    const errors: { league: number; message: string }[] = [];
    for (const league of this.s.leagues) {
      try {
        const upcoming = (await this.c.get('/fixtures', { league, season, from, to, timezone: this.s.timezone }, TTL_UPCOMING)).filter(
          (f: Fx) => ['NS', 'TBD'].includes(f?.fixture?.status?.short),
        );
        if (upcoming.length === 0) continue;
        const lg = (upcoming[0] as Fx).league;
        competitions.push({ id: String(lg.id), name: `${lg.name} (${lg.country || 'International'})` });
        const model = await this.leagueModel(league, season);
        let odds = new Map<number, Map<MarketId, [number, string]>>();
        try {
          odds = parseOdds(await this.c.get('/odds', { league, season }, TTL_ODDS), this.s.bookmakers);
        } catch (e) {
          // Sans cotes, les matchs restent consultables mais ne sont pas sélectionnables.
          errors.push({ league, message: `Cotes indisponibles : ${(e as Error).message}` });
        }
        for (const f of upcoming as Fx[]) matches.push(buildMatch(f, model, odds.get(f.fixture.id)));
      } catch (e) {
        errors.push({ league, message: (e as Error).message });
      }
    }
    matches.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
    return {
      source: 'api-football',
      season,
      generatedAt: new Date().toISOString(),
      competitions,
      matches,
      errors,
      quota: { ...this.c.quota },
    };
  }

  async results(ids: number[]) {
    const out: Record<string, { status: string; finished: boolean; cancelled: boolean; home: number | null; away: number | null }> = {};
    const sorted = [...new Set(ids)].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i += 20) {
      // 20 identifiants max par requête
      for (const f of (await this.c.get('/fixtures', { ids: sorted.slice(i, i + 20).join('-') }, TTL_RESULTS)) as Fx[]) {
        const st: string = f.fixture.status.short;
        // Les paris « temps réglementaire » se règlent sur le score à 90 minutes.
        const ft = f.score?.fulltime ?? {};
        out[String(f.fixture.id)] = {
          status: st,
          finished: ['FT', 'AET', 'PEN'].includes(st),
          cancelled: ['PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(st),
          home: ft.home ?? f.goals?.home ?? null,
          away: ft.away ?? f.goals?.away ?? null,
        };
      }
    }
    return out;
  }
}
