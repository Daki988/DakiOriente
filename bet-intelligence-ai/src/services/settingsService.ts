import type { MarketId, Settings } from '../types';
import { ALL_MARKET_IDS } from '../utils/markets';
import { clamp } from '../utils/math';
import { readJson, STORAGE_KEYS, writeJson } from './storage';

export const DEFAULT_SETTINGS: Settings = {
  prudentMode: false,
  minProbability: 0.75,
  minOdds: 1.2,
  maxOdds: 1.6,
  minSelections: 2,
  maxSelections: 4,
  targetTotalOdds: null,
  allowedMarkets: [...ALL_MARKET_IDS],
  showWarnings: true,
  compactTables: false,
  reduceMotion: false,
};

/** Normalise des paramètres (bornes, cohérence min/max) — protège contre un stockage corrompu. */
export function sanitizeSettings(input: Partial<Settings> | null | undefined): Settings {
  const s = { ...DEFAULT_SETTINGS, ...(input ?? {}) };
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const minOdds = clamp(num(s.minOdds, DEFAULT_SETTINGS.minOdds), 1.01, 20);
  const maxOdds = clamp(num(s.maxOdds, DEFAULT_SETTINGS.maxOdds), minOdds, 50);
  const minSelections = Math.round(clamp(num(s.minSelections, 2), 1, 10));
  const maxSelections = Math.round(clamp(num(s.maxSelections, 4), minSelections, 10));
  const allowedMarkets = Array.isArray(s.allowedMarkets)
    ? (s.allowedMarkets.filter((m) => ALL_MARKET_IDS.includes(m as MarketId)) as MarketId[])
    : [...ALL_MARKET_IDS];
  const target = s.targetTotalOdds;
  return {
    prudentMode: Boolean(s.prudentMode),
    minProbability: clamp(num(s.minProbability, 0.75), 0.01, 0.99),
    minOdds,
    maxOdds,
    minSelections,
    maxSelections,
    targetTotalOdds: typeof target === 'number' && Number.isFinite(target) && target > 1 ? target : null,
    allowedMarkets,
    showWarnings: s.showWarnings !== false,
    compactTables: Boolean(s.compactTables),
    reduceMotion: Boolean(s.reduceMotion),
  };
}

export function loadSettings(): Settings {
  return sanitizeSettings(readJson<Partial<Settings> | null>(STORAGE_KEYS.settings, null));
}

export function saveSettings(settings: Settings): boolean {
  return writeJson(STORAGE_KEYS.settings, settings);
}
