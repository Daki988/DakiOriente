import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, MapPin, Upload, Video } from 'lucide-react'
import { Sheet } from './Sheet'
import { PaymentPicker, paymentLabel, type PaymentId } from './PaymentPicker'
import { SERVICE_MAP } from '../data/services'
import type { Product } from '../data/products'
import { useApp } from '../store/AppContext'
import { fcfa } from '../lib/format'
import { tap } from '../lib/native'

const SLOTS = ['08:00', '09:30', '11:00', '13:30', '15:00', '16:30', '18:00']

function nextDays(n = 7) {
  const out: Date[] = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  for (let i = 0; i < n; i++) out.push(new Date(d.getTime() + i * 86400000))
  return out
}

export type Bookable = Pick<Product, 'serviceId' | 'name' | 'emoji' | 'price' | 'unit' | 'vendor'> & { from?: boolean }

/** Réservation d'une prestation : date, créneau, lieu, paiement → crée un rendez-vous. */
export function BookingSheet({ item, open, onClose }: { item: Bookable; open: boolean; onClose: () => void }) {
  const { city, wallet, placeOrder, payWithWallet, toast } = useApp()
  const navigate = useNavigate()
  const service = SERVICE_MAP[item.serviceId]
  const days = useMemo(() => nextDays(), [])
  const [day, setDay] = useState(0)
  const [slot, setSlot] = useState('')
  const [mode, setMode] = useState<'domicile' | 'visio'>(item.serviceId === 'health' || item.serviceId === 'legal' ? 'visio' : 'domicile')
  const [address, setAddress] = useState('')
  const [payment, setPayment] = useState<PaymentId>('airtel')
  const [error, setError] = useState('')
  const canVisio = item.serviceId === 'health' || item.serviceId === 'legal'

  const confirm = () => {
    if (!slot) return setError('Choisissez un créneau.')
    if (mode === 'domicile' && !address.trim()) return setError('Indiquez l’adresse de la prestation.')
    if (payment === 'wallet' && !payWithWallet(item.price)) return setError('Solde NEAM Pay insuffisant.')
    tap()
    const label = `${days[day].toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${slot}`
    const order = placeOrder({
      serviceId: item.serviceId,
      lines: [{ name: item.name, emoji: item.emoji, qty: 1, price: item.price }],
      subtotal: item.price,
      delivery: 0,
      total: item.price,
      payment: paymentLabel(payment),
      address: mode === 'visio' ? 'En visio (lien envoyé par SMS)' : `${address.trim()}, ${city}`,
      etaMin: 60,
      kind: 'rendez-vous',
      slot: label,
    })
    toast('Rendez-vous confirmé')
    onClose()
    navigate(`/commandes/${order.id}`)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Réserver">
      <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: service.soft }}>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-3xl shadow-sm">{item.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{item.name}</p>
          <p className="text-xs text-neutral-500">{item.unit} · {item.vendor}</p>
        </div>
        <p className="text-right text-sm font-bold" style={{ color: service.color }}>
          {item.from && <span className="block text-[10px] font-medium text-neutral-500">à partir de</span>}
          {fcfa(item.price)}
        </p>
      </div>

      <h4 className="mb-2 mt-5 text-sm font-semibold text-neutral-700">Date</h4>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {days.map((d, i) => (
          <button
            key={i}
            onClick={() => setDay(i)}
            className={`flex w-16 shrink-0 flex-col items-center rounded-2xl border py-2.5 transition ${day === i ? 'border-transparent text-white shadow-md' : 'border-neutral-200 bg-white'}`}
            style={day === i ? { background: service.gradient } : undefined}
          >
            <span className="text-[11px] capitalize opacity-80">{i === 0 ? 'Auj.' : d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
            <span className="text-lg font-bold">{d.getDate()}</span>
          </button>
        ))}
      </div>

      <h4 className="mb-2 mt-5 text-sm font-semibold text-neutral-700">Créneau</h4>
      <div className="grid grid-cols-4 gap-2">
        {SLOTS.map((s) => (
          <button
            key={s}
            onClick={() => { setSlot(s); setError('') }}
            className={`rounded-xl border py-2 text-sm font-medium transition ${slot === s ? 'border-transparent text-white' : 'border-neutral-200 bg-white'}`}
            style={slot === s ? { background: service.color } : undefined}
          >
            {s}
          </button>
        ))}
      </div>

      {canVisio && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          {([['visio', 'En visio', Video], ['domicile', 'Au cabinet / domicile', MapPin]] as const).map(([m, label, Ico]) => (
            <button key={m} onClick={() => setMode(m)} className="flex items-center gap-2 rounded-2xl border border-neutral-200 p-3 text-left text-sm font-medium" style={mode === m ? { borderColor: service.color, background: service.soft } : undefined}>
              <Ico size={18} style={{ color: service.color }} /> {label}
            </button>
          ))}
        </div>
      )}

      {mode === 'domicile' && (
        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
          <MapPin size={18} style={{ color: service.color }} />
          <input value={address} onChange={(e) => { setAddress(e.target.value); setError('') }} placeholder="Adresse, quartier, point de repère" className="flex-1 bg-transparent text-sm outline-none" />
        </label>
      )}

      <h4 className="mb-2 mt-5 text-sm font-semibold text-neutral-700">Paiement</h4>
      <PaymentPicker value={payment} onChange={setPayment} wallet={wallet} />

      {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">{error}</p>}
      <button onClick={confirm} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-white shadow-lg transition active:scale-[0.98]" style={{ background: service.gradient }}>
        <CalendarCheck size={19} /> Confirmer · {fcfa(item.price)}
      </button>
    </Sheet>
  )
}

