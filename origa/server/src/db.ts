import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

export type Db = pg.Pool;

const certDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'certs');

/** Autorité de certification attendue pour la base (texte PEM), ou undefined pour celles du système. */
export function databaseCa(url: string, env: NodeJS.ProcessEnv = process.env): string | undefined {
  const v = env.DATABASE_CA?.trim();
  if (v) return v.includes('-----BEGIN') ? v.replace(/\\n/g, '\n') : readFileSync(v, 'utf8');
  let host = '';
  try { host = new URL(url).hostname; } catch { /* adresse non standard : autorités du système */ }
  return /(^|\.)supabase\.(com|co)$/.test(host) ? readFileSync(join(certDir, 'supabase-root-2021.crt'), 'utf8') : undefined;
}

/**
 * Pool de connexions. Variables facultatives :
 * - DATABASE_SSL : « verify » (chiffré, certificat et nom d'hôte vérifiés), « no-verify » (chiffré sans
 *   vérification, à éviter) ; absent : selon l'adresse.
 * - DATABASE_CA : autorité de certification (texte PEM ou chemin d'un fichier) pour « verify ». Par défaut,
 *   l'autorité racine de Supabase (certs/supabase-root-2021.crt) pour un hôte *.supabase.com, sinon celles du système.
 * - DATABASE_SCHEMA : schéma de travail (par défaut celui de l'utilisateur), pour isoler Origa dans une base partagée.
 */
function withoutSslParams(url: string) {
  try {
    const u = new URL(url);
    for (const k of [...u.searchParams.keys()]) if (/^ssl/i.test(k)) u.searchParams.delete(k);
    return u.toString();
  } catch { return url; }
}

export function createPool(url: string): Db {
  const mode = process.env.DATABASE_SSL;
  const ca = mode === 'verify' ? databaseCa(url) : undefined;
  const ssl = mode === 'verify' ? { rejectUnauthorized: true, ...(ca ? { ca } : {}) } : mode === 'no-verify' ? { rejectUnauthorized: false } : undefined;
  // Les paramètres ssl* de l'adresse l'emporteraient sur ce réglage dans pg : on les retire quand DATABASE_SSL est défini.
  const connectionString = ssl ? withoutSslParams(url) : url;
  // En fonction sans serveur (Vercel), chaque instance garde peu de connexions.
  const pool = new pg.Pool({ connectionString, max: process.env.VERCEL ? 3 : 10, ...(ssl ? { ssl } : {}) });
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
