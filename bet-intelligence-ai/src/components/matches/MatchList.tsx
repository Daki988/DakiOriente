import { ChevronRight } from 'lucide-react';
import type { Match, MarketOffer } from '../../types';
import { formatDate, formatOdds, formatPct, formatTime } from '../../utils/format';
import { marketLabel } from '../../utils/markets';
import { QualityBadge } from '../ui/Badge';

interface Props {
  rows: { match: Match; offer: MarketOffer | null }[];
  competitionNames: Record<string, string>;
  onOpen: (m: Match) => void;
  compact: boolean;
}

function offerOf(m: Match, id: MarketOffer['market']): MarketOffer | undefined {
  return m.markets.find((o) => o.market === id);
}

export function MatchList({ rows, competitionNames, onOpen, compact }: Props) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
      {rows.map(({ match: m, offer }) => {
        const trio = [offerOf(m, 'HOME_WIN'), offerOf(m, 'DRAW'), offerOf(m, 'AWAY_WIN')];
        return (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onOpen(m)}
              className={`grid w-full grid-cols-1 items-center gap-3 px-4 text-left transition-colors hover:bg-panel-2 md:grid-cols-[1.6fr_1.4fr_1.2fr_auto] md:gap-5 md:px-5 ${compact ? 'py-2.5' : 'py-4'}`}
              aria-label={`Détails du match ${m.home.name} contre ${m.away.name}`}
            >
              <div className="min-w-0">
                <p className="text-[11px] text-muted">
                  <span className="tabular">{formatDate(m.kickoff)} · {formatTime(m.kickoff)}</span> · <span className="truncate">{competitionNames[m.competitionId]}</span>
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-ink">{m.home.name}</p>
                <p className="truncate text-sm font-semibold text-ink">{m.away.name}</p>
              </div>
              <div className="grid grid-cols-3 gap-1.5" aria-label="Cotes 1X2 et probabilités estimées">
                {trio.map((o, i) => (
                  <div key={i} className="rounded-lg bg-night-2 px-2 py-1.5 text-center">
                    <p className="text-[10px] text-muted">{['1', 'X', '2'][i]}</p>
                    <p className="tabular font-mono text-sm font-semibold text-ink">{o ? formatOdds(o.odds) : '—'}</p>
                    <p className="tabular text-[10px] text-ink-2">{o ? formatPct(o.probability) : 'sans cote'}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-line px-3 py-2">
                {offer ? (
                  <>
                    <p className="truncate text-[10px] text-muted">{marketLabel(offer.market)}{offer.bookmaker ? ` · ${offer.bookmaker}` : ''}</p>
                    <p className="tabular flex items-baseline justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-ink">{formatOdds(offer.odds)}</span>
                      <span className="text-xs font-semibold text-good">{formatPct(offer.probability)}</span>
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-muted">Aucune cote disponible</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 md:justify-end">
                <QualityBadge quality={m.dataQuality} compact />
                <ChevronRight size={16} className="text-muted" aria-hidden />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
