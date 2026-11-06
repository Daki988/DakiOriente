import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

export type Db = pg.Pool;

export function createPool(url: string): Db {
  return new pg.Pool({ connectionString: url, max: 10 });
}

const here = dirname(fileURLToPath(import.meta.url));

export async function migrate(db: Db) {
  const file = [join(here, 'schema.sql'), join(here, '..', 'src', 'schema.sql')].find((f) => {
    try { readFileSync(f); return true; } catch { return false; }
  });
  if (!file) throw new Error('schema.sql introuvable');
  await db.query(readFileSync(file, 'utf8'));
}
