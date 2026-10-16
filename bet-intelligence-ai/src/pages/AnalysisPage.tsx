import { BrainCircuit, Cpu, Home, Plane } from 'lucide-react';
import { useMemo } from 'react';
import { ProbabilityComparisonChart } from '../components/dashboard/ProbabilityComparisonChart';
import { ArgumentsRisks } from '../components/analysis/ArgumentsRisks';
import { ConfidenceMeter } from '../components/analysis/ConfidenceMeter';
import { MarketTable } from '../components/analysis/MarketTable';
import { FormStrip, StatComparison, VenueRecord } from '../components/analysis/StatBlocks';
import { QualityBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Notice, SyntheticDataNote } from '../components/ui/Notice';
import { useApp } from '../hooks/useAppStore';
import { analyzeMatch } from '../services/analysisService';
import { competitionName } from '../services/matchService';
import { formatDate, formatNumber, formatOdds, formatPct, formatTime } from '../utils/format';
import { labels } from '../utils/labels';
import { marketLabel } from '../utils/markets';

export function AnalysisPage() {
  const { matches, competitions, selections, analysisMatchId, setAnalysisMatchId, dataSource } = useApp();
  const live = dataSource === 'live';
  const L = labels(live);
  const match = matches.find((m) => m.id === analysisMatchId) ?? matches[0];
  const analysis = useMemo(() => (match ? analyzeMatch(match) : null), [match]);
  const matchSelections = useMemo(() => selections.filter((s) => s.matchId === match?.id), [selections, match]);

  if (!match || !analysis) return <p className="text-sm text-muted">Aucun match disponible.</p>;

  return (
    <div className="space-y-6">
      <Notice tone="info">
        <strong className="font-semibold">Méthode :</strong> cette version n’utilise pas de modèle d’intelligence artificielle.{' '}
        {live
          ? 'Les probabilités proviennent d’un modèle statistique (loi de Poisson appliquée aux buts marqués et encaissés cette saison) ; les cotes sont celles des bookmakers. Les commentaires sont des textes pré-rédigés choisis par des règles. Une probabilité estimée n’est jamais une certitude.'
          : 'Les probabilités proviennent d’un moteur déterministe (loi de Poisson appliquée à des profils de force fictifs) et les commentaires sont des textes pré-rédigés, sélectionnés par des règles à partir des statistiques simulées.'}
      </Notice>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="analysis-match" className="mb-1.5 block text-xs font-medium text-ink-2">Rencontre analysée</label>
          <select id="analysis-match" className="field-input" value={match.id} onChange={(e) => setAnalysisMatchId(e.target.value)}>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {formatDate(m.kickoff)} · {m.home.name} – {m.away.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card
        title={
          <span className="flex items-center gap-2 text-base">
            <BrainCircuit size={17} className="text-good" aria-hidden /> {match.home.name} – {match.away.name}
          </span>
        }
        subtitle={`${competitionName(competitions, match.competitionId)} · ${formatDate(match.kickoff)} à ${formatTime(match.kickoff)}`}
        actions={<QualityBadge quality={match.dataQuality} />}
      >
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Résumé du match</h3>
        <p className="text-sm leading-relaxed text-ink-2">{analysis.summary}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label={`${L.xg} ${match.home.shortName}`} value={formatNumber(analysis.xg.home)} />
          <Metric label={`${L.xg} ${match.away.shortName}`} value={formatNumber(analysis.xg.away)} />
          <Metric label="Marché le plus probable" value={analysis.bestMarket ? marketLabel(analysis.bestMarket.market) : 'Aucune cote'} small />
          <Metric
            label={live ? 'Proba. estimée / cote' : 'Proba. / cote démo'}
            value={analysis.bestMarket ? `${formatPct(analysis.bestMarket.probability)} · ${formatOdds(analysis.bestMarket.odds)}` : '—'}
            small
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Statistiques offensives" subtitle={L.stats}>
          <StatComparison match={match} kind="offense" />
        </Card>
        <Card title="Statistiques défensives" subtitle={L.stats}>
          <StatComparison match={match} kind="defense" />
        </Card>
      </div>

      <Card title="Performances à domicile et à l’extérieur" subtitle={L.form}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-medium text-ink"><Home size={15} className="text-muted" aria-hidden /> {match.home.name}</p>
            <VenueRecord label={L.venueHome} stats={match.homeStats} />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted">{L.last5}</span>
              <FormStrip recent={match.homeStats.recent} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-medium text-ink"><Plane size={15} className="text-muted" aria-hidden /> {match.away.name}</p>
            <VenueRecord label={L.venueAway} stats={match.awayStats} />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted">{L.last5}</span>
              <FormStrip recent={match.awayStats.recent} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3" title={`Probabilités estimées et ${L.oddsLong}`} subtitle="Écart = probabilité estimée − probabilité implicite">
          <MarketTable match={match} />
        </Card>
        <Card className="xl:col-span-2" title="Comparaison probabilités / cotes" subtitle="Par marché">
          <ProbabilityComparisonChart selections={matchSelections} domainMin={0} labelBy="market" />
          <SyntheticDataNote className="mt-3" live={live} />
        </Card>
      </div>

      <Card title="Arguments et risques identifiés" actions={<span className="flex items-center gap-1.5 text-[11px] text-muted"><Cpu size={12} aria-hidden /> Règles déterministes</span>}>
        <ArgumentsRisks args={analysis.arguments} risks={analysis.risks} />
        <div className="mt-5">
          <ConfidenceMeter confidence={analysis.confidence} />
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl bg-night-2 p-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`tabular mt-1 font-semibold text-ink ${small ? 'text-sm' : 'font-mono text-xl'}`}>{value}</p>
    </div>
  );
}
