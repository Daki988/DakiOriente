import type { Role } from '../domain/types';

export interface Session {
  role: Role;
  userLabel: string;
  farmId?: string; // profil éleveur
  farmIds?: string[]; // profil agent technique
}

export const PROFILES: Session[] = [
  { role: 'eleveur', userLabel: 'Éleveur · Ferme Nkoltang', farmId: 'GA1-0042' },
  { role: 'agent', userLabel: 'Agent technique · Estuaire', farmIds: ['GA1-0042', 'GA1-0003', 'GA1-0017'] },
  { role: 'dge', userLabel: 'DGE · Programme POUFA' },
  { role: 'veterinaire', userLabel: 'Services vétérinaires' },
];

const KEY = 'origa.session';
let listeners: (() => void)[] = [];
let cache: { raw: string | null; value: Session } | null = null;

/** Instantané stable : même objet tant que le stockage n'a pas changé (exigé par useSyncExternalStore). */
export function getSession(): Session {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { /* stockage indisponible */ }
  if (cache && cache.raw === raw) return cache.value;
  let value = PROFILES[0];
  if (raw) { try { value = JSON.parse(raw) as Session; } catch { /* valeur corrompue */ } }
  cache = { raw, value };
  return value;
}

export function setSession(s: Session) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribeSession(l: () => void) {
  listeners.push(l);
  return () => { listeners = listeners.filter((x) => x !== l); };
}
