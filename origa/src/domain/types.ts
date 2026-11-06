// Modèle de données Origa — aligné sur le cahier des charges POUFA (CGI, novembre 2026).

export type ProvinceCode = 'GA1' | 'GA2' | 'GA3' | 'GA4' | 'GA5' | 'GA6' | 'GA7' | 'GA8' | 'GA9';
export type FarmStatus = 'preparation' | 'operationnelle' | 'suspendue';
export type Role = 'eleveur' | 'agent' | 'dge' | 'veterinaire' | 'bceg' | 'admin';

export interface Farm {
  id: string; // ex. GA1-0042 (code province ISO 3166-2:GA + n° d'ordre)
  name: string;
  owner: string;
  phone: string;
  province: ProvinceCode;
  locality: string;
  amiRef?: string;
  lat?: number;
  lng?: number;
  capacity: number; // places
  buildings: number;
  status: FarmStatus;
  cohort: 1 | 2;
  bcegFinanced: boolean;
  bcegConsentAt?: string;
  createdAt: string;
}

export interface Band {
  id: string; // ex. GA1-0042-B07
  farmId: string;
  rank: number;
  placedAt: string; // AAAA-MM-JJ
  chicks: number;
  initialWeightG: number;
  strain: string;
  closedAt?: string;
}

export interface DailyEntry {
  id: string;
  bandId: string;
  date: string;
  deaths: number;
  feedKg: number;
  waterL?: number;
  createdAt: string;
}

export interface Weighing {
  id: string;
  bandId: string;
  date: string;
  sampleSize: number;
  avgWeightG: number;
}

export type ExitReason = 'vente' | 'abattoir' | 'vente_directe' | 'autre';

export interface Exit {
  id: string;
  bandId: string;
  date: string;
  count: number;
  weightKg: number;
  reason: ExitReason;
  operatorId?: string;
  destination?: string;
  unitPriceXaf?: number;
  lotId?: string;
}

export type InputType = 'poussins' | 'aliment' | 'vaccin' | 'medicament' | 'autre';

export interface InputMovement {
  id: string;
  farmId: string;
  bandId?: string;
  date: string;
  type: InputType;
  product: string;
  quantity: number;
  unit: string;
  kind: 'reception' | 'utilisation';
  supplier?: string;
  supplierLot?: string;
  subsidized?: boolean;
  confirmed?: boolean;
}

export interface Treatment {
  id: string;
  bandId: string;
  product: string;
  reason: string;
  startDate: string;
  endDate: string;
  withdrawalDays: number; // délai d'attente avant abattage
  animals: number;
}

export interface Vaccination {
  id: string;
  bandId: string;
  date: string;
  vaccine: string;
  method: string;
  animals: number;
}

export interface HealthReport {
  id: string;
  bandId: string;
  farmId: string;
  date: string;
  signs: string[];
  affected: number;
  photo?: string; // data URL compressée
  note?: string;
}

export type AlertStatus = 'nouvelle' | 'analyse' | 'confirmee' | 'informee' | 'close';

export interface Alert {
  id: string;
  farmId: string;
  bandId: string;
  createdAt: string;
  source: 'seuil' | 'tendance' | 'declaration';
  message: string;
  status: AlertStatus;
  history: { at: string; status: AlertStatus; by: string; comment?: string }[];
}

export interface Operator {
  id: string;
  name: string;
  type: 'abattoir' | 'acheteur' | 'distributeur';
  locality: string;
  contact?: string;
  convention: boolean;
}

export interface Lot {
  id: string; // ex. GA1-0042-B07-L03
  bandId: string;
  farmId: string;
  parentId?: string;
  count: number;
  weightKg: number;
  operatorId?: string;
  destination?: string;
  cededAt: string;
  signature: string; // Ed25519, base64url
  confirmCode: string;
  receivedAt?: string;
  receivedCount?: number;
}

export interface Scan {
  id: string;
  lotId: string;
  at: string;
  valid: boolean;
  approxLocation?: string;
}

/** Paramètres modifiables sans développement (§ 7.3 du cahier des charges). */
export interface Settings {
  id: 'global';
  bandReferenceDays: number;
  weighingEveryDays: number;
  weighingSample: number;
  alertDailyMortalityPct: number; // réglé par les services vétérinaires
  inputGapPct: number;
  receptionGapPct: number;
  formulas: Record<FormulaKey, string>;
  vaccinationCalendar: { day: number; vaccine: string }[];
  clinicalSigns: string[];
}

export type FormulaKey = 'mortalite' | 'viabilite' | 'gmq' | 'ic' | 'epef' | 'occupation';

export interface OutboxItem {
  id?: number;
  table: string;
  op: 'put' | 'delete';
  key: string;
  payload: unknown;
  at: string;
}

export interface AuditEntry {
  id?: number;
  at: string;
  user: string;
  action: string;
  table: string;
  key: string;
  prevHash: string;
  hash: string;
}
