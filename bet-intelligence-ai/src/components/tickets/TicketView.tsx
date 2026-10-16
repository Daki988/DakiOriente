import { CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';
import type { Ticket } from '../../types';
import { formatDate, formatDateTime, formatFcfa, formatOdds, formatPct, formatTime } from '../../utils/format';
import { marketLabel } from '../../utils/markets';
import { StatusBadge } from '../ui/Badge';

export function TicketSummary({ ticket }: { ticket: Ticket }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl bg-night-2 p-3">
        <p className="text-[11px] text-muted">Cote totale</p>
        <p className="tabular font-mono text-xl font-semibold text-ink">{formatOdds(ticket.totalOdds)}</p>
      </div>
      <div className="rounded-xl bg-night-2 p-3">
        <p className="text-[11px] text-muted">Probabilité indicative</p>
        <p className="tabular font-mono text-xl font-semibold text-good">{formatPct(ticket.probability)}</p>
      </div>
      <div className="rounded-xl bg-night-2 p-3">
        <p className="text-[11px] text-muted">Sélections</p>
        <p className="tabular font-mono text-xl font-semibold text-ink">{ticket.legs.length}</p>
      </div>
      <div className="rounded-xl bg-night-2 p-3">
        <p className="text-[11px] text-muted">Mise virtuelle</p>
        <p className="tabular text-sm font-semibold text-ink">{formatFcfa(ticket.virtualStake)}</p>
        <p className="text-[10px] text-muted">fictifs, sans valeur</p>
      </div>
    </div>
  );
}

export function TicketLegs({ ticket, showReasons = true }: { ticket: Ticket; showReasons?: boolean }) {
  return (
    <ol className="space-y-2">
      {ticket.legs.map((l, i) => (
        <li key={l.selectionId} className="rounded-xl border border-line bg-panel-2 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-muted">
                <span className="tabular">#{i + 1}</span> · {l.competitionName} · {formatDate(l.kickoff)} {formatTime(l.kickoff)}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-ink">{l.homeName} – {l.awayName}</p>
              <p className="text-xs text-ink-2">{marketLabel(l.market)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="tabular font-mono text-base font-semibold text-ink">{formatOdds(l.odds)}</p>
              <p className="tabular text-[11px] text-good">{formatPct(l.probability)}</p>
              {l.outcome && (
                <p className={`mt-1 inline-flex items-center gap-1 text-[10px] font-medium ${l.outcome === 'WON' ? 'text-good' : 'text-risk'}`}>
                  {l.outcome === 'WON' ? <CheckCircle2 size={11} aria-hidden /> : <XCircle size={11} aria-hidden />}
                  {l.outcome === 'WON' ? 'Gagnée (sim.)' : 'Perdue (sim.)'}
                </p>
              )}
            </div>
          </div>
          {showReasons && <p className="mt-2 border-t border-line/60 pt-2 text-xs leading-relaxed text-muted">Motif : {l.reason}</p>}
        </li>
      ))}
    </ol>
  );
}

export function TicketRisks({ risks }: { risks: string[] }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-warn"><ShieldAlert size={14} aria-hidden /> Risques</h3>
      <ul className="space-y-1.5">
        {risks.map((r) => (
          <li key={r} className="rounded-lg border border-warn/15 bg-warn-soft/40 px-3 py-2 text-xs leading-relaxed text-ink-2">{r}</li>
        ))}
      </ul>
    </div>
  );
}

export function TicketHeader({ ticket }: { ticket: Ticket }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <span className="font-mono font-semibold text-ink">{ticket.id}</span>
      <span>· créé le {formatDateTime(ticket.createdAt)}</span>
      <StatusBadge status={ticket.status} />
    </div>
  );
}
