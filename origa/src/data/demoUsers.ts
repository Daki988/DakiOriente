import { db } from './db';
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
  { id: 'u-admin', phone: '+24100000009', name: 'Administrateur Origa', role: 'admin', active: true, createdAt: '2026-08-20' },
];

const DEMO_REQUESTS: AccessRequest[] = [
  { id: 'r-1', createdAt: '2026-11-05T09:12:00Z', name: 'Mme Boussougou', phone: '+24106112233', profile: 'eleveur', organisation: 'Ferme Boussougou, Kango', province: 'GA1', reference: 'AMI-2026-131', message: 'Ferme retenue dans la cohorte 2.', consent: true, status: 'en_attente' },
  { id: 'r-2', createdAt: '2026-11-04T15:40:00Z', name: 'Abattoir de Lambaréné', phone: '+24107445566', profile: 'operateur', organisation: 'Abattoir municipal de Lambaréné', province: 'GA3', reference: 'CONV-2026-014', consent: true, status: 'en_attente' },
];

/** Comptes et demandes de démonstration, ajoutés sans écraser ce que l'administrateur a modifié. */
export async function ensureDemoAccounts() {
  if ((await db.users.count()) === 0) await db.users.bulkPut(DEMO_USERS);
  if ((await db.requests.count()) === 0) await db.requests.bulkPut(DEMO_REQUESTS);
}
