import { describe, expect, it } from 'vitest';
import { buildDemoMatches } from '../services/demoEngine';
import { eligibleSelections, toSelections } from '../services/matchService';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../services/settingsService';
import {
  composeLegs,
  generateTicket,
  legSignature,
  NO_COMBINATION_MESSAGE,
  setTicketStatus,
  settleWithResults,
  simulateSettlement,
} from '../services/ticketService';
import { DEMO_COMPETITIONS } from '../data/demoMatches';
import type { Selection, Settings } from '../types';
import { combinedOdds, combinedProbability, round } from '../utils/math';

const REF = new Date('2026-03-10T08:00:00');
const NOW = new Date('2026-03-10T09:00:00');
const matches = buildDemoMatches(1, REF);
const selections = toSelections(matches, DEMO_COMPETITIONS);
const settings: Settings = { ...DEFAULT_SETTINGS };

function sel(id: string, matchId: string, odds: number, probability: number): Selection {
  return {
    id, matchId, market: 'OVER_1_5', odds, probability, impliedProbability: 1 / odds, edge: probability - 1 / odds,
    dataQuality: 'HIGH', homeName: 'A', awayName: 'B', competitionName: 'C', kickoff: REF.toISOString(), reason: '', source: 'demo',
  };
}

describe('jeu de démonstration', () => {
  it('est déterministe pour une même graine', () => {
    expect(buildDemoMatches(1, REF)).toEqual(buildDemoMatches(1, REF));
  });
  it('produit des cotes et probabilités valides', () => {
    for (const s of selections) {
      expect(s.odds).toBeGreaterThan(1);
      expect(s.probability).toBeGreaterThan(0);
      expect(s.probability).toBeLessThanOrEqual(1);
    }
  });
});

describe('filtrage des sélections', () => {
  it('respecte tous les critères configurés', () => {
    const eligible = eligibleSelections(matches, selections, settings, NOW);
    expect(eligible.length).toBeGreaterThan(0);
    for (const s of eligible) {
      expect(s.probability).toBeGreaterThanOrEqual(settings.minProbability);
      expect(s.odds).toBeGreaterThanOrEqual(settings.minOdds);
      expect(s.odds).toBeLessThanOrEqual(settings.maxOdds);
      expect(s.dataQuality).not.toBe('LOW');
    }
  });
  it('exclut les marchés non autorisés', () => {
    const eligible = eligibleSelections(matches, selections, { ...settings, allowedMarkets: ['OVER_1_5'] }, NOW);
    expect(eligible.every((s) => s.market === 'OVER_1_5')).toBe(true);
  });
  it('le mode prudent est plus restrictif', () => {
    const normal = eligibleSelections(matches, selections, settings, NOW);
    const prudent = eligibleSelections(matches, selections, { ...settings, prudentMode: true }, NOW);
    expect(prudent.length).toBeLessThanOrEqual(normal.length);
    expect(prudent.every((s) => s.dataQuality === 'HIGH' && s.probability >= 0.78)).toBe(true);
    expect(prudent.some((s) => ['DRAW', 'BTTS_YES', 'OVER_2_5'].includes(s.market))).toBe(false);
  });
  it('exclut les matchs déjà commencés', () => {
    const later = new Date(REF.getTime() + 30 * 86400000);
    expect(eligibleSelections(matches, selections, settings, later)).toHaveLength(0);
  });
});

describe('composition des tickets', () => {
  it('une seule sélection par match', () => {
    const legs = composeLegs([sel('a', 'm1', 1.3, 0.8), sel('b', 'm1', 1.25, 0.82), sel('c', 'm2', 1.3, 0.8)], settings);
    expect(legs?.map((l) => l.id)).toEqual(['a', 'c']);
  });
  it('renvoie null si le minimum de sélections est inatteignable', () => {
    expect(composeLegs([sel('a', 'm1', 1.3, 0.8)], settings)).toBeNull();
  });
  it('ajoute des sélections pour approcher la cote cible sans dépasser le maximum', () => {
    const c = [1, 2, 3, 4, 5, 6].map((i) => sel(`s${i}`, `m${i}`, 1.3, 0.8));
    expect(composeLegs(c, { ...settings, targetTotalOdds: 2 })).toHaveLength(3); // 1,3³ = 2,197
    expect(composeLegs(c, { ...settings, targetTotalOdds: 50 })).toHaveLength(4);
    expect(composeLegs(c, { ...settings, targetTotalOdds: null })).toHaveLength(2);
  });
});

