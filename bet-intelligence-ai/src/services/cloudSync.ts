/**
 * Sauvegarde liée au compte claude.ai (capacité `db`, sous-arbre privé de chaque
 * utilisateur : data/users/<id>/state). Disponible uniquement en ligne ; en local,
 * l'application se contente du localStorage.
 */
import type { Settings, Ticket } from '../types';
import type { DbDocRef } from '../types/claude-runtime';
import { sanitizeSettings } from './settingsService';
import { runtime } from './runtime';

export interface CloudState {
  settings: Settings;
  tickets: Ticket[];
  oddsSeed: number;
  updatedAt: string;
}

/** Limite de confort : un document est plafonné à 256 Kio. */
export const CLOUD_MAX_TICKETS = 80;

let refPromise: Promise<DbDocRef | null> | null = null;

export function cloudDoc(): Promise<DbDocRef | null> {
  const rt = runtime();
  if (!rt) return Promise.resolve(null);
  refPromise ??= (async () => {
    const [db, user] = await Promise.all([rt.use('db'), rt.use('user')]);
    if (!db || !user) return null;
    const id = await user.id();
    if (!id) return null;
    return db.doc(`data/users/${id}/state`);
  })().catch(() => null);
  return refPromise;
}

export async function loadCloudState(): Promise<CloudState | null> {
  const ref = await cloudDoc();
  if (!ref) return null;
  const snap = await ref.get();
  if (!snap.exists) return null;
  const d = snap.data() ?? {};
  return {
    settings: sanitizeSettings(d.settings as Partial<Settings>),
    tickets: Array.isArray(d.tickets) ? (d.tickets as Ticket[]) : [],
    oddsSeed: typeof d.oddsSeed === 'number' ? d.oddsSeed : 1,
    updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : '',
  };
}

export async function saveCloudState(state: Omit<CloudState, 'updatedAt'>): Promise<'saved' | 'unavailable'> {
  const ref = await cloudDoc();
  if (!ref) return 'unavailable';
  await ref.set({
    settings: state.settings as unknown as Record<string, unknown>,
    tickets: state.tickets.slice(0, CLOUD_MAX_TICKETS) as unknown as Record<string, unknown>[],
    oddsSeed: state.oddsSeed,
    updatedAt: new Date().toISOString(),
  });
  return 'saved';
}
