// Modèle de données Origa — aligné sur le cahier des charges POUFA (CGI, novembre 2026).

export type ProvinceCode = 'GA1' | 'GA2' | 'GA3' | 'GA4' | 'GA5' | 'GA6' | 'GA7' | 'GA8' | 'GA9';
export type FarmStatus = 'preparation' | 'operationnelle' | 'suspendue';
export type Role = 'eleveur' | 'agent' | 'dge' | 'veterinaire' | 'bceg' | 'admin' | 'operateur' | 'maedr' | 'aninf';

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
  bcegConsentRevokedAt?: string;
  /** Domiciliation des revenus (visible de la BCEG seule). */
  incomeAccount?: string;
  infrastructures?: string[];
  statusHistory?: { at: string; status: FarmStatus; by: string }[];
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
  receivedWeightKg?: number;
  receptionNote?: string;
  /** Contrôle par le distributeur (§ 6.2). */
  distributorCheckedAt?: string;
  distributorId?: string;
  /** Transformation : lots dérivés d'un lot parent. */
  derivedProduct?: string;
  documentIssuedAt?: string;
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
  /** Listes paramétrables (§ 7.3). */
  localities: string[];
  infrastructures: string[];
  inputCatalog: { type: string; product: string; unit: string }[];
  exitReasons: ListItem[];
  chargePosts: string[];
  treatmentProducts: { product: string; withdrawalDays: number }[];
  operatorTypes: ListItem[];
  farmStatuses: ListItem[];
  biosecurityGrid: string[];
  rankingWeights: { mortalite: number; ic: number; gmq: number; regularite: number };
  /** Rapports automatiques ; `recipients` : adresses qui reçoivent les envois par e-mail. */
  reports: { hebdomadaire: boolean; finBande: boolean; mensuel: boolean; recipients?: string[] };
  /** Matrice des droits par profil et par domaine (§ 5.4, paramétrable). */
  rights: Record<string, Partial<Record<RightDomain, RightAction[]>>>;
}

export interface ListItem { k: string; label: string }

export type RightAction = 'consulter' | 'creer' | 'modifier' | 'valider' | 'administrer';
export type RightDomain = 'fermes' | 'elevage' | 'intrants' | 'sanitaire' | 'economie' | 'tracabilite' | 'pilotage' | 'administration';

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

/** Compte utilisateur, créé par l'administrateur (§ 3 : « gère les comptes, les droits et les paramètres »). */
export interface UserAccount {
  id: string;
  phone: string; // E.164, ex. +24107123456
  name: string;
  role: Role | 'operateur';
  farmId?: string;
  farmIds?: string[];
  operatorId?: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type RequestedProfile = 'eleveur' | 'agent' | 'operateur' | 'veterinaire' | 'bceg' | 'autre';
export type RequestStatus = 'en_attente' | 'approuvee' | 'refusee';

/** Demande d'accès : pas d'inscription libre, chaque compte est validé par l'administrateur. */
export interface AccessRequest {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  profile: RequestedProfile;
  organisation: string; // ferme, abattoir, service, agence…
  province?: ProvinceCode;
  reference?: string; // réf. AMI (éleveur) ou n° de convention (opérateur)
  message?: string;
  consent: boolean; // loi n° 025/2023
  status: RequestStatus;
  decidedAt?: string;
  decidedBy?: string;
  decisionNote?: string;
  userId?: string;
}

/** Diagnostics et interventions vétérinaires (§ 5.2). */
export interface Diagnostic { id: string; farmId: string; bandId?: string; date: string; diagnostic: string; intervention: string; recommendations?: string; photo?: string; by: string }
/** Contrôle de biosécurité : grille, score, mesures correctives suivies jusqu'à clôture. */
export interface BiosecurityCheck { id: string; farmId: string; date: string; results: Record<string, boolean>; scorePct: number; actions: { text: string; due: string; done: boolean }[]; by: string }
/** Visite technique d'un agent (§ 5.4). */
export interface Visit { id: string; farmId: string; date: string; agent: string; findings: string; recommendations?: string; observedFeedStockKg?: number; lat?: number; lng?: number }
/** Charge d'exploitation par poste (§ 5.3). */
export interface Charge { id: string; farmId: string; bandId?: string; date: string; post: string; amountXaf: number; note?: string }
/** Commande d'intrants pour la bande suivante : demande → validation DGE → livraison. */
export interface InputOrder { id: string; farmId: string; date: string; type: string; product: string; quantity: number; unit: string; wishedDate: string; status: 'demandee' | 'validee' | 'refusee' | 'livree'; note?: string; decidedBy?: string }
/** Rendez-vous d'abattage (calendrier par abattoir). */
export interface SlaughterBooking { id: string; farmId: string; bandId: string; operatorId: string; date: string; count: number; status: 'demande' | 'confirme' | 'realise' | 'annule'; note?: string }
/** Diffusion de données agrégées, soumise à la validation du MAEDR. */
export interface Publication { id: string; period: string; createdAt: string; createdBy: string; data: Record<string, number>; status: 'brouillon' | 'soumise' | 'validee' | 'refusee'; decidedBy?: string; decidedAt?: string; note?: string }
/** Relevé de prix (observatoire). */
export interface PriceRecord { id: string; date: string; product: string; unit: string; priceXaf: number; locality: string; source: string }
/** Assistance vétérinaire à distance. */
export interface Consultation { id: string; farmId: string; date: string; question: string; photo?: string; answer?: string; answeredBy?: string; status: 'ouverte' | 'repondue' }
/** Offre commerciale (mise en relation producteurs / acheteurs). */
export interface Offer { id: string; farmId: string; date: string; product: string; quantity: number; availableFrom: string; priceXaf?: number; contact: string; status: 'ouverte' | 'close' }
/** Mouvement (transport) d'un lot, saisi par scan. */
export interface Movement { id: string; lotId: string; date: string; from: string; to: string; by: string }

/** Étiquette QR pré-signée par le serveur pour un prochain lot : le QR est valide même sans réseau. */
export interface PresignedLabel { lotId: string; bandId: string; signature: string; issuedAt: string }
