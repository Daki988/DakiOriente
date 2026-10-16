/** Routes HTTP (Request → Response), indépendantes de l'hébergeur. Mêmes réponses que le backend FastAPI. */
import { ApiFootballClient, ApiFootballError } from './apiFootball';
import { currentSeason, MatchService, readSettings, type ServerSettings } from './service';

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });

/** Cache CDN : protège le quota quotidien du fournisseur (une réponse partagée par tous les visiteurs). */
const cdn = (seconds: number) => ({
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Netlify-CDN-Cache-Control': `public, durable, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`,
});

export function createHandler(env: (key: string) => string | undefined, fetchImpl: typeof fetch = fetch) {
  const settings: ServerSettings = readSettings(env);
  // Réutilisé tant que l'instance reste chaude : le cache mémoire du client évite des appels.
  const service = settings.apiKey ? new MatchService(settings, new ApiFootballClient(settings.apiKey, settings.baseUrl, fetchImpl)) : null;

  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const route = url.pathname.replace(/\/+$/, '');
    if (req.method !== 'GET') return json({ detail: 'Méthode non autorisée.' }, 405);

    if (route === '/api/health') {
      return json({ ok: true, live: Boolean(service), provider: service ? 'API-Football' : null, leagues: settings.leagues, season: settings.season ?? currentSeason() });
    }
    if (!service) {
      return json({ detail: "API_FOOTBALL_KEY non configurée : l'application reste en mode démonstration." }, 503);
    }
    try {
      if (route === '/api/matches') return json(await service.matches(), 200, cdn(1800));
      if (route === '/api/results') {
        const ids = (url.searchParams.get('ids') ?? '').split(',').filter((x) => x.trim() !== '').map(Number);
        if (ids.length === 0 || ids.some((n) => !Number.isInteger(n) || n <= 0)) return json({ detail: 'Identifiants invalides.' }, 400);
        return json({ results: await service.results(ids.slice(0, 100)) }, 200, cdn(600));
      }
    } catch (e) {
      if (e instanceof ApiFootballError) return json({ detail: `API-Football : ${e.message}` }, 502);
      return json({ detail: 'Erreur interne du serveur.' }, 500);
    }
    return json({ detail: 'Route inconnue.' }, 404);
  };
}
