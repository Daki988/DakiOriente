import { describe, expect, it } from 'vitest';
import { brierScore, combinedOdds, combinedProbability, impliedProbability, round } from '../utils/math';
import { marketProbabilities, scoreMatrix } from '../utils/poisson';
import { ALL_MARKET_IDS } from '../utils/markets';
import { formatOdds, formatPct } from '../utils/format';

describe('calculs de cotes et probabilités', () => {
  it('cote totale = produit des cotes', () => {
    expect(round(combinedOdds([1.25, 1.4, 1.3]))).toBe(2.28);
    expect(combinedOdds([])).toBe(0);
  });

  it('probabilité indicative = produit des probabilités', () => {
    expect(combinedProbability([0.8, 0.9])).toBeCloseTo(0.72, 10);
    expect(combinedProbability([])).toBe(0);
  });

  it('probabilité implicite = 1 / cote', () => {
    expect(impliedProbability(1.25)).toBeCloseTo(0.8, 10);
    expect(() => impliedProbability(0)).toThrow();
  });

  it('score de Brier', () => {
    expect(brierScore([])).toBeNull();
    expect(brierScore([{ probability: 1, outcome: 1 }])).toBe(0);
    expect(brierScore([{ probability: 0.7, outcome: 0 }, { probability: 0.7, outcome: 1 }])).toBeCloseTo((0.49 + 0.09) / 2, 10);
  });
});

describe('modèle de Poisson', () => {
  it('la matrice des scores somme à ~1', () => {
    const total = scoreMatrix(1.6, 1.1).flat().reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 4);
  });

  it('1 + X + 2 = 1 et les doubles chances sont cohérentes', () => {
    const p = marketProbabilities(1.7, 0.9, ALL_MARKET_IDS);
    expect(p.HOME_WIN + p.DRAW + p.AWAY_WIN).toBeCloseTo(1, 4);
    expect(p.DOUBLE_CHANCE_1X).toBeCloseTo(p.HOME_WIN + p.DRAW, 6);
    expect(p.DOUBLE_CHANCE_X2).toBeCloseTo(p.AWAY_WIN + p.DRAW, 6);
    expect(p.OVER_1_5).toBeGreaterThan(p.OVER_2_5);
  });
});

describe('formats français', () => {
  it('cote avec virgule décimale', () => {
    expect(formatOdds(1.2)).toBe('1,20');
  });
  it('pourcentage', () => {
    expect(formatPct(0.784).replace(/\s/g, ' ')).toBe('78,4 %');
  });
});

import { buildDemoMatches } from '../services/demoEngine';
import { DEFAULT_MATCH_FILTERS, filterMatches } from '../utils/matchFilters';

describe('filtres du centre des matchs', () => {
  const matches = buildDemoMatches(1, new Date('2026-03-10T08:00:00'));
  it('recherche insensible aux accents et à la casse', () => {
    const r = filterMatches(matches, {}, { ...DEFAULT_MATCH_FILTERS, search: 'etoile' });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every(({ match }) => `${match.home.name} ${match.away.name}`.includes('Étoile'))).toBe(true);
  });
  it('filtre par marché, cote et probabilité', () => {
    const r = filterMatches(matches, {}, { ...DEFAULT_MATCH_FILTERS, market: 'OVER_1_5', minOdds: 1.2, maxOdds: 1.5, minProbability: 0.7 });
    for (const { offer } of r) {
      expect(offer!.market).toBe('OVER_1_5');
      expect(offer!.odds).toBeGreaterThanOrEqual(1.2);
      expect(offer!.odds).toBeLessThanOrEqual(1.5);
      expect(offer!.probability).toBeGreaterThanOrEqual(0.7);
    }
  });
  it('tri par probabilité décroissante', () => {
    const r = filterMatches(matches, {}, { ...DEFAULT_MATCH_FILTERS, sort: 'probability', sortDir: 'desc' });
    for (let i = 1; i < r.length; i++) expect(r[i - 1].offer!.probability).toBeGreaterThanOrEqual(r[i].offer!.probability);
  });
  it('tri par heure de coup d’envoi', () => {
    const r = filterMatches(matches, {}, DEFAULT_MATCH_FILTERS);
    expect(r).toHaveLength(matches.length);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].match.kickoff <= r[i].match.kickoff).toBe(true);
  });
});
