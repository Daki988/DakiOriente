/**
 * Indicateurs de performance calculés UNIQUEMENT à partir des tickets virtuels
 * enregistrés par l'utilisateur et réglés en simulation. Aucun historique n'est inventé.
 */
import type { MarketId, Ticket } from '../types';
import { brierScore, mean, round } from '../utils/math';

/** Taille d'échantillon minimale pour afficher des indicateurs d'évaluation. */
export const MIN_SETTLED_SAMPLE = 5;
export const INSUFFICIENT_DATA_MESSAGE = 'Données insuffisantes pour évaluer la performance.';
export const VIRTUAL_BANKROLL_START = 100_000;

export interface PerformanceSummary {
  recorded: number;
  settled: number;
  pending: number;
  cancelled: number;
  won: number;
  lost: number;
  hitRate: number | null;
  averageOdds: number | null;
  totalStaked: number;
  totalReturned: number;
  roi: number | null;
  brier: number | null;
  sufficient: boolean;
}

const isWon = (t: Ticket) => t.status === 'WON_SIM' || t.status === 'WON';
const isSettled = (t: Ticket) => isWon(t) || t.status === 'LOST_SIM' || t.status === 'LOST';

export function settledTickets(tickets: Ticket[]): Ticket[] {
  return tickets
    .filter(isSettled)
    .sort((a, b) => (a.settledAt ?? a.createdAt).localeCompare(b.settledAt ?? b.createdAt));
}

export function summarize(tickets: Ticket[]): PerformanceSummary {
  const settled = settledTickets(tickets);
  const won = settled.filter(isWon);
  const totalStaked = settled.reduce((a, t) => a + t.virtualStake, 0);
  const totalReturned = won.reduce((a, t) => a + t.virtualStake * t.totalOdds, 0);
  const sufficient = settled.length >= MIN_SETTLED_SAMPLE;
  return {
    recorded: tickets.length,
    settled: settled.length,
    pending: tickets.filter((t) => t.status === 'PENDING').length,
    cancelled: tickets.filter((t) => t.status === 'CANCELLED').length,
    won: won.length,
    lost: settled.length - won.length,
    hitRate: settled.length ? won.length / settled.length : null,
    averageOdds: settled.length ? round(mean(settled.map((t) => t.totalOdds))) : null,
    totalStaked,
    totalReturned: round(totalReturned),
    roi: totalStaked > 0 ? (totalReturned - totalStaked) / totalStaked : null,
    brier: brierScore(settled.map((t) => ({ probability: t.probability, outcome: isWon(t) ? 1 : 0 }))),
    sufficient,
  };
}

export interface BankrollPoint {
  index: number;
  label: string;
  bankroll: number;
}

export function bankrollSeries(tickets: Ticket[], start = VIRTUAL_BANKROLL_START): BankrollPoint[] {
  const points: BankrollPoint[] = [{ index: 0, label: 'Départ', bankroll: start }];
  let b = start;
  settledTickets(tickets).forEach((t, i) => {
    b += isWon(t) ? t.virtualStake * (t.totalOdds - 1) : -t.virtualStake;
    points.push({ index: i + 1, label: t.id, bankroll: round(b, 0) });
  });
  return points;
}

export interface MarketResult {
  market: MarketId;
  won: number;
  lost: number;
}

/** Résultats par marché, sur les jambes dont l'issue simulée est connue. */
export function resultsByMarket(tickets: Ticket[]): MarketResult[] {
  const map = new Map<MarketId, MarketResult>();
  for (const t of tickets) {
    for (const l of t.legs) {
      if (!l.outcome) continue;
      const r = map.get(l.market) ?? { market: l.market, won: 0, lost: 0 };
      if (l.outcome === 'WON') r.won++;
      else r.lost++;
      map.set(l.market, r);
    }
  }
  return [...map.values()].sort((a, b) => b.won + b.lost - (a.won + a.lost));
}

export interface ProbabilityBucket {
  label: string;
  from: number;
  to: number;
  count: number;
}

/** Distribution des probabilités indicatives des tickets enregistrés. */
export function probabilityDistribution(tickets: Ticket[], step = 0.1): ProbabilityBucket[] {
  const buckets: ProbabilityBucket[] = [];
  for (let from = 0; from < 1 - 1e-9; from += step) {
    const to = Math.min(1, from + step);
    buckets.push({ label: `${Math.round(from * 100)}–${Math.round(to * 100)} %`, from, to, count: 0 });
  }
  for (const t of tickets) {
    const idx = Math.min(buckets.length - 1, Math.floor(t.probability / step));
    buckets[idx].count++;
  }
  return buckets;
}

export interface CalibrationPoint {
  label: string;
  predicted: number;
  observed: number;
  count: number;
}

/** Comparaison probabilité estimée / fréquence observée (tickets réglés), par tranche. */
export function calibration(tickets: Ticket[], step = 0.2): CalibrationPoint[] {
  const settled = settledTickets(tickets);
  const out: CalibrationPoint[] = [];
  for (let from = 0; from < 1 - 1e-9; from += step) {
    const to = from + step;
    const inBucket = settled.filter((t) => t.probability >= from && (t.probability < to || (to >= 1 && t.probability <= 1)));
    if (inBucket.length === 0) continue;
    out.push({
      label: `${Math.round(from * 100)}–${Math.round(to * 100)} %`,
      predicted: mean(inBucket.map((t) => t.probability)),
      observed: inBucket.filter(isWon).length / inBucket.length,
      count: inBucket.length,
    });
  }
  return out;
}
