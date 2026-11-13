import { db } from './db';
import { addDays, today, uid } from '../domain/ids';
import type { AccessRequest, UserAccount } from '../domain/types';

/** Code de connexion du mode démonstration (aucun SMS n'est envoyé hors serveur). */
export const DEMO_CODE = '241241';

export const DEMO_USERS: UserAccount[] = [
  { id: 'u-eleveur', phone: '+24100000001', name: 'M. Ndong · Ferme Nkoltang', role: 'eleveur', farmId: 'GA1-0042', active: true, createdAt: '2026-08-20' },
  { id: 'u-agent', phone: '+24100000002', name: 'Agent technique · Estuaire', role: 'agent', farmIds: ['GA1-0042', 'GA1-0003', 'GA1-0017'], farmId: 'GA1-0042', active: true, createdAt: '2026-08-20' },
  { id: 'u-dge', phone: '+24100000003', name: 'DGE · Programme POUFA', role: 'dge', active: true, createdAt: '2026-08-20' },
  { id: 'u-vet', phone: '+24100000004', name: 'Services vétérinaires', role: 'veterinaire', active: true, createdAt: '2026-08-20' },
  { id: 'u-bceg', phone: '+24100000005', name: 'BCEG · Suivi des financements', role: 'bceg', active: true, createdAt: '2026-08-20' },
  { id: 'u-operateur', phone: '+24100000007', name: 'Abattoir de Ntoum', role: 'operateur', operatorId: 'OP-001', active: true, createdAt: '2026-08-20' },
  { id: 'u-distributeur', phone: '+24100000008', name: 'Distributeur Libreville Centre', role: 'operateur', operatorId: 'OP-003', active: true, createdAt: '2026-08-20' },
  { id: 'u-maedr', phone: '+24100000010', name: 'MAEDR · Cabinet du ministre', role: 'maedr', active: true, createdAt: '2026-08-20' },
  { id: 'u-aninf', phone: '+24100000011', name: 'ANINF · Audit', role: 'aninf', active: true, createdAt: '2026-08-20' },
  { id: 'u-admin', phone: '+24100000009', name: 'Administrateur Origa', role: 'admin', active: true, createdAt: '2026-08-20' },
];

const DEMO_REQUESTS: AccessRequest[] = [
  { id: 'r-1', createdAt: '2026-11-05T09:12:00Z', name: 'Mme Boussougou', phone: '+24106112233', profile: 'eleveur', organisation: 'Ferme Boussougou, Kango', province: 'GA1', reference: 'AMI-2026-131', message: 'Ferme retenue dans la cohorte 2.', consent: true, status: 'en_attente' },
  { id: 'r-2', createdAt: '2026-11-04T15:40:00Z', name: 'Abattoir de Lambaréné', phone: '+24107445566', profile: 'operateur', organisation: 'Abattoir municipal de Lambaréné', province: 'GA3', reference: 'CONV-2026-014', consent: true, status: 'en_attente' },
];

/** Comptes et demandes de démonstration, ajoutés sans écraser ce que l'administrateur a modifié. */
export async function ensureDemoAccounts() {
  if ((await db.users.count()) === 0) await db.users.bulkPut(DEMO_USERS);
  // Comptes ajoutés depuis (distributeur) : complétés sans toucher aux autres.
  for (const u of DEMO_USERS) if (!(await db.users.get(u.id))) await db.users.put(u);
  if ((await db.requests.count()) === 0) await db.requests.bulkPut(DEMO_REQUESTS);
}

