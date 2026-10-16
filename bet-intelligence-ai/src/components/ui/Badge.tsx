import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, CircleDashed, XCircle, Info } from 'lucide-react';
import type { DataQuality, TicketStatus } from '../../types';
import { STATUS_LABELS } from '../../services/ticketService';

export type Tone = 'good' | 'warn' | 'risk' | 'info' | 'neutral';

const toneClass: Record<Tone, string> = {
  good: 'bg-good-soft text-good ring-good/25',
  warn: 'bg-warn-soft text-warn ring-warn/25',
  risk: 'bg-risk-soft text-risk ring-risk/25',
  info: 'bg-info-soft text-[#7fb2f0] ring-info/25',
  neutral: 'bg-panel-3 text-ink-2 ring-line-strong',
};

export function Badge({ tone = 'neutral', children, icon }: { tone?: Tone; children: ReactNode; icon?: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${toneClass[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

const qualityMeta: Record<DataQuality, { tone: Tone; label: string }> = {
  HIGH: { tone: 'good', label: 'Données élevées' },
  MEDIUM: { tone: 'warn', label: 'Données moyennes' },
  LOW: { tone: 'risk', label: 'Données faibles' },
};

/** Indicateur de qualité des données : couleur + icône + libellé (jamais la couleur seule). */
export function QualityBadge({ quality, compact = false }: { quality: DataQuality; compact?: boolean }) {
  const m = qualityMeta[quality];
  const Icon = quality === 'HIGH' ? CheckCircle2 : quality === 'MEDIUM' ? AlertTriangle : XCircle;
  return (
    <Badge tone={m.tone} icon={<Icon size={12} aria-hidden />}>
      {compact ? m.label.replace('Données ', '') : m.label}
    </Badge>
  );
}

const statusMeta: Record<TicketStatus, { tone: Tone; Icon: typeof Info }> = {
  PENDING: { tone: 'info', Icon: CircleDashed },
  WON_SIM: { tone: 'good', Icon: CheckCircle2 },
  LOST_SIM: { tone: 'risk', Icon: XCircle },
  WON: { tone: 'good', Icon: CheckCircle2 },
  LOST: { tone: 'risk', Icon: XCircle },
  CANCELLED: { tone: 'neutral', Icon: XCircle },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const { tone, Icon } = statusMeta[status];
  return (
    <Badge tone={tone} icon={<Icon size={12} aria-hidden />}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function DemoBadge() {
  return <Badge tone="warn">Démo</Badge>;
}