describe('generateTicket', () => {
  it('calcule la cote totale et la probabilité indicative', () => {
    const r = generateTicket(matches, selections, settings, [], NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const t = r.ticket;
    expect(t.legs.length).toBeGreaterThanOrEqual(2);
    expect(t.legs.length).toBeLessThanOrEqual(4);
    expect(t.totalOdds).toBe(round(combinedOdds(t.legs.map((l) => l.odds))));
    expect(t.probability).toBeCloseTo(combinedProbability(t.legs.map((l) => l.probability)), 3);
    expect(new Set(t.legs.map((l) => l.matchId)).size).toBe(t.legs.length);
    expect(t.status).toBe('PENDING');
    expect(r.reasons).toHaveLength(t.legs.length);
    expect(t.risks.some((x) => x.includes('indépendance'))).toBe(true);
  });

  it('ne recrée pas un ticket en attente identique', () => {
    const first = generateTicket(matches, selections, settings, [], NOW);
    if (!first.ok) throw new Error('attendu ok');
    const second = generateTicket(matches, selections, settings, [first.ticket], NOW);
    if (second.ok) {
      expect(legSignature(second.ticket.legs)).not.toBe(legSignature(first.ticket.legs));
      expect(second.ticket.id).not.toBe(first.ticket.id);
    } else {
      expect(second.message).toBe(NO_COMBINATION_MESSAGE);
    }
  });

  it('ne force jamais la création si les critères sont impossibles', () => {
    const r = generateTicket(matches, selections, { ...settings, minProbability: 0.99 }, [], NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe(NO_COMBINATION_MESSAGE);
  });

  it('refuse des paramètres incohérents', () => {
    const r = generateTicket(matches, selections, { ...settings, minSelections: 5, maxSelections: 2 }, [], NOW);
    expect(r.ok).toBe(false);
  });
});

describe('règlement simulé et statuts', () => {
  const r = generateTicket(matches, selections, settings, [], NOW);
  if (!r.ok) throw new Error('attendu ok');
  it('est reproductible et cohérent avec les jambes', () => {
    const a = simulateSettlement(r.ticket, NOW);
    const b = simulateSettlement(r.ticket, NOW);
    expect(a.status).toBe(b.status);
    expect(a.legs.every((l) => l.outcome)).toBe(true);
    expect(a.status === 'WON_SIM').toBe(a.legs.every((l) => l.outcome === 'WON'));
  });
  it('remise en attente efface le règlement', () => {
    const settled = simulateSettlement(r.ticket, NOW);
    const back = setTicketStatus(settled, 'PENDING', NOW);
    expect(back.settledAt).toBeUndefined();
    expect(back.legs.every((l) => l.outcome === undefined)).toBe(true);
  });
});

describe('sanitizeSettings', () => {
  it('corrige les bornes incohérentes', () => {
    const s = sanitizeSettings({ minOdds: 2, maxOdds: 1.5, minSelections: 4, maxSelections: 2, minProbability: 3 });
    expect(s.maxOdds).toBeGreaterThanOrEqual(s.minOdds);
    expect(s.maxSelections).toBeGreaterThanOrEqual(s.minSelections);
    expect(s.minProbability).toBeLessThan(1);
  });
  it('revient aux valeurs par défaut', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
  });
});

describe('règlement sur scores réels', () => {
  const base = generateTicket(matches, selections, settings, [], NOW);
  if (!base.ok) throw new Error('attendu ok');
  const live = { ...base.ticket, source: 'live' as const };
  const ids = live.legs.map((l) => l.matchId);
  const finished = (h: number, a: number) => ({ finished: true, cancelled: false, home: h, away: a });

  it('reste en attente tant que tous les matchs ne sont pas terminés', () => {
    const t = settleWithResults(live, {});
    expect(t.status).toBe('PENDING');
  });
  it('perdant dès qu’une sélection est perdue', () => {
    // 0-0 fait perdre « +1,5 », « +2,5 », « BTTS » et les victoires sèches.
    const losing = live.legs.findIndex((l) => ['OVER_1_5', 'OVER_2_5', 'BTTS_YES', 'HOME_WIN', 'AWAY_WIN'].includes(l.market));
    if (losing < 0) return;
    const t = settleWithResults(live, { [ids[losing]]: finished(0, 0) });
    expect(t.status).toBe('LOST');
    expect(t.legs[losing].finalScore).toEqual({ home: 0, away: 0 });
  });
  it('annulé si un match est reporté', () => {
    expect(settleWithResults(live, { [ids[0]]: { finished: false, cancelled: true, home: null, away: null } }).status).toBe('CANCELLED');
  });
  it('ignore les tickets de démonstration', () => {
    expect(settleWithResults(base.ticket, { [ids[0]]: finished(0, 0) })).toBe(base.ticket);
  });
});
