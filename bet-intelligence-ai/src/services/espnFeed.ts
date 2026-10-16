/**
 * Données réelles ESPN (matchs, scores, classements) obtenues via le connecteur Firecrawl
 * (fournisseur catalogué « espn-com », capacités sports-data/standings et sports-data/scoreboard).
 *
 * ESPN ne fournit pas de cotes : les cotes affichées sont celles du MODÈLE (1 / probabilité,
 * sans marge), signalées comme telles partout dans l'interface.
 */
import type { Competition, Match, MarketOffer, RecentMatch, TeamStats } from '../types';
import { ALL_MARKET_IDS } from '../utils/markets';
import { round } from '../utils/math';
import { marketProbabilities } from '../utils/poisson';

export const ESPN_LEAGUES: { slug: string; label: string }[] = [
  { slug: 'eng.1', label: 'Premier League (Angleterre)' },
  { slug: 'esp.1', label: 'LaLiga (Espagne)' },
  { slug: 'ita.1', label: 'Serie A (Italie)' },
  { slug: 'ger.1', label: 'Bundesliga (Allemagne)' },
  { slug: 'fra.1', label: 'Ligue 1 (France)' },
];

/** Jours interrogés autour d'aujourd'hui : la veille (résultats) et les 4 jours suivants. */
export const DAYS_BACK = 1;
export const DAYS_AHEAD = 4;
export const CREDITS_PER_CALL = 5;
export const MODEL_BOOKMAKER = 'Modèle (sans marge)';

const HOME_ADVANTAGE = 1.12;
const AWAY_FACTOR = 0.9;
const SHRINK = 4;

export interface FeedTeam {
  id: string;
  name: string;
  abbr: string;
  gp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  form: string; // ex. « DWWDD » (ESPN), vide si inconnu
}

export interface FeedEvent {
  id: string;
  start: string; // ISO UTC
  state: 'pre' | 'in' | 'post';
  completed: boolean;
  cancelled: boolean;
  homeId: string;
  awayId: string;
  homeScore: number | null;
  awayScore: number | null;
}

export interface FeedLeague {
  slug: string;
  name: string;
  teams: FeedTeam[];
  events: FeedEvent[];
}

export interface EspnFeed {
  version: 1;
  fetchedAt: string;
  leagues: FeedLeague[];
  errors: string[];
}

// ——— Lecture des réponses Firecrawl / ESPN ———

/* eslint-disable @typescript-eslint/no-explicit-any -- JSON du fournisseur */
type J = any;

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0);

export function parseStandings(data: J): { name: string; teams: Omit<FeedTeam, 'form'>[] } {
  const table = (data?.tables ?? [])[0];
  const name: string = data?.league?.name ?? '';
  const teams = (table?.entries ?? []).map((e: J) => {
    const st = Object.fromEntries((e.stats ?? []).map((s: J) => [s.name, s.value]));
    return {
      id: String(e.team_id),
      name: String(e.display_name),
      abbr: String(e.abbreviation ?? '').slice(0, 3) || String(e.display_name).slice(0, 3).toUpperCase(),
      gp: num(st.gamesPlayed),
      w: num(st.wins),
      d: num(st.ties),
      l: num(st.losses),
      gf: num(st.pointsFor),
      ga: num(st.pointsAgainst),
    };
  });
  return { name, teams };
}

export function parseScoreboard(data: J): { events: FeedEvent[]; forms: Record<string, string> } {
  const events: FeedEvent[] = [];
  const forms: Record<string, string> = {};
  for (const ev of data?.events ?? []) {
    const comps: J[] = ev.competitors ?? [];
    const home = comps.find((c) => c.home_away === 'home');
    const away = comps.find((c) => c.home_away === 'away');
    if (!home || !away) continue;
    for (const c of [home, away]) if (typeof c.form === 'string' && c.form) forms[String(c.team_id)] = c.form;
    const status = ev.status ?? {};
    events.push({
      id: String(ev.event_id),
      start: String(ev.start_time),
      state: status.state === 'post' ? 'post' : status.state === 'in' ? 'in' : 'pre',
      completed: Boolean(status.completed),
      cancelled: /POSTPONED|CANCELED|CANCELLED|ABANDONED|SUSPENDED/.test(String(status.name ?? '')),
      homeId: String(home.team_id),
      awayId: String(away.team_id),
      homeScore: home.score_value ?? (home.score != null ? Number(home.score) : null),
      awayScore: away.score_value ?? (away.score != null ? Number(away.score) : null),
    });
  }
  return { events, forms };
}

