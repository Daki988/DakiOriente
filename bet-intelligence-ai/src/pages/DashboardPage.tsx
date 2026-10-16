import { Activity, Clock, ListChecks, Ticket as TicketIcon, Wand2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MarketDistributionChart } from '../components/dashboard/MarketDistributionChart';
import { OpportunityList } from '../components/dashboard/OpportunityList';
import { ProbabilityComparisonChart } from '../components/dashboard/ProbabilityComparisonChart';
import { MatchDetailsModal } from '../components/matches/MatchDetailsModal';
import { BankrollChart } from '../components/performance/BankrollChart';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Notice, SyntheticDataNote } from '../components/ui/Notice';
import { StatCard } from '../components/ui/StatCard';
import { useApp } from '../hooks/useAppStore';
import { useEligible } from '../hooks/useEligible';
import { bankrollSeries, settledTickets, VIRTUAL_BANKROLL_START } from '../services/performanceService';
import { formatInt, formatOdds, formatPct } from '../utils/format';

export function DashboardPage() {
  const { matches, competitions, tickets, settings, navigate, openAnalysis } = useApp();
  const eligible = useEligible();
  const [openId, setOpenId] = useState<string | null>(null);
  const pendingTickets = tickets.filter((t) => t.status === 'PENDING');
  const pendingLegs = pendingTickets.reduce((a, t) => a + t.legs.length, 0);
  const settled = settledTickets(tickets);
  const bankroll = useMemo(() => bankrollSeries(tickets), [tickets]);
  const openMatch = matches.find((m) => m.id === openId) ?? null;

  return (
    <div className="space-y-6">
      {settings.showWarnings && (
        <Notice tone="demo">
          <strong className="font-semibold">Prototype de démonstration.</strong> Les compétitions, équipes, cotes et probabilités affichées sont
          synthétiques et ne constituent ni des informations sportives actuelles ni un conseil de pari.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Matchs analysés" value={formatInt(matches.length)} hint="Rencontres simulées à venir" icon={<ListChecks size={16} />} tone="info" />
        <StatCard
          label="Sélections admissibles"
          value={formatInt(eligible.length)}
          hint={`Proba. ≥ ${formatPct(settings.minProbability)} · cote ${formatOdds(settings.minOdds)}–${formatOdds(settings.maxOdds)}`}
          icon={<Activity size={16} />}
          tone="good"
        />
        <StatCard label="Tickets virtuels générés" value={formatInt(tickets.length)} hint="Historique local" icon={<TicketIcon size={16} />} tone="neutral" />
        <StatCard
          label="Prédictions en attente"
          value={formatInt(pendingLegs)}
          hint={`Dans ${formatInt(pendingTickets.length)} ticket(s) en attente`}
          icon={<Clock size={16} />}
          tone="warn"
        />
      </div>

      <Card
        title="Meilleures opportunités"
        subtitle="Sélections candidates triées par probabilité estimée, selon les règles configurées"
        actions={
          <Button size="sm" variant="primary" icon={<Wand2 size={14} />} onClick={() => navigate('generateur')}>
            Générer un ticket
          </Button>
        }
      >
        {eligible.length === 0 ? (
          <EmptyState
            icon={<Activity size={20} />}
            title="Aucune sélection ne satisfait les critères actuels"
            description="Assouplissez la probabilité minimale, élargissez la plage de cotes ou autorisez davantage de marchés."
            action={<Button size="sm" onClick={() => navigate('parametres')}>Modifier les paramètres</Button>}
          />
        ) : (
          <OpportunityList items={eligible.slice(0, 6)} onOpen={setOpenId} />
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Répartition des sélections admissibles par marché" subtitle={`${formatInt(eligible.length)} sélection(s)`}>
          {eligible.length === 0 ? (
            <EmptyState title="Aucune donnée à représenter" description="Aucune sélection admissible avec les paramètres actuels." />
          ) : (
            <MarketDistributionChart selections={eligible} />
          )}
          <SyntheticDataNote className="mt-3" />
        </Card>

        <Card title="Probabilité estimée vs probabilité implicite" subtitle="Implicite = 1 / cote de démonstration · 8 premières sélections">
          {eligible.length === 0 ? (
            <EmptyState title="Aucune donnée à représenter" description="Aucune sélection admissible avec les paramètres actuels." />
          ) : (
            <ProbabilityComparisonChart selections={eligible.slice(0, 8)} />
          )}
          <SyntheticDataNote className="mt-3" />
        </Card>
      </div>

      <Card
        title="Évolution des résultats simulés"
        subtitle="Bankroll virtuelle (FCFA fictifs) d’après vos tickets réglés en simulation — aucun résultat réel"
        actions={<Button size="sm" variant="ghost" onClick={() => navigate('performances')}>Voir les performances</Button>}
      >
        {settled.length === 0 ? (
          <EmptyState
            icon={<TicketIcon size={20} />}
            title="Aucun ticket réglé pour l’instant"
            description="Générez des tickets virtuels puis utilisez « Simuler le résultat » dans Mes tickets : la courbe se construira à partir de ces règlements simulés. Aucun historique n’est inventé."
            action={<Button size="sm" onClick={() => navigate('tickets')}>Ouvrir Mes tickets</Button>}
          />
        ) : (
          <BankrollChart data={bankroll} start={VIRTUAL_BANKROLL_START} />
        )}
        <SyntheticDataNote className="mt-3" />
      </Card>

      <MatchDetailsModal
        match={openMatch}
        competitions={competitions}
        onClose={() => setOpenId(null)}
        onAnalyze={(id) => {
          setOpenId(null);
          openAnalysis(id);
        }}
      />
    </div>
  );
}
