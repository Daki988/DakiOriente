import { TAUX_SECOURS, type Taux } from "@/lib/devises";

// Taux du jour (base MAD), mis en cache 12 h ; instantané du référentiel en secours.
let cache: { at: number; data: Taux } | null = null;

export async function tauxDuJour(): Promise<Taux> {
  if (!cache || Date.now() - cache.at > 12 * 3600_000) {
    try {
      const r = await fetch("https://open.er-api.com/v6/latest/MAD", { signal: AbortSignal.timeout(8000) });
      const j = await r.json();
      if (j.result === "success") cache = { at: Date.now(), data: { date: new Date(j.time_last_update_unix * 1000).toISOString().slice(0, 10), base: "MAD", taux: j.rates } };
    } catch {
      /* service indisponible : instantané */
    }
  }
  return cache?.data ?? TAUX_SECOURS;
}
