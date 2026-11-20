import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useApp } from '../store/AppContext'

export function Toasts() {
  const { toasts } = useApp()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--safe-top)+12px)] z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) =>
        t.error ? (
          <div key={t.id} role="alert" className="flex max-w-md animate-pop items-start gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-xl">
            <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            {t.text}
          </div>
        ) : (
          <div key={t.id} className="flex animate-pop items-center gap-2 rounded-full bg-neam-950/95 px-4 py-2.5 text-sm font-medium text-white shadow-xl ring-1 ring-neam-400/30">
            <CheckCircle2 size={18} className="text-neam-400" aria-hidden="true" />
            {t.text}
          </div>
        ),
      )}
    </div>
  )
}
