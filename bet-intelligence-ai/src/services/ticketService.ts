/**
 * Génération, persistance et règlement SIMULÉ des tickets virtuels.
 * Aucun ticket n'a de valeur financière ; aucun pari n'est placé.
 */
import type {
  ExclusionStats,
  GenerationResult,
  Match,
  Selection,
  Settings,
  Ticket,
  TicketLeg,
  TicketStatus,
} from '../types';
import { marketLabel } from '../utils/markets';
import { combinedOdds, combinedProbability, round } from '../utils/math';
import { formatOdds, formatPct } from '../utils/format';
import { hashString, mulberry32 } from '../utils/random';
import { checkEligibility, effectiveCriteria } from './matchService';
import { readJson, STORAGE_KEYS, writeJson } from './storage';

/** Mise virtuelle fixe utilisée pour le ROI simulé (FCFA fictifs). */
export const VIRTUAL_STAKE = 1000;

export const NO_COMBINATION_MESSAGE =
  'Aucune combinaison ne satisfait actuellement les critères définis. Modifiez vos paramètres ou réessayez ultérieurement.';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  PENDING: 'En attente',
  WON_SIM: 'Gagnant simulé',
  LOST_SIM: 'Perdant simulé',
  CANCELLED: 'Annulé',
};

export function legSignature(legs: Pick<TicketLeg, 'selectionId'>[]): string {
  return legs
    .map((l) => l.selectionId)
    .sort()
    .join('|');
}

export function computeExclusions(
  matches: Match[],
  selections: Selection[],
  settings: Settings,
  now = new Date(),
): { stats: ExclusionStats; eligible: Selection[] } {
  const samples = new Map(matches.map((m) => [m.id, m.sampleSize]));
  const stats: ExclusionStats = {
    total: selections.length,
    marketNotAllowed: 0,
    lowProbability: 0,
    oddsOutOfRange: 0,
    insufficientData: 0,
    eligible: 0,
  };
  const eligible: Selection[] = [];
  for (const s of selections) {
    const c = checkEligibility(s, settings, samples, now);
    // Une sélection n'est comptée que pour le premier motif d'exclusion rencontré.
    if (c.marketNotAllowed) stats.marketNotAllowed++;
    else if (c.insufficientData) stats.insufficientData++;
    else if (c.oddsOutOfRange) stats.oddsOutOfRange++;
    else if (c.lowProbability) stats.lowProbability++;
    else {
      stats.eligible++;
      eligible.push(s);
    }
  }
  eligible.sort((a, b) => b.probability - a.probability || b.edge - a.edge || a.id.localeCompare(b.id));
  return { stats, eligible };
}

/**
 * Compose une liste de jambes à partir de candidats déjà triés par qualité.
 * - une seule sélection par match (pas de doublon ni de corrélation intra-match) ;
 * - au moins `minSelections` ; on ajoute des jambes au-delà du minimum
 *   uniquement pour approcher la cote cible, sans dépasser `maxSelections`.
 * Retourne null si le minimum ne peut être atteint.
 */
export function composeLegs(candidates: Selection[], settings: Settings): Selection[] | null {
  const chosen: Selection[] = [];
  const usedMatches = new Set<string>();
  const target = settings.targetTotalOdds;
  for (const c of candidates) {
    if (usedMatches.has(c.matchId)) continue;
    const current = combinedOdds(chosen.map((s) => s.odds)) || 1;
    const needMin = chosen.length < settings.minSelections;
    const wantMore = target != null && current < target && chosen.length < settings.maxSelections;
    if (!needMin && !wantMore) break;
    chosen.push(c);
    usedMatches.add(c.matchId);
  }
  return chosen.length >= settings.minSelections ? chosen : null;
}

function toLeg(s: Selection): TicketLeg {
  return {
    selectionId: s.id,
    matchId: s.matchId,
    market: s.market,
    odds: s.odds,
    probability: s.probability,
    homeName: s.homeName,
    awayName: s.awayName,
    competitionName: s.competitionName,
    kickoff: s.kickoff,
    reason: s.reason,
  };
}

export function ticketRisks(legs: TicketLeg[], probability: number, settings: Settings, matches: Match[]): string[] {
  const risks: string[] = [
    'Probabilité calculée en supposant l’indépendance des événements : les dépendances entre rencontres ne sont pas prises en compte.',
  ];
  if (probability < 0.5) {
    risks.push(`La probabilité indicative du combiné (${formatPct(probability)}) est inférieure à 50 % : l’échec est plus probable que la réussite.`);
  }
  if (legs.length >= 4) risks.push('Au-delà de 3 sélections, chaque jambe supplémentaire réduit fortement la probabilité globale.');
  const medium = legs.filter((l) => matches.find((m) => m.id === l.matchId)?.dataQuality === 'MEDIUM');
  if (medium.length > 0) {
    risks.push(`${medium.length} sélection(s) reposent sur des données de qualité moyenne.`);
  }
  const weakest = [...legs].sort((a, b) => a.probability - b.probability)[0];
  if (weakest) {
    risks.push(`Maillon le plus fragile : ${weakest.homeName} – ${weakest.awayName}, ${marketLabel(weakest.market)} (${formatPct(weakest.probability)}).`);
  }
  if (settings.targetTotalOdds != null) {
    const total = combinedOdds(legs.map((l) => l.odds));
    if (total < settings.targetTotalOdds) {
      risks.push(
        `Cote cible de ${formatOdds(settings.targetTotalOdds)} non atteinte (${formatOdds(total)}) : les critères de qualité ont été privilégiés.`,
      );
    }
  }
  return risks;
}

