import { sql } from "drizzle-orm";
import { db } from "../db";

/** Numéro lisible et séquentiel par préfixe et par année : 2026-00125, NL-2026-00342… */
export async function nextNumber(prefix: string, width = 5) {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  const res = await db.execute<{ value: number }>(sql`insert into counters (key, value) values (${key}, 1)
    on conflict (key) do update set value = counters.value + 1 returning value`);
  const n = String(res.rows[0].value).padStart(width, "0");
  return prefix ? `${prefix}-${year}-${n}` : `${year}-${n}`;
}
