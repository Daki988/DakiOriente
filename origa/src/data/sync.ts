import { db } from './db';
import { API, apiEnabled, api, getToken } from '../app/api';
import { refillReserve } from './labels';

// Synchronisation au retour du réseau : envoi de la file locale, puis réception des données du périmètre.
// Règle de conflit (côté serveur) : la dernière saisie horodatée l'emporte, l'autre est conservée et signalée.
const CURSOR = 'origa.cursor';
const ISSUES = 'origa.syncIssues';

export interface SyncIssue { table: string; key: string; reason: string }
export const syncIssues = (): SyncIssue[] => { try { return JSON.parse(localStorage.getItem(ISSUES) ?? '[]'); } catch { return []; } };

const TABLES = new Set(['farms', 'bands', 'entries', 'weighings', 'exits', 'inputs', 'treatments', 'vaccinations', 'reports', 'alerts', 'operators', 'lots', 'settings',
  'diagnostics', 'biosecurity', 'visits', 'charges', 'orders', 'slaughter', 'publications', 'prices', 'consultations', 'offers', 'movements']);

export async function flushOutbox(): Promise<{ sent: number; received?: number; error?: string }> {
  if (!apiEnabled) return { sent: 0, error: 'Serveur non configuré (mode démonstration)' };
  if (!getToken()) return { sent: 0, error: 'Non connecté' };
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { sent: 0, error: 'Hors ligne' };
  let sent = 0;
  try {
    for (;;) {
      const batch = await db.outbox.orderBy('id').limit(200).toArray();
      if (!batch.length) break;
      // Seule la dernière version de chaque enregistrement est envoyée.
      const last = new Map(batch.map((b) => [`${b.table}/${b.key}`, b]));
      const r = await api<{ applied: number; conflicts: { table: string; key: string }[]; rejected: SyncIssue[] }>('/sync', {
        method: 'POST', body: JSON.stringify({ items: [...last.values()] }),
      });
      if (r.rejected.length || r.conflicts.length) {
        const issues = [...syncIssues(), ...r.rejected, ...r.conflicts.map((c) => ({ ...c, reason: 'conflit : une saisie plus récente existe' }))].slice(-50);
        localStorage.setItem(ISSUES, JSON.stringify(issues));
      }
      await db.outbox.bulkDelete(batch.map((b) => b.id!));
      sent += r.applied;
    }
    const received = await pull();
    // Réserve d'étiquettes QR pré-signées : complétée tant qu'il y a du réseau, pour servir hors ligne.
    await refillReserve().catch(() => undefined);
    return { sent, received };
  } catch (e) {
    return { sent, error: (e as Error).message };
  }
}

/** Réception des données du périmètre de l'utilisateur depuis le dernier curseur. */
export async function pull(): Promise<number> {
  let n = 0;
  let cursor = Number(localStorage.getItem(CURSOR) ?? 0);
  for (;;) {
    const r = await api<{ items: { table: string; key: string; payload: { id: string } }[]; cursor: number; more: boolean }>(`/sync/pull?since=${cursor}`);
    const byTable = new Map<string, { id: string }[]>();
    for (const it of r.items) if (TABLES.has(it.table)) byTable.set(it.table, [...(byTable.get(it.table) ?? []), it.payload]);
    for (const [t, rows] of byTable) await db.table(t).bulkPut(rows);
    n += r.items.length; cursor = r.cursor;
    localStorage.setItem(CURSOR, String(cursor));
    if (!r.more) break;
  }
  return n;
}

export async function pendingCount() { return db.outbox.count(); }

export function startAutoSync() {
  if (!API) return () => undefined;
  const run = () => { flushOutbox().catch(() => undefined); };
  window.addEventListener('online', run);
  const t = window.setInterval(run, 60_000);
  run();
  return () => { window.removeEventListener('online', run); window.clearInterval(t); };
}
