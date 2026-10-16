/**
 * Synchronisation des données réelles ESPN :
 * - lecture : instantané partagé stocké dans la base de l'artefact (doc « feeds/espn ») ;
 * - mise à jour : sur clic d'un éditeur, appels au connecteur Firecrawl de la personne (ses crédits),
 *   puis écriture de l'instantané pour tous les visiteurs.
 */
import type { DbDocRef } from '../types/claude-runtime';
import { getMcp } from './connectorService';
import { alexandriaBlocks, ESPN_LEAGUES, FEED_MAX_AGE_MS, leagueFromBlocks, leagueRequest, type EspnFeed, type FeedLeague } from './espnFeed';
import { runtime } from './runtime';

export const FIRECRAWL = { server: 'Firecrawl', tool: 'firecrawl_scrape' } as const;
const FEED_PATH = 'feeds/espn';

let refPromise: Promise<DbDocRef | null> | null = null;
function feedDoc(): Promise<DbDocRef | null> {
  const rt = runtime();
  if (!rt) return Promise.resolve(null);
  refPromise ??= rt.use('db').then((db) => (db ? db.doc(FEED_PATH) : null)).catch(() => null);
  return refPromise;
}

export function isFeed(x: unknown): x is EspnFeed {
  const f = x as EspnFeed;
  return !!f && f.version === 1 && Array.isArray(f.leagues) && typeof f.fetchedAt === 'string';
}

/** Instantané ESPN s'il existe et n'est pas périmé ; null sinon (hors ligne compris). */
export async function loadEspnFeed(now = new Date()): Promise<EspnFeed | null> {
  const ref = await feedDoc();
  if (!ref) return null;
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : undefined;
  if (!isFeed(data)) return null;
  if (now.getTime() - new Date(data.fetchedAt).getTime() > FEED_MAX_AGE_MS) return null;
  return data;
}

export interface RefreshProgress {
  done: number;
  total: number;
  label: string;
}

/**
 * Interroge ESPN via Firecrawl (une requête groupée par championnat) puis enregistre l'instantané.
 * À n'appeler que sur une action explicite : chaque appel consomme des crédits Firecrawl.
 */
export async function refreshEspnFeed(onProgress?: (p: RefreshProgress) => void, now = new Date()): Promise<EspnFeed> {
  const mcp = await getMcp();
  if (!mcp) throw { code: 'not_granted', message: 'Connecteurs indisponibles dans cette vue.' };
  const leagues: FeedLeague[] = [];
  const errors: string[] = [];
  for (const [i, lg] of ESPN_LEAGUES.entries()) {
    onProgress?.({ done: i, total: ESPN_LEAGUES.length, label: lg.label });
    try {
      const res = await mcp.callTool(FIRECRAWL.server, FIRECRAWL.tool, {
        alexandria: leagueRequest(lg.slug, now),
        objective: 'Matchs, résultats et classement de football de la saison en cours pour une application d’analyse.',
      });
      const built = leagueFromBlocks(lg.slug, lg.label, alexandriaBlocks(res.payload));
      leagues.push(built.league);
      errors.push(...built.errors);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      // Erreurs d'accès : inutile d'essayer les autres championnats.
      if (['server_not_connected', 'needs_reauth', 'not_in_manifest', 'approval_required', 'not_granted', 'blocked_by_policy'].includes(err.code ?? '')) throw e;
      errors.push(`${lg.label} : ${err.message ?? 'échec'}`);
    }
  }
  onProgress?.({ done: ESPN_LEAGUES.length, total: ESPN_LEAGUES.length, label: 'Enregistrement' });
  if (leagues.every((l) => l.teams.length === 0)) throw { code: 'tool_error', message: errors[0] ?? 'Aucune donnée reçue.' };
  const feed: EspnFeed = { version: 1, fetchedAt: now.toISOString(), leagues, errors };
  const ref = await feedDoc();
  if (ref) await ref.set(feed as unknown as Record<string, unknown>);
  return feed;
}
