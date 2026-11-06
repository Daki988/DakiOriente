import { describe, expect, it } from 'vitest';
import { evalFormula, validateFormula } from './formula';
import { bandStats, inputGapPct, stockByType } from './kpis';
import { DEFAULT_SETTINGS } from './defaults';
import { bandId, farmId, lotId, nextSeq, addDays } from './ids';
import { checkDeaths, checkExit, thresholdAlert, trendAlert, withdrawalBlock } from './rules';
import { signLot, verifyLot, parseToken, lotToken } from './qr';
import { gpsMatchesProvince } from './provinces';
import type { Band, DailyEntry } from './types';

describe('identifiants', () => {
  it('suivent la nomenclature proposée', () => {
    const f = farmId('GA1', 42);
    expect(f).toBe('GA1-0042');
    expect(bandId(f, 7)).toBe('GA1-0042-B07');
    expect(lotId(bandId(f, 7), 3)).toBe('GA1-0042-B07-L03');
  });
  it('ne réutilisent jamais un numéro', () => {
    expect(nextSeq(['GA1-0001', 'GA1-0007', 'GA2-0009'], 'GA1-', /^(\d{4})$/)).toBe(8);
  });
});

describe('formules paramétrables', () => {
  it('évalue sans eval, avec priorités et fonctions', () => {
    expect(evalFormula('(a + b) * 2 / 4', { a: 1, b: 3 })).toBe(2);
    expect(evalFormula('round(x / 3, 2)', { x: 10 })).toBe(3.33);
    expect(evalFormula('-a + max(b, 4)', { a: 1, b: 2 })).toBe(3);
  });
  it('rejette une formule invalide ou une variable inconnue', () => {
    expect(validateFormula('a +', ['a'])).not.toBeNull();
    expect(validateFormula('a * z', ['a'])).toMatch(/inconnue/);
    expect(validateFormula('a * 2', ['a'])).toBeNull();
  });
});

describe('indicateurs de bande', () => {
  const band: Band = { id: 'B', farmId: 'F', rank: 1, placedAt: '2026-10-01', chicks: 1000, initialWeightG: 40, strain: 'Cobb 500' };
  const entries: DailyEntry[] = Array.from({ length: 20 }, (_, i) => ({
    id: String(i), bandId: 'B', date: addDays('2026-10-01', i + 1), deaths: 2, feedKg: 60, createdAt: '',
  }));
  const s = bandStats(band, entries, [{ id: 'w', bandId: 'B', date: '2026-10-21', sampleSize: 50, avgWeightG: 900 }], [], DEFAULT_SETTINGS, '2026-10-21');

  it('calcule effectif, mortalité et viabilité', () => {
    expect(s.deaths).toBe(40);
    expect(s.present).toBe(960);
    expect(s.mortalityPct).toBeCloseTo(4);
    expect(s.viabilityPct).toBeCloseTo(96);
  });
  it('calcule GMQ, IC et EPEF', () => {
    expect(s.ageDays).toBe(20);
    expect(s.gmq).toBeCloseTo(43);
    // IC = 1200 / (0 + 864 - 40)
    expect(s.ic).toBeCloseTo(1200 / 824, 4);
    expect(s.epef).toBeCloseTo((96 * 0.9 * 100) / (20 * (1200 / 824)), 2);
  });
  it('mesure la complétude des saisies', () => {
    expect(s.completenessPct).toBe(100);
  });
});

describe('intrants', () => {
  it('calcule stock et écart', () => {
    expect(stockByType([
      { type: 'aliment', quantity: 1000, kind: 'reception' },
      { type: 'aliment', quantity: 300, kind: 'utilisation' },
    ]).aliment).toBe(700);
    expect(inputGapPct(1000, 300, 600)).toBe(10);
  });
});

describe('contrôles et alertes', () => {
  it('bloque des morts ou sorties supérieurs à l’effectif', () => {
    expect(checkDeaths(5, 4).ok).toBe(false);
    expect(checkDeaths(4, 4).ok).toBe(true);
    expect(checkExit(0, 10).ok).toBe(false);
  });
  it('déclenche l’alerte au-delà du seuil vétérinaire', () => {
    expect(thresholdAlert(4, 1000, DEFAULT_SETTINGS)).toBeNull();
    expect(thresholdAlert(6, 1000, DEFAULT_SETTINGS)).toMatch(/0,60 %/);
  });
  it('détecte un écart à la tendance', () => {
    const prev = Array.from({ length: 7 }, (_, i) => ({ id: String(i), bandId: 'B', date: '', deaths: 2, feedKg: 0, createdAt: '' }));
    expect(trendAlert(3, prev)).toBeNull();
    expect(trendAlert(12, prev)).not.toBeNull();
  });
  it('respecte le délai d’attente des médicaments', () => {
    const t = [{ id: 't', bandId: 'B', product: 'Enrofloxacine', reason: '', startDate: '2026-11-01', endDate: '2026-11-03', withdrawalDays: 7, animals: 100 }];
    expect(withdrawalBlock(t, '2026-11-08')).not.toBeNull();
    expect(withdrawalBlock(t, '2026-11-10')).toBeNull();
  });
  it('vérifie la cohérence GPS / province', () => {
    expect(gpsMatchesProvince('GA1', 0.39, 9.45)).toBe(true); // Libreville
    expect(gpsMatchesProvince('GA1', -1.63, 13.58)).toBe(false); // Franceville
  });
});

describe('QR signé', () => {
  it('accepte un lot authentique et rejette une copie modifiée', () => {
    const sig = signLot('GA1-0042-B07-L03');
    expect(verifyLot('GA1-0042-B07-L03', sig)).toBe(true);
    expect(verifyLot('GA1-0042-B07-L04', sig)).toBe(false);
    expect(parseToken(lotToken('GA1-0042-B07-L03', sig))).toEqual({ lotId: 'GA1-0042-B07-L03', signature: sig });
  });
});

describe('IC sans pesée', () => {
  it('n’affiche pas un IC négatif avant toute pesée', () => {
    const band: Band = { id: 'B2', farmId: 'F', rank: 1, placedAt: '2026-10-01', chicks: 1000, initialWeightG: 42, strain: 'Ross 308' };
    const e: DailyEntry[] = [{ id: '1', bandId: 'B2', date: '2026-10-03', deaths: 10, feedKg: 30, createdAt: '' }];
    expect(bandStats(band, e, [], [], DEFAULT_SETTINGS, '2026-10-03').ic).toBe(0);
  });
});
