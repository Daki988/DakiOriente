import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: 'good' | 'warn' | 'risk' | 'info' | 'neutral';
}

const iconTone = {
  good: 'text-good bg-good-soft',
  warn: 'text-warn bg-warn-soft',
  risk: 'text-risk bg-risk-soft',
  info: 'text-[#7fb2f0] bg-info-soft',
  neutral: 'text-ink-2 bg-panel-3',
};

export function StatCard({ label, value, hint, icon, tone = 'neutral' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        {icon && <span className={`grid size-8 place-items-center rounded-lg ${iconTone[tone]}`}>{icon}</span>}
      </div>
      <p className="tabular mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
