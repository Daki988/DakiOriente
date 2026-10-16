import { AlertTriangle, FlaskConical, Info, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';

type NoticeTone = 'demo' | 'warn' | 'risk' | 'info';

const map = {
  demo: { cls: 'border-warn/30 bg-warn-soft text-[#f8c56a]', Icon: FlaskConical },
  warn: { cls: 'border-warn/30 bg-warn-soft text-[#f8c56a]', Icon: AlertTriangle },
  risk: { cls: 'border-risk/30 bg-risk-soft text-[#f59a9a]', Icon: ShieldAlert },
  info: { cls: 'border-info/30 bg-info-soft text-[#9cc3f3]', Icon: Info },
};

export function Notice({ tone = 'info', children, className = '' }: { tone?: NoticeTone; children: ReactNode; className?: string }) {
  const { cls, Icon } = map[tone];
  return (
    <div className={`flex gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed ${cls} ${className}`} role="note">
      <Icon size={15} className="mt-px shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function SyntheticDataNote({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-center gap-1.5 text-[11px] text-muted ${className}`}>
      <FlaskConical size={12} aria-hidden /> Graphique fondé sur des données synthétiques de démonstration.
    </p>
  );
}
