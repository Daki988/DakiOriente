import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Selection } from '../../types';
import { formatPct } from '../../utils/format';
import { marketShort } from '../../utils/markets';
import { AXIS_TICK, ChartTooltip, GRID_STROKE, SERIES } from '../ui/ChartTooltip';

/** Probabilité estimée (moteur démo) vs probabilité implicite (1 / cote démo). */
export function ProbabilityComparisonChart({ selections, domainMin = 0.5, labelBy = 'match' }: { selections: Selection[]; domainMin?: number; labelBy?: 'match' | 'market' }) {
  const data = selections.map((s) => ({
    name: labelBy === 'market' ? marketShort(s.market) : `${s.homeName.split(' ').slice(-1)[0]} · ${marketShort(s.market)}`,
    full: `${s.homeName} – ${s.awayName} · ${marketShort(s.market)}`,
    estimee: s.probability,
    implicite: s.impliedProbability,
  }));
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -8 }} barGap={2} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={56} axisLine={false} tickLine={false} />
          <YAxis domain={[domainMin, 1]} tickFormatter={(v: number) => `${Math.round(v * 100)} %`} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: '#ffffff08' }}
            content={(p) => (
              <ChartTooltip
                active={p.active}
                payload={p.payload as never}
                label={(p.payload?.[0]?.payload as { full?: string } | undefined)?.full}
                format={(v) => formatPct(v)}
              />
            )}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#b4bccb' }} iconType="square" iconSize={9} />
          <Bar isAnimationActive={false} dataKey="estimee" name="Probabilité estimée" fill={SERIES.s1} radius={[4, 4, 0, 0]} maxBarSize={16} />
          <Bar isAnimationActive={false} dataKey="implicite" name="Probabilité implicite" fill={SERIES.s2} radius={[4, 4, 0, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
