import { loadConfig } from './config.js';
import { createPool, migrate } from './db.js';

// Comptes de démonstration (numéros fictifs). En production, les comptes sont créés par l'administrateur.
const USERS = [
  ['+24100000001', 'Éleveur · Ferme Nkoltang', 'eleveur', 'GA1-0042', []],
  ['+24100000002', 'Agent technique · Estuaire', 'agent', null, ['GA1-0042', 'GA1-0003', 'GA1-0017']],
  ['+24100000003', 'DGE · Programme POUFA', 'dge', null, []],
  ['+24100000004', 'Services vétérinaires', 'veterinaire', null, []],
  ['+24100000005', 'BCEG · Suivi des financements', 'bceg', null, []],
  ['+24100000007', 'Abattoir de Ntoum', 'operateur', null, []],
  ['+24100000009', 'Administrateur', 'admin', null, []],
  ['+24100000010', 'MAEDR · Cabinet du ministre', 'maedr', null, []],
  ['+24100000011', 'ANINF · Audit', 'aninf', null, []],
] as const;

const db = createPool(loadConfig().databaseUrl);
await migrate(db);
for (const [phone, name, role, farm, farms] of USERS) {
  await db.query(
    `INSERT INTO users (phone, name, role, farm_id, farm_ids, operator_id) VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (phone) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role, farm_id=EXCLUDED.farm_id, farm_ids=EXCLUDED.farm_ids, operator_id=EXCLUDED.operator_id`,
    [phone, name, role, farm, farms, role === 'operateur' ? 'OP-001' : null],
  );
}

// Données de démonstration minimales pour essayer l'application de bout en bout (fictives).
const now = new Date();
const day = (n: number) => new Date(now.getTime() + n * 86_400_000).toISOString().slice(0, 10);
const placedAt = day(-23);
const records: [string, Record<string, unknown>][] = [
  ['settings', { id: 'global', bandReferenceDays: 45, weighingEveryDays: 7, weighingSample: 50, alertDailyMortalityPct: 0.5, inputGapPct: 10, receptionGapPct: 2,
    formulas: { mortalite: 'morts_cumules / mis_en_place * 100', viabilite: '100 - mortalite', gmq: '(poids_moyen_g - poids_initial_g) / age_jours',
      ic: 'aliment_kg / (poids_vif_sorti_kg + poids_vif_present_kg - poids_poussins_kg)', epef: 'viabilite * (poids_moyen_g / 1000) * 100 / (age_jours * ic)', occupation: 'mis_en_place / capacite * 100' },
    vaccinationCalendar: [{ day: 1, vaccine: 'Marek / Newcastle (couvoir)' }, { day: 7, vaccine: 'Gumboro' }, { day: 14, vaccine: 'Newcastle (rappel)' }, { day: 24, vaccine: 'Gumboro (rappel)' }],
    clinicalSigns: ['Mortalité soudaine', 'Diarrhée', 'Toux, râles', 'Abattement', "Baisse d'appétit", 'Boiteries', 'Crête violacée', 'Autre'] }],
  ['operators', { id: 'OP-001', name: 'Abattoir de Ntoum', type: 'abattoir', locality: 'Ntoum', convention: true }],
  ['operators', { id: 'OP-002', name: 'Grossiste Mont-Bouët', type: 'acheteur', locality: 'Libreville', convention: true }],
  ['farms', { id: 'GA1-0042', name: 'Ferme Nkoltang', owner: 'M. Ndong', phone: '+24100000001', province: 'GA1', locality: 'Nkoltang', lat: 0.405, lng: 9.62, capacity: 6000, buildings: 2, status: 'operationnelle', cohort: 1, bcegFinanced: true, bcegConsentAt: '2026-09-01', createdAt: '2026-08-20' }],
  ['farms', { id: 'GA1-0003', name: 'Ferme Owendo Plaine', owner: 'Mme Nzé', phone: '+24100000011', province: 'GA1', locality: 'Owendo', lat: 0.29, lng: 9.5, capacity: 3000, buildings: 1, status: 'operationnelle', cohort: 1, bcegFinanced: false, createdAt: '2026-08-20' }],
  ['bands', { id: 'GA1-0042-B07', farmId: 'GA1-0042', rank: 7, placedAt, chicks: 5000, initialWeightG: 42, strain: 'Cobb 500' }],
  ['inputs', { id: 'in-1', farmId: 'GA1-0042', bandId: 'GA1-0042-B07', date: placedAt, type: 'aliment', product: 'Aliment démarrage / croissance', quantity: 18000, unit: 'kg', kind: 'reception', supplier: 'SMAG', supplierLot: 'AL-DEMO', subsidized: true, confirmed: true }],
  ['vaccinations', { id: 'vac-1', bandId: 'GA1-0042-B07', date: placedAt, vaccine: 'Marek / Newcastle (couvoir)', method: 'Injection', animals: 5000 }],
  ['vaccinations', { id: 'vac-2', bandId: 'GA1-0042-B07', date: day(-16), vaccine: 'Gumboro', method: 'Eau de boisson', animals: 5000 }],
  ['vaccinations', { id: 'vac-3', bandId: 'GA1-0042-B07', date: day(-9), vaccine: 'Newcastle (rappel)', method: 'Eau de boisson', animals: 5000 }],
];
for (let d = 1; d < 23; d++) records.push(['entries', { id: `demo-e${d}`, bandId: 'GA1-0042-B07', date: day(-23 + d), deaths: d < 4 ? 20 : 4, feedKg: Math.round(60 + d * 21), createdAt: day(-23 + d) }]);
for (const d of [7, 14, 21]) records.push(['weighings', { id: `demo-w${d}`, bandId: 'GA1-0042-B07', date: day(-23 + d), sampleSize: 50, avgWeightG: Math.round(42 + 2.2 * d * d * (1 - d / 140)) }]);
for (const [tbl, payload] of records) {
  const farm = tbl === 'farms' ? payload.id : (payload.farmId ?? (typeof payload.bandId === 'string' ? payload.bandId.split('-B')[0] : null));
  await db.query(`INSERT INTO records (tbl, key, farm_id, payload, client_at) VALUES ($1,$2,$3,$4, now()) ON CONFLICT (tbl, key) DO NOTHING`, [tbl, payload.id, farm, payload]);
}
await db.end();
console.log(`${USERS.length} comptes et ${records.length} enregistrements de démonstration prêts.`);
