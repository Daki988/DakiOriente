import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BankrollPoint } from '../../services/performanceService';
import { formatFcfa, formatInt } from '../../utils/format';
import { AXIS_TICK, ChartTooltip, GRID_STROKE, SERIES } from '../ui/ChartTooltip';

export function BankrollChart({ data, start, height = 256 }: { data: BankrollPoint[]; start: number; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 8 }}>
          <defs>
            <linearGradient id="bankrollFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES.s1} stopOpacity={0.28} />
              <stop offset="100%" stopColor={SERIES.s1} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis dataKey="index" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={72}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => formatInt(v)}
          />
          <ReferenceLine y={start} stroke="#8590a5" strokeDasharray="4 4" />
          <Tooltip
            content={(p) => (
              <ChartTooltip
                active={p.active}
                payload={p.payload as never}
                label={(p.payload?.[0]?.payload as BankrollPoint | undefined)?.label}
                format={(v) => `${formatFcfa(v)} fictifs`}
              />
            )}
          />
          <Area isAnimationActive={false} type="monotone" dataKey="bankroll" name="Bankroll virtuelle" stroke={SERIES.s1} strokeWidth={2} fill="url(#bankrollFill)" dot={{ r: 3, fill: SERIES.s1 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
