import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CalibrationPoint, MarketResult, ProbabilityBucket } from '../../services/performanceService';
import { formatPct } from '../../utils/format';
import { marketLabel } from '../../utils/markets';
import { AXIS_TICK, ChartTooltip, GRID_STROKE, SERIES } from '../ui/ChartTooltip';

export function MarketResultsChart({ data }: { data: MarketResult[] }) {
  const rows = data.map((d) => ({ ...d, label: marketLabel(d.market) }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid horizontal={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" width={150} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#ffffff08' }} content={(p) => <ChartTooltip active={p.active} payload={p.payload as never} label={p.label as string} />} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="square" iconSize={9} />
          <Bar isAnimationActive={false} dataKey="won" name="Sélections gagnantes" stackId="r" fill={SERIES.good} maxBarSize={18} />
          <Bar isAnimationActive={false} dataKey="lost" name="Sélections perdantes" stackId="r" fill={SERIES.risk} radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProbabilityDistributionChart({ data }: { data: ProbabilityBucket[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }} barCategoryGap={3}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#ffffff08' }} content={(p) => <ChartTooltip active={p.active} payload={p.payload as never} label={p.label as string} />} />
          <Bar isAnimationActive={false} dataKey="count" name="Tickets" fill={SERIES.s1} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CalibrationChart({ data }: { data: CalibrationPoint[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 1]} tickFormatter={(v: number) => `${Math.round(v * 100)} %`} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip content={(p) => <ChartTooltip active={p.active} payload={p.payload as never} label={p.label as string} format={(v) => formatPct(v)} />} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" />
          <Line isAnimationActive={false} type="monotone" dataKey="predicted" name="Probabilité estimée moyenne" stroke={SERIES.s1} strokeWidth={2} dot={{ r: 4 }} />
          <Line isAnimationActive={false} type="monotone" dataKey="observed" name="Fréquence observée" stroke={SERIES.s2} strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
