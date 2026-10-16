import { BrainCircuit, CalendarPlus } from 'lucide-react';
import { useMemo } from 'react';
import { analyzeMatch } from '../../services/analysisService';
import { addMatchToCalendar } from '../../services/connectorService';
import { competitionName } from '../../services/matchService';
import type { Competition, Match } from '../../types';
import { formatDate, formatNumber, formatTime } from '../../utils/format';
import { labels } from '../../utils/labels';
import { ArgumentsRisks } from '../analysis/ArgumentsRisks';
import { ConfidenceMeter } from '../analysis/ConfidenceMeter';
import { MarketTable } from '../analysis/MarketTable';
import { RecentTable, StatComparison } from '../analysis/StatBlocks';
import { QualityBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ConnectorButton } from '../ui/ConnectorButton';
import { Modal } from '../ui/Modal';
import { Notice } from '../ui/Notice';

interface Props {
  match: Match | null;
  competitions: Competition[];
  onClose: () => void;
  onAnalyze: (id: string) => void;
}

export function MatchDetailsModal({ match, competitions, onClose, onAnalyze }: Props) {
  const analysis = useMemo(() => (match ? analyzeMatch(match) : null), [match]);
  if (!match || !analysis) return null;
  const live = match.source === 'live';
  const L = labels(live);
  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={`${match.home.name} – ${match.away.name}`}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          {competitionName(competitions, match.competitionId)} · {formatDate(match.kickoff)} à {formatTime(match.kickoff)}
          <QualityBadge quality={match.dataQuality} />
        </span>
      }
      footer={
        <>
          <div className="mr-auto">
            <ConnectorButton
              connector="calendar"
              icon={<CalendarPlus size={14} />}
              action={() => addMatchToCalendar(match, competitionName(competitions, match.competitionId))}
              successMessage={live ? 'Match ajouté à votre Google Calendar.' : 'Match fictif ajouté à votre Google Calendar (marqué [DÉMO]).'}
            >
              Ajouter à Google Calendar
            </ConnectorButton>
          </div>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          <Button variant="primary" icon={<BrainCircuit size={15} />} onClick={() => onAnalyze(match.id)}>Ouvrir l’analyse détaillée</Button>
        </>
      }
    >
      <div className="space-y-6">
        <Notice tone={live ? 'info' : 'demo'}>{L.matchNotice}</Notice>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-night-2 p-3">
            <p className="text-[11px] text-muted">{L.xg} {match.home.shortName}</p>
            <p className="tabular mt-1 font-mono text-xl font-semibold text-ink">{formatNumber(analysis.xg.home)}</p>
          </div>
          <div className="rounded-xl bg-night-2 p-3">
            <p className="text-[11px] text-muted">Total attendu</p>
            <p className="tabular mt-1 font-mono text-xl font-semibold text-ink">{formatNumber(analysis.xg.total)}</p>
          </div>
          <div className="rounded-xl bg-night-2 p-3">
            <p className="text-[11px] text-muted">{L.xg} {match.away.shortName}</p>
            <p className="tabular mt-1 font-mono text-xl font-semibold text-ink">{formatNumber(analysis.xg.away)}</p>
          </div>
        </div>

        <section>
          <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">{L.recentTitle}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RecentTable name={match.home.name} recent={match.homeStats.recent} />
            <RecentTable name={match.away.name} recent={match.awayStats.recent} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Statistiques offensives</h3>
            <StatComparison match={match} kind="offense" />
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Statistiques défensives</h3>
            <StatComparison match={match} kind="defense" />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Probabilités estimées par marché</h3>
          <MarketTable match={match} />
        </section>

        <ArgumentsRisks args={analysis.arguments} risks={analysis.risks} />
        <ConfidenceMeter confidence={analysis.confidence} />
      </div>
    </Modal>
  );
}
