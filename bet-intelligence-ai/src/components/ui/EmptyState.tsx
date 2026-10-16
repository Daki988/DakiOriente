import type { ReactNode } from 'react';

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong px-6 py-10 text-center">
      {icon && <div className="mb-3 grid size-11 place-items-center rounded-xl bg-panel-2 text-muted">{icon}</div>}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
