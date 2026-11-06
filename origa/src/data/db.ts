import Dexie, { type Table } from 'dexie';
import type {
  Alert, AuditEntry, Band, DailyEntry, Exit, Farm, HealthReport, InputMovement, Lot, Operator, OutboxItem,
  Scan, Settings, Treatment, Vaccination, Weighing, UserAccount, AccessRequest,
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
  }
}

export const db = new OrigaDB();
