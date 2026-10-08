import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Check, ChevronRight, MessageCircle, Phone, Star } from 'lucide-react'
import { SERVICE_MAP, type ServiceId } from '../data/services'
import { ServiceSubHeader } from './service/ServiceLayout'
import { useApp, type Order } from '../store/AppContext'
import { fcfa, timeAgo } from '../lib/format'
import { PageHeader } from '../components/PageHeader'
import { PageShell } from '../components/Navigation'
import { ServiceBadge } from '../components/ServiceTile'
import { NeamMark } from '../components/Logo'

/** Mode démo : le suivi avance 10x plus vite que le temps réel. */
const DEMO_SPEED = 10

const STEPS = [
  { at: 0, label: 'Commande confirmée', hint: 'Le partenaire a reçu votre commande' },
  { at: 0.15, label: 'En préparation', hint: 'Votre commande est en cours de préparation' },
  { at: 0.5, label: 'En route', hint: 'Votre coursier NEAM arrive' },
  { at: 1, label: 'Livrée', hint: 'Bonne journée avec NEAM !' },
]

export function progressOf(o: Order, now = Date.now()) {
  // Un rendez-vous reste « à venir » : pas de suivi de livraison
  if (o.kind === 'rendez-vous') return 0
  return Math.min(1, ((now - o.createdAt) * DEMO_SPEED) / (o.etaMin * 60000))
}

const stepIndex = (p: number) => STEPS.reduce((idx, s, i) => (p >= s.at ? i : idx), 0)

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

