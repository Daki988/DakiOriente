import { Check, Clock } from 'lucide-react'

/** Au lancement, seul le paiement à la livraison est ouvert ; les autres moyens sont annoncés. */
export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Paiement à la livraison', hint: 'Espèces remises au livreur', icon: '💵', soon: false },
  { id: 'airtel', label: 'Airtel Money', hint: 'Bientôt disponible', icon: '📱', soon: true },
  { id: 'moov', label: 'Moov Money', hint: 'Bientôt disponible', icon: '📲', soon: true },
  { id: 'card', label: 'Carte bancaire', hint: 'Bientôt disponible', icon: '💳', soon: true },
] as const

export type PaymentId = (typeof PAYMENT_METHODS)[number]['id']

export const paymentLabel = (id: string) => PAYMENT_METHODS.find((p) => p.id === id)?.label ?? id

export function PaymentPicker({ value, onChange }: { value: PaymentId; onChange: (id: PaymentId) => void; wallet?: number }) {
  return (
    <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Moyen de paiement">
      {PAYMENT_METHODS.map((m) => {
        const on = value === m.id && !m.soon
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-disabled={m.soon}
            disabled={m.soon}
            onClick={() => !m.soon && onChange(m.id)}
            className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left transition ${on ? 'border-neam-500 ring-2 ring-neam-500/20' : 'border-neutral-200'} ${m.soon ? 'cursor-not-allowed opacity-60' : 'hover:border-neam-300'}`}
          >
            <span className={`grid h-10 w-10 place-items-center rounded-xl bg-neutral-50 text-xl ${m.soon ? 'grayscale' : ''}`}>{m.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{m.label}</span>
              <span className="block text-xs text-neutral-500">{m.hint}</span>
            </span>
            {m.soon ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-500"><Clock size={12} /> À venir</span>
            ) : (
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-neam-500 bg-neam-500 text-white' : 'border-neutral-300'}`}>
                {on && <Check size={14} strokeWidth={3} />}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