/** Données de démonstration des registres complémentaires (une seule fois, sans écraser). */
export async function ensureDemoExtras() {
  if ((await db.charges.count()) > 0 || (await db.farms.count()) === 0) return;
  const t = today();
  const band = (await db.bands.where('farmId').equals('GA1-0042').toArray()).find((b) => !b.closedAt);
  const prev = (await db.bands.where('farmId').equals('GA1-0042').toArray()).find((b) => b.closedAt);
  await db.transaction('rw', [db.charges, db.prices, db.orders, db.slaughter, db.biosecurity, db.visits, db.consultations, db.offers, db.publications, db.treatments], async () => {
    if (prev) await db.charges.bulkPut([
      { id: uid(), farmId: 'GA1-0042', bandId: prev.id, date: prev.placedAt, post: 'Poussins', amountXaf: 2_700_000 },
      { id: uid(), farmId: 'GA1-0042', bandId: prev.id, date: addDays(prev.placedAt, 20), post: 'Aliment', amountXaf: 9_800_000 },
      { id: uid(), farmId: 'GA1-0042', bandId: prev.id, date: addDays(prev.placedAt, 40), post: 'Main-d’œuvre', amountXaf: 900_000 },
    ]);
    if (band) await db.charges.bulkPut([{ id: uid(), farmId: 'GA1-0042', bandId: band.id, date: band.placedAt, post: 'Poussins', amountXaf: 2_500_000 }]);
    await db.prices.bulkPut([
      { id: uid(), date: addDays(t, -2), product: 'Poulet vif', unit: 'kg', priceXaf: 1900, locality: 'Libreville', source: 'Agent technique · Estuaire' },
      { id: uid(), date: addDays(t, -5), product: 'Poulet vif', unit: 'kg', priceXaf: 2100, locality: 'Oyem', source: 'DGE' },
      { id: uid(), date: addDays(t, -3), product: 'Aliment croissance', unit: 'sac de 50 kg', priceXaf: 18500, locality: 'Libreville', source: 'DGE' },
      { id: uid(), date: addDays(t, -6), product: 'Poussin d’un jour', unit: 'tête', priceXaf: 650, locality: 'Ntoum', source: 'Agent technique · Estuaire' },
    ]);
    await db.orders.bulkPut([{ id: uid(), farmId: 'GA1-0042', date: addDays(t, -1), type: 'aliment', product: 'Aliment démarrage', quantity: 3000, unit: 'kg', wishedDate: addDays(t, 20), status: 'demandee' }]);
    if (band) await db.slaughter.bulkPut([{ id: uid(), farmId: 'GA1-0042', bandId: band.id, operatorId: 'OP-001', date: addDays(band.placedAt, 43), count: 2400, status: 'demande' }]);
    await db.biosecurity.bulkPut([{ id: uid(), farmId: 'GA1-0042', date: addDays(t, -9), results: { 'Pédiluve à l’entrée, désinfectant renouvelé': true, 'Accès limité et registre des visiteurs': false, 'Vide sanitaire respecté entre deux bandes': true, 'Litière sèche et renouvelée': true, 'Abreuvoirs et mangeoires propres': true, 'Cadavres éliminés le jour même': true, 'Pas d’autres volailles ni animaux en contact': true, 'Tenues et bottes dédiées': false }, scorePct: 75, actions: [{ text: 'Installer un registre des visiteurs à l’entrée', due: addDays(t, 5), done: false }, { text: 'Fournir bottes et tenues dédiées', due: addDays(t, 10), done: false }], by: 'Agent technique · Estuaire' }]);
    await db.visits.bulkPut([{ id: uid(), farmId: 'GA1-0042', date: addDays(t, -9), agent: 'Agent technique · Estuaire', findings: 'Bonne tenue du bâtiment, litière sèche. Registre des visiteurs absent.', recommendations: 'Mettre en place le registre et des bottes dédiées.', observedFeedStockKg: 11200, lat: 0.405, lng: 9.62 }]);
    await db.consultations.bulkPut([{ id: uid(), farmId: 'GA1-0042', date: addDays(t, -2), question: 'Quelques poulets boitent depuis deux jours, est-ce grave ?', answer: 'Vérifiez la litière (humidité) et l’apport en vitamines. Si cela s’étend, faites une déclaration sanitaire.', answeredBy: 'Services vétérinaires', status: 'repondue' }]);
    if (band) await db.offers.bulkPut([{ id: uid(), farmId: 'GA1-0042', date: addDays(t, -1), product: 'Poulets vifs', quantity: 2400, availableFrom: addDays(band.placedAt, 42), priceXaf: 4000, contact: '+241 07 10 00 00', status: 'ouverte' }]);
    await db.publications.bulkPut([{ id: uid(), period: 'octobre 2026', createdAt: addDays(t, -6) + 'T09:00:00Z', createdBy: 'DGE · Programme POUFA', data: { fermesActives: 12, volumeKg: 104000, pouletsVendus: 49500, prixMoyenTete: 3500, mortaliteMoyennePct: 4.6, lotsTraces: 26, lotsAvecQrPct: 100 }, status: 'validee', decidedBy: 'MAEDR · Cabinet du ministre', decidedAt: addDays(t, -5) }]);
  });
}

