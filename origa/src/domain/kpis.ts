import { evalFormula } from './formula';
import { daysBetween } from './ids';
import type { Band, DailyEntry, Exit, Settings, Weighing } from './types';

export interface BandStats {
  ageDays: number;
  placed: number;
  deaths: number;
  exited: number;
  present: number;
  feedKg: number;
  avgWeightG: number;
  mortalityPct: number;
  viabilityPct: number;
  gmq: number;
  ic: number;
  epef: number;
  exitedWeightKg: number;
  liveWeightPresentKg: number;
  completenessPct: number;
  lastEntryDate?: string;
}

const safe = (v: number) => (Number.isFinite(v) ? v : 0);

/** Calcule les indicateurs d'une bande à une date (§ 5.1, formules paramétrables). */
export function bandStats(
  band: Band,
  entries: DailyEntry[],
  weighings: Weighing[],
  exits: Exit[],
  settings: Settings,
  asOf: string,
): BandStats {
  const end = band.closedAt && band.closedAt < asOf ? band.closedAt : asOf;
  const ageDays = Math.max(1, daysBetween(band.placedAt, end));
  const inRange = <T extends { date: string }>(xs: T[]) => xs.filter((x) => x.date <= end);
  const es = inRange(entries);
  const ws = inRange(weighings).sort((a, b) => a.date.localeCompare(b.date));
  const xs = inRange(exits);

  const deaths = es.reduce((s, e) => s + e.deaths, 0);
  const feedKg = es.reduce((s, e) => s + e.feedKg, 0);
  const exited = xs.reduce((s, e) => s + e.count, 0);
  const exitedWeightKg = xs.reduce((s, e) => s + e.weightKg, 0);
  const present = band.chicks - deaths - exited;
  const avgWeightG = ws.length ? ws[ws.length - 1].avgWeightG : band.initialWeightG;
  const liveWeightPresentKg = (present * avgWeightG) / 1000;
  const f = settings.formulas;

  const v: Record<string, number> = {
    morts_cumules: deaths,
    mis_en_place: band.chicks,
    poids_moyen_g: avgWeightG,
    poids_initial_g: band.initialWeightG,
    age_jours: ageDays,
    aliment_kg: feedKg,
    poids_vif_sorti_kg: exitedWeightKg,
    poids_vif_present_kg: liveWeightPresentKg,
    poids_poussins_kg: (band.chicks * band.initialWeightG) / 1000,
    effectif_present: present,
    capacite: 0,
  };
  const run = (src: string) => {
    try { return safe(evalFormula(src, v)); } catch { return 0; }
  };
  v.mortalite = run(f.mortalite);
  v.viabilite = run(f.viabilite);
  v.gmq = run(f.gmq);
  // IC non calculable tant que le poids vif produit n'est pas positif (aucune pesée, début de bande).
  const produced = exitedWeightKg + liveWeightPresentKg - (band.chicks * band.initialWeightG) / 1000;
  v.ic = produced > 0 ? run(f.ic) : 0;
  v.epef = v.ic > 0 ? run(f.epef) : 0;

  const days = new Set(es.map((e) => e.date)).size;
  const elapsed = Math.max(1, daysBetween(band.placedAt, end));

  return {
    ageDays,
    placed: band.chicks,
    deaths,
    exited,
    present,
    feedKg,
    avgWeightG,
    mortalityPct: v.mortalite,
    viabilityPct: v.viabilite,
    gmq: v.gmq,
    ic: v.ic,
    epef: v.epef,
    exitedWeightKg,
    liveWeightPresentKg,
    completenessPct: Math.min(100, (days / elapsed) * 100),
    lastEntryDate: es.map((e) => e.date).sort().pop(),
  };
}

/** Stock = reçu − utilisé, par type d'intrant (§ 5.1). */
export function stockByType(movs: { type: string; quantity: number; kind: 'reception' | 'utilisation' }[]) {
  const s: Record<string, number> = {};
  for (const m of movs) s[m.type] = (s[m.type] ?? 0) + (m.kind === 'reception' ? m.quantity : -m.quantity);
  return s;
}

/** Écart livré / déclaré (%) = (livré − utilisé − stock) / livré × 100. */
export function inputGapPct(delivered: number, used: number, stock: number): number {
  return delivered > 0 ? ((delivered - used - stock) / delivered) * 100 : 0;
}
