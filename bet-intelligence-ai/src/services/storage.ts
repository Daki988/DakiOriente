/** Accès sécurisé à localStorage (navigation privée, quota, JSON corrompu…). */
const PREFIX = 'bia:v1:';

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Renvoie false si l'écriture a échoué (stockage indisponible ou plein). */
export function writeJson(key: string, value: unknown): boolean {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    globalThis.localStorage?.removeItem(PREFIX + key);
  } catch {
    /* stockage indisponible : rien à faire */
  }
}

export const STORAGE_KEYS = { settings: 'settings', tickets: 'tickets', seed: 'oddsSeed' } as const;