export function Orders({ serviceId }: { serviceId?: ServiceId } = {}) {
  const { orders: all } = useApp()
  const orders = serviceId ? all.filter((o) => o.serviceId === serviceId) : all
  const svc = serviceId ? SERVICE_MAP[serviceId] : null
  const isRdv = !!svc && ['health', 'services', 'legal'].includes(svc.id)
  const now = useNow(3000)
  const [tab, setTab] = useState<'current' | 'past'>('current')
  const list = orders.filter((o) => (progressOf(o, now) < 1) === (tab === 'current'))

  const title = isRdv ? 'Mes rendez-vous' : svc?.id === 'express' ? 'Mes envois' : 'Mes commandes'
  const body = (
      <div className={svc ? 'p-4' : 'px-4'}>
        <div className="grid grid-cols-2 rounded-2xl bg-neutral-200/70 p-1 text-sm font-semibold">
          {(['current', 'past'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-xl py-2.5 transition ${tab === t ? 'bg-white text-neutral-900 shadow' : 'text-neutral-500'}`}>
              {t === 'current' ? (isRdv ? 'À venir' : 'En cours') : 'Historique'}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-neam-50 text-5xl">{tab === 'current' ? '🛵' : '🧾'}</div>
            <p className="mt-4 font-semibold">{tab === 'current' ? 'Aucune commande en cours' : 'Aucune commande passée'}</p>
            <p className="mt-1 text-sm text-neutral-500">{svc ? `Vos ${title.slice(4).toLowerCase()} ${svc.name} apparaîtront ici.` : 'Vos commandes NEAM apparaîtront ici.'}</p>
            <Link to={svc ? `/service/${svc.id}` : '/'} className="mt-6 rounded-full bg-neam-600 px-6 py-3 text-sm font-semibold text-white">Commander maintenant</Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {list.map((o) => {
              const s = SERVICE_MAP[o.serviceId]
              const p = progressOf(o, now)
              return (
                <li key={o.id}>
                  <Link to={`/commandes/${o.id}`} className="block rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <ServiceBadge service={s} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{s.name}</p>
                        <p className="text-xs text-neutral-500">#{o.id} · {o.slot ? `📅 ${o.slot}` : timeAgo(o.createdAt)}</p>
                      </div>
                      <ChevronRight size={18} className="text-neutral-400" />
                    </div>
                    <p className="mt-3 line-clamp-1 text-sm text-neutral-600">{o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p >= 1 ? 'bg-neutral-100 text-neutral-600' : 'bg-neam-50 text-neam-700'}`}>{o.kind === 'rendez-vous' ? 'Rendez-vous confirmé' : STEPS[stepIndex(p)].label}</span>
                      <span className="font-bold">{fcfa(o.total)}</span>
                    </div>
                    {p < 1 && o.kind !== 'rendez-vous' && (
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.max(6, p * 100)}%`, background: s.gradient }} />
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
  )

  if (svc)
    return (
      <>
        <ServiceSubHeader service={svc} title={title} />
        {body}
      </>
    )
  return (
    <PageShell>
      <PageHeader title="Mes commandes" subtitle={`${orders.length} commande${orders.length > 1 ? 's' : ''}`} />
      {body}
    </PageShell>
  )
}

export function OrderDetail() {
  const { id } = useParams()
  const { orders, toast } = useApp()
  const now = useNow()
  const [rating, setRating] = useState(0)
  const order = orders.find((o) => o.id === id)
  if (!order) return <Navigate to="/commandes" replace />

  const s = SERVICE_MAP[order.serviceId]
  const p = progressOf(order, now)
  const step = stepIndex(p)
  const remaining = Math.max(0, Math.ceil(order.etaMin * (1 - p)))
  // Position du coursier sur le trajet (entre 0.5 et 1 de progression)
  const ride = Math.min(1, Math.max(0, (p - 0.5) / 0.5))

  return (
    <PageShell>
      <PageHeader title={`Commande #${order.id}`} subtitle={s.name} />

      {order.kind === 'rendez-vous' ? (
        <div className="mx-4 rounded-3xl p-5 text-white shadow-lg" style={{ background: s.gradient }}>
          <p className="text-xs font-medium uppercase tracking-wider text-white/80">Rendez-vous confirmé</p>
          <p className="mt-1 text-2xl font-extrabold leading-tight first-letter:uppercase">{order.slot}</p>
          <p className="mt-2 text-sm text-white/90">📍 {order.address}</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => toast('Rappel ajouté : vous serez notifié 1 h avant')} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900">Me le rappeler</button>
            <button onClick={() => toast('Demande de report envoyée')} className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">Reporter</button>
          </div>
        </div>
      ) : (
      <div className="relative mx-4 h-56 overflow-hidden rounded-3xl bg-[#e8f1ec] ring-1 ring-black/5">
        <svg viewBox="0 0 400 220" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
          <rect width="400" height="220" fill="#e6efe9" />
          <path d="M0 160 Q120 150 200 175 T400 165 L400 220 L0 220Z" fill="#bfe0f2" />
          {[40, 110, 180, 250, 320].map((x) => <rect key={x} x={x} y="20" width="50" height="40" rx="6" fill="#d7e5dc" />)}
          {[70, 150, 230, 300].map((x) => <rect key={x} x={x} y="85" width="45" height="35" rx="6" fill="#d7e5dc" />)}
          <path d="M0 72 H400 M0 135 H400 M95 0 V220 M215 0 V220 M300 0 V220" stroke="#fff" strokeWidth="9" />
          <path id="route" d="M60 135 H215 V72 H340" fill="none" stroke={s.color} strokeWidth="5" strokeDasharray="10 7" strokeLinecap="round" />
        </svg>
        <div className="absolute left-[15%] top-[61%] -translate-x-1/2 -translate-y-1/2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg shadow-lg">{s.visual[0]}</span>
        </div>
        <div className="absolute left-[85%] top-[33%] -translate-x-1/2 -translate-y-full text-3xl drop-shadow">📍</div>
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000"
          style={{
            left: `${ride < 0.55 ? 15 + (ride / 0.55) * 38.75 : ride < 0.75 ? 53.75 : 53.75 + ((ride - 0.75) / 0.25) * 31.25}%`,
            top: `${ride < 0.55 ? 61 : ride < 0.75 ? 61 - ((ride - 0.55) / 0.2) * 28 : 33}%`,
          }}
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-neam-400 to-neam-700 shadow-xl ring-4 ring-white">
            <NeamMark mono className="h-5" />
          </span>
        </div>
        <div className="absolute bottom-3 left-3 rounded-2xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
          <p className="text-[11px] text-neutral-500">{p >= 1 ? 'Livrée' : 'Arrivée estimée'}</p>
          <p className="text-lg font-extrabold">{p >= 1 ? '✅' : `${remaining} min`}</p>
        </div>
      </div>
      )}

      <div className="space-y-4 px-4 pt-4">
        {order.kind !== 'rendez-vous' && <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <ol className="space-y-0">
            {STEPS.map((st, i) => {
              const done = i <= step
              return (
                <li key={st.label} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < STEPS.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 ${i < step ? 'bg-neam-500' : 'bg-neutral-200'}`} />}
                  <span className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full ${done ? 'bg-neam-500 text-white' : 'bg-neutral-100 text-neutral-400'} ${i === step && p < 1 ? 'ring-4 ring-neam-500/20' : ''}`}>
                    {done ? <Check size={15} strokeWidth={3} /> : <span className="h-2 w-2 rounded-full bg-current" />}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${done ? 'text-neutral-900' : 'text-neutral-400'}`}>{st.label}</p>
                    <p className="text-xs text-neutral-500">{st.hint}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>}

        {order.kind !== 'rendez-vous' && step >= 2 && p < 1 && (
          <section className="flex items-center gap-3 rounded-3xl bg-neam-950 p-4 text-white">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-neam-700 text-2xl">🧑🏾</span>
            <div className="flex-1">
              <p className="font-semibold">Junior M.</p>
              <p className="flex items-center gap-1 text-xs text-white/70"><Star size={12} className="fill-amber-400 text-amber-400" /> 4,9 · Coursier NEAM</p>
            </div>
            <button onClick={() => toast('Message envoyé au coursier')} aria-label="Envoyer un message" className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><MessageCircle size={18} /></button>
            <a href="tel:+24100000000" aria-label="Appeler le coursier" className="grid h-10 w-10 place-items-center rounded-full bg-neam-500"><Phone size={18} /></a>
          </section>
        )}

        {p >= 1 && order.kind !== 'rendez-vous' && (
          <section className="rounded-3xl bg-white p-4 text-center shadow-sm ring-1 ring-black/5">
            <p className="font-semibold">Comment s’est passée votre commande ?</p>
            <div className="mt-2 flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} aria-label={`${n} étoile${n > 1 ? 's' : ''}`} onClick={() => { setRating(n); toast('Merci pour votre avis !') }}>
                  <Star size={30} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'} />
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-3xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
          <h2 className="mb-2 font-bold">Récapitulatif</h2>
          <ul className="space-y-2">
            {order.lines.map((l, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-xl">{l.emoji}</span>
                <span className="flex-1">{l.qty}× {l.name}</span>
                <span className="font-medium">{fcfa(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-dashed border-neutral-200 pt-3 text-neutral-600">
            <div className="flex justify-between"><span>Livraison</span><span>{order.delivery ? fcfa(order.delivery) : 'Offerte'}</span></div>
            <div className="flex justify-between"><span>Paiement</span><span>{order.payment}</span></div>
            <div className="flex justify-between"><span>Adresse</span><span className="max-w-[60%] truncate text-right">{order.address}</span></div>
            {order.note && <div className="flex justify-between"><span>Note</span><span>{order.note}</span></div>}
            <div className="flex justify-between pt-1 text-base font-bold text-neutral-900"><span>Total</span><span>{fcfa(order.total)}</span></div>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
