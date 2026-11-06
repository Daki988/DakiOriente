import { db } from './db';
import { DEFAULT_SETTINGS } from '../domain/defaults';
import { addDays, bandId, lotId, today, uid } from '../domain/ids';
import { signLot } from '../domain/qr';
import type { Band, DailyEntry, Exit, Farm, InputMovement, Lot, Operator, ProvinceCode, Weighing } from '../domain/types';

// Données de démonstration déterministes (aucune donnée réelle de ferme).
let s = 42;
const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];

const FARMS: [ProvinceCode, number, string, string, number, number][] = [
  ['GA1', 42, 'Ferme Nkoltang', 'Nkoltang', 0.405, 9.62],
  ['GA1', 3, 'Ferme Owendo Plaine', 'Owendo', 0.29, 9.5],
  ['GA1', 17, 'GIE Ntoum Avicole', 'Ntoum', 0.39, 9.78],
  ['GA1', 21, 'Ferme Cap Estérias', 'Cap Estérias', 0.6, 9.33],
  ['GA2', 19, 'Ferme Franceville Mvengue', 'Franceville', -1.62, 13.55],
  ['GA2', 4, 'Ferme Moanda Plateau', 'Moanda', -1.56, 13.2],
  ['GA3', 8, 'Ferme Lambaréné Isaac', 'Lambaréné', -0.7, 10.24],
  ['GA4', 11, 'Ferme Mouila Sud', 'Mouila', -1.87, 11.06],
  ['GA5', 2, 'Ferme Tchibanga Nyanga', 'Tchibanga', -2.85, 11.02],
  ['GA6', 3, 'Ferme Makokou Ivindo', 'Makokou', 0.57, 12.86],
  ['GA7', 5, 'Ferme Koulamoutou Lolo', 'Koulamoutou', -1.13, 12.47],
  ['GA8', 5, 'Ferme Port-Gentil Ozouri', 'Port-Gentil', -0.72, 8.78],
  ['GA9', 7, 'Ferme Oyem Akok', 'Oyem', 1.6, 11.58],
  ['GA9', 12, 'Ferme Bitam Frontière', 'Bitam', 2.08, 11.49],
];

const OPERATORS: Operator[] = [
  { id: 'OP-001', name: 'Abattoir de Ntoum', type: 'abattoir', locality: 'Ntoum', convention: true },
  { id: 'OP-002', name: 'Grossiste Mont-Bouët', type: 'acheteur', locality: 'Libreville', convention: true },
  { id: 'OP-003', name: 'Distributeur Libreville Centre', type: 'distributeur', locality: 'Libreville', convention: true },
  { id: 'OP-004', name: 'Abattoir de Franceville', type: 'abattoir', locality: 'Franceville', convention: false },
];

/** Courbe de poids de référence simplifiée (g) selon l'âge en jours. */
export const refWeight = (age: number) => Math.round(42 + 2.2 * age * age * (1 - age / 140));

