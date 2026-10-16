/** Client API-Football (v3) : cache mémoire par instance + lecture du quota (en-têtes x-ratelimit-*). */
export class ApiFootballError extends Error {}

export interface Quota {
  limit: number | null;
  remaining: number | null;
}

type Json = Record<string, unknown>;

export class ApiFootballClient {
  private cache = new Map<string, { expires: number; items: Json[] }>();
  quota: Quota = { limit: null, remaining: null };
  calls = 0;

  constructor(
    private apiKey: string,
    private baseUrl = 'https://v3.football.api-sports.io',
    private fetchImpl: typeof fetch = fetch,
  ) {}

  async get(path: string, params: Record<string, string | number>, ttlSeconds: number): Promise<Json[]> {
    const key = `${path}?${Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&')}`;
    const hit = this.cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.items;
    const items: Json[] = [];
    for (let page = 1; page <= 10; page++) {
      const url = new URL(this.baseUrl + path);
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
      if (page > 1) url.searchParams.set('page', String(page));
      const res = await this.fetchImpl(url, { headers: { 'x-apisports-key': this.apiKey } });
      this.calls++;
      this.readQuota(res.headers);
      if (!res.ok) throw new ApiFootballError(`HTTP ${res.status} sur ${path}`);
      const body = (await res.json()) as { errors?: unknown; response?: Json[]; paging?: { total?: number } };
      const errors = body.errors;
      const hasErrors = Array.isArray(errors) ? errors.length > 0 : errors && typeof errors === 'object' && Object.keys(errors).length > 0;
      if (hasErrors) {
        const msg = Array.isArray(errors)
          ? errors.map(String).join('; ')
          : Object.entries(errors as Record<string, unknown>).map(([k, v]) => `${k}: ${String(v)}`).join('; ');
        throw new ApiFootballError(msg);
      }
      items.push(...(body.response ?? []));
      if (page >= Number(body.paging?.total ?? 1)) break;
    }
    this.cache.set(key, { expires: Date.now() + ttlSeconds * 1000, items });
    return items;
  }

  private readQuota(h: Headers) {
    const limit = h.get('x-ratelimit-requests-limit');
    const remaining = h.get('x-ratelimit-requests-remaining');
    if (limit && /^\d+$/.test(limit)) this.quota.limit = Number(limit);
    if (remaining && /^\d+$/.test(remaining)) this.quota.remaining = Number(remaining);
  }
}
