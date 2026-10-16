/**
 * Connecteurs claude.ai de l'utilisateur (Google Calendar, Gmail, Google Drive),
 * appelés avec SES identifiants via la capacité `mcp` de l'Artifact.
 * Chaque appel est une action explicite (clic) ; aucune nouvelle tentative automatique
 * n'est faite pour une écriture.
 */
import type { Match, Ticket } from '../types';
import type { McpError, McpNamespace } from '../types/claude-runtime';
import { formatDateTime, formatOdds, formatPct } from '../utils/format';
import { marketLabel } from '../utils/markets';
import { STATUS_LABELS } from './ticketService';
import { runtime } from './runtime';

export const CONNECTORS = {
  calendar: { server: 'Google Calendar', tool: 'create_event', label: 'Google Calendar' },
  gmail: { server: 'Gmail', tool: 'create_draft', label: 'Gmail' },
  drive: { server: 'Google Drive', tool: 'create_file', label: 'Google Drive' },
} as const;

export type ConnectorKey = keyof typeof CONNECTORS;

let mcpPromise: Promise<McpNamespace | null> | null = null;

/** Namespace MCP, ou null hors ligne / non accordé (résolu une seule fois). */
export function getMcp(): Promise<McpNamespace | null> {
  const rt = runtime();
  if (!rt) return Promise.resolve(null);
  mcpPromise ??= rt.use('mcp').catch(() => null);
  return mcpPromise;
}

export type ConnectorStatus = 'connected' | 'needs_reauth' | 'unknown' | 'not_connected';

let statusPromise: Promise<Record<ConnectorKey, ConnectorStatus> | null> | null = null;

/** État des connecteurs (lecture seule, mémorisée pour la durée de la page). */
export function connectorStatuses(): Promise<Record<ConnectorKey, ConnectorStatus> | null> {
  statusPromise ??= readStatuses();
  return statusPromise;
}

async function readStatuses(): Promise<Record<ConnectorKey, ConnectorStatus> | null> {
  const mcp = await getMcp();
  if (!mcp) return null;
  try {
    const { servers } = await mcp.listTools();
    const out = {} as Record<ConnectorKey, ConnectorStatus>;
    for (const key of Object.keys(CONNECTORS) as ConnectorKey[]) {
      const s = servers.find((x) => x.server === CONNECTORS[key].server);
      if (!s || s.tools.length === 0) out[key] = s ? 'unknown' : 'not_connected';
      else out[key] = s.authStatus === 'connected' ? 'connected' : s.authStatus === 'needs_reauth' ? 'needs_reauth' : 'unknown';
    }
    return out;
  } catch {
    return null;
  }
}

/** Message français adapté à chaque code d'erreur (jamais un message générique unique). */
export function connectorErrorMessage(err: unknown, label: string): string {
  const e = err as Partial<McpError>;
  switch (e?.code) {
    case 'server_not_connected':
    case 'server_not_found':
      return `${label} n’est pas connecté à votre compte. Ajoutez-le dans claude.ai → Paramètres → Connecteurs, puis réessayez.`;
    case 'needs_reauth':
      return `La connexion à ${label} a expiré. Reconnectez-le dans claude.ai → Paramètres → Connecteurs.`;
    case 'selection_required':
      return `Plusieurs connecteurs ${label} existent sur votre compte : choisissez-en un dans la fenêtre proposée par claude.ai.`;
    case 'approval_required':
    case 'not_in_manifest':
      return `L’accès à ${label} n’a pas été autorisé pour cette page. Autorisez-le depuis le menu Autorisations de l’artefact.`;
    case 'blocked_by_policy':
      return `Votre organisation bloque cette action ${label}.`;
    case 'tool_error':
      return `${label} a refusé l’opération : ${e.message ?? 'erreur non précisée'}.`;
    case 'server_unavailable':
    case 'upstream_error':
      return `${label} n’a pas répondu à temps. L’opération a peut-être abouti : vérifiez dans ${label} avant de recommencer.`;
    case 'not_granted':
    case 'capability_disabled':
    case 'capability_removed':
      return 'Les connecteurs ne sont pas disponibles dans cette vue. Ouvrez la version en ligne sur claude.ai.';
    default:
      return `Échec de l’opération ${label}${e?.message ? ` : ${e.message}` : ''}.`;
  }
}

/** Cherche un lien ouvrable dans la réponse d'un connecteur. */
export function extractLink(payload: unknown, key: ConnectorKey): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  for (const k of ['viewUrl', 'htmlLink', 'webViewLink', 'url', 'alternateLink']) {
    const v = p[k];
    if (typeof v === 'string' && /^https:\/\//.test(v)) return v;
  }
  if (key === 'drive' && typeof p.id === 'string') return `https://drive.google.com/open?id=${encodeURIComponent(p.id)}`;
  if (key === 'gmail') return 'https://mail.google.com/mail/#drafts';
  return null;
}

export interface ActionResult {
  link: string | null;
}

async function call(key: ConnectorKey, input: Record<string, unknown>): Promise<ActionResult> {
  const mcp = await getMcp();
  if (!mcp) throw { code: 'not_granted', message: 'Connecteurs indisponibles hors ligne.' } satisfies McpError;
  const { server, tool } = CONNECTORS[key];
  const res = await mcp.callTool(server, tool, input);
  return { link: extractLink(res.payload, key) };
}