/**
 * Compléments de démonstration de la version 1.3 (une seule fois, sans écraser) : vaccinations faites à temps
 * sur toutes les bandes en cours sauf deux retards réalistes, charges par bande pour que les marges soient
 * crédibles, domiciliation bancaire des fermes financées par la BCEG.
 */
export async function ensureDemoV13() {
  if ((await db.farms.count()) === 0 || (await db.vaccinations.count()) > 10) return;
  const t = today();
  const [farms, bands, exits, vaccinations, charges] = await Promise.all([db.farms.toArray(), db.bands.toArray(), db.exits.toArray(), db.vaccinations.toArray(), db.charges.toArray()]);
  const calendar = (await db.settings.get('global'))?.vaccinationCalendar ?? [];
  const methods: Record<string, string> = { 'Marek / Newcastle (couvoir)': 'Injection au couvoir' };
  const late = new Set(['GA4-0011', 'GA9-0007']); // deux fermes en retard d'un rappel, pour la démonstration
  const vacc = bands.filter((b) => !b.closedAt).flatMap((b) => {
    const age = Math.round((Date.parse(t) - Date.parse(b.placedAt)) / 86_400_000);
    const due = calendar.filter((v) => v.day <= age && !vaccinations.some((x) => x.bandId === b.id && x.vaccine === v.vaccine));
    const kept = late.has(b.farmId) ? due.slice(0, -1) : due;
    return kept.map((v) => ({ id: uid(), bandId: b.id, date: addDays(b.placedAt, Math.max(0, v.day - 1)), vaccine: v.vaccine, method: methods[v.vaccine] ?? 'Eau de boisson', animals: b.chicks }));
  });
  // Charges : poussins à la mise en place, aliment et main-d'œuvre, en proportion des ventes de chaque bande.
  const extra = bands.filter((b) => !charges.some((c) => c.bandId === b.id)).flatMap((b) => {
    const sold = exits.filter((x) => x.bandId === b.id).reduce((a, x) => a + (x.unitPriceXaf ?? 0) * x.count, 0);
    const rows = [{ id: uid(), farmId: b.farmId, bandId: b.id, date: b.placedAt, post: 'Poussins', amountXaf: b.chicks * 520 }];
    if (b.closedAt) {
      rows.push({ id: uid(), farmId: b.farmId, bandId: b.id, date: addDays(b.placedAt, 20), post: 'Aliment', amountXaf: Math.round((sold * 0.58) / 1000) * 1000 });
      rows.push({ id: uid(), farmId: b.farmId, bandId: b.id, date: addDays(b.placedAt, 40), post: 'Main-d’œuvre', amountXaf: 850_000 });
    }
    return rows;
  });
  const banks = ['BGFIBank Gabon', 'UGB', 'Orabank Gabon', 'BICIG'];
  const financed = farms.filter((f) => f.bcegFinanced && !f.incomeAccount).map((f, i) => ({ ...f, incomeAccount: `${banks[i % banks.length]} · compte ${String(40210 + i * 37).padStart(6, '0')}` }));
  await db.transaction('rw', [db.vaccinations, db.charges, db.farms], async () => {
    await db.vaccinations.bulkPut(vacc);
    await db.charges.bulkPut(extra);
    await db.farms.bulkPut(financed);
  });
}
