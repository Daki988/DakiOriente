import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Db } from './db.js';
import { farmOf } from './scope.js';
import { lotSigner } from './security.js';

// Jeu de démonstration (données fictives) : le serveur de présentation démarre avec les mêmes fermes, bandes et lots
// que l'application hors serveur. Chargé une seule fois, sur une base vide, et seulement en mode démonstration.

const USERS: [string, string, string, string | null, string[], string | null][] = [
  ['+24100000001', 'M. Ndong · Ferme Nkoltang', 'eleveur', 'GA1-0042', [], null],
  ['+24100000002', 'Agent technique · Estuaire', 'agent', null, ['GA1-0042', 'GA1-0003', 'GA1-0017'], null],
  ['+24100000003', 'DGE · Programme POUFA', 'dge', null, [], null],
  ['+24100000004', 'Services vétérinaires', 'veterinaire', null, [], null],
  ['+24100000005', 'BCEG · Suivi des financements', 'bceg', null, [], null],
  ['+24100000007', 'Abattoir de Ntoum', 'operateur', null, [], 'OP-001'],
  ['+24100000008', 'Distributeur Libreville Centre', 'operateur', null, [], 'OP-003'],
  ['+24100000010', 'MAEDR · Cabinet du ministre', 'maedr', null, [], null],
  ['+24100000011', 'ANINF · Audit', 'aninf', null, [], null],
  ['+24100000009', 'Administrateur Origa', 'admin', null, [], null],
];

const here = dirname(fileURLToPath(import.meta.url));
const DAY = 86_400_000;

/** Décale toutes les dates du jeu d'essai pour qu'il reste « du jour » quel que soit le moment du chargement. */
export function shiftDates<T>(value: T, days: number): T {
  if (!days) return value;
  const move = (s: string) => s.replace(/^(\d{4}-\d{2}-\d{2})(T.*)?$/, (_m, d: string, t?: string) => new Date(Date.parse(`${d}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10) + (t ?? ''));
  const walk = (v: unknown): unknown => (typeof v === 'string' ? move(v) : Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v);
  return walk(value) as T;
}

export async function seedDemo(db: Db, signingKey: string, now = new Date(), force = false): Promise<number> {
  // Chargé une seule fois : un repère l'atteste. Un chargement interrompu est complété sans rien effacer, et un
  // enregistrement supprimé depuis (pierre tombale) ne revient pas.
  if ((await db.query(`SELECT 1 FROM meta WHERE key='demo_seed'`)).rowCount) return 0;
  const used = (await db.query(`SELECT count(*)::int AS n FROM users`)).rows[0].n;
  const real = (await db.query(`SELECT 1 FROM records WHERE updated_by IS NOT NULL LIMIT 1`)).rowCount;
  if (!force && (real || used > USERS.length)) return 0; // base déjà utilisée pour de vrai : on n'y mélange pas de données fictives
  const file = [join(here, '..', 'seed', 'demo.json'), join(here, '..', '..', 'seed', 'demo.json'), join(process.cwd(), 'server', 'seed', 'demo.json')].find((f) => { try { readFileSync(f); return true; } catch { return false; } });
  if (!file) return 0;
  const seed = JSON.parse(readFileSync(file, 'utf8')) as { generatedAt: string; records: Record<string, Record<string, unknown>[]> };
  const days = Math.floor((Date.parse(now.toISOString().slice(0, 10)) - Date.parse(seed.generatedAt)) / DAY);
  const signer = lotSigner(signingKey);
  for (const [phone, name, role, farm, farms, operator] of USERS) {
    await db.query(
      `INSERT INTO users (phone, name, role, farm_id, farm_ids, operator_id) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (phone) DO NOTHING`,
      [phone, name, role, farm, farms, operator]);
  }
  // Une requête par table et une seule transaction : rapide même loin de la base, et jamais à moitié chargé.
  const at = now.toISOString();
  let n = 0;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const [tbl, rows] of Object.entries(seed.records)) {
      if (!rows.length) continue;
      const items = rows.map((raw) => {
        const row = shiftDates(raw, days);
        const key = String(row.id);
        return { key, farm_id: farmOf(tbl, row), payload: tbl === 'lots' ? { ...row, signature: signer.sign(key) } : row };
      });
      await client.query(
        `INSERT INTO records (tbl, key, farm_id, payload, client_at)
         SELECT $1, x.key, x.farm_id, x.payload, $2 FROM jsonb_to_recordset($3::jsonb) AS x(key text, farm_id text, payload jsonb)
         WHERE NOT EXISTS (SELECT 1 FROM tombstones t WHERE t.tbl = $1 AND t.key = x.key)
         ON CONFLICT (tbl, key) DO NOTHING`, [tbl, at, JSON.stringify(items)]);
      n += items.length;
    }
    await client.query(`INSERT INTO meta (key, value) VALUES ('demo_seed', $1) ON CONFLICT (key) DO NOTHING`, [at]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  return n;
}

/**
 * Remise à zéro de la démonstration (avant une séance de test, par exemple avec un jury) : les données métier
 * repartent du jeu de démonstration, dates recalées sur aujourd'hui. Comptes et journal d'audit sont conservés
 * (le journal n'est jamais modifiable). Réservé au mode démonstration : l'appelant le vérifie.
 */
export async function resetDemo(db: Db, signingKey: string, now = new Date()): Promise<number> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const t of ['records', 'tombstones', 'conflicts', 'scans']) await client.query(`DELETE FROM ${t}`);
    await client.query(`DELETE FROM meta WHERE key='demo_seed'`);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  return seedDemo(db, signingKey, now, true);
}
