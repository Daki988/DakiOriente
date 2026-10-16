/** Contenu de tooltip Recharts homogène avec l'interface sombre. */
interface Row {
  name?: string | number;
  value?: number | string | readonly (number | string)[];
  color?: string;
  dataKey?: string | number | ((obj: unknown) => unknown);
}

export function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: readonly Row[];
  label?: string | number;
  format?: (v: number, key: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-line-strong bg-night-2/95 px-3 py-2 text-xs shadow-xl">
      {label != null && label !== '' && <p className="mb-1 font-medium text-ink">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-ink-2">
          <span className="inline-block size-2 rounded-sm" style={{ background: p.color }} aria-hidden />
          <span>{p.name}</span>
          <span className="tabular ml-auto pl-3 font-medium text-ink">
            {typeof p.value === 'number' && format ? format(p.value, String(p.dataKey)) : String(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

export const AXIS_TICK = { fill: '#8590a5', fontSize: 11 };
export const GRID_STROKE = '#273044';
export const SERIES = { s1: '#3987e5', s2: '#d95926', s3: '#199e70', good: '#22c55e', risk: '#ef4444' };
