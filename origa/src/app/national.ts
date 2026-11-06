import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { bandStats, type BandStats } from '../domain/kpis';
import { addDays, today } from '../domain/ids';
import { useSettings } from './hooks';
import type { Band, Farm } from '../domain/types';

export interface FarmRow { farm: Farm; band?: Band; st?: BandStats; alerts: number }

/** ISO 8601 : numéro de semaine. */
export function isoWeek(d: string): number {
  const date = new Date(d + 'T12:00:00Z');
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((date.getTime() - first.getTime()) / 86_400_000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
}

/** Consolidation nationale : une ligne par ferme + production hebdomadaire et prévision à 6 semaines. */
export function useNational() {
  const settings = useSettings();
  return useLiveQuery(async () => {
    const [farms, bands, entries, weighings, exits, alerts] = await Promise.all([
      db.farms.toArray(), db.bands.toArray(), db.entries.toArray(), db.weighings.toArray(), db.exits.toArray(), db.alerts.toArray(),
    ]);
    const by = <T extends { bandId: string }>(xs: T[], id: string) => xs.filter((x) => x.bandId === id);
    const now = today();
    const rows: FarmRow[] = farms.map((farm) => {
      const band = bands.filter((b) => b.farmId === farm.id && !b.closedAt).sort((a, b) => b.rank - a.rank)[0];
      const st = band ? bandStats(band, by(entries, band.id), by(weighings, band.id), by(exits, band.id), settings, now) : undefined;
      return { farm, band, st, alerts: alerts.filter((a) => a.farmId === farm.id && a.status !== 'close' && a.status !== 'informee').length };
    });

    // Production réalisée par semaine (8 dernières) et prévision (6 suivantes).
    const weeks: { w: number; t: number; proj: boolean }[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = addDays(now, -7 * i - 6); const end = addDays(now, -7 * i);
      weeks.push({ w: isoWeek(end), t: exits.filter((x) => x.date >= start && x.date <= end).reduce((s, x) => s + x.weightKg, 0) / 1000, proj: false });
    }
    for (let i = 1; i <= 6; i++) {
      const start = addDays(now, 7 * i - 6); const end = addDays(now, 7 * i);
      const t = rows.reduce((s, r) => {
        if (!r.band || !r.st) return s;
        const out = addDays(r.band.placedAt, 42);
        return out >= start && out <= end ? s + (r.st.present * 2.2) / 1000 : s;
      }, 0);
      weeks.push({ w: isoWeek(end), t, proj: true });
    }
    const since = `${now.slice(0, 4)}-09-01`;
    return {
      rows, weeks, exits, lots: await db.lots.toArray(), alerts: alerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      produced: exits.filter((x) => x.date >= since).reduce((s, x) => s + x.weightKg, 0) / 1000,
    };
  }, [settings]);
}
