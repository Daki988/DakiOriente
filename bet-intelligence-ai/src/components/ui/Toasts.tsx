import { X } from 'lucide-react';
import { useApp } from '../../hooks/useAppStore';

const tone = {
  good: 'border-good/40',
  warn: 'border-warn/40',
  risk: 'border-risk/40',
  info: 'border-info/40',
};

export function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed right-4 bottom-20 z-[60] flex w-[min(92vw,360px)] flex-col gap-2 lg:bottom-6" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`pointer-events-auto flex animate-slide-up items-start gap-3 rounded-xl border bg-panel-2 px-4 py-3 text-sm text-ink shadow-xl ${tone[t.tone]}`}>
          <p className="flex-1">{t.message}</p>
          <button type="button" onClick={() => dismissToast(t.id)} className="text-muted hover:text-ink" aria-label="Fermer la notification">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
