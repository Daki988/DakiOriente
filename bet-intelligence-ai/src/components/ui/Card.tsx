import type { ReactNode } from 'react';

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Card({ title, subtitle, actions, children, className = '', bodyClassName = '' }: CardProps) {
  return (
    <section className={`rounded-2xl border border-line bg-panel shadow-[0_1px_0_#ffffff08_inset] ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
