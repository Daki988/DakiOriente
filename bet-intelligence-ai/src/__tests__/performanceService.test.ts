import { describe, expect, it } from 'vitest';
import {
  bankrollSeries,
  calibration,
  MIN_SETTLED_SAMPLE,
  probabilityDistribution,
  resultsByMarket,
  summarize,
  VIRTUAL_BANKROLL_START,
} from '../services/performanceService';
import type { Ticket, TicketStatus } from '../types';

function ticket(id: string, status: TicketStatus, totalOdds: number, probability: number): Ticket {
  return {
    id, createdAt: `2026-01-0${id}T10:00:00.000Z`, settledAt: `2026-01-0${id}T20:00:00.000Z`,
    legs: [{ selectionId: `${id}:OVER_1_5`, matchId: id, market: 'OVER_1_5', odds: totalOdds, probability,
      homeName: 'A', awayName: 'B', competitionName: 'C', kickoff: '', reason: '',
      outcome: status === 'WON_SIM' ? 'WON' : status === 'LOST_SIM' ? 'LOST' : undefined }],
    totalOdds, probability, status, virtualStake: 1000, risks: [],
  };
}

describe('summarize', () => {
  it('signale un échantillon insuffisant et ne calcule rien sans données', () => {
    const s = summarize([]);
    expect(s.sufficient).toBe(false);
    expect(s.hitRate).toBeNull();
    expect(s.roi).toBeNull();
    expect(s.brier).toBeNull();
  });

  it('calcule taux de réussite, ROI simulé et Brier', () => {
    const tickets = [
      ticket('1', 'WON_SIM', 2, 0.6),
      ticket('2', 'LOST_SIM', 2, 0.6),
      ticket('3', 'PENDING', 2, 0.6),
      ticket('4', 'CANCELLED', 2, 0.6),
    ];
    const s = summarize(tickets);
    expect(s.recorded).toBe(4);
    expect(s.settled).toBe(2);
    expect(s.pending).toBe(1);
    expect(s.hitRate).toBe(0.5);
    expect(s.roi).toBe(0); // 2000 misés, 2000 retournés
    expect(s.brier).toBeCloseTo((0.16 + 0.36) / 2, 10);
    expect(s.sufficient).toBe(2 >= MIN_SETTLED_SAMPLE);
  });
});

describe('séries', () => {
  const tickets = [ticket('1', 'WON_SIM', 1.5, 0.7), ticket('2', 'LOST_SIM', 1.8, 0.55), ticket('3', 'PENDING', 1.4, 0.75)];
  it('bankroll virtuelle', () => {
    const b = bankrollSeries(tickets);
    expect(b.map((p) => p.bankroll)).toEqual([VIRTUAL_BANKROLL_START, VIRTUAL_BANKROLL_START + 500, VIRTUAL_BANKROLL_START - 500]);
  });
  it('résultats par marché', () => {
    expect(resultsByMarket(tickets)).toEqual([{ market: 'OVER_1_5', won: 1, lost: 1 }]);
  });
  it('distribution des probabilités', () => {
    const d = probabilityDistribution(tickets);
    expect(d).toHaveLength(10);
    expect(d.reduce((a, b) => a + b.count, 0)).toBe(3);
  });
  it('calibration sur les tickets réglés uniquement', () => {
    const c = calibration(tickets);
    expect(c.reduce((a, b) => a + b.count, 0)).toBe(2);
  });
});
