import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Clock, MapPin, PackageSearch, ShoppingBag, Timer, Zap } from 'lucide-react'
import type { Service } from '../../data/services'
import { useApp, type Order } from '../../store/AppContext'
import { fcfa } from '../../lib/format'
import { tap } from '../../lib/native'
import { Sheet } from '../../components/Sheet'
import { PaymentPicker, paymentLabel, type PaymentId } from '../../components/PaymentPicker'
import { progressOf } from '../Orders'
import { ServiceHeader, ServiceSubHeader } from './ServiceLayout'

const TYPES = [
  { id: 'standard', label: 'Standard', hint: '24-48 h', icon: Clock, factor: 1, eta: 120 },
  { id: 'express', label: 'Express', hint: '2-6 h', icon: Zap, factor: 1.6, eta: 45 },
  { id: 'sameday', label: 'Same day', hint: 'Le jour même', icon: Timer, factor: 1.3, eta: 90 },
] as const

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

const TRACK = ['Collecte', 'En transit', 'En livraison', 'Livré']
const trackStep = (p: number) => (p >= 1 ? 3 : p >= 0.5 ? 2 : p >= 0.15 ? 1 : 0)

function useTick(ms = 2000) {
  const [, set] = useState(0)
  useEffect(() => {
    const t = setInterval(() => set((x) => x + 1), ms)
    return () => clearInterval(t)
  }, [ms])
}

export function ParcelTracker({ order, service }: { order: Order; service: Service }) {
  useTick()
  const p = progressOf(order)
  const step = trackStep(p)
  const left = Math.max(0, Math.ceil(order.etaMin * (1 - p)))
  return (
    <Link to={`/commandes/${order.id}`} className="block rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="relative flex justify-between">
        <div className="absolute left-[12%] right-[12%] top-[11px] h-1 rounded-full bg-neutral-200">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(step / 3) * 100}%`, background: service.color }} />
        </div>
        {TRACK.map((t, i) => (
          <div key={t} className="relative flex w-1/4 flex-col items-center gap-1.5">
            <span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${i <= step ? 'border-transparent text-white' : 'border-neutral-300 bg-white'}`} style={i <= step ? { background: service.color } : undefined}>
              {i <= step && <Check size={13} strokeWidth={3} />}
            </span>
            <span className="text-[11px] text-neutral-600">{t}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl p-3" style={{ background: service.soft }}>
        <span className="text-2xl">🛵</span>
        <div className="flex-1 text-sm">
          <p className="font-semibold">{p >= 1 ? 'Votre colis a été livré' : 'Votre colis est en cours de livraison'}</p>
          <p className="text-xs text-neutral-500">{p >= 1 ? `#${order.id}` : `Arrivée estimée : ${left} min · #${order.id}`}</p>
        </div>
        <ArrowRight size={16} className="text-neutral-400" />
      </div>
    </Link>
  )
}

