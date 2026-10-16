import { ArrowDownWideNarrow, ArrowUpNarrowWide, RotateCcw, Search } from 'lucide-react';
import type { Competition, MarketId } from '../../types';
import { formatDate } from '../../utils/format';
import { MARKETS } from '../../utils/markets';
import { DEFAULT_MATCH_FILTERS, type MatchFilterState, type SortKey } from '../../utils/matchFilters';

interface Props {
  value: MatchFilterState;
  onChange: (v: MatchFilterState) => void;
  competitions: Competition[];
  days: string[];
}

const optNum = (v: string) => (v === '' ? null : Number(v));

export function MatchFilters({ value, onChange, competitions, days }: Props) {
  const set = <K extends keyof MatchFilterState>(k: K, v: MatchFilterState[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
        <label htmlFor="match-search" className="sr-only">Rechercher une équipe</label>
        <input
          id="match-search"
          type="search"
          placeholder="Rechercher une équipe…"
          className="field-input pl-9"
          value={value.search}
          onChange={(e) => set('search', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <div className="col-span-2 md:col-span-1 xl:col-span-2">
          <label htmlFor="f-comp" className="mb-1 block text-[11px] font-medium text-muted">Compétition</label>
          <select id="f-comp" className="field-input" value={value.competitionId} onChange={(e) => set('competitionId', e.target.value)}>
            <option value="">Toutes</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-day" className="mb-1 block text-[11px] font-medium text-muted">Date</label>
          <select id="f-day" className="field-input" value={value.day} onChange={(e) => set('day', e.target.value)}>
            <option value="">Toutes</option>
            {days.map((d) => (
              <option key={d} value={d}>{formatDate(`${d}T12:00:00`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-market" className="mb-1 block text-[11px] font-medium text-muted">Marché</label>
          <select id="f-market" className="field-input" value={value.market} onChange={(e) => set('market', e.target.value as MarketId | '')}>
            <option value="">1X2 (par défaut)</option>
            {MARKETS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-min-odds" className="mb-1 block text-[11px] font-medium text-muted">Cote min.</label>
          <input id="f-min-odds" type="number" step="0.05" min="1" className="field-input tabular" placeholder="—" value={value.minOdds ?? ''} onChange={(e) => set('minOdds', optNum(e.target.value))} />
        </div>
        <div>
          <label htmlFor="f-max-odds" className="mb-1 block text-[11px] font-medium text-muted">Cote max.</label>
          <input id="f-max-odds" type="number" step="0.05" min="1" className="field-input tabular" placeholder="—" value={value.maxOdds ?? ''} onChange={(e) => set('maxOdds', optNum(e.target.value))} />
        </div>
        <div>
          <label htmlFor="f-prob" className="mb-1 block text-[11px] font-medium text-muted">
            Proba. min. <span className="tabular text-ink-2">{Math.round(value.minProbability * 100)} %</span>
          </label>
          <input id="f-prob" type="range" min="0" max="95" step="5" className="mt-2.5 w-full" value={Math.round(value.minProbability * 100)} onChange={(e) => set('minProbability', Number(e.target.value) / 100)} />
        </div>
        <div>
          <label htmlFor="f-sort" className="mb-1 block text-[11px] font-medium text-muted">Trier par</label>
          <div className="flex gap-1">
            <select id="f-sort" className="field-input" value={value.sort} onChange={(e) => set('sort', e.target.value as SortKey)}>
              <option value="kickoff">Coup d’envoi</option>
              <option value="probability">Probabilité</option>
              <option value="odds">Cote</option>
            </select>
            <button
              type="button"
              className="grid w-10 shrink-0 place-items-center rounded-lg border border-line bg-night-2 text-ink-2 hover:text-ink"
              onClick={() => set('sortDir', value.sortDir === 'asc' ? 'desc' : 'asc')}
              aria-label={value.sortDir === 'asc' ? 'Tri croissant (cliquer pour décroissant)' : 'Tri décroissant (cliquer pour croissant)'}
            >
              {value.sortDir === 'asc' ? <ArrowUpNarrowWide size={15} /> : <ArrowDownWideNarrow size={15} />}
            </button>
          </div>
        </div>
      </div>
      <button type="button" onClick={() => onChange(DEFAULT_MATCH_FILTERS)} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink">
        <RotateCcw size={12} aria-hidden /> Réinitialiser les filtres
      </button>
    </div>
  );
}
