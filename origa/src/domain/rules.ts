import { addDays } from './ids';
import type { DailyEntry, Settings, Treatment } from './types';

export interface Check { ok: boolean; message?: string }

/** Morts du jour ≤ effectif présent (§ 7.4). */
export function checkDeaths(deaths: number, present: number): Check {
  if (!Number.isInteger(deaths) || deaths < 0) return { ok: false, message: 'Le nombre de morts doit être un entier positif.' };
  if (deaths > present) return { ok: false, message: `Impossible : seulement ${present} animaux présents.` };
  return { ok: true };
}

/** Sorties ≤ effectif présent. */
export function checkExit(count: number, present: number): Check {
  if (!Number.isInteger(count) || count <= 0) return { ok: false, message: 'Indiquez un nombre d’animaux.' };
  if (count > present) return { ok: false, message: `Impossible : seulement ${present} animaux présents.` };
  return { ok: true };
}

/** Alerte précoce : mortalité du jour en % de l'effectif présent > seuil vétérinaire (§ 5.2). */
export function thresholdAlert(deaths: number, presentBefore: number, s: Settings): string | null {
  if (presentBefore <= 0) return null;
  const pct = (deaths / presentBefore) * 100;
  return pct > s.alertDailyMortalityPct
    ? `Mortalité du jour ${pct.toFixed(2).replace('.', ',')} % (seuil ${String(s.alertDailyMortalityPct).replace('.', ',')} %)`
    : null;
}

/** Alerte de tendance : morts du jour > moyenne des 7 jours précédents + 3 écarts-types (minimum 5). */
export function trendAlert(deaths: number, previous: DailyEntry[]): string | null {
  const last = previous.slice(-7).map((e) => e.deaths);
  if (last.length < 5) return null;
  const mean = last.reduce((a, b) => a + b, 0) / last.length;
  const sd = Math.sqrt(last.reduce((a, b) => a + (b - mean) ** 2, 0) / last.length);
  const limit = Math.max(5, mean + 3 * sd);
  return deaths > limit ? `Écart anormal à la tendance : ${deaths} morts contre ${mean.toFixed(1).replace('.', ',')} en moyenne` : null;
}

/** Délai d'attente des médicaments : bloque la cession d'un lot traité trop récemment. */
export function withdrawalBlock(treatments: Treatment[], date: string): Treatment | null {
  return treatments.find((t) => addDays(t.endDate, t.withdrawalDays) > date) ?? null;
}

/** Retards vaccinaux par rapport au calendrier de référence. */
export function vaccinationsDue(age: number, done: string[], s: Settings) {
  return s.vaccinationCalendar.filter((v) => v.day <= age + 1 && !done.includes(v.vaccine));
}
