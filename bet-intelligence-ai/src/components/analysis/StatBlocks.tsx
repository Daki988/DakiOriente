import type { Match, RecentMatch, TeamStats } from '../../types';
import { formatNumber } from '../../utils/format';

const resultStyle = { W: 'bg-good-soft text-good', D: 'bg-panel-3 text-ink-2', L: 'bg-risk-soft text-risk' };
const resultLabel = { W: 'V', D: 'N', L: 'D' };
const resultTitle = { W: 'Victoire', D: 'Nul', L: 'Défaite' };

export function FormStrip({ recent }: { recent: RecentMatch[] }) {
  return (
    <ul className="flex gap-1" aria-label="Forme récente">
      {recent.map((r, i) => (
        <li
          key={i}
          className={`grid size-6 place-items-center rounded text-[10px] font-bold ${resultStyle[r.result]}`}
          title={`${resultTitle[r.result]} ${r.goalsFor}-${r.goalsAgainst} contre ${r.opponent} (${r.venue === 'DOM' ? 'domicile' : 'extérieur'})`}
        >
          {resultLabel[r.result]}
        </li>
      ))}
    </ul>
  );
}

export function RecentTable({ name, recent }: { name: string; recent: RecentMatch[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-ink-2">{name}</p>
      <ul className="space-y-1">
        {recent.map((r, i) => (
          <li key={i} className="flex items-center gap-2 rounded-lg bg-night-2 px-2.5 py-1.5 text-xs">
            <span className={`grid size-5 place-items-center rounded text-[10px] font-bold ${resultStyle[r.result]}`} aria-label={resultTitle[r.result]}>
              {resultLabel[r.result]}
            </span>
            <span className="min-w-0 flex-1 truncate text-ink-2">
              {r.venue === 'DOM' ? 'vs' : '@'} {r.opponent}
            </span>
            <span className="tabular font-mono font-semibold text-ink">
              {r.goalsFor}-{r.goalsAgainst}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Row = { label: string; home: number | null; away: number | null; fmt?: (n: number) => string; higherIsBetter?: boolean };

/** Comparaison côte à côte des statistiques simulées des deux équipes. */
export function StatComparison({ match, kind }: { match: Match; kind: 'offense' | 'defense' }) {
  const h = match.homeStats;
  const a = match.awayStats;
  const f2 = (n: number) => formatNumber(n);
  const f1 = (n: number) => formatNumber(n, 1);
  const pct = (n: number) => `${n} %`;
  const rows: Row[] =
    kind === 'offense'
      ? [
          { label: 'Buts marqués / match', home: h.goalsScoredAvg, away: a.goalsScoredAvg, fmt: f2 },
          { label: 'xG / match', home: h.xgFor, away: a.xgFor, fmt: f2 },
          { label: 'Tirs / match', home: h.shotsPerMatch, away: a.shotsPerMatch, fmt: f1 },
          { label: 'Tirs cadrés / match', home: h.shotsOnTargetPerMatch, away: a.shotsOnTargetPerMatch, fmt: f1 },
          { label: 'Possession moyenne', home: h.possessionPct, away: a.possessionPct, fmt: pct },
        ]
      : [
          { label: 'Buts encaissés / match', home: h.goalsConcededAvg, away: a.goalsConcededAvg, fmt: f2, higherIsBetter: false },
          { label: 'xG concédés / match', home: h.xgAgainst, away: a.xgAgainst, fmt: f2, higherIsBetter: false },
          { label: 'Clean sheets', home: h.cleanSheetPct, away: a.cleanSheetPct, fmt: pct },
        ];
  return (
    <table className="w-full text-xs">
      <caption className="sr-only">{kind === 'offense' ? 'Statistiques offensives' : 'Statistiques défensives'}</caption>
      <thead>
        <tr className="text-[11px] text-muted">
          <th scope="col" className="pb-2 text-left font-medium">{match.home.shortName}</th>
          <th scope="col" className="pb-2 text-center font-medium">Indicateur</th>
          <th scope="col" className="pb-2 text-right font-medium">{match.away.shortName}</th>
        </tr>
      </thead>
      <tbody>
        {rows.filter((r) => r.home != null && r.away != null).map((raw) => {
          const r = raw as Row & { home: number; away: number };
          const better = r.higherIsBetter === false ? (x: number, y: number) => x < y : (x: number, y: number) => x > y;
          const fmt = r.fmt ?? String;
          const total = r.home + r.away || 1;
          return (
            <tr key={r.label} className="border-t border-line/60">
              <td className={`tabular py-2 text-left font-mono ${better(r.home, r.away) ? 'font-semibold text-ink' : 'text-ink-2'}`}>{fmt(r.home)}</td>
              <td className="py-2 text-center">
                <p className="text-muted">{r.label}</p>
                <div className="mx-auto mt-1 flex h-1 max-w-40 overflow-hidden rounded-full bg-panel-3" aria-hidden>
                  <div className="bg-[#3987e5]" style={{ width: `${(r.home / total) * 100}%` }} />
                  <div className="ml-0.5 flex-1 bg-[#d95926]" />
                </div>
              </td>
              <td className={`tabular py-2 text-right font-mono ${better(r.away, r.home) ? 'font-semibold text-ink' : 'text-ink-2'}`}>{fmt(r.away)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function VenueRecord({ label, stats }: { label: string; stats: TeamStats }) {
  const v = stats.venueRecord;
  return (
    <div className="rounded-xl bg-night-2 p-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="tabular mt-1 text-sm text-ink">
        <span className="font-semibold text-good">{v.won} V</span> · <span className="text-ink-2">{v.drawn} N</span> ·{' '}
        <span className="text-risk">{v.lost} D</span> <span className="text-muted">sur {v.played}</span>
      </p>
    </div>
  );
}