export function ExpressHome({ service }: { service: Service }) {
  const { city, wallet, orders, placeOrder, payWithWallet, toast } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'send' | 'shop'>('send')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [size, setSize] = useState('s')
  const [type, setType] = useState<(typeof TYPES)[number]['id']>('express')
  const [items, setItems] = useState('')
  const [store, setStore] = useState('')
  const [budget, setBudget] = useState(10000)
  const [step, setStep] = useState<'form' | 'pay'>('form')
  const [payment, setPayment] = useState<PaymentId>('airtel')
  const [error, setError] = useState('')

  const t = TYPES.find((x) => x.id === type)!
  const km = from && to ? fakeKm(from, to) : 0
  const base = SIZES.find((s) => s.id === size)!.price
  const fee = tab === 'send' ? Math.round(((base + km * 250) * t.factor) / 100) * 100 : 2000 + Math.round((budget * 0.05) / 100) * 100
  const total = tab === 'send' ? fee : fee + budget
  const last = orders.find((o) => o.serviceId === 'express')

  const next = () => {
    if (tab === 'send' && (!from.trim() || !to.trim())) return setError('Indiquez l’adresse de ramassage et de livraison.')
    if (tab === 'shop' && (!items.trim() || !to.trim())) return setError('Indiquez votre liste et l’adresse de livraison.')
    setError('')
    setStep('pay')
  }

  const confirm = () => {
    if (payment === 'wallet' && !payWithWallet(total)) return setError('Solde NEAM Pay insuffisant.')
    tap()
    const s = SIZES.find((x) => x.id === size)!
    const order = placeOrder(
      tab === 'send'
        ? {
            serviceId: 'express',
            lines: [{ name: `${s.label} · ${from} → ${to}`, emoji: s.emoji, qty: 1, price: fee }],
            subtotal: fee, delivery: 0, total: fee, payment: paymentLabel(payment), address: `${to}, ${city}`, etaMin: t.eta, note: `Livraison ${t.label} (${t.hint})`,
          }
        : {
            serviceId: 'express',
            lines: [
              { name: `Courses : ${items.split('\n').filter(Boolean).join(', ')}`, emoji: '🛍️', qty: 1, price: budget },
              { name: 'Frais de course NEAM Express', emoji: '🛵', qty: 1, price: fee },
            ],
            subtotal: budget, delivery: fee, total, payment: paymentLabel(payment), address: `${to}, ${city}`, etaMin: t.eta, note: store ? `Achats chez ${store}` : 'Le coursier choisit le meilleur commerce',
          },
    )
    toast('Coursier en route vers le point de retrait')
    setStep('form')
    navigate(`/commandes/${order.id}`)
  }

  const input = 'flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400'
  return (
    <>
      <ServiceHeader service={service} search={false} location />
      <div className="space-y-4 px-4">
        <div className="grid grid-cols-2 gap-2">
          {([['send', 'Envoyer un colis'], ['shop', 'Commander pour moi']] as const).map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setError('') }} className={`rounded-2xl py-3 text-sm font-semibold transition ${tab === id ? 'text-white shadow-md' : 'bg-white text-neutral-700 ring-1 ring-neutral-200'}`} style={tab === id ? { background: service.color } : undefined}>
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-2 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-black/5">
          {tab === 'send' ? (
            <label className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-3 py-2.5">
              <PackageSearch size={18} className="text-neutral-500" />
              <span className="flex flex-1 flex-col">
                <span className="text-[11px] font-semibold text-neutral-700">Adresse de ramassage</span>
                <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Votre adresse" className={input} />
              </span>
            </label>
          ) : (
            <>
              <label className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-3 py-2.5">
                <ShoppingBag size={18} className="text-neutral-500" />
                <span className="flex flex-1 flex-col">
                  <span className="text-[11px] font-semibold text-neutral-700">Où acheter ? (facultatif)</span>
                  <input value={store} onChange={(e) => setStore(e.target.value)} placeholder="Pharmacie, supermarché, marché…" className={input} />
                </span>
              </label>
              <textarea value={items} onChange={(e) => setItems(e.target.value)} rows={3} placeholder={'Votre liste, une ligne par article\nex. 2 baguettes\n1 paquet de sucre'} className="w-full rounded-2xl bg-neutral-50 px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400" />
              <label className="block rounded-2xl bg-neutral-50 px-3 py-2.5 text-[11px] font-semibold text-neutral-700">
                Budget maximum : {fcfa(budget)}
                <input type="range" min={2000} max={100000} step={1000} value={budget} onChange={(e) => setBudget(+e.target.value)} className="mt-1 w-full" style={{ accentColor: service.color }} />
              </label>
            </>
          )}
          <label className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-3 py-2.5">
            <MapPin size={18} className="text-neutral-500" />
            <span className="flex flex-1 flex-col">
              <span className="text-[11px] font-semibold text-neutral-700">Adresse de livraison</span>
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={tab === 'send' ? 'Adresse du destinataire' : 'Votre adresse'} className={input} />
            </span>
          </label>
        </div>

        {tab === 'send' && (
          <div className="grid grid-cols-4 gap-2">
            {SIZES.map((s) => (
              <button key={s.id} onClick={() => setSize(s.id)} className="flex flex-col items-center rounded-2xl border bg-white p-2 text-center" style={{ borderColor: size === s.id ? service.color : '#e5e5e5' }}>
                <span className="text-2xl">{s.emoji}</span>
                <span className="mt-0.5 text-[11px] font-semibold leading-tight">{s.label}</span>
                <span className="text-[10px] text-neutral-500">{s.hint}</span>
              </button>
            ))}
          </div>
        )}

        <div>
          <h3 className="mb-2 font-bold">Type de service</h3>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((x) => {
              const on = x.id === type
              return (
                <button key={x.id} onClick={() => setType(x.id)} className={`flex flex-col items-center gap-1 rounded-2xl py-3 transition ${on ? 'text-white shadow-md' : 'bg-white ring-1 ring-neutral-200'}`} style={on ? { background: service.color } : undefined}>
                  <x.icon size={20} />
                  <span className="text-sm font-semibold">{x.label}</span>
                  <span className={`text-[11px] ${on ? 'text-white/80' : 'text-neutral-500'}`}>{x.hint}</span>
                </button>
              )
            })}
          </div>
        </div>

        {error && step === 'form' && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">{error}</p>}
        <button onClick={next} className="flex w-full items-center justify-between rounded-2xl px-5 py-4 font-semibold text-white shadow-lg" style={{ background: service.color }}>
          <span>Continuer</span>
          <span>{tab === 'send' && !km ? '' : fcfa(total)}</span>
        </button>

        {last && (
          <section>
            <h3 className="mb-2 font-bold">Suivi de votre colis</h3>
            <ParcelTracker order={last} service={service} />
          </section>
        )}
      </div>

      <Sheet open={step === 'pay'} onClose={() => setStep('form')} title="Récapitulatif">
        <div className="space-y-2 rounded-2xl p-4 text-sm" style={{ background: service.soft }}>
          {tab === 'send' ? (
            <>
              <p className="flex justify-between"><span className="text-neutral-600">Trajet</span><span className="font-medium">{from} → {to}</span></p>
              <p className="flex justify-between"><span className="text-neutral-600">Distance</span><span className="font-medium">{km} km</span></p>
            </>
          ) : (
            <p className="flex justify-between"><span className="text-neutral-600">Courses (budget max)</span><span className="font-medium">{fcfa(budget)}</span></p>
          )}
          <p className="flex justify-between"><span className="text-neutral-600">Service</span><span className="font-medium">{t.label} · {t.hint}</span></p>
          <p className="flex justify-between border-t border-black/5 pt-2 text-base font-bold"><span>Total</span><span>{fcfa(total)}</span></p>
        </div>
        <h4 className="mb-2 mt-5 text-sm font-semibold text-neutral-700">Paiement</h4>
        <PaymentPicker value={payment} onChange={setPayment} wallet={wallet} />
        {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
        <button onClick={confirm} className="mt-5 w-full rounded-2xl py-4 font-semibold text-white shadow-lg" style={{ background: service.gradient }}>Trouver un coursier</button>
      </Sheet>
    </>
  )
}

