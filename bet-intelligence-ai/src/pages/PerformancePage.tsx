import { BarChart3, Database, FlaskConical } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { BankrollChart } from '../components/performance/BankrollChart';
import { CalibrationChart, MarketResultsChart, ProbabilityDistributionChart } from '../components/performance/PerformanceCharts';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Notice, SyntheticDataNote } from '../components/ui/Notice';
import { StatCard } from '../components/ui/StatCard';
import { useApp } from '../hooks/useAppStore';
import {
  bankrollSeries,
  calibration,
  INSUFFICIENT_DATA_MESSAGE,
  MIN_SETTLED_SAMPLE,
  probabilityDistribution,
  resultsByMarket,
  summarize,
  VIRTUAL_BANKROLL_START,
} from '../services/performanceService';
import { formatInt, formatNumber, formatOdds, formatPct } from '../utils/format';

export function PerformancePage() {
  const { tickets, navigate } = useApp();
  const s = useMemo(() => summarize(tickets), [tickets]);
  const bankroll = useMemo(() => bankrollSeries(tickets), [tickets]);
  const byMarket = useMemo(() => resultsByMarket(tickets), [tickets]);
  const distribution = useMemo(() => probabilityDistribution(tickets), [tickets]);
  const calib = useMemo(() => calibration(tickets), [tickets]);
  const gated = (v: string) => (s.sufficient ? v : '—');
  const insufficient = <Insufficient settled={s.settled} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Notice tone="demo">
          <strong className="font-semibold">Résultats de démonstration.</strong> Les indicateurs ci-dessous sont calculés uniquement à partir de vos tickets virtuels
          réglés par tirage simulé. Ils ne reflètent aucune performance réelle.
        </Notice>
        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-panel px-3.5 py-2.5 text-xs text-ink-2">
          <Database size={15} className="shrink-0 text-muted" aria-hidden />
          Résultats réels enregistrés : <strong className="text-ink">0</strong> — aucune source de résultats réels n’est connectée.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Prédictions enregistrées" value={formatInt(s.recorded)} hint="Tickets virtuels" />
        <StatCard label="Prédictions réglées" value={formatInt(s.settled)} hint={`${s.pending} en attente · ${s.cancelled} annulé(s)`} />
        <StatCard label="Taux de réussite" value={gated(s.hitRate != null ? formatPct(s.hitRate) : '—')} hint="Simulé" tone="good" />
        <StatCard label="Cote moyenne" value={gated(s.averageOdds != null ? formatOdds(s.averageOdds) : '—')} hint="Tickets réglés" />
        <StatCard label="ROI simulé" value={gated(s.roi != null ? `${s.roi >= 0 ? '+' : ''}${formatPct(s.roi)}` : '—')} hint="Mises virtuelles" tone={s.roi != null && s.roi < 0 ? 'risk' : 'good'} />
        <StatCard label="Brier Score" value={gated(s.brier != null ? formatNumber(s.brier, 3) : '—')} hint="0 = parfait · plus bas = mieux" />
      </div>

      {!s.sufficient && (
        <div className="rounded-2xl border border-warn/30 bg-warn-soft p-5 text-center" role="status">
          <p className="text-sm font-medium text-ink">{INSUFFICIENT_DATA_MESSAGE}</p>
          <p className="mt-1 text-xs text-ink-2">
            {s.settled} ticket(s) réglé(s) sur les {MIN_SETTLED_SAMPLE} nécessaires. Générez des tickets puis simulez leur résultat dans Mes tickets.
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Button size="sm" variant="primary" onClick={() => navigate('generateur')}>Générer un ticket</Button>
            <Button size="sm" onClick={() => navigate('tickets')}>Mes tickets</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Évolution de la bankroll virtuelle" subtitle={`Départ ${formatInt(VIRTUAL_BANKROLL_START)} FCFA fictifs · mise virtuelle fixe par ticket`}>
          {s.sufficient ? <BankrollChart data={bankroll} start={VIRTUAL_BANKROLL_START} /> : insufficient}
        </ChartCard>
        <ChartCard title="Résultats par marché" subtitle="Jambes dont l’issue simulée est connue">
          {s.sufficient && byMarket.length > 0 ? <MarketResultsChart data={byMarket} /> : insufficient}
        </ChartCard>
        <ChartCard title="Distribution des probabilités" subtitle="Probabilité indicative de tous les tickets enregistrés">
          {s.recorded > 0 ? <ProbabilityDistributionChart data={distribution} /> : <EmptyState icon={<BarChart3 size={20} />} title="Aucun ticket enregistré" />}
        </ChartCard>
        <ChartCard title="Probabilités estimées vs résultats observés" subtitle="Par tranche de probabilité (tickets réglés)">
          {s.sufficient ? <CalibrationChart data={calib} /> : insufficient}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Card title={title} subtitle={subtitle}>
      {children}
      <SyntheticDataNote className="mt-3" />
    </Card>
  );
}

function Insufficient({ settled }: { settled: number }) {
  return (
    <EmptyState
      icon={<FlaskConical size={20} />}
      title={INSUFFICIENT_DATA_MESSAGE}
      description={`Échantillon actuel : ${settled} ticket(s) réglé(s) · minimum requis : ${MIN_SETTLED_SAMPLE}.`}
    />
  );
}
