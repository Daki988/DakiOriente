import { useId, type ReactNode } from 'react';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  hint?: ReactNode;
  error?: string | null;
}

export function NumberField({ label, value, onChange, min, max, step = 1, suffix, hint, error }: NumberFieldProps) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-2">{label}</label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className="field-input tabular pr-10"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value === '' ? Number.NaN : Number(e.target.value))}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errId : undefined}
        />
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs text-muted">{suffix}</span>}
      </div>
      {error ? <p id={errId} className="mt-1 text-[11px] text-risk">{error}</p> : hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-ink">{label}</label>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-good' : 'bg-panel-3 ring-1 ring-line-strong'}`}
      >
        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

export function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-2">{label}</label>
      <select id={id} className="field-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}
