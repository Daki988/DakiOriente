import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { getSession, subscribeSession } from './sessionStore';
import { bandStats, type BandStats } from '../domain/kpis';
import { DEFAULT_SETTINGS, withDefaults } from '../domain/defaults';
import { today } from '../domain/ids';
import type { Band, Farm, Settings } from '../domain/types';

export const useSession = () => useSyncExternalStore(subscribeSession, getSession, getSession);

export function useOnline() {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true); const b = () => setOn(false);
    window.addEventListener('online', a); window.addEventListener('offline', b);
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); };
  }, []);
  return on;
}

/** Ordinateur : grand écran et souris (une tablette, même en paysage, garde la mise en page tactile). */
const DESKTOP_QUERY = '(min-width: 1000px) and (hover: hover) and (pointer: fine)';
const mq = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(DESKTOP_QUERY) : null);
export function useDesktop(): boolean {
  return useSyncExternalStore(
    (cb) => { const m = mq(); m?.addEventListener('change', cb); return () => m?.removeEventListener('change', cb); },
    () => !!mq()?.matches,
    () => false,
  );
}

export const usePending = () => useLiveQuery(() => db.outbox.count(), [], 0);
/** Paramètres complétés des valeurs par défaut ; même objet tant que l'enregistrement ne change pas (évite les boucles de rendu). */
export function useSettings(): Settings {
  const raw = useLiveQuery(() => db.settings.get('global'), [], DEFAULT_SETTINGS);
  return useMemo(() => withDefaults(raw), [raw]);
}

/** Bande en cours d'une ferme (la plus récente non clôturée). */
export function useCurrentBand(farmId?: string): { farm?: Farm; band?: Band } | undefined {
  return useLiveQuery(async () => {
    if (!farmId) return {};
    const farm = await db.farms.get(farmId);
    const bands = await db.bands.where('farmId').equals(farmId).toArray();
    const band = bands.filter((b) => !b.closedAt).sort((a, b) => b.rank - a.rank)[0];
    return { farm, band };
  }, [farmId]);
}

export function useBandStats(band?: Band): BandStats | undefined {
  const settings = useSettings();
  return useLiveQuery(async () => {
    if (!band) return undefined;
    const [entries, weighings, exits] = await Promise.all([
      db.entries.where('bandId').equals(band.id).toArray(),
      db.weighings.where('bandId').equals(band.id).toArray(),
      db.exits.where('bandId').equals(band.id).toArray(),
    ]);
    return bandStats(band, entries, weighings, exits, settings, today());
  }, [band?.id, settings]);
}

const nf = new Intl.NumberFormat('fr-FR');
export const fmt = (n: number, d = 0) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
export const fmtInt = (n: number) => nf.format(Math.round(n));
export const fmtDate = (iso: string) => new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
export const fmtLongDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
