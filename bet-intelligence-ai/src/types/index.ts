/**
 * Types métier de BET INTELLIGENCE AI.
 * Ces interfaces servent de contrat entre l'interface et la couche de services :
 * un futur backend Python devra renvoyer des objets de même forme.
 */

/** Marchés pris en charge par le prototype. */
export type MarketId =
  | 'HOME_WIN'
  | 'DRAW'
  | 'AWAY_WIN'
  | 'DOUBLE_CHANCE_1X'
  | 'DOUBLE_CHANCE_X2'
  | 'OVER_1_5'
  | 'OVER_2_5'
  | 'UNDER_3_5'
  | 'BTTS_YES';

export type DataQuality = 'HIGH' | 'MEDIUM' | 'LOW';

export type FormResult = 'W' | 'D' | 'L';

export interface RecentMatch {
  opponent: string;
  venue: 'DOM' | 'EXT';
  /** null quand la source ne donne que le résultat (forme ESPN « VNDDV »). */
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: FormResult;
}

export interface TeamStats {
  /** Moyennes par match sur l'échantillon simulé. */
  goalsScoredAvg: number;
  goalsConcededAvg: number;
  /** null quand la source ne fournit pas la donnée (flux réel API-Football). */
  xgFor: number | null;
  xgAgainst: number | null;
  shotsPerMatch: number | null;
  shotsOnTargetPerMatch: number | null;
  possessionPct: number | null;
  cleanSheetPct: number | null;
  /** Bilan à domicile (équipe recevante) ou à l'extérieur (équipe visiteuse). */
  venueRecord: { played: number; won: number; drawn: number; lost: number };
  recent: RecentMatch[];
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
}

export interface Competition {
  id: string;
  name: string;
}

export interface MarketOffer {
  market: MarketId;
  /** Cote décimale de démonstration. */
  odds: number;
  /** Probabilité estimée par le modèle (0–1). */
  probability: number;
  /** Bookmaker d'origine de la cote (données réelles uniquement). */
  bookmaker?: string;
}

/** Origine des données : jeu synthétique local ou flux réel via le backend. */
export type DataSource = 'demo' | 'live';

export interface Match {
  id: string;
  competitionId: string;
  kickoff: string; // ISO 8601
  home: Team;
  away: Team;
  homeStats: TeamStats;
  awayStats: TeamStats;
  dataQuality: DataQuality;
  /** Nombre de matchs disponibles dans l'échantillon simulé. */
  sampleSize: number;
  markets: MarketOffer[];
  /** Buts attendus estimés par le modèle pour cette rencontre. */
  expectedGoals: { home: number; away: number };
  source: DataSource;
  /** Résultat simulé, renseigné uniquement pour les matchs « joués » de la démo. */
  simulatedScore?: { home: number; away: number };
}

/** Une sélection = un marché d'un match, enrichi pour l'affichage et le filtrage. */
export interface Selection {
  id: string; // `${matchId}:${market}`
  matchId: string;
  market: MarketId;
  odds: number;
  probability: number;
  impliedProbability: number;
  /** Écart probabilité estimée − probabilité implicite. */
  edge: number;
  dataQuality: DataQuality;
  homeName: string;
  awayName: string;
  competitionName: string;
  kickoff: string;
  reason: string;
  bookmaker?: string;
  source: DataSource;
}

export interface Settings {
  prudentMode: boolean;
  minProbability: number; // 0–1
  minOdds: number;
  maxOdds: number;
  minSelections: number;
  maxSelections: number;
  /** Cote totale indicative souhaitée (null = pas de cible). */
  targetTotalOdds: number | null;
  allowedMarkets: MarketId[];
  showWarnings: boolean;
  compactTables: boolean;
  reduceMotion: boolean;
}

/** WON_SIM / LOST_SIM : règlement simulé (démo). WON / LOST : règlement sur le score réel. */
export type TicketStatus = 'PENDING' | 'WON_SIM' | 'LOST_SIM' | 'WON' | 'LOST' | 'CANCELLED';

export interface TicketLeg {
  selectionId: string;
  matchId: string;
  market: MarketId;
  odds: number;
  probability: number;
  homeName: string;
  awayName: string;
  competitionName: string;
  kickoff: string;
  reason: string;
  bookmaker?: string;
  /** Score final réel (90 min), renseigné au règlement d'un ticket réel. */
  finalScore?: { home: number; away: number };
  /** Issue simulée de la jambe (renseignée lors du règlement simulé). */
  outcome?: 'WON' | 'LOST';
}

export interface Ticket {
  id: string;
  createdAt: string;
  legs: TicketLeg[];
  totalOdds: number;
  probability: number;
  status: TicketStatus;
  /** Mise virtuelle (FCFA fictifs) utilisée pour le ROI simulé. */
  virtualStake: number;
  risks: string[];
  settledAt?: string;
  /** Absent sur les tickets créés avant l'arrivée des données réelles : traité comme 'demo'. */
  source?: DataSource;
}

export type GenerationResult =
  | { ok: true; ticket: Ticket; reasons: string[]; risks: string[]; excluded: ExclusionStats }
  | { ok: false; message: string; excluded: ExclusionStats };

export interface ExclusionStats {
  total: number;
  marketNotAllowed: number;
  lowProbability: number;
  oddsOutOfRange: number;
  insufficientData: number;
  eligible: number;
}