/** Personnalisation NEAM Print : visuel, quantité, finition. */
export function CustomizeSheet({ product, open, onClose }: { product: Product; open: boolean; onClose: () => void }) {
  const { addToCart, toast } = useApp()
  const service = SERVICE_MAP[product.serviceId]
  const [file, setFile] = useState<string>('')
  const [qty, setQty] = useState(1)
  const [finish, setFinish] = useState('Standard')
  return (
    <Sheet open={open} onClose={onClose} title="Personnaliser">
      <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: service.soft }}>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-3xl shadow-sm">{product.emoji}</span>
        <div className="flex-1">
          <p className="font-semibold">{product.name}</p>
          <p className="text-xs text-neutral-500">{product.unit}</p>
        </div>
      </div>
      <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed p-6 text-center" style={{ borderColor: service.color + '55' }}>
        <Upload style={{ color: service.color }} />
        <span className="text-sm font-semibold">{file || 'Importer votre visuel ou logo'}</span>
        <span className="text-xs text-neutral-500">PNG, JPG ou PDF · notre équipe vérifie chaque fichier</span>
        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />
      </label>
      <h4 className="mb-2 mt-5 text-sm font-semibold text-neutral-700">Finition</h4>
      <div className="grid grid-cols-3 gap-2">
        {['Standard', 'Premium', 'Express 24 h'].map((f) => (
          <button key={f} onClick={() => setFinish(f)} className={`rounded-xl border py-2.5 text-sm font-medium ${finish === f ? 'border-transparent text-white' : 'border-neutral-200'}`} style={finish === f ? { background: service.color } : undefined}>{f}</button>
        ))}
      </div>
      <h4 className="mb-2 mt-5 text-sm font-semibold text-neutral-700">Quantité (lots)</h4>
      <div className="flex items-center gap-3">
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-11 w-11 rounded-xl bg-neutral-100 text-lg font-bold">−</button>
        <span className="w-8 text-center text-lg font-bold">{qty}</span>
        <button onClick={() => setQty((q) => q + 1)} className="h-11 w-11 rounded-xl bg-neutral-100 text-lg font-bold">+</button>
      </div>
      <button
        onClick={() => {
          addToCart(product, qty)
          toast(file ? `Visuel « ${file} » reçu · ajouté au panier` : 'Ajouté au panier · envoyez votre visuel plus tard')
          onClose()
        }}
        className="mt-6 w-full rounded-2xl py-4 font-semibold text-white shadow-lg"
        style={{ background: service.gradient }}
      >
        Ajouter au panier · {fcfa(product.price * qty)}
      </button>
    </Sheet>
  )
}
