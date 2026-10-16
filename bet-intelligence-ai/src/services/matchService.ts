/**
 * Couche d'accès aux matchs.
 * Aujourd'hui : données locales synthétiques. Demain : remplacer le corps de
 * `fetchMatches` par un appel au backend (ex. `fetch('/api/matches')`) renvoyant
 * des objets `Match` — le reste de l'application n'a pas à changer.
 */
import { MIN_SAMPLE_SIZE } from '../data/demoStatistics';
import type { Competition, DataSource, Match, MarketId, Selection, Settings } from '../types';
import { VOLATILE_MARKETS } from '../utils/markets';
import { impliedProbability, round } from '../utils/math';
import { formatNumber, formatPct } from '../utils/format';
import { buildDemoMatches, demoCompetitions } from './demoEngine';
import { buildFromFeed } from './espnFeed';
import { loadEspnFeed } from './espnSync';
import { isOnline } from './runtime';

/** Adresse du backend : même origine par défaut (déploiement Vercel), surchargeable au build. */
const API_BASE: string = (import.meta.env?.VITE_API_BASE as string | undefined) ?? '';

export type LiveProvider = 'api-football' | 'espn';

export const ESPN_ODDS_WARNING =
  'Cotes affichées = 1 / probabilité du modèle (sans marge) : ESPN ne fournit aucune cote de bookmaker. Comparez toujours avec la cote réelle proposée par votre bookmaker.';

export interface MatchFeed {
  source: DataSource;
  /** Fournisseur des données réelles, quand source = 'live'. */
  provider?: LiveProvider;
  /** Date de l'instantané (données ESPN). */
  fetchedAt?: string;
  /** Scores connus par identifiant de match (données ESPN), pour régler les tickets. */
  results?: Record<string, FixtureResult>;
  matches: Match[];
  competitions: Competition[];
  /** Problèmes partiels signalés par le backend (une ligue sans cotes, quota…). */
  warnings: string[];
  /** Pourquoi on est resté en démonstration, le cas échéant. */
  fallbackReason?: string;
  quota?: { limit: number | null; remaining: number | null };
}

