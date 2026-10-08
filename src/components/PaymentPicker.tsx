import { Check } from 'lucide-react'
import { fcfa } from '../lib/format'

export const PAYMENT_METHODS = [
  { id: 'wallet', label: 'NEAM Pay', hint: 'Portefeuille NEAM', icon: '💚' },
  { id: 'airtel', label: 'Airtel Money', hint: 'Paiement mobile', icon: '📱' },
  { id: 'moov', label: 'Moov Money', hint: 'Paiement mobile', icon: '📲' },
  { id: 'card', label: 'Carte bancaire', hint: 'Visa, Mastercard', icon: '💳' },
  { id: 'cash', label: 'À la livraison', hint: 'Espèces', icon: '💵' },
] as const

export type PaymentId = (typeof PAYMENT_METHODS)[number]['id']

export const paymentLabel = (id: string) => PAYMENT_METHODS.find((p) => p.id === id)?.label ?? id

export function PaymentPicker({ value, onChange, wallet }: { value: PaymentId; onChange: (id: PaymentId) => void; wallet: number }) {
  return (
    <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Moyen de paiement">
      {PAYMENT_METHODS.map((m) => {
        const on = value === m.id
        return (
          <button
            key={m.id}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(m.id)}
            className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left transition ${on ? 'border-neam-500 ring-2 ring-neam-500/20' : 'border-neutral-200 hover:border-neam-300'}`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-50 text-xl">{m.icon}</span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">{m.label}</span>
              <span className="block text-xs text-neutral-500">{m.id === 'wallet' ? `Solde : ${fcfa(wallet)}` : m.hint}</span>
            </span>
            <span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${on ? 'border-neam-500 bg-neam-500 text-white' : 'border-neutral-300'}`}>
              {on && <Check size={14} strokeWidth={3} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