export function ExpressTracking({ service }: { service: Service }) {
  const { orders } = useApp()
  const [code, setCode] = useState('')
  const list = orders.filter((o) => o.serviceId === 'express' && (!code || o.id.includes(code.trim().toUpperCase())))
  return (
    <>
      <ServiceSubHeader service={service} title="Suivi de colis">
        <label className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-neutral-800">
          <PackageSearch size={18} className="text-neutral-500" />
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Numéro de suivi (ex. NM123456)" className="flex-1 bg-transparent text-sm outline-none" />
        </label>
      </ServiceSubHeader>
      <div className="space-y-3 p-4">
        {list.map((o) => <ParcelTracker key={o.id} order={o} service={service} />)}
        {!list.length && (
          <div className="py-16 text-center text-neutral-500">
            <div className="text-5xl">📦</div>
            <p className="mt-3 font-medium">Aucun envoi à suivre</p>
            <Link to={`/service/express`} className="mt-4 inline-block rounded-full px-5 py-2.5 text-sm font-semibold text-white" style={{ background: service.color }}>Envoyer un colis</Link>
          </div>
        )}
      </div>
    </>
  )
}

export function ExpressPricing({ service }: { service: Service }) {
  return (
    <>
      <ServiceSubHeader service={service} title="Nos tarifs" />
      <div className="space-y-4 p-4">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full text-sm">
            <thead style={{ background: service.soft }}>
              <tr className="text-left text-xs text-neutral-600">
                <th className="px-4 py-3">Envoi</th>
                {TYPES.map((t) => <th key={t.id} className="px-2 py-3 text-right">{t.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {SIZES.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3"><span className="mr-1">{s.emoji}</span> {s.label} <span className="block text-[11px] text-neutral-500">{s.hint}</span></td>
                  {TYPES.map((t) => <td key={t.id} className="px-2 py-3 text-right font-semibold">{fcfa(Math.round((s.price * t.factor) / 100) * 100)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="rounded-2xl bg-white p-4 text-sm text-neutral-600 ring-1 ring-black/5">
          + 250 FCFA par kilomètre. Assurance incluse jusqu’à 100 000 FCFA. Livraison partout au Gabon : Libreville, Port-Gentil, Franceville, Oyem…
        </p>
      </div>
    </>
  )
}
