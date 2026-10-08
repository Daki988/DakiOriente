import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bike, MapPin, Minus, Plus, ShieldCheck, Tag, Trash2, Zap } from 'lucide-react'
import { PRODUCT_MAP, type Product } from '../data/products'
import { SERVICE_MAP, type ServiceId } from '../data/services'
import { useApp } from '../store/AppContext'
import { fcfa } from '../lib/format'
import { tap } from '../lib/native'
import { PageHeader } from '../components/PageHeader'
import { PageShell } from '../components/Navigation'
import { ServiceBadge } from '../components/ServiceTile'
import { PaymentPicker, paymentLabel, type PaymentId } from '../components/PaymentPicker'

const FREE_FROM = 15000

function useGroups() {
  const { cart } = useApp()
  return useMemo(() => {
    const map = new Map<ServiceId, { product: Product; qty: number }[]>()
    for (const l of cart) {
      const product = PRODUCT_MAP[l.productId]
      if (!product) continue
      map.set(product.serviceId, [...(map.get(product.serviceId) ?? []), { product, qty: l.qty }])
    }
    return [...map.entries()]
  }, [cart])
}

export function Cart() {
  const { cartTotal, setQty, clearCart } = useApp()
  const groups = useGroups()
  const navigate = useNavigate()

  if (!groups.length)
    return (
      <PageShell>
        <PageHeader title="Mon panier" />
        <div className="flex flex-col items-center px-8 py-20 text-center">
          <div className="grid h-28 w-28 place-items-center rounded-full bg-neam-50 text-6xl">🛒</div>
          <h2 className="mt-5 text-lg font-bold">Votre panier est vide</h2>
          <p className="mt-1 text-sm text-neutral-500">Découvrez nos services et ajoutez vos produits préférés.</p>
          <Link to="/" className="mt-6 rounded-full bg-neam-600 px-6 py-3 font-semibold text-white shadow-lg">Explorer NEAM</Link>
        </div>
      </PageShell>
    )

  const missing = Math.max(0, FREE_FROM - cartTotal)

  return (
    <PageShell className="pb-44">
      <PageHeader
        title="Mon panier"
        subtitle={`${groups.length} service${groups.length > 1 ? 's' : ''}`}
        right={<button onClick={clearCart} className="rounded-full px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50">Vider</button>}
      />
      <div className="space-y-4 px-4 pt-2">
        <div className="rounded-2xl bg-neam-50 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-neam-800">
            <Bike size={18} /> {missing ? <>Plus que <b>{fcfa(missing)}</b> pour la livraison offerte</> : <>Livraison offerte débloquée 🎉</>}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-neam-100">
            <div className="h-full rounded-full bg-gradient-to-r from-neam-400 to-neam-600 transition-all" style={{ width: `${Math.min(100, (cartTotal / FREE_FROM) * 100)}%` }} />
          </div>
        </div>

        {groups.map(([sid, lines]) => {
          const s = SERVICE_MAP[sid]
          return (
            <section key={sid} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="mb-3 flex items-center gap-3">
                <ServiceBadge service={s} size="sm" />
                <div>
                  <h2 className="font-bold">{s.name}</h2>
                  <p className="text-xs text-neutral-500">Livraison {s.eta}</p>
                </div>
              </div>
              <ul className="divide-y divide-neutral-100">
                {lines.map(({ product: p, qty }) => (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl" style={{ background: s.soft }}>{p.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-neutral-500">{p.unit}</p>
                      <p className="text-sm font-bold" style={{ color: s.color }}>{fcfa(p.price * qty)}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-xl bg-neutral-100 p-1">
                      <button aria-label="Diminuer" onClick={() => { tap(); setQty(p.id, qty - 1) }} className="grid h-8 w-8 place-items-center rounded-lg bg-white shadow-sm">
                        {qty === 1 ? <Trash2 size={15} className="text-red-500" /> : <Minus size={15} />}
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{qty}</span>
                      <button aria-label="Augmenter" onClick={() => { tap(); setQty(p.id, qty + 1) }} className="grid h-8 w-8 place-items-center rounded-lg bg-white shadow-sm">
                        <Plus size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 lg:sticky lg:mt-6">
        <div className="mx-auto max-w-3xl rounded-t-[28px] bg-white px-5 pb-[calc(16px+var(--safe-bottom))] pt-4 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.2)] lg:rounded-[28px]">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Sous-total</span>
            <span className="text-xl font-extrabold">{fcfa(cartTotal)}</span>
          </div>
          <button onClick={() => navigate('/checkout')} className="mt-3 w-full rounded-2xl bg-gradient-to-r from-neam-500 to-neam-700 py-4 font-semibold text-white shadow-lg transition active:scale-[0.98]">
            Passer la commande
          </button>
        </div>
      </div>
    </PageShell>
  )
}

const PROMOS: Record<string, number> = { NEAM20: 0.2, BIENVENUE: 0.1 }

export function Checkout() {
  const { city, cartTotal, wallet, placeOrder, clearCart, payWithWallet, toast } = useApp()
  const groups = useGroups()
  const navigate = useNavigate()
  const [address, setAddress] = useState('')
  const [fast, setFast] = useState(false)
  const [payment, setPayment] = useState<PaymentId>('airtel')
  const [code, setCode] = useState('')
  const [promo, setPromo] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)

  if (!groups.length && !paying) return <Cart />

  const deliveryPer = (sub: number) => (sub >= FREE_FROM ? 0 : 1000) + (fast ? 1500 : 0)
  const delivery = groups.reduce((n, [, lines]) => n + deliveryPer(lines.reduce((m, l) => m + l.product.price * l.qty, 0)), 0)
  const discount = promo ? Math.round((cartTotal * PROMOS[promo]) / 100) * 100 : 0
  const total = cartTotal + delivery - discount

  const applyCode = () => {
    const c = code.trim().toUpperCase()
    if (PROMOS[c]) {
      setPromo(c)
      toast(`Code ${c} appliqué`)
    } else setError('Code promo invalide.')
  }

  const confirm = () => {
    if (!address.trim()) return setError('Indiquez votre adresse ou votre quartier.')
    if (payment === 'wallet' && !payWithWallet(total)) return setError('Solde NEAM Pay insuffisant.')
    tap()
    setPaying(true)
    // Simulation de la validation du paiement (Mobile Money / carte)
    setTimeout(() => {
      let last = ''
      for (const [sid, lines] of groups) {
        const sub = lines.reduce((m, l) => m + l.product.price * l.qty, 0)
        const share = Math.round((discount * sub) / cartTotal)
        const del = deliveryPer(sub)
        const s = SERVICE_MAP[sid]
        last = placeOrder({
          serviceId: sid,
          lines: lines.map((l) => ({ name: l.product.name, emoji: l.product.emoji, qty: l.qty, price: l.product.price })),
          subtotal: sub,
          delivery: del,
          total: sub + del - share,
          payment: paymentLabel(payment),
          address: `${address.trim()}, ${city}`,
          etaMin: fast ? 20 : s.id === 'print' ? 90 : 40,
        }).id
      }
      clearCart()
      toast('Paiement accepté · commande confirmée')
      navigate(groups.length === 1 ? `/commandes/${last}` : '/commandes', { replace: true })
    }, 1400)
  }

  return (
    <PageShell className="pb-44">
      <PageHeader title="Validation" subtitle="Livraison et paiement" />
      <div className="space-y-5 px-4 pt-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">Adresse de livraison</h2>
          <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-black/5">
            <MapPin size={18} className="text-neam-600" />
            <input value={address} onChange={(e) => { setAddress(e.target.value); setError('') }} placeholder="Quartier, rue, point de repère…" className="flex-1 bg-transparent text-sm outline-none" />
            <span className="text-xs font-medium text-neutral-400">{city}</span>
          </label>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">Mode de livraison</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: false, icon: Bike, t: 'Standard', d: '30-50 min' },
              { v: true, icon: Zap, t: 'Express', d: '15-25 min · +1 500' },
            ].map(({ v, icon: Icon, t, d }) => (
              <button key={t} onClick={() => setFast(v)} className={`rounded-2xl border bg-white p-3 text-left transition ${fast === v ? 'border-neam-500 ring-2 ring-neam-500/20' : 'border-neutral-200'}`}>
                <Icon size={20} className="text-neam-600" />
                <p className="mt-1 text-sm font-semibold">{t}</p>
                <p className="text-xs text-neutral-500">{d}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">Paiement</h2>
          <PaymentPicker value={payment} onChange={(p) => { setPayment(p); setError('') }} wallet={wallet} />
        </section>

        <section className="flex gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 shadow-sm ring-1 ring-black/5">
            <Tag size={16} className="text-neutral-400" />
            <input value={code} onChange={(e) => { setCode(e.target.value); setError('') }} placeholder="Code promo (essayez NEAM20)" className="h-12 flex-1 bg-transparent text-sm uppercase outline-none placeholder:normal-case" />
          </label>
          <button onClick={applyCode} className="rounded-2xl bg-neam-950 px-5 text-sm font-semibold text-white">Appliquer</button>
        </section>

        <section className="space-y-2 rounded-3xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
          <div className="flex justify-between"><span className="text-neutral-500">Sous-total</span><span>{fcfa(cartTotal)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Livraison</span><span>{delivery ? fcfa(delivery) : 'Offerte'}</span></div>
          {discount > 0 && <div className="flex justify-between text-neam-700"><span>Réduction {promo}</span><span>-{fcfa(discount)}</span></div>}
          <div className="flex justify-between border-t border-dashed border-neutral-200 pt-2 text-base font-bold"><span>Total</span><span>{fcfa(total)}</span></div>
        </section>

        <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-500"><ShieldCheck size={14} className="text-neam-600" /> Paiement chiffré et sécurisé</p>
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">{error}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 lg:sticky lg:mt-6">
        <div className="mx-auto max-w-3xl rounded-t-[28px] bg-white px-5 pb-[calc(16px+var(--safe-bottom))] pt-4 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.2)] lg:rounded-[28px]">
          <button disabled={paying} onClick={confirm} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-neam-500 to-neam-700 py-4 font-semibold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-80">
            {paying ? (
              <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Validation du paiement…</>
            ) : (
              <>Payer {fcfa(total)}</>
            )}
          </button>
        </div>
      </div>
    </PageShell>
  )
}
