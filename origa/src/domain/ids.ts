import type { ProvinceCode } from './types';

// Identifiants uniques, automatiques, non modifiables et jamais réutilisés (§ 7.5).
export const farmId = (province: ProvinceCode, seq: number) => `${province}-${String(seq).padStart(4, '0')}`;
export const bandId = (farm: string, rank: number) => `${farm}-B${String(rank).padStart(2, '0')}`;
export const lotId = (band: string, n: number) => `${band}-L${String(n).padStart(2, '0')}`;
export const subLotId = (lot: string, n: number) => `${lot}-S${n}`;

export function nextSeq(existing: string[], prefix: string, pattern: RegExp): number {
  let max = 0;
  for (const id of existing) {
    if (!id.startsWith(prefix)) continue;
    const m = id.slice(prefix.length).match(pattern);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);

export const today = () => new Date().toISOString().slice(0, 10);

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export function addDays(date: string, n: number): string {
  const d = new Date(Date.parse(date) + n * 86_400_000);
  return d.toISOString().slice(0, 10);
}
