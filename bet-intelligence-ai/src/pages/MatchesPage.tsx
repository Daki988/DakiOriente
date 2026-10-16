import { SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MatchDetailsModal } from '../components/matches/MatchDetailsModal';
import { MatchFilters } from '../components/matches/MatchFilters';
import { MatchList } from '../components/matches/MatchList';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Notice } from '../components/ui/Notice';
import { useApp } from '../hooks/useAppStore';
import { dayKey } from '../utils/format';
import { DEFAULT_MATCH_FILTERS, filterMatches, type MatchFilterState } from '../utils/matchFilters';

export function MatchesPage() {
  const { matches, competitions, settings, openAnalysis, dataSource } = useApp();
  const [filters, setFilters] = useState<MatchFilterState>(DEFAULT_MATCH_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);
  const names = useMemo(() => Object.fromEntries(competitions.map((c) => [c.id, c.name])), [competitions]);
  const days = useMemo(() => [...new Set(matches.map((m) => dayKey(m.kickoff)))].sort(), [matches]);
  const rows = useMemo(() => filterMatches(matches, names, filters), [matches, names, filters]);
  const openMatch = matches.find((m) => m.id === openId) ?? null;

  return (
    <div className="space-y-5">
      {settings.showWarnings && (
        dataSource === 'live' ? (
          <Notice tone="info">Matchs à venir des championnats suivis (API-Football). Cliquez sur un match pour voir ses statistiques et l’estimation du modèle.</Notice>
        ) : (
          <Notice tone="demo">Rencontres fictives générées pour la démonstration. Cliquez sur un match pour consulter ses statistiques simulées.</Notice>
        )
      )}
      <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <MatchFilters value={filters} onChange={setFilters} competitions={competitions} days={days} />
      </div>
      <p className="text-xs text-muted" aria-live="polite">
        {rows.length} rencontre(s) sur {matches.length}
        {filters.market || filters.minOdds != null || filters.maxOdds != null || filters.minProbability > 0
          ? ' · l’encadré de droite affiche la meilleure offre correspondant à vos filtres'
          : ' · l’encadré de droite affiche l’issue 1X2 la plus probable'}
      </p>
      {rows.length === 0 ? (
        <EmptyState
          icon={<SearchX size={20} />}
          title="Aucune rencontre ne correspond aux filtres"
          description="Élargissez la recherche ou réinitialisez les filtres."
          action={<Button size="sm" onClick={() => setFilters(DEFAULT_MATCH_FILTERS)}>Réinitialiser</Button>}
        />
      ) : (
        <MatchList rows={rows} competitionNames={names} onOpen={(m) => setOpenId(m.id)} compact={settings.compactTables} />
      )}
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
