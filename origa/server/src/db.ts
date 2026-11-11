import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

export type Db = pg.Pool;

export function createPool(url: string): Db {
  // En fonction sans serveur (Vercel), chaque instance garde peu de connexions.
  return new pg.Pool({ connectionString: url, max: process.env.VERCEL ? 3 : 10 });
}

const here = dirname(fileURLToPath(import.meta.url));

export async function migrate(db: Db) {
  const file = [join(here, 'schema.sql'), join(here, '..', 'src', 'schema.sql')].find((f) => {
    try { readFileSync(f); return true; } catch { return false; }
  });
  if (!file) throw new Error('schema.sql introuvable');
  await db.query(readFileSync(file, 'utf8'));
}

/**
 * Démarrage d'une instance : schéma à jour (une seule instance à la fois, les autres attendent), puis action
 * facultative sous le même verrou (chargement du jeu de démonstration, par exemple).
 */
export async function prepare(db: Db, after?: () => Promise<unknown>) {
  const c = await db.connect();
  try {
    await c.query('SELECT pg_advisory_lock(724100)');
    await migrate(db);
    await after?.();
  } finally {
    await c.query('SELECT pg_advisory_unlock(724100)').catch(() => undefined);
    c.release();
  }
}