export async function seedIfEmpty() {
  if ((await db.farms.count()) > 0) return;
  const now = today();
  const farms: Farm[] = []; const bands: Band[] = []; const entries: DailyEntry[] = [];
  const weighings: Weighing[] = []; const exits: Exit[] = []; const inputs: InputMovement[] = []; const lots: Lot[] = [];

  FARMS.forEach(([prov, seq, name, loc, lat, lng], idx) => {
    const id = `${prov}-${String(seq).padStart(4, '0')}`;
    const capacity = pick([2000, 3000, 5000, 6000]);
    farms.push({
      id, name, owner: pick(['M. Ndong', 'Mme Moussavou', 'M. Obame', 'Mme Nzé', 'M. Mba', 'Mme Boussougou']),
      phone: `+241 07 ${String(10 + idx).padStart(2, '0')} ${String(Math.floor(rnd() * 90 + 10))} ${String(Math.floor(rnd() * 90 + 10))}`,
      province: prov, locality: loc, amiRef: `AMI-2026-${String(100 + idx)}`, lat, lng, capacity,
      buildings: capacity >= 5000 ? 2 : 1, status: idx === 13 ? 'preparation' : 'operationnelle', cohort: idx < 9 ? 1 : 2,
      bcegFinanced: idx % 3 === 0, bcegConsentAt: idx % 3 === 0 ? '2026-09-01' : undefined, createdAt: '2026-08-20',
    });
    if (idx === 13) return;

    // Bande précédente clôturée (alimente la production hebdomadaire).
    const rank = idx === 0 ? 7 : 6 + (idx % 2);
    const prevPlaced = addDays(now, -95 + Math.floor(rnd() * 30));
    const prev: Band = { id: bandId(id, rank - 1), farmId: id, rank: rank - 1, placedAt: prevPlaced, chicks: Math.round(capacity * 0.9), initialWeightG: 42, strain: 'Cobb 500', closedAt: addDays(prevPlaced, 44) };
    bands.push(prev);
    const prevDeaths = Math.round(prev.chicks * (0.03 + rnd() * 0.04));
    for (let k = 0; k < 2; k++) {
      const count = Math.floor((prev.chicks - prevDeaths) / 2);
      const date = addDays(prevPlaced, 42 + k * 2);
      const lid = lotId(prev.id, k + 1);
      exits.push({ id: uid(), bandId: prev.id, date, count, weightKg: Math.round(count * 2.1), reason: 'abattoir', operatorId: k ? 'OP-002' : 'OP-001', lotId: lid, unitPriceXaf: 3500 });
      lots.push({ id: lid, bandId: prev.id, farmId: id, count, weightKg: Math.round(count * 2.1), operatorId: k ? 'OP-002' : 'OP-001', cededAt: date, signature: signLot(lid), confirmCode: String(1000 + Math.floor(rnd() * 8999)), receivedAt: date, receivedCount: count });
    }
    entries.push({ id: uid(), bandId: prev.id, date: prev.closedAt!, deaths: prevDeaths, feedKg: Math.round(prev.chicks * 4.2), createdAt: prev.closedAt! });

    // Bande en cours.
    const age = idx === 0 ? 23 : 6 + Math.floor(rnd() * 34);
    const placedAt = addDays(now, -age);
    const chicks = idx === 0 ? 5000 : Math.round(capacity * (0.8 + rnd() * 0.2));
    const b: Band = { id: bandId(id, rank), farmId: id, rank, placedAt, chicks, initialWeightG: 42, strain: pick(['Cobb 500', 'Ross 308']) };
    bands.push(b);
    inputs.push({ id: uid(), farmId: id, bandId: b.id, date: placedAt, type: 'poussins', product: `Poussins d'un jour ${b.strain}`, quantity: chicks, unit: 'têtes', kind: 'reception', supplier: 'Couvoir national', supplierLot: `CV-${placedAt.replace(/-/g, '')}`, subsidized: true, confirmed: true });
    inputs.push({ id: uid(), farmId: id, bandId: b.id, date: placedAt, type: 'aliment', product: 'Aliment démarrage / croissance', quantity: Math.round(chicks * 3.6), unit: 'kg', kind: 'reception', supplier: 'SMAG', supplierLot: `AL-${placedAt.replace(/-/g, '')}`, subsidized: true, confirmed: true });

    const sick = id === 'GA4-0011';
    const lazy = id === 'GA9-0007';
    let feedUsed = 0;
    for (let d = 1; d < age; d++) {
      if (lazy && rnd() < 0.5) continue;
      const base = d < 4 ? 0.004 : 0.0006;
      const spike = sick && d > age - 3 ? 0.02 : 0;
      const deaths = Math.round(chicks * (base + spike) * (0.5 + rnd()));
      const feedKg = Math.round(chicks * (0.012 + d * 0.0042));
      feedUsed += feedKg;
      entries.push({ id: uid(), bandId: b.id, date: addDays(placedAt, d), deaths, feedKg, waterL: Math.round(feedKg * 1.9), createdAt: addDays(placedAt, d) });
      if (d % 7 === 0) weighings.push({ id: uid(), bandId: b.id, date: addDays(placedAt, d), sampleSize: 50, avgWeightG: Math.round(refWeight(d) * (sick ? 0.85 : 0.96 + rnd() * 0.08)) });
    }
    inputs.push({ id: uid(), farmId: id, bandId: b.id, date: addDays(now, -1), type: 'aliment', product: 'Aliment démarrage / croissance', quantity: feedUsed, unit: 'kg', kind: 'utilisation' });
  });

  await db.transaction('rw', [db.farms, db.bands, db.entries, db.weighings, db.exits, db.inputs, db.lots, db.operators, db.settings, db.alerts, db.vaccinations], async () => {
    await db.settings.put(DEFAULT_SETTINGS);
    await db.operators.bulkPut(OPERATORS);
    await db.farms.bulkPut(farms);
    await db.bands.bulkPut(bands);
    await db.entries.bulkPut(entries);
    await db.weighings.bulkPut(weighings);
    await db.exits.bulkPut(exits);
    await db.inputs.bulkPut(inputs);
    await db.lots.bulkPut(lots);
    const main = bands.find((b) => b.id === 'GA1-0042-B07')!;
    await db.vaccinations.bulkPut([
      { id: uid(), bandId: main.id, date: main.placedAt, vaccine: 'Marek / Newcastle (couvoir)', method: 'Injection', animals: main.chicks },
      { id: uid(), bandId: main.id, date: addDays(main.placedAt, 7), vaccine: 'Gumboro', method: 'Eau de boisson', animals: main.chicks },
      { id: uid(), bandId: main.id, date: addDays(main.placedAt, 14), vaccine: 'Newcastle (rappel)', method: 'Eau de boisson', animals: main.chicks },
    ]);
    await db.alerts.bulkPut([
      { id: uid(), farmId: 'GA4-0011', bandId: bands.find((b) => b.farmId === 'GA4-0011' && !b.closedAt)!.id, createdAt: addDays(now, -1) + 'T07:12:00Z', source: 'seuil', message: 'Mortalité du jour 2,10 % (seuil 0,5 %)', status: 'confirmee', history: [{ at: addDays(now, -1) + 'T07:12:00Z', status: 'nouvelle', by: 'Système' }, { at: addDays(now, -1) + 'T10:40:00Z', status: 'confirmee', by: 'Services vétérinaires', comment: 'Newcastle suspectée, prélèvements envoyés' }] },
      { id: uid(), farmId: 'GA6-0003', bandId: bands.find((b) => b.farmId === 'GA6-0003' && !b.closedAt)!.id, createdAt: now + 'T06:30:00Z', source: 'declaration', message: 'Diarrhée signalée, 40 animaux touchés', status: 'analyse', history: [{ at: now + 'T06:30:00Z', status: 'nouvelle', by: 'Éleveur' }, { at: now + 'T08:05:00Z', status: 'analyse', by: 'Services vétérinaires' }] },
    ]);
  });
}