function newTicketId(now: Date, existing: Ticket[]): string {
  const base = `TV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  let n = existing.filter((t) => t.id.startsWith(base)).length + 1;
  let id = `${base}-${String(n).padStart(3, '0')}`;
  while (existing.some((t) => t.id === id)) id = `${base}-${String(++n).padStart(3, '0')}`;
  return id;
}

/**
 * Génère un ticket virtuel. Ne force jamais la création : si les critères
 * ne sont pas satisfaits, renvoie un résultat `ok: false`.
 */
export function generateTicket(
  matches: Match[],
  selections: Selection[],
  settings: Settings,
  existing: Ticket[],
  now = new Date(),
): GenerationResult {
  if (settings.minSelections > settings.maxSelections || settings.minOdds > settings.maxOdds) {
    return { ok: false, message: 'Paramètres incohérents : vérifiez les bornes minimum et maximum.', excluded: emptyStats(selections.length) };
  }
  const { stats, eligible } = computeExclusions(matches, selections, settings, now);
  const composeSettings = { ...settings, maxSelections: effectiveCriteria(settings).maxSelections };
  if (composeSettings.maxSelections < settings.minSelections) {
    return { ok: false, message: NO_COMBINATION_MESSAGE, excluded: stats };
  }
  const existingSignatures = new Set(existing.filter((t) => t.status === 'PENDING').map((t) => legSignature(t.legs)));

  // Évite de reproduire un ticket en attente identique : on retire la jambe
  // la moins bien classée et l'on recompose, jusqu'à épuisement des candidats.
  let pool = [...eligible];
  let legs: Selection[] | null = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    const composed = composeLegs(pool, composeSettings);
    if (!composed) break;
    if (!existingSignatures.has(legSignature(composed.map((s) => ({ selectionId: s.id }))))) {
      legs = composed;
      break;
    }
    const last = composed[composed.length - 1];
    pool = pool.filter((s) => s.id !== last.id);
  }

  if (!legs) return { ok: false, message: NO_COMBINATION_MESSAGE, excluded: stats };

  const ticketLegs = legs.map(toLeg);
  const totalOdds = round(combinedOdds(ticketLegs.map((l) => l.odds)));
  const probability = round(combinedProbability(ticketLegs.map((l) => l.probability)), 4);
  const risks = ticketRisks(ticketLegs, probability, settings, matches);
  const ticket: Ticket = {
    id: newTicketId(now, existing),
    createdAt: now.toISOString(),
    legs: ticketLegs,
    totalOdds,
    probability,
    status: 'PENDING',
    virtualStake: VIRTUAL_STAKE,
    risks,
  };
  const reasons = ticketLegs.map(
    (l) => `${l.homeName} – ${l.awayName} · ${marketLabel(l.market)} à ${formatOdds(l.odds)} (${formatPct(l.probability)}) : ${l.reason}`,
  );
  return { ok: true, ticket, reasons, risks, excluded: stats };
}

function emptyStats(total: number): ExclusionStats {
  return { total, marketNotAllowed: 0, lowProbability: 0, oddsOutOfRange: 0, insufficientData: 0, eligible: 0 };
}

/**
 * Règlement SIMULÉ : chaque jambe est tirée au sort selon sa probabilité synthétique,
 * avec une graine dérivée de l'identifiant du ticket (résultat reproductible).
 * Ce n'est en aucun cas un résultat sportif réel.
 */
export function simulateSettlement(ticket: Ticket, now = new Date()): Ticket {
  if (ticket.status !== 'PENDING') return ticket;
  const rand = mulberry32(hashString(`settle:${ticket.id}:${legSignature(ticket.legs)}`));
  const legs = ticket.legs.map((l) => ({ ...l, outcome: rand() < l.probability ? ('WON' as const) : ('LOST' as const) }));
  const won = legs.every((l) => l.outcome === 'WON');
  return { ...ticket, legs, status: won ? 'WON_SIM' : 'LOST_SIM', settledAt: now.toISOString() };
}

export function setTicketStatus(ticket: Ticket, status: TicketStatus, now = new Date()): Ticket {
  if (status === 'PENDING') {
    return { ...ticket, status, settledAt: undefined, legs: ticket.legs.map(({ outcome: _o, ...l }) => l) };
  }
  // Statut fixé manuellement : on ne connaît l'issue des jambes que si le ticket est gagnant.
  const legs =
    status === 'WON_SIM'
      ? ticket.legs.map((l) => ({ ...l, outcome: 'WON' as const }))
      : ticket.legs.map(({ outcome: _o, ...l }) => l);
  return { ...ticket, status, legs, settledAt: now.toISOString() };
}

// ——— Persistance locale ———

function isTicket(x: unknown): x is Ticket {
  const t = x as Ticket;
  return !!t && typeof t.id === 'string' && Array.isArray(t.legs) && typeof t.totalOdds === 'number';
}

export function loadTickets(): Ticket[] {
  const raw = readJson<unknown>(STORAGE_KEYS.tickets, []);
  return Array.isArray(raw) ? raw.filter(isTicket) : [];
}

export function saveTickets(tickets: Ticket[]): boolean {
  return writeJson(STORAGE_KEYS.tickets, tickets);
}
