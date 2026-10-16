import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Selection } from '../../types';
import { MARKETS } from '../../utils/markets';
import { AXIS_TICK, ChartTooltip, GRID_STROKE, SERIES } from '../ui/ChartTooltip';

export function MarketDistributionChart({ selections }: { selections: Selection[] }) {
  const data = MARKETS.map((m) => ({ name: m.short, label: m.label, count: selections.filter((s) => s.market === m.id).length })).filter(
    (d) => d.count > 0,
  );
  return (
    <div className="h-64" role="img" aria-label={`Répartition des sélections admissibles par marché : ${data.map((d) => `${d.label} ${d.count}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" width={150} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#ffffff08' }} content={(p) => <ChartTooltip active={p.active} payload={p.payload as never} label={p.label as string} />} />
          <Bar isAnimationActive={false} dataKey="count" name="Sélections" fill={SERIES.s1} radius={[0, 4, 4, 0]} maxBarSize={18} label={{ position: 'right', fill: '#b4bccb', fontSize: 11 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
