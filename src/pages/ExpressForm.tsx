import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, Circle, MapPin, Zap } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { fcfa } from '../lib/format'
import { tap } from '../lib/native'
import { PaymentPicker, paymentLabel, type PaymentId } from '../components/PaymentPicker'

const SIZES = [
  { id: 'doc', label: 'Document', emoji: '✉️', hint: '< 1 kg', price: 1500 },
  { id: 's', label: 'Petit colis', emoji: '📦', hint: '< 5 kg', price: 2500 },
  { id: 'm', label: 'Moyen', emoji: '🗃️', hint: '< 15 kg', price: 4000 },
  { id: 'l', label: 'Grand', emoji: '🛋️', hint: '< 40 kg', price: 7500 },
]

/** Distance fictive mais stable, calculée à partir des adresses saisies. */
const fakeKm = (a: string, b: string) => {
  let h = 0
  for (const ch of a + '|' + b) h = (h * 31 + ch.charCodeAt(0)) % 9973
  return 2 + (h % 14)
}

export default function ExpressForm() {
  const { city, wallet, placeOrder, payWithWallet, toast } = useApp()
  const navigate = useNavigate()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [size, setSize] = useState('s')
  const [urgent, setUrgent] = useState(false)
  const [payment, setPayment] = useState<PaymentId>('airtel')
  const [error, setError] = useState('')

  const km = from && to ? fakeKm(from, to) : 0
  const base = SIZES.find((s) => s.id === size)!.price
  const price = from && to ? Math.round((base + km * 250) * (urgent ? 1.5 : 1) / 100) * 100 : 0
  const eta = urgent ? 15 + km : 30 + km * 2

  const submit = () => {
    if (!from.trim() || !to.trim()) return setError('Indiquez les adresses de départ et d’arrivée.')
    if (payment === 'wallet' && !payWithWallet(price)) return setError('Solde NEAM Pay insuffisant.')
    tap()
    const s = SIZES.find((x) => x.id === size)!
    const order = placeOrder({
      serviceId: 'express',
      lines: [{ name: `${s.label} · ${from} → ${to}`, emoji: s.emoji, qty: 1, price }],
      subtotal: price,
      delivery: 0,
      total: price,
      payment: paymentLabel(payment),
      address: `${to}, ${city}`,
      etaMin: eta,
      note: urgent ? 'Course express prioritaire' : undefined,
    })
    toast('Coursier en route vers le point de retrait')
    navigate(`/commandes/${order.id}`)
  }

  return (
    <div className="relative -mt-8 space-y-4 px-4">
      <div className="rounded-3xl bg-white p-4 shadow-lg ring-1 ring-black/5">
        <h2 className="mb-3 font-bold">Envoyer un colis</h2>
        <label className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-3 py-3">
          <Circle size={16} className="fill-neam-500 text-neam-500" />
          <input value={from} onChange={(e) => { setFrom(e.target.value); setError('') }} placeholder={`Adresse de retrait (ex. Louis, ${city})`} className="flex-1 bg-transparent text-sm outline-none" />
        </label>
        <div className="flex justify-start pl-4 text-neutral-300"><ArrowDown size={18} /></div>
        <label className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-3 py-3">
          <MapPin size={16} className="text-red-500" />
          <input value={to} onChange={(e) => { setTo(e.target.value); setError('') }} placeholder="Adresse de livraison (ex. Glass)" className="flex-1 bg-transparent text-sm outline-none" />
        </label>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-neutral-700">Type d’envoi</h3>
        <div className="grid grid-cols-4 gap-2">
          {SIZES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSize(s.id)}
              className={`flex flex-col items-center rounded-2xl border bg-white p-2.5 text-center transition ${size === s.id ? 'border-neam-500 ring-2 ring-neam-500/20' : 'border-neutral-200'}`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="mt-1 text-[11px] font-semibold leading-tight">{s.label}</span>
              <span className="text-[10px] text-neutral-500">{s.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setUrgent((u) => !u)}
        className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${urgent ? 'border-neam-500 bg-neam-50' : 'border-neutral-200 bg-white'}`}
        aria-pressed={urgent}
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-neam-400 to-neam-700 text-white"><Zap size={20} /></span>
        <span className="flex-1">
          <span className="block text-sm font-semibold">Course prioritaire</span>
          <span className="block text-xs text-neutral-500">Un coursier dédié, sans arrêt intermédiaire (+50%)</span>
        </span>
        <span className={`h-7 w-12 rounded-full p-1 transition ${urgent ? 'bg-neam-500' : 'bg-neutral-300'}`}>
          <span className={`block h-5 w-5 rounded-full bg-white shadow transition ${urgent ? 'translate-x-5' : ''}`} />
        </span>
      </button>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-neutral-700">Paiement</h3>
        <PaymentPicker value={payment} onChange={setPayment} wallet={wallet} />
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">{error}</p>}

      <div className="sticky bottom-[calc(84px+var(--safe-bottom))] rounded-3xl bg-neam-950 p-4 text-white shadow-2xl lg:bottom-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">{km ? `${km} km · arrivée ≈ ${eta} min` : 'Saisissez vos adresses'}</span>
          <span className="text-lg font-bold">{price ? fcfa(price) : '—'}</span>
        </div>
        <button onClick={submit} className="mt-3 w-full rounded-2xl bg-neam-400 py-3.5 font-semibold text-neam-950 transition active:scale-[0.98]">
          Trouver un coursier
        </button>
      </div>
    </div>
  )
}
