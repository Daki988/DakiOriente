import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Bike, Check, ChevronRight, KeyRound, MapPin, Package, Phone, Store, X } from 'lucide-react'
import { SERVICE_MAP } from '../data/services'
import { fcfa, timeAgo, formatPhone } from '../lib/format'
import { PageHeader } from '../components/PageHeader'
import { PageShell } from '../components/Navigation'
import { ServiceBadge } from '../components/ServiceTile'
import { ServiceSubHeader } from '../pages/service/ServiceLayout'
import { useApp } from '../store/AppContext'
import { useAuth } from './auth'
import { PhoneLogin } from './PhoneLogin'
import { useLiveQuery } from './realtime'
import { ACTIVE_STATUSES, errMsg, ORDER_SELECT, sb, STATUS_LABEL, STATUS_TONE, type LiveOrder, type OrderStatus } from './supabase'

const svc = (o: LiveOrder) => SERVICE_MAP[o.kind]

export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>
}

/** Mes commandes (Market + Express), en temps réel. */
export function LiveOrders({ kind }: { kind?: 'market' | 'express' }) {
  const { session, ready } = useAuth()
  const [tab, setTab] = useState<'current' | 'past'>('current')
  const uid = session?.user.id
  const { data: orders, loading } = useLiveQuery<LiveOrder[]>(
    `client-orders-${uid}-${kind}`,
    async () => {
      if (!uid) return []
      let q = sb().from('orders').select(ORDER_SELECT).eq('client_id', uid).order('created_at', { ascending: false }).limit(50)
      if (kind) q = q.eq('kind', kind)
      const { data, error } = await q
      if (error) throw error
      return data as LiveOrder[]
    },
    uid ? [{ table: 'orders', filter: `client_id=eq.${uid}` }] : [],
    [],
  )
  const list = orders.filter((o) => ACTIVE_STATUSES.includes(o.status) === (tab === 'current'))
  const title = kind === 'express' ? 'Mes envois' : 'Mes commandes'

  const body = !ready ? null : !uid ? (
    <div className="mx-4 mt-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <PhoneLogin title="Connectez-vous" subtitle="Pour retrouver vos commandes, connectez-vous avec votre numéro." />
    </div>
  ) : (
    <div className="px-4 pt-2">
      <div className="grid grid-cols-2 rounded-2xl bg-neutral-200/70 p-1 text-sm font-semibold">
        {(['current', 'past'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl py-2.5 transition ${tab === t ? 'bg-white text-neutral-900 shadow' : 'text-neutral-500'}`}>
            {t === 'current' ? 'En cours' : 'Historique'}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="mt-4 space-y-3">{[0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-neutral-200/70" />)}</div>
      ) : !list.length ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-neam-50 text-5xl">{tab === 'current' ? '🛵' : '🧾'}</div>
          <p className="mt-4 font-semibold">{tab === 'current' ? 'Aucune commande en cours' : 'Aucune commande passée'}</p>
          <Link to={kind === 'express' ? '/service/express' : '/service/market'} className="mt-6 rounded-full bg-neam-600 px-6 py-3 text-sm font-semibold text-white">Commander</Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((o) => (
            <li key={o.id}>
              <Link to={`/suivi/${o.id}`} className="block rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
                <div className="flex items-center gap-3">
                  <ServiceBadge service={svc(o)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{o.kind === 'market' ? o.stores?.name ?? 'NEAM Market' : 'Envoi NEAM Express'}</p>
                    <p className="text-xs text-neutral-500">#{o.code} · {timeAgo(new Date(o.created_at).getTime())}</p>
                  </div>
                  <ChevronRight size={18} className="text-neutral-400" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <StatusPill status={o.status} />
                  <span className="font-bold">{fcfa(o.total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  if (kind) return <><ServiceSubHeader service={SERVICE_MAP[kind]} title={title} />{body}</>
  return (
    <PageShell>
      <PageHeader title={title} subtitle="NEAM Market et NEAM Express" />
      {body}
    </PageShell>
  )
}

const MARKET_STEPS: { s: OrderStatus[]; label: string; hint: string }[] = [
  { s: ['pending'], label: 'Commande envoyée', hint: 'La boutique va confirmer votre commande' },
  { s: ['accepted'], label: 'En préparation', hint: 'La boutique prépare vos articles' },
  { s: ['ready', 'assigned'], label: 'Prête / livreur affecté', hint: 'Un livreur NEAM va récupérer la commande' },
  { s: ['picked_up'], label: 'En route', hint: 'Votre livreur arrive' },
  { s: ['delivered'], label: 'Livrée', hint: 'Merci d’avoir commandé avec NEAM !' },
]
const EXPRESS_STEPS: typeof MARKET_STEPS = [
  { s: ['pending'], label: 'Envoi enregistré', hint: 'Nous affectons un livreur' },
  { s: ['assigned'], label: 'Livreur en route vers le ramassage', hint: 'Préparez votre colis' },
  { s: ['picked_up'], label: 'Colis récupéré', hint: 'En route vers le destinataire' },
  { s: ['delivered'], label: 'Livré', hint: 'Le destinataire a reçu le colis' },
]

type Courier = { full_name: string; phone: string | null; vehicle: string; lat: number | null; lng: number | null; location_at: string | null }

/** Suivi d'une commande réelle, mis à jour en direct. */
export function LiveTracking() {
  const { id = '' } = useParams()
  const { toast } = useApp()
  const [busy, setBusy] = useState(false)
  const { data, loading, reload } = useLiveQuery<{ order: LiveOrder | null; code: string | null; courier: Courier | null; events: { status: OrderStatus; created_at: string; note: string | null }[] }>(
    `track-${id}`,
    async () => {
      const [{ data: order, error }, { data: secret }, { data: events }] = await Promise.all([
        sb().from('orders').select(ORDER_SELECT).eq('id', id).maybeSingle(),
        sb().from('order_secrets').select('delivery_code').eq('order_id', id).maybeSingle(),
        sb().from('order_events').select('status, created_at, note').eq('order_id', id).order('id'),
      ])
      if (error) throw error
      let courier: Courier | null = null
      if (order?.courier_id) courier = ((await sb().rpc('courier_public', { p_order: id })).data as Courier[] | null)?.[0] ?? null
      return { order: order as LiveOrder | null, code: secret?.delivery_code ?? null, courier, events: (events ?? []) as never }
    },
    [{ table: 'orders', filter: `id=eq.${id}` }, { table: 'order_events', filter: `order_id=eq.${id}` }, { table: 'couriers' }],
    { order: null, code: null, courier: null, events: [] },
  )

  if (loading) return <PageShell><PageHeader title="Suivi" /><div className="mx-4 h-64 animate-pulse rounded-3xl bg-neutral-200/70" /></PageShell>
  if (!data.order) return <Navigate to="/commandes" replace />
  const o = data.order
  const s = svc(o)
  const steps = o.kind === 'market' ? MARKET_STEPS : EXPRESS_STEPS
  const stepIdx = Math.max(0, steps.findIndex((x) => x.s.includes(o.status)))
  const closed = ['delivered', 'cancelled', 'rejected'].includes(o.status)
  const failed = o.status === 'cancelled' || o.status === 'rejected'

  const cancel = async () => {
    setBusy(true)
    const { error } = await sb().rpc('cancel_my_order', { p_order: o.id, p_reason: 'Annulée par le client' })
    setBusy(false)
    if (error) return toast(errMsg(error))
    toast('Commande annulée')
    reload()
  }

  return (
    <PageShell>
      <PageHeader title={`Commande #${o.code}`} subtitle={o.kind === 'market' ? o.stores?.name ?? s.name : s.name} />
      <div className="space-y-4 px-4 pt-1">
        <section className="rounded-3xl p-5 text-white shadow-lg" style={{ background: failed ? 'linear-gradient(145deg,#ef4444,#b91c1c)' : s.gradient }}>
          <p className="text-xs font-medium uppercase tracking-wider text-white/80">{failed ? 'Commande' : closed ? 'Terminé' : 'En cours'}</p>
          <p className="mt-1 text-2xl font-extrabold leading-tight">{failed ? STATUS_LABEL[o.status] : steps[stepIdx].label}</p>
          <p className="mt-1 text-sm text-white/90">{failed ? o.cancel_reason : steps[stepIdx].hint}</p>
        </section>

        {!closed && data.code && (
          <section className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-2 ring-neam-500/30">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-neam-50 text-neam-700"><KeyRound /></span>
            <div className="flex-1">
              <p className="text-xs text-neutral-500">Code de remise à donner au livreur</p>
              <p className="text-3xl font-extrabold tracking-[0.3em] text-neutral-900">{data.code}</p>
            </div>
          </section>
        )}

        {data.courier && !closed && (
          <section className="rounded-3xl bg-neam-950 p-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-neam-700"><Bike /></span>
              <div className="flex-1">
                <p className="font-semibold">{data.courier.full_name || 'Votre livreur NEAM'}</p>
                <p className="text-xs text-white/70">{data.courier.vehicle} · Livreur NEAM</p>
              </div>
              {data.courier.phone && <a href={`tel:+${data.courier.phone}`} aria-label="Appeler le livreur" className="grid h-11 w-11 place-items-center rounded-full bg-neam-500"><Phone size={19} /></a>}
            </div>
            {data.courier.phone && <p className="mt-2 select-all text-sm text-white/80">{formatPhone(data.courier.phone)}</p>}
            {data.courier.lat != null && data.courier.lng != null && (
              <a
                href={`https://www.openstreetmap.org/?mlat=${data.courier.lat}&mlon=${data.courier.lng}#map=17/${data.courier.lat}/${data.courier.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-2"><MapPin size={16} /> Position {data.courier.location_at ? timeAgo(new Date(data.courier.location_at).getTime()) : ''}</span>
                <span className="font-semibold text-neam-300">Voir sur la carte</span>
              </a>
            )}
          </section>
        )}

        {!failed && (
          <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <ol>
              {steps.map((st, i) => {
                const done = i <= stepIdx && !failed
                return (
                  <li key={st.label} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < steps.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 ${i < stepIdx ? 'bg-neam-500' : 'bg-neutral-200'}`} />}
                    <span className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full ${done ? 'bg-neam-500 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                      {done ? <Check size={15} strokeWidth={3} /> : <span className="h-2 w-2 rounded-full bg-current" />}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${done ? '' : 'text-neutral-400'}`}>{st.label}</p>
                      {i === stepIdx && <p className="text-xs text-neutral-500">{st.hint}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        <section className="rounded-3xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
          <h2 className="mb-2 font-bold">Récapitulatif</h2>
          {o.kind === 'market' ? (
            <ul className="space-y-2">
              {o.order_items?.map((l) => (
                <li key={l.id} className="flex items-center gap-2">
                  <span className="text-xl">{l.emoji}</span>
                  <span className="flex-1">{l.qty}× {l.name}</span>
                  <span className="font-medium">{fcfa(l.price * l.qty)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-start gap-2"><Package size={16} className="mt-0.5 shrink-0" /> {o.pickup_address} → {o.address}</p>
          )}
          <div className="mt-3 space-y-1 border-t border-dashed border-neutral-200 pt-3 text-neutral-600">
            {o.kind === 'market' && <div className="flex justify-between"><span>Articles</span><span>{fcfa(o.items_total)}</span></div>}
            <div className="flex justify-between"><span>Livraison</span><span>{o.delivery_fee ? fcfa(o.delivery_fee) : 'Offerte'}</span></div>
            <div className="flex justify-between"><span>Adresse</span><span className="max-w-[60%] text-right">{o.address}</span></div>
            {o.stores && <div className="flex justify-between"><span className="flex items-center gap-1"><Store size={14} /> Boutique</span><span>{o.stores.name}</span></div>}
            <div className="flex justify-between pt-1 text-base font-bold text-neutral-900"><span>{o.status === 'delivered' ? 'Payé à la livraison' : 'À payer à la livraison'}</span><span>{fcfa(o.total)}</span></div>
          </div>
        </section>

        {o.status === 'pending' && (
          <button disabled={busy} onClick={cancel} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-semibold text-red-600 ring-1 ring-red-200 disabled:opacity-60">
            <X size={18} /> Annuler la commande
          </button>
        )}
        <p className="pb-2 text-center text-xs text-neutral-400">Mise à jour en direct · {data.events.length} étape{data.events.length > 1 ? 's' : ''}</p>
      </div>
    </PageShell>
  )
}
