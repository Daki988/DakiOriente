import type { Match } from '../../types';
import { formatOdds, formatPct } from '../../utils/format';
import { marketLabel } from '../../utils/markets';
import { impliedProbability } from '../../utils/math';
import { ProbabilityBar } from '../ui/ProbabilityBar';

/** Probabilités estimées, cotes de démonstration et écart estimé − implicite pour chaque marché. */
export function MarketTable({ match }: { match: Match }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-xs">
        <caption className="sr-only">Marchés pris en charge, probabilités estimées et cotes de démonstration</caption>
        <thead>
          <tr className="text-left text-[11px] text-muted">
            <th scope="col" className="pb-2 font-medium">Marché</th>
            <th scope="col" className="pb-2 text-right font-medium">Cote démo</th>
            <th scope="col" className="pb-2 text-right font-medium">Implicite</th>
            <th scope="col" className="pb-2 pl-4 font-medium">Estimée</th>
            <th scope="col" className="pb-2 text-right font-medium">Écart</th>
          </tr>
        </thead>
        <tbody>
          {[...match.markets]
            .sort((a, b) => b.probability - a.probability)
            .map((o) => {
              const implied = impliedProbability(o.odds);
              const edge = o.probability - implied;
              return (
                <tr key={o.market} className="border-t border-line/60">
                  <td className="py-2 text-ink-2">{marketLabel(o.market)}</td>
                  <td className="tabular py-2 text-right font-mono font-semibold text-ink">{formatOdds(o.odds)}</td>
                  <td className="tabular py-2 text-right text-muted">{formatPct(implied)}</td>
                  <td className="py-2 pl-4">
                    <div className="flex items-center gap-2">
                      <span className="tabular w-12 shrink-0 font-semibold text-ink">{formatPct(o.probability)}</span>
                      <div className="w-24"><ProbabilityBar value={o.probability} implied={implied} /></div>
                    </div>
                  </td>
                  <td className={`tabular py-2 text-right font-medium ${edge >= 0 ? 'text-good' : 'text-risk'}`}>
                    {edge >= 0 ? '+' : '−'}
                    {formatPct(Math.abs(edge))}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
