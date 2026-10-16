import { CalendarClock, Sparkles } from 'lucide-react';
import type { Selection } from '../../types';
import { formatDate, formatOdds, formatPct, formatTime } from '../../utils/format';
import { marketLabel } from '../../utils/markets';
import { QualityBadge } from '../ui/Badge';
import { ProbabilityBar } from '../ui/ProbabilityBar';

export function OpportunityList({ items, onOpen }: { items: Selection[]; onOpen: (matchId: string) => void }) {
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
      {items.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => onOpen(s.matchId)}
            className="group flex h-full w-full flex-col gap-3 rounded-xl border border-line bg-panel-2 p-4 text-left transition-colors hover:border-line-strong hover:bg-panel-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {s.homeName} <span className="font-normal text-muted">vs</span> {s.awayName}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted">{s.competitionName}</p>
              </div>
              <QualityBadge quality={s.dataQuality} compact />
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] text-muted">Marché</p>
                <p className="text-sm font-medium text-ink-2">{marketLabel(s.market)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted">{s.source === 'live' ? (s.bookmaker ? `Cote ${s.bookmaker}` : 'Cote') : 'Cote démo'}</p>
                <p className="tabular font-mono text-lg font-semibold text-ink">{formatOdds(s.odds)}</p>
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-[11px]">
                <span className="text-muted">Probabilité estimée</span>
                <span className="tabular font-semibold text-good">{formatPct(s.probability)}</span>
              </div>
              <ProbabilityBar value={s.probability} implied={s.impliedProbability} />
              <p className="tabular mt-1 text-[10px] text-muted">Repère blanc : probabilité implicite {formatPct(s.impliedProbability)}</p>
            </div>
            <p className="flex gap-1.5 text-xs leading-relaxed text-ink-2">
              <Sparkles size={13} className="mt-0.5 shrink-0 text-good" aria-hidden />
              {s.reason}
            </p>
            <p className="mt-auto flex items-center gap-1.5 text-[11px] text-muted">
              <CalendarClock size={12} aria-hidden /> {formatDate(s.kickoff)} · {formatTime(s.kickoff)}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