const DEMO_TAG = '[DÉMO]';
const DISCLAIMER =
  'Rencontre FICTIVE issue de BET INTELLIGENCE AI (mode démonstration). Données synthétiques : ce match n’existe pas. Aucun pari réel.';

/** Heure locale sans décalage, format attendu par Google Calendar (« 2026-04-30T10:00:00 »). */
export function localIso(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}:00`;
}

export interface CalendarMatchInput {
  homeName: string;
  awayName: string;
  competitionName: string;
  kickoff: string;
  detail?: string;
  live?: boolean;
}

export function calendarEventInput(m: CalendarMatchInput): Record<string, unknown> {
  const start = new Date(m.kickoff);
  const end = new Date(start.getTime() + 2 * 3600_000);
  return {
    summary: m.live ? `⚽ ${m.homeName} – ${m.awayName}` : `${DEMO_TAG} ${m.homeName} – ${m.awayName}`,
    description: (m.live
      ? ['Match ajouté depuis BET INTELLIGENCE AI (données API-Football).', `Compétition : ${m.competitionName}`, m.detail, 'Ticket virtuel : aucun pari n’a été placé.']
      : [DISCLAIMER, `Compétition (fictive) : ${m.competitionName}`, m.detail]
    ).filter(Boolean).join('\n'),
    startTime: localIso(start),
    endTime: localIso(end),
    availability: 'AVAILABILITY_FREE',
  };
}

export function addMatchToCalendar(match: Match, competitionName: string): Promise<ActionResult> {
  return call('calendar', calendarEventInput({ homeName: match.home.name, awayName: match.away.name, competitionName, kickoff: match.kickoff, live: match.source === 'live' }));
}

export function addLegToCalendar(ticket: Ticket, legIndex: number): Promise<ActionResult> {
  const l = ticket.legs[legIndex];
  return call(
    'calendar',
    calendarEventInput({
      ...l,
      live: ticket.source === 'live',
      detail: `Ticket virtuel ${ticket.id} · ${marketLabel(l.market)} à ${formatOdds(l.odds)}${l.bookmaker ? ` (${l.bookmaker})` : ''} · probabilité ${ticket.source === 'live' ? 'estimée' : 'synthétique'} ${formatPct(l.probability)}`,
    }),
  );
}

export function ticketEmailBody(ticket: Ticket): string {
  const lines = [
    `Ticket virtuel ${ticket.id} — BET INTELLIGENCE AI (${ticket.source === 'live' ? 'données réelles API-Football' : 'mode démonstration'})`,
    `Créé le ${formatDateTime(ticket.createdAt)} · Statut : ${STATUS_LABELS[ticket.status]}`,
    '',
    ...ticket.legs.map(
      (l, i) =>
        `${i + 1}. ${l.homeName} – ${l.awayName} (${l.competitionName})\n   ${marketLabel(l.market)} · cote ${formatOdds(l.odds)} · probabilité ${formatPct(l.probability)}\n   Coup d’envoi : ${formatDateTime(l.kickoff)}`,
    ),
    '',
    `Cote totale : ${formatOdds(ticket.totalOdds)} (produit des cotes)`,
    `Probabilité indicative : ${formatPct(ticket.probability)} (produit des probabilités, hypothèse d’indépendance)`,
    '',
    'Risques :',
    ...ticket.risks.map((r) => `- ${r}`),
    '',
    ticket.source === 'live'
      ? 'Avertissement : matchs et cotes réels ; probabilités estimées par un modèle statistique, sans garantie. Ticket virtuel : aucun pari n’a été placé.'
      : 'Avertissement : équipes, compétitions, cotes et probabilités sont synthétiques. Ticket virtuel sans valeur financière ; aucun pari n’a été placé.',
  ];
  return lines.join('\n');
}

export function draftTicketEmail(ticket: Ticket): Promise<ActionResult> {
  return call('gmail', {
    subject: `${ticket.source === 'live' ? '' : `${DEMO_TAG} `}Ticket virtuel ${ticket.id} — cote ${formatOdds(ticket.totalOdds)}`,
    body: ticketEmailBody(ticket),
  });
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Une ligne par sélection ; séparateur virgule, décimales au point (lisible par Google Sheets). */
export function ticketsCsv(tickets: Ticket[]): string {
  const header = ['ticket', 'source', 'cree_le', 'statut', 'cote_totale', 'probabilite_ticket', 'match', 'competition', 'coup_envoi', 'marche', 'bookmaker', 'cote', 'probabilite', 'score_final', 'issue'];
  const rows = tickets.flatMap((t) =>
    t.legs.map((l) => [
      t.id, t.source === 'live' ? 'réel' : 'démo', t.createdAt, STATUS_LABELS[t.status], t.totalOdds, t.probability.toFixed(4),
      `${l.homeName} - ${l.awayName}`, l.competitionName, l.kickoff, marketLabel(l.market), l.bookmaker ?? '', l.odds, l.probability.toFixed(4),
      l.finalScore ? `${l.finalScore.home}-${l.finalScore.away}` : '',
      l.outcome ? `${l.outcome === 'WON' ? 'gagnée' : 'perdue'}${t.source === 'live' ? '' : ' (sim.)'}` : '',
    ]),
  );
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

export function exportTicketsToDrive(tickets: Ticket[], now = new Date()): Promise<ActionResult> {
  return call('drive', {
    title: `BET INTELLIGENCE AI – tickets virtuels ${localIso(now).slice(0, 16).replace('T', ' ')}`,
    textContent: ticketsCsv(tickets),
    contentMimeType: 'text/csv',
  });
}