async function getJson<T>(path: string, timeoutMs: number): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { detail?: string } | null;
      throw new Error(body?.detail ?? `HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

interface LivePayload {
  matches: Match[];
  competitions: Competition[];
  errors: { league: number; message: string }[];
  quota?: { limit: number | null; remaining: number | null };
}

/** Traduit les refus courants d'API-Football en consigne compréhensible. */
export function explainProviderError(message: string): string {
  if (/free plans? do not have access to this season/i.test(message)) {
    return 'Votre offre API-Football gratuite ne donne pas accès à la saison en cours. Passez à l’offre Pro pour afficher les vrais matchs ; en attendant, l’application reste en démonstration.';
  }
  if (/token|application key/i.test(message)) return 'La clé API-Football est invalide ou absente. Vérifiez la variable API_FOOTBALL_KEY.';
  if (/request limit|too many requests|rate/i.test(message)) return 'Quota quotidien API-Football atteint. Les données réelles reviendront après la remise à zéro (minuit UTC).';
  return `API-Football : ${message}`;
}

/** Données réelles si le backend est configuré, sinon jeu de démonstration (jamais l'inverse en silence). */
export async function fetchMatchFeed(oddsSeed: number, reference = new Date()): Promise<MatchFeed> {
  let fallbackReason: string | undefined;
  // Dans la version claude.ai, aucun backend n'est joignable : on passe directement à l'instantané ESPN.
  if (!isOnline()) try {
    const health = await getJson<{ live: boolean }>('/api/health', 4000);
    if (health.live) {
      const data = await getJson<LivePayload>('/api/matches', 30000);
      if (data.matches.length === 0 && data.errors.length > 0) {
        // Aucune donnée exploitable (ex. saison non couverte par l'offre gratuite) : démonstration, raison affichée.
        return {
          source: 'demo',
          matches: buildDemoMatches(oddsSeed, reference),
          competitions: demoCompetitions,
          warnings: [],
          fallbackReason: explainProviderError(data.errors[0].message),
          quota: data.quota,
        };
      }
      return {
        source: 'live',
        provider: 'api-football',
        matches: data.matches,
        competitions: data.competitions,
        warnings: data.errors.map((e) => e.message),
        quota: data.quota,
      };
    }
    fallbackReason = 'Le backend est en ligne mais aucune clé API-Football n’est configurée.';
  } catch (e) {
    // Pas de backend joignable (version claude.ai, copie locale) : mode démonstration.
    fallbackReason = e instanceof Error && e.name !== 'AbortError' && !/fetch|network|load/i.test(e.message) ? `Backend : ${e.message}` : undefined;
  }
  // Version claude.ai : instantané ESPN (mis à jour via le connecteur Firecrawl).
  try {
    const feed = await loadEspnFeed(reference);
    if (feed) {
      const built = buildFromFeed(feed, reference);
      if (built.matches.length > 0) {
        const results: Record<string, FixtureResult> = {};
        for (const [id, r] of Object.entries(built.results)) results[id] = { status: r.finished ? 'FT' : r.cancelled ? 'CANC' : 'NS', ...r };
        return {
          source: 'live',
          provider: 'espn',
          fetchedAt: feed.fetchedAt,
          matches: built.matches,
          competitions: built.competitions,
          warnings: [ESPN_ODDS_WARNING, ...feed.errors],
          results,
        };
      }
      fallbackReason = 'L’instantané ESPN ne contient plus de match à venir : actualisez les données réelles dans Paramètres.';
    }
  } catch {
    /* base indisponible : démonstration */
  }
  return { source: 'demo', matches: buildDemoMatches(oddsSeed, reference), competitions: demoCompetitions, warnings: [], fallbackReason };
}

export interface FixtureResult {
  status: string;
  finished: boolean;
  cancelled: boolean;
  home: number | null;
  away: number | null;
}

export async function fetchResults(ids: string[]): Promise<Record<string, FixtureResult>> {
  if (ids.length === 0) return {};
  const data = await getJson<{ results: Record<string, FixtureResult> }>(`/api/results?ids=${ids.map(encodeURIComponent).join(',')}`, 20000);
  return data.results;
}

export function competitionName(competitions: Competition[], id: string): string {
  return competitions.find((c) => c.id === id)?.name ?? id;
}

export function hasSufficientData(match: Pick<Match, 'sampleSize' | 'dataQuality'>): boolean {
  return match.sampleSize >= MIN_SAMPLE_SIZE && match.dataQuality !== 'LOW';
}

/** Motif de sélection pré-rédigé, cohérent avec les statistiques simulées. */
export function selectionReason(match: Match, market: MarketId): string {
  const xg = match.expectedGoals;
  const sim = match.source === 'live' ? '' : ' simulé';
  const sims = match.source === 'live' ? '' : ' simulés';
  const h = match.homeStats;
  const a = match.awayStats;
  const total = formatNumber(xg.home + xg.away);
  switch (market) {
    case 'HOME_WIN':
      return `${match.home.name} génère ${formatNumber(xg.home)} buts attendus${sims} contre ${formatNumber(xg.away)} pour ${match.away.name}.`;
    case 'AWAY_WIN':
      return `${match.away.name} domine le rapport de force${sim} (${formatNumber(xg.away)} buts attendus contre ${formatNumber(xg.home)}).`;
    case 'DRAW':
      return `Rapport de force équilibré : écart de buts attendus de ${formatNumber(Math.abs(xg.home - xg.away))}.`;
    case 'DOUBLE_CHANCE_1X':
      return `${match.home.name} n'a perdu que ${h.venueRecord.lost} de ses ${h.venueRecord.played} matchs${sims} à domicile.`;
    case 'DOUBLE_CHANCE_X2':
      return `${match.away.name} n'a perdu que ${a.venueRecord.lost} de ses ${a.venueRecord.played} matchs${sims} à l'extérieur.`;
    case 'OVER_1_5':
      return `Total de buts attendus${sim} de ${total} pour cette rencontre.`;
    case 'OVER_2_5':
      return `Deux attaques productives : ${total} buts attendus${sims} au total.`;
    case 'UNDER_3_5':
      return h.cleanSheetPct != null
        ? `Profil fermé : ${total} buts attendus${sims}, ${formatPct(h.cleanSheetPct / 100)} de clean sheets pour ${match.home.name}.`
        : `Profil fermé : ${total} buts attendus${sims} pour cette rencontre.`;
    case 'BTTS_YES':
      return `Les deux équipes dépassent ${formatNumber(Math.min(xg.home, xg.away))} buts attendus${sim} et concèdent régulièrement.`;
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
        bookmaker: o.bookmaker,
        source: m.source,
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

