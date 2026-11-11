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

export async function seedDemo(db: Db, signingKey: string, now = new Date()): Promise<number> {
  if ((await db.query('SELECT 1 FROM records LIMIT 1')).rowCount) return 0;
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
  let n = 0;
  const at = now.toISOString();
  for (const [tbl, rows] of Object.entries(seed.records)) {
    for (const raw of rows) {
      const row = shiftDates(raw, days);
      const key = String(row.id);
      const payload = tbl === 'lots' ? { ...row, signature: signer.sign(key) } : row;
      await db.query('INSERT INTO records (tbl, key, farm_id, payload, client_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (tbl, key) DO NOTHING', [tbl, key, farmOf(tbl, row), payload, at]);
      n++;
    }
  }
  return n;
}