/** Extrait les blocs Alexandria d'une réponse firecrawl_scrape (payload JSON du connecteur). */
export function alexandriaBlocks(payload: J): { capability: string; data: J; error?: string }[] {
  const blocks = payload?.data?.alexandria ?? payload?.alexandria ?? [];
  return (Array.isArray(blocks) ? blocks : [blocks]).map((b: J) => ({
    capability: String(b?.capability ?? ''),
    data: b?.data,
    error: b?.error ? String(b.error?.message ?? b.error?.code ?? b.error) : undefined,
  }));
}

export function ymd(d: Date): string {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function feedDates(now = new Date()): string[] {
  const out: string[] = [];
  for (let i = -DAYS_BACK; i <= DAYS_AHEAD; i++) out.push(ymd(new Date(now.getTime() + i * 86400_000)));
  return out;
}

export function estimatedCredits(leagues = ESPN_LEAGUES.length): number {
  return leagues * (1 + DAYS_BACK + DAYS_AHEAD + 1) * CREDITS_PER_CALL;
}

/** Une requête Firecrawl par ligue : classement + tableau des matchs de chaque jour (≤ 10 capacités). */
export function leagueRequest(slug: string, now = new Date()) {
  return [
    {
      provider: 'espn-com',
      capability: 'sports-data/standings',
      options: { sport: 'soccer', league: slug, stats: ['gamesPlayed', 'wins', 'ties', 'losses', 'pointsFor', 'pointsAgainst'] },
    },
    ...feedDates(now).map((date) => ({ provider: 'espn-com', capability: 'sports-data/scoreboard', options: { sport: 'soccer', league: slug, date } })),
  ];
}

export function leagueFromBlocks(slug: string, label: string, blocks: ReturnType<typeof alexandriaBlocks>): { league: FeedLeague; errors: string[] } {
  const errors: string[] = [];
  let teams: Omit<FeedTeam, 'form'>[] = [];
  let name = label;
  const events = new Map<string, FeedEvent>();
  const forms: Record<string, string> = {};
  for (const b of blocks) {
    if (b.error || !b.data) {
      errors.push(`${label} : ${b.error ?? 'réponse vide'}`);
      continue;
    }
    if (b.capability.endsWith('standings')) {
      const st = parseStandings(b.data);
      teams = st.teams;
      if (st.name) name = label;
    } else if (b.capability.endsWith('scoreboard')) {
      const sb = parseScoreboard(b.data);
      sb.events.forEach((e) => events.set(e.id, e));
      Object.assign(forms, sb.forms);
    }
  }
  return {
    league: { slug, name, teams: teams.map((t) => ({ ...t, form: forms[t.id] ?? '' })), events: [...events.values()] },
    errors,
  };
}

// ——— Construction des matchs ———

function strengths(league: FeedLeague) {
  const gp = league.teams.reduce((a, t) => a + t.gp, 0);
  const goals = league.teams.reduce((a, t) => a + t.gf, 0);
  const avg = gp ? goals / gp : 1.35; // buts par équipe et par match dans la ligue
  const byId = new Map(league.teams.map((t) => [t.id, t]));
  const ratio = (total: number, n: number) => {
    const raw = n && avg ? total / n / avg : 1;
    const w = n / (n + SHRINK);
    return w * raw + (1 - w);
  };
  return {
    avg,
    team: (id: string) => {
      const t = byId.get(id);
      return { attack: t ? ratio(t.gf, t.gp) : 1, defense: t ? ratio(t.ga, t.gp) : 1, played: t?.gp ?? 0, t };
    },
  };
}

function formToRecent(form: string): RecentMatch[] {
  return form
    .toUpperCase()
    .split('')
    .filter((c) => c === 'W' || c === 'D' || c === 'L')
    .slice(-5)
    .map((r) => ({ opponent: '', venue: 'DOM' as const, goalsFor: null, goalsAgainst: null, result: r as RecentMatch['result'] }));
}

function teamStats(t: FeedTeam | undefined): TeamStats {
  const n = t?.gp ?? 0;
  return {
    goalsScoredAvg: n ? round(t!.gf / n) : 0,
    goalsConcededAvg: n ? round(t!.ga / n) : 0,
    xgFor: null,
    xgAgainst: null,
    shotsPerMatch: null,
    shotsOnTargetPerMatch: null,
    possessionPct: null,
    cleanSheetPct: null, // non fourni par le classement ESPN
    // Bilan de la saison (toutes rencontres) : ESPN ne sépare pas domicile/extérieur ici.
    venueRecord: { played: n, won: t?.w ?? 0, drawn: t?.d ?? 0, lost: t?.l ?? 0 },
    recent: formToRecent(t?.form ?? ''),
  };
}

const quality = (sample: number) => (sample >= 8 ? 'HIGH' : sample >= 4 ? 'MEDIUM' : 'LOW');

export interface BuiltFeed {
  matches: Match[];
  competitions: Competition[];
  results: Record<string, { finished: boolean; cancelled: boolean; home: number | null; away: number | null }>;
}

export function buildFromFeed(feed: EspnFeed, now = new Date()): BuiltFeed {
  const matches: Match[] = [];
  const competitions: Competition[] = [];
  const results: BuiltFeed['results'] = {};
  for (const lg of feed.leagues) {
    if (lg.teams.length === 0) continue;
    const s = strengths(lg);
    let any = false;
    for (const ev of lg.events) {
      results[ev.id] = { finished: ev.completed && ev.state === 'post', cancelled: ev.cancelled, home: ev.homeScore, away: ev.awayScore };
      if (ev.state !== 'pre' || ev.cancelled || new Date(ev.start) <= now) continue;
      const h = s.team(ev.homeId);
      const a = s.team(ev.awayId);
      if (!h.t || !a.t) continue;
      const xg = { home: s.avg * h.attack * a.defense * HOME_ADVANTAGE, away: s.avg * a.attack * h.defense * AWAY_FACTOR };
      const probs = marketProbabilities(xg.home, xg.away, ALL_MARKET_IDS);
      const markets: MarketOffer[] = ALL_MARKET_IDS.map((m) => ({
        market: m,
        probability: round(probs[m], 4),
        // Pas de cote de bookmaker disponible : cote « juste » du modèle, sans marge.
        odds: round(Math.max(1.01, 1 / probs[m]), 2),
        bookmaker: MODEL_BOOKMAKER,
      }));
      const sample = Math.min(h.played, a.played);
      matches.push({
        id: ev.id,
        competitionId: lg.slug,
        kickoff: new Date(ev.start).toISOString(),
        home: { id: h.t.id, name: h.t.name, shortName: h.t.abbr },
        away: { id: a.t.id, name: a.t.name, shortName: a.t.abbr },
        homeStats: teamStats(h.t),
        awayStats: teamStats(a.t),
        dataQuality: quality(sample),
        sampleSize: sample,
        markets,
        expectedGoals: { home: round(xg.home, 3), away: round(xg.away, 3) },
        source: 'live',
      });
      any = true;
    }
    if (any) competitions.push({ id: lg.slug, name: lg.name });
  }
  matches.sort((x, y) => x.kickoff.localeCompare(y.kickoff));
  return { matches, competitions, results };
}

/** Âge maximal d'un instantané avant d'être jugé périmé (les matchs passés sortent de toute façon). */
export const FEED_MAX_AGE_MS = 4 * 86400_000;
