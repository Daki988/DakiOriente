import { sql } from "drizzle-orm";
import { db } from "../db";
import { AppError } from "./errors";

/** Numéro lisible et séquentiel par préfixe et par année : 2026-00125, NL-2026-00342… */
export async function nextNumber(prefix: string, width = 5) {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  const res = await db.execute<{ value: number }>(sql`insert into counters (key, value) values (${key}, 1)
    on conflict (key) do update set value = counters.value + 1 returning value`);
  const n = String(res.rows[0].value).padStart(width, "0");
  return prefix ? `${prefix}-${year}-${n}` : `${year}-${n}`;
}

/**
 * Limite de fréquence (anti-abus) : au plus `max` actions par fenêtre de `fenetreS` secondes pour une clé
 * (adresse IP, paiement…). Compteur atomique en base, partagé par tous les processus.
 */
export async function limiter(cle: string, max: number, fenetreS: number, message: string) {
  const tranche = Math.floor(Date.now() / 1000 / fenetreS);
  const k = `limite:${cle}:${fenetreS}:${tranche}`;
  const res = await db.execute<{ value: number }>(sql`insert into counters (key, value) values (${k}, 1)
    on conflict (key) do update set value = counters.value + 1 returning value`);
  if (Math.random() < 0.01) // ménage : tranches de plus de deux jours
    await db.execute(sql`delete from counters where key like 'limite:%' and split_part(key, ':', 4)::bigint * split_part(key, ':', 3)::bigint < ${Math.floor(Date.now() / 1000) - 2 * 86400}`).catch(() => {});
  if (res.rows[0].value > max) throw new AppError(message, 429, "trop_de_tentatives");
}
