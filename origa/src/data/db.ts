import Dexie, { type Table } from 'dexie';
import type {
  Alert, AuditEntry, Band, DailyEntry, Exit, Farm, HealthReport, InputMovement, Lot, Operator, OutboxItem,
  Scan, Settings, Treatment, Vaccination, Weighing, UserAccount, AccessRequest,
  PresignedLabel, Diagnostic, BiosecurityCheck, Visit, Charge, InputOrder, SlaughterBooking, Publication, PriceRecord, Consultation, Offer, Movement,
} from '../domain/types';

/** Base locale du téléphone (IndexedDB) : toutes les saisies fonctionnent sans réseau (§ 7.2). */
export class OrigaDB extends Dexie {
  farms!: Table<Farm, string>;
  bands!: Table<Band, string>;
  entries!: Table<DailyEntry, string>;
  weighings!: Table<Weighing, string>;
  exits!: Table<Exit, string>;
  inputs!: Table<InputMovement, string>;
  treatments!: Table<Treatment, string>;
  vaccinations!: Table<Vaccination, string>;
  reports!: Table<HealthReport, string>;
  alerts!: Table<Alert, string>;
  operators!: Table<Operator, string>;
  lots!: Table<Lot, string>;
  scans!: Table<Scan, string>;
  settings!: Table<Settings, string>;
  outbox!: Table<OutboxItem, number>;
  audit!: Table<AuditEntry, number>;
  users!: Table<UserAccount, string>;
  requests!: Table<AccessRequest, string>;
  diagnostics!: Table<Diagnostic, string>;
  biosecurity!: Table<BiosecurityCheck, string>;
  visits!: Table<Visit, string>;
  charges!: Table<Charge, string>;
  orders!: Table<InputOrder, string>;
  slaughter!: Table<SlaughterBooking, string>;
  publications!: Table<Publication, string>;
  prices!: Table<PriceRecord, string>;
  consultations!: Table<Consultation, string>;
  offers!: Table<Offer, string>;
  movements!: Table<Movement, string>;
  presigned!: Table<PresignedLabel, string>;

  constructor(name = 'origa') {
    super(name);
    this.version(1).stores({
      farms: 'id, province, status, cohort',
      bands: 'id, farmId, placedAt',
      entries: 'id, bandId, date, [bandId+date]',
      weighings: 'id, bandId, date',
      exits: 'id, bandId, date, lotId',
      inputs: 'id, farmId, bandId, date, type',
      treatments: 'id, bandId',
      vaccinations: 'id, bandId',
      reports: 'id, bandId, farmId, date',
      alerts: 'id, farmId, status, createdAt',
      operators: 'id, type',
      lots: 'id, bandId, farmId, cededAt',
      scans: 'id, lotId, at',
      settings: 'id',
      outbox: '++id, table, at',
      audit: '++id, at, table',
    });
    // v2 : comptes et demandes d'accès (mode démonstration ; en production ils vivent sur le serveur).
    this.version(2).stores({ users: 'id, &phone, role, active', requests: 'id, status, createdAt' });
    // v3 : registres complémentaires du cahier des charges (sanitaire, économique, commandes, diffusion, services).
    this.version(3).stores({
      diagnostics: 'id, farmId, date', biosecurity: 'id, farmId, date', visits: 'id, farmId, date', charges: 'id, farmId, bandId, date',
      orders: 'id, farmId, status, date', slaughter: 'id, farmId, operatorId, date', publications: 'id, status, createdAt',
      prices: 'id, product, date', consultations: 'id, farmId, status, date', offers: 'id, farmId, status, date', movements: 'id, lotId, date',
    });
    // v4 : réserve d'étiquettes QR pré-signées (propre à l'appareil, jamais synchronisée).
    this.version(4).stores({ presigned: 'lotId, bandId' });
  }
}

export const db = new OrigaDB();
