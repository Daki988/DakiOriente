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

import { bandEconomics, biosecurityScore, inputGap, lotStatus, periodBounds, rankFarms, traceIndicators } from './analytics';

describe('volet économique', () => {
  it('calcule chiffre d’affaires, coût de revient et marge', () => {
    const exits = [{ id: 'x', bandId: 'B', date: '', count: 1000, weightKg: 2000, reason: 'abattoir' as const, unitPriceXaf: 3500 }];
    const charges = [{ id: 'c', farmId: 'F', date: '', post: 'Aliment', amountXaf: 2_000_000 }, { id: 'd', farmId: 'F', date: '', post: 'Poussins', amountXaf: 500_000 }];
    const e = bandEconomics(exits, charges);
    expect(e.revenue).toBe(3_500_000);
    expect(e.cost).toBe(2_500_000);
    expect(e.margin).toBe(1_000_000);
    expect(e.costPerKg).toBe(1250);
    expect(e.marginRatePct).toBeCloseTo(28.57, 1);
  });
});

describe('traçabilité et contrôles', () => {
  const lot = { id: 'L', bandId: 'B', farmId: 'F', count: 10, weightKg: 20, cededAt: '2026-11-01', signature: 'sig', confirmCode: '1234' };
  it('valide un lot seulement après cession et réception', () => {
    expect(lotStatus(lot).validated).toBe(false);
    expect(lotStatus({ ...lot, receivedAt: '2026-11-02' }).validated).toBe(true);
  });
  it('mesure le taux de lots avec QR et de ventes rattachées', () => {
    const t = traceIndicators([lot, { ...lot, id: 'L2', signature: '' }], [
      { id: '1', bandId: 'B', date: '', count: 1, weightKg: 1, reason: 'abattoir', lotId: 'L' },
      { id: '2', bandId: 'B', date: '', count: 1, weightKg: 1, reason: 'vente_directe' },
    ]);
    expect(t.qrPct).toBe(50);
    expect(t.salesLinkedPct).toBe(50);
    expect(t.qrTargetMet).toBe(false);
  });
  it('calcule l’écart sur les intrants à partir du stock constaté', () => {
    const inputs = [
      { id: 'a', farmId: 'F', date: '', type: 'aliment' as const, product: '', quantity: 1000, unit: 'kg', kind: 'reception' as const },
      { id: 'b', farmId: 'F', date: '', type: 'aliment' as const, product: '', quantity: 700, unit: 'kg', kind: 'utilisation' as const },
    ];
    expect(inputGap(inputs, []).gapPct).toBeUndefined();
    expect(inputGap(inputs, [{ id: 'v', farmId: 'F', date: '2026-11-01', agent: '', findings: '', observedFeedStockKg: 200 }]).gapPct).toBe(10);
  });
  it('calcule le score de biosécurité', () => {
    expect(biosecurityScore({ a: true, b: false, c: true, d: true })).toBe(75);
  });
  it('classe les fermes selon des pondérations', () => {
    const r = rankFarms([
      { id: 'bonne', mortality: 3, ic: 1.5, gmq: 50, completeness: 100 },
      { id: 'moyenne', mortality: 6, ic: 1.8, gmq: 40, completeness: 60 },
    ], { mortalite: 35, ic: 30, gmq: 20, regularite: 15 });
    expect(r[0].id).toBe('bonne');
  });
  it('calcule les périodes de rapport', () => {
    expect(periodBounds('hebdomadaire', '2026-11-06')).toMatchObject({ start: '2026-11-02', end: '2026-11-08' });
    expect(periodBounds('mensuel', '2026-11-06')).toMatchObject({ start: '2026-11-01', end: '2026-11-30' });
  });
});

