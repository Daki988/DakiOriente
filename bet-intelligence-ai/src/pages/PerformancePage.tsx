import { BarChart3, Database, FlaskConical } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import type { DataSource } from '../types';
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
  const { tickets: allTickets, navigate, dataSource } = useApp();
  const [view, setView] = useState<DataSource>(dataSource);
  const live = view === 'live';
  const tickets = useMemo(() => allTickets.filter((t) => (t.source ?? 'demo') === view), [allTickets, view]);
  const realSettled = useMemo(() => summarize(allTickets.filter((t) => t.source === 'live')).settled, [allTickets]);
  const s = useMemo(() => summarize(tickets), [tickets]);
  const bankroll = useMemo(() => bankrollSeries(tickets), [tickets]);
  const byMarket = useMemo(() => resultsByMarket(tickets), [tickets]);
  const distribution = useMemo(() => probabilityDistribution(tickets), [tickets]);
  const calib = useMemo(() => calibration(tickets), [tickets]);
  const gated = (v: string) => (s.sufficient ? v : '—');
  const insufficient = <Insufficient settled={s.settled} />;

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Origine des résultats" className="inline-flex rounded-xl border border-line bg-panel p-1">
        {(['live', 'demo'] as DataSource[]).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${view === v ? 'bg-panel-3 text-ink' : 'text-muted hover:text-ink-2'}`}
          >
            {v === 'live' ? 'Résultats réels' : 'Démonstration'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {live ? (
          <Notice tone="info">
            <strong className="font-semibold">Résultats réels.</strong> Tickets virtuels générés sur les données API-Football et réglés sur les
            scores finaux. Mises virtuelles : aucun argent réel n’est engagé.
          </Notice>
        ) : (
          <Notice tone="demo">
            <strong className="font-semibold">Résultats de démonstration.</strong> Les indicateurs ci-dessous sont calculés uniquement à partir de vos tickets virtuels
            réglés par tirage simulé. Ils ne reflètent aucune performance réelle.
          </Notice>
        )}
        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-panel px-3.5 py-2.5 text-xs text-ink-2">
          <Database size={15} className="shrink-0 text-muted" aria-hidden />
          Tickets réels réglés : <strong className="text-ink">{realSettled}</strong>
          {dataSource !== 'live' && ' — le backend API-Football n’est pas connecté à cette version.'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Prédictions enregistrées" value={formatInt(s.recorded)} hint="Tickets virtuels" />
        <StatCard label="Prédictions réglées" value={formatInt(s.settled)} hint={`${s.pending} en attente · ${s.cancelled} annulé(s)`} />
        <StatCard label="Taux de réussite" value={gated(s.hitRate != null ? formatPct(s.hitRate) : '—')} hint={live ? 'Scores réels' : 'Simulé'} tone="good" />
        <StatCard label="Cote moyenne" value={gated(s.averageOdds != null ? formatOdds(s.averageOdds) : '—')} hint="Tickets réglés" />
        <StatCard label={live ? 'ROI (mises virtuelles)' : 'ROI simulé'} value={gated(s.roi != null ? `${s.roi >= 0 ? '+' : ''}${formatPct(s.roi)}` : '—')} hint="Mises virtuelles" tone={s.roi != null && s.roi < 0 ? 'risk' : 'good'} />
        <StatCard label="Brier Score" value={gated(s.brier != null ? formatNumber(s.brier, 3) : '—')} hint="0 = parfait · plus bas = mieux" />
      </div>

      {!s.sufficient && (
        <div className="rounded-2xl border border-warn/30 bg-warn-soft p-5 text-center" role="status">
          <p className="text-sm font-medium text-ink">{INSUFFICIENT_DATA_MESSAGE}</p>
          <p className="mt-1 text-xs text-ink-2">
            {s.settled} ticket(s) réglé(s) sur les {MIN_SETTLED_SAMPLE} nécessaires. {live ? 'Générez des tickets : ils seront réglés à la fin des matchs.' : 'Générez des tickets puis simulez leur résultat dans Mes tickets.'}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Button size="sm" variant="primary" onClick={() => navigate('generateur')}>Générer un ticket</Button>
            <Button size="sm" onClick={() => navigate('tickets')}>Mes tickets</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard live={live} title="Évolution de la bankroll virtuelle" subtitle={`Départ ${formatInt(VIRTUAL_BANKROLL_START)} FCFA fictifs · mise virtuelle fixe par ticket`}>
          {s.sufficient ? <BankrollChart data={bankroll} start={VIRTUAL_BANKROLL_START} /> : insufficient}
        </ChartCard>
        <ChartCard live={live} title="Résultats par marché" subtitle={live ? 'Sélections dont le score final est connu' : 'Jambes dont l’issue simulée est connue'}>
          {s.sufficient && byMarket.length > 0 ? <MarketResultsChart data={byMarket} /> : insufficient}
        </ChartCard>
        <ChartCard live={live} title="Distribution des probabilités" subtitle="Probabilité indicative de tous les tickets enregistrés">
          {s.recorded > 0 ? <ProbabilityDistributionChart data={distribution} /> : <EmptyState icon={<BarChart3 size={20} />} title="Aucun ticket enregistré" />}
        </ChartCard>
        <ChartCard live={live} title="Probabilités estimées vs résultats observés" subtitle="Par tranche de probabilité (tickets réglés)">
          {s.sufficient ? <CalibrationChart data={calib} /> : insufficient}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, live = false }: { title: string; subtitle: string; children: ReactNode; live?: boolean }) {
  return (
    <Card title={title} subtitle={subtitle}>
      {children}
      <SyntheticDataNote className="mt-3" live={live} />
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
