import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

export type Db = pg.Pool;

/**
 * Pool de connexions. Variables facultatives :
 * - DATABASE_SSL : « verify » (chiffré, certificat vérifié), « no-verify » (chiffré, certificat non vérifié,
 *   pour un hébergeur à autorité privée comme le pooler de Supabase) ; absent : selon l'adresse.
 * - DATABASE_SCHEMA : schéma de travail (par défaut celui de l'utilisateur), pour isoler Origa dans une base partagée.
 */
export function createPool(url: string): Db {
  const mode = process.env.DATABASE_SSL;
  const ssl = mode === 'verify' ? { rejectUnauthorized: true } : mode === 'no-verify' ? { rejectUnauthorized: false } : undefined;
  // En fonction sans serveur (Vercel), chaque instance garde peu de connexions.
  const pool = new pg.Pool({ connectionString: url, max: process.env.VERCEL ? 3 : 10, ...(ssl ? { ssl } : {}) });
  const schema = process.env.DATABASE_SCHEMA;
  if (schema && /^[a-z_][a-z0-9_]{0,62}$/.test(schema)) pool.on('connect', (c) => { c.query(`SET search_path TO ${schema}`).catch(() => undefined); });
  return pool;
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
