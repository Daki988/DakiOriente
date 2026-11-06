import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import { db } from './db';
import { getSession } from '../app/sessionStore';

type Tables = 'farms' | 'bands' | 'entries' | 'weighings' | 'exits' | 'inputs' | 'treatments' | 'vaccinations'
  | 'reports' | 'alerts' | 'operators' | 'lots' | 'scans' | 'settings';

/**
 * Toute écriture passe ici : enregistrement local + file d'envoi (outbox) + journal d'audit
 * non modifiable, scellé par chaînage SHA-256 (§ 8).
 */
export async function save<T extends { id: string }>(table: Tables, row: T, action = 'enregistrement') {
  const at = new Date().toISOString();
  const user = getSession().userLabel;
  await db.transaction('rw', db.table(table), db.outbox, db.audit, async () => {
    await db.table(table).put(row);
    await db.outbox.add({ table, op: 'put', key: row.id, payload: row, at });
    const prev = await db.audit.orderBy('id').last();
    const prevHash = prev?.hash ?? '0'.repeat(64);
    const body = JSON.stringify({ at, user, action, table, key: row.id, row, prevHash });
    await db.audit.add({ at, user, action, table, key: row.id, prevHash, hash: bytesToHex(sha256(utf8ToBytes(body))) });
  });
  return row;
}

/** Vérifie que le journal n'a pas été altéré (chaînage continu). */
export async function verifyAuditChain(): Promise<boolean> {
  const all = await db.audit.orderBy('id').toArray();
  return all.every((e, i) => i === 0 || e.prevHash === all[i - 1].hash);
}