import { parseCsv, toCsv } from './csv';
describe('reprise des données (CSV)', () => {
  it('lit un CSV point-virgule avec guillemets et BOM', () => {
    const r = parseCsv('﻿nom;telephone\n"Ferme ""A""";+24107\nFerme B;+24106\n');
    expect(r).toEqual([{ nom: 'Ferme "A"', telephone: '+24107' }, { nom: 'Ferme B', telephone: '+24106' }]);
  });
  it('détecte la virgule et réécrit en CSV', () => {
    expect(parseCsv('a,b\n1,2')[0]).toEqual({ a: '1', b: '2' });
    expect(toCsv([{ a: 'x;y', b: 2 }])).toContain('"x;y";2');
  });
});

import { nextLotIds } from './ids';
import { buildEpcis } from './epcis';
describe('étiquettes pré-signées et EPCIS 2.0', () => {
  it('réserve les prochains numéros de lot, sans réutiliser ceux qui ont servi', () => {
    expect(nextLotIds(['GA1-0042-B07-L01', 'GA1-0042-B07-L03', 'GA1-0042-B06-L09'], 'GA1-0042-B07', 3)).toEqual(['GA1-0042-B07-L04', 'GA1-0042-B07-L05', 'GA1-0042-B07-L06']);
    expect(nextLotIds([], 'GA1-0042-B08', 2)).toEqual(['GA1-0042-B08-L01', 'GA1-0042-B08-L02']);
    expect(nextLotIds(['GA1-0042-B07-L98'], 'GA1-0042-B07', 5)).toEqual(['GA1-0042-B07-L99']);
  });
  it('une étiquette pré-signée porte la signature que le lot recevra', () => {
    const [id] = nextLotIds([], 'GA1-0042-B08', 1);
    expect(verifyLot(id, signLot(id))).toBe(true);
    expect(signLot(id)).toBe(signLot(id)); // Ed25519 est déterministe : ré-émettre redonne le même QR
  });
  it('décrit la vie d’un lot en événements EPCIS 2.0', () => {
    const doc = buildEpcis({
      now: '2026-11-11T10:00:00.000Z',
      lots: [
        { id: 'GA1-0042-B07-L01', bandId: 'GA1-0042-B07', farmId: 'GA1-0042', count: 1800, weightKg: 3780, operatorId: 'OP-001', cededAt: '2026-10-28', receivedAt: '2026-10-29', receivedCount: 1795, distributorCheckedAt: '2026-10-31', distributorId: 'OP-003' },
        { id: 'GA1-0042-B07-L01-D1', parentId: 'GA1-0042-B07-L01', bandId: 'GA1-0042-B07', farmId: 'GA1-0042', count: 1790, operatorId: 'OP-001', cededAt: '2026-10-30', derivedProduct: 'Poulet entier prêt à cuire' },
      ],
      movements: [{ id: 'm1', lotId: 'GA1-0042-B07-L01', date: '2026-10-28', from: 'Nkoltang', to: 'Ntoum', by: 'Transports Ogooué' }],
    });
    expect(doc.type).toBe('EPCISDocument');
    expect(doc.schemaVersion).toBe('2.0');
    expect(doc.epcisBody.eventList.map((e) => `${e.type}:${e.bizStep}`)).toEqual([
      'ObjectEvent:commissioning', 'ObjectEvent:shipping', 'ObjectEvent:transporting', 'ObjectEvent:receiving', 'TransformationEvent:commissioning', 'ObjectEvent:inspecting',
    ]);
    const [commissioning, shipping, , receiving, transformation] = doc.epcisBody.eventList;
    expect(commissioning).toMatchObject({ action: 'ADD', eventTime: '2026-10-28T12:00:00+01:00', eventTimeZoneOffset: '+01:00', bizLocation: { id: 'urn:origa:farm:GA1-0042' } });
    expect(shipping.destinationList).toEqual([{ type: 'location', destination: 'urn:origa:operator:OP-001' }]);
    expect(receiving.quantityList).toEqual([{ epcClass: 'urn:origa:lot:GA1-0042-B07-L01', quantity: 1795 }]);
    expect(transformation).toMatchObject({ inputQuantityList: [{ epcClass: 'urn:origa:lot:GA1-0042-B07-L01' }], outputQuantityList: [{ epcClass: 'urn:origa:lot:GA1-0042-B07-L01-D1', quantity: 1790 }] });
  });
});
