import type { Charge, Exit, InputMovement, Lot, Settings, Visit } from './types';
import type { BandStats } from './kpis';

/** Résultats économiques d'une bande (§ 5.3). Prix de vente unitaire par tête. */
export function bandEconomics(exits: Exit[], charges: Charge[], stats?: Pick<BandStats, 'exitedWeightKg' | 'exited'>) {
  const revenue = exits.reduce((s, e) => s + (e.unitPriceXaf ?? 0) * e.count, 0);
  const cost = charges.reduce((s, c) => s + c.amountXaf, 0);
  const kg = stats?.exitedWeightKg ?? exits.reduce((s, e) => s + e.weightKg, 0);
  const heads = stats?.exited ?? exits.reduce((s, e) => s + e.count, 0);
  const margin = revenue - cost;
  return {
    revenue, cost, margin,
    costPerKg: kg > 0 ? cost / kg : 0,
    costPerHead: heads > 0 ? cost / heads : 0,
    marginPerKg: kg > 0 ? margin / kg : 0,
    marginRatePct: revenue > 0 ? (margin / revenue) * 100 : 0,
    avgPricePerKg: kg > 0 ? revenue / kg : 0,
  };
}

/** Indicateurs de traçabilité (§ 6.3) : seuil de recette 95 % des lots avec QR. */
export function traceIndicators(lots: Lot[], exits: Exit[]) {
  const sales = exits.filter((e) => e.reason === 'abattoir' || e.reason === 'vente' || e.reason === 'vente_directe');
  const linked = sales.filter((e) => !!e.lotId);
  const withQr = lots.filter((l) => !!l.signature);
  const validated = lots.filter((l) => lotStatus(l).validated);
  return {
    lots: lots.length,
    salesLinkedPct: sales.length ? (linked.length / sales.length) * 100 : 0,
    qrPct: lots.length ? (withQr.length / lots.length) * 100 : 0,
    validatedPct: lots.length ? (validated.length / lots.length) * 100 : 0,
    qrTargetMet: lots.length === 0 || withQr.length / lots.length >= 0.95,
  };
}

/** Validation sur événements vérifiables : cession enregistrée ET réception validée à l'abattoir (Proposé). */
export function lotStatus(l: Lot): { label: string; validated: boolean; step: number } {
  if (l.distributorCheckedAt) return { label: 'Contrôlé par le distributeur', validated: !!l.receivedAt, step: 3 };
  if (l.receivedAt) return { label: 'Validé : réceptionné à l’abattoir', validated: true, step: 2 };
  if (!l.signature) return { label: 'Cédé · signature en attente', validated: false, step: 0 };
  return { label: 'Cédé · réception non confirmée', validated: false, step: 1 };
}

/** Écart (%) entre intrants livrés, déclarés utilisés et stock constaté en visite (§ 5.1). */
export function inputGap(inputs: InputMovement[], visits: Visit[], type = 'aliment') {
  const delivered = inputs.filter((i) => i.type === type && i.kind === 'reception').reduce((s, i) => s + i.quantity, 0);
  const used = inputs.filter((i) => i.type === type && i.kind === 'utilisation').reduce((s, i) => s + i.quantity, 0);
  const last = [...visits].filter((v) => v.observedFeedStockKg !== undefined).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!last || delivered === 0) return { delivered, used, observed: undefined as number | undefined, gapPct: undefined as number | undefined };
  const observed = last.observedFeedStockKg!;
  return { delivered, used, observed, gapPct: ((delivered - used - observed) / delivered) * 100 };
}

/** Score de biosécurité (%) = points conformes / points contrôlés × 100. */
export function biosecurityScore(results: Record<string, boolean>): number {
  const v = Object.values(results);
  return v.length ? (v.filter(Boolean).length / v.length) * 100 : 0;
}

export interface RankInput { id: string; mortality: number; ic: number; gmq: number; completeness: number }

/** Classement pondéré des fermes : chaque critère ramené sur 0-100, pondérations paramétrables. */
export function rankFarms(rows: RankInput[], w: Settings['rankingWeights']) {
  const valid = rows.filter((r) => r.ic > 0);
  const range = (k: keyof RankInput) => {
    const xs = valid.map((r) => r[k] as number);
    return [Math.min(...xs), Math.max(...xs)] as const;
  };
  const norm = (v: number, [lo, hi]: readonly [number, number], lowerIsBetter: boolean) => (hi === lo ? 100 : lowerIsBetter ? ((hi - v) / (hi - lo)) * 100 : ((v - lo) / (hi - lo)) * 100);
  const rm = range('mortality'); const ri = range('ic'); const rg = range('gmq');
  const total = w.mortalite + w.ic + w.gmq + w.regularite || 1;
  return valid.map((r) => ({
    id: r.id,
    score: (norm(r.mortality, rm, true) * w.mortalite + norm(r.ic, ri, true) * w.ic + norm(r.gmq, rg, false) * w.gmq + Math.min(100, r.completeness) * w.regularite) / total,
  })).sort((a, b) => b.score - a.score);
}

/** Bornes d'une période de rapport. */
export function periodBounds(kind: 'hebdomadaire' | 'mensuel', ref: string): { start: string; end: string; label: string } {
  const d = new Date(ref + 'T12:00:00Z');
  if (kind === 'mensuel') {
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), label: start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) };
  }
  const day = (d.getUTCDay() + 6) % 7;
  const start = new Date(d.getTime() - day * 86_400_000);
  const end = new Date(start.getTime() + 6 * 86_400_000);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), label: `semaine du ${start.toLocaleDateString('fr-FR', { timeZone: 'UTC' })}` };
}
