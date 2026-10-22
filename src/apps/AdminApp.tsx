import { Fragment, useMemo, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { BadgeCheck, Bike, ClipboardList, LayoutDashboard, MapPin, Search, Settings, Store, Users } from 'lucide-react'
import { formatPhone, money, timeAgo } from '../lib/format'
import { Sheet } from '../components/Sheet'
import { useLiveQuery } from '../live/realtime'
import { ACTIVE_STATUSES, errMsg, ORDER_SELECT, sb, STATUS_LABEL, type LiveOrder, type OrderStatus } from '../live/supabase'
import { StatusPill } from '../live/ClientOrders'
import { useApp } from '../store/AppContext'
import { Card, Empty, PageTitle, STAFF_APPS, StaffGate, StaffShell } from './staff'

const APP = STAFF_APPS.admin

type CourierRow = { id: string; full_name: string; phone: string; vehicle: string; plate: string; is_online: boolean; is_active: boolean; lat: number | null; lng: number | null; location_at: string | null; active_orders: number; delivered_today: number; cash_due: number }

const needsDispatch = (o: LiveOrder) => !o.courier_id && ((o.kind === 'market' && (o.status === 'accepted' || o.status === 'ready')) || (o.kind === 'express' && o.status === 'pending'))
const btn = 'rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-50'
const field = 'h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400'

function useCouriers() {
  return useLiveQuery<CourierRow[]>('admin-couriers', async () => ((await sb().rpc('admin_couriers')).data ?? []) as CourierRow[], [{ table: 'couriers' }, { table: 'orders' }], [])
}

// ---------------- Détail commande + affectation ----------------
function OrderSheet({ order, onClose, couriers }: { order: LiveOrder; onClose: () => void; couriers: CourierRow[] }) {
  const { toast } = useApp()
  const [courier, setCourier] = useState(order.courier_id ?? '')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const { data: events } = useLiveQuery<{ id: number; status: OrderStatus; note: string | null; created_at: string }[]>(
    `admin-ev-${order.id}`,
    async () => ((await sb().from('order_events').select('id, status, note, created_at').eq('order_id', order.id).order('id')).data ?? []) as never,
    [{ table: 'order_events', filter: `order_id=eq.${order.id}` }],
    [],
  )
  const canAssign = needsDispatch(order) || order.status === 'assigned'
  const open = !['delivered', 'cancelled', 'rejected'].includes(order.status)
  const assign = async () => {
    setBusy(true)
    const { error } = await sb().rpc('admin_assign_courier', { p_order: order.id, p_courier: courier })
    setBusy(false)
    if (error) return toast(errMsg(error))
    toast('Livreur affecté')
    onClose()
  }
  const cancel = async () => {
    if (!reason.trim()) return toast('Indiquez le motif de l’annulation')
    setBusy(true)
    const { error } = await sb().rpc('admin_cancel_order', { p_order: order.id, p_reason: reason.trim() })
    setBusy(false)
    if (error) return toast(errMsg(error))
    toast('Commande annulée')
    onClose()
  }
  const sorted = [...couriers].filter((c) => c.is_active).sort((a, b) => Number(b.is_online) - Number(a.is_online) || a.active_orders - b.active_orders)
  return (
    <Sheet open onClose={onClose} title={`Commande #${order.code}`}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusPill status={order.status} />
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{order.kind === 'market' ? 'NEAM Market' : 'NEAM Express'}</span>
        <span className="text-xs text-neutral-500">{new Date(order.created_at).toLocaleString('fr-FR')}</span>
      </div>
      <div className="mt-3 space-y-1.5 rounded-2xl bg-neutral-50 p-3 text-sm">
        {order.kind === 'market' ? <p><b>Boutique :</b> {order.stores?.name} ({order.stores?.district})</p> : <p><b>Ramassage :</b> {order.pickup_address}</p>}
        <p><b>Livraison :</b> {order.address}</p>
        <p><b>Client :</b> {order.contact_name || '—'} · <span className="select-all">{formatPhone(order.contact_phone)}</span></p>
        {order.note && <p><b>Note :</b> {order.note}</p>}
        <p><b>Total à encaisser :</b> {money(order.total)} (articles {money(order.items_total)} + livraison {money(order.delivery_fee)}) · commission {money(order.commission)}</p>
      </div>
      {order.order_items && order.order_items.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">{order.order_items.map((l) => <li key={l.id}>{l.emoji} {l.qty}× {l.name} — {money(l.price * l.qty)}</li>)}</ul>
      )}
      {canAssign && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold">{order.courier_id ? 'Réaffecter la course' : 'Affecter un livreur'}</p>
          <div className="flex gap-2">
            <select id="as-courier" className={field} value={courier} onChange={(e) => setCourier(e.target.value)}>
              <option value="">Choisir un livreur…</option>
              {sorted.map((c) => <option key={c.id} value={c.id}>{c.is_online ? '🟢' : '⚪'} {c.full_name} · {c.active_orders} en cours</option>)}
            </select>
            <button disabled={!courier || busy || courier === order.courier_id} onClick={assign} className={`${btn} shrink-0 bg-neam-600 text-white`}>Affecter</button>
          </div>
          {!sorted.some((c) => c.is_online) && <p className="mt-1 text-xs text-amber-700">Aucun livreur en ligne pour le moment.</p>}
        </div>
      )}
      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold">Historique</p>
        <ol className="space-y-1 text-sm">
          {events.map((e) => <li key={e.id} className="flex gap-2"><span className="w-28 shrink-0 text-xs text-neutral-400">{new Date(e.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span><span>{STATUS_LABEL[e.status]}{e.note ? ` · ${e.note}` : ''}</span></li>)}
        </ol>
      </div>
      {open && (
        <div className="mt-5 border-t border-neutral-100 pt-4">
          <p className="mb-2 text-sm font-semibold text-red-700">Annuler la commande</p>
          <div className="flex gap-2">
            <input id="as-reason" className={field} placeholder="Motif (visible par le client)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button disabled={busy} onClick={cancel} className={`${btn} shrink-0 bg-red-50 text-red-700`}>Annuler</button>
          </div>
        </div>
      )}
    </Sheet>
  )
}

function useAdminOrders(key: string, filter: 'active' | 'all', search = '') {
  return useLiveQuery<LiveOrder[]>(
    `admin-orders-${key}-${search}`,
    async () => {
      let q = sb().from('orders').select(ORDER_SELECT).order('created_at', { ascending: false }).limit(200)
      if (filter === 'active') q = q.in('status', ACTIVE_STATUSES)
      if (search.trim()) q = q.or(`code.ilike.%${search.trim()}%,contact_phone.ilike.%${search.trim()}%,contact_name.ilike.%${search.trim()}%`)
      const { data, error } = await q
      if (error) throw error
      return data as LiveOrder[]
    },
    [{ table: 'orders' }],
    [],
  )
}

function OrderRow({ o, onOpen, couriers }: { o: LiveOrder; onOpen: () => void; couriers: CourierRow[] }) {
  const c = couriers.find((x) => x.id === o.courier_id)
  return (
    <button onClick={onOpen} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 text-left text-sm hover:bg-neutral-50 lg:grid-cols-[110px_120px_minmax(0,1fr)_160px_110px_130px]">
      <span className="font-bold">#{o.code}</span>
      <span className="justify-self-end lg:justify-self-start"><StatusPill status={o.status} /></span>
      <span className="col-span-2 truncate text-neutral-600 lg:col-span-1 lg:order-none">{o.kind === 'market' ? `🛒 ${o.stores?.name ?? ''}` : `📦 ${o.pickup_address}`} → {o.address}</span>
      <span className="truncate text-xs text-neutral-500 lg:text-sm">{c ? `🛵 ${c.full_name}` : needsDispatch(o) ? <b className="text-amber-700">À affecter</b> : '—'}</span>
      <span className="text-right font-semibold tabular-nums lg:text-left">{money(o.total)}</span>
      <span className="hidden text-xs text-neutral-400 lg:block">{timeAgo(new Date(o.created_at).getTime())}</span>
    </button>
  )
}

// ---------------- Vue d'ensemble ----------------
function Overview() {
  const [period, setPeriod] = useState<1 | 7 | 30>(1)
  const { data: stats } = useLiveQuery(
    `admin-stats-${period}`,
    async () => {
      const from = new Date()
      from.setHours(0, 0, 0, 0)
      from.setDate(from.getDate() - (period - 1))
      return ((await sb().rpc('admin_stats', { p_from: from.toISOString(), p_to: new Date(Date.now() + 60_000).toISOString() })).data as Record<string, number>[] | null)?.[0] ?? null
    },
    [{ table: 'orders' }, { table: 'staff_applications' }, { table: 'couriers' }],
    null as Record<string, number> | null,
  )
  const { data: orders } = useAdminOrders('overview', 'active')
  const { data: couriers } = useCouriers()
  const [open, setOpen] = useState<LiveOrder | null>(null)
  const dispatch = orders.filter(needsDispatch)
  const tiles = stats
    ? [
        { l: 'Commandes', v: String(stats.orders_count) },
        { l: 'Livrées', v: String(stats.delivered) },
        { l: 'Encaissé (livré)', v: money(stats.gmv) },
        { l: 'Commissions NEAM', v: money(stats.commission) },
        { l: 'Frais de livraison', v: money(stats.delivery_fees) },
        { l: 'Annulées / refusées', v: String(stats.cancelled) },
        { l: 'En cours maintenant', v: String(stats.active_now) },
        { l: 'Livreurs en ligne', v: String(stats.couriers_online) },
        { l: 'Candidatures en attente', v: String(stats.pending_applications) },
        { l: 'Nouveaux clients', v: String(stats.new_clients) },
      ]
    : []
  return (
    <>
      <PageTitle
        title="Vue d’ensemble"
        subtitle="NEAM Market + NEAM Express · Libreville"
        action={
          <div className="flex rounded-full bg-white p-1 text-sm font-semibold ring-1 ring-black/5">
            {([[1, 'Aujourd’hui'], [7, '7 jours'], [30, '30 jours']] as const).map(([p, l]) => (
              <button key={p} onClick={() => setPeriod(p)} className={`rounded-full px-3 py-1.5 ${period === p ? 'bg-neam-950 text-white' : 'text-neutral-500'}`}>{l}</button>
            ))}
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-5 lg:px-8">
        {tiles.map((t) => <Card key={t.l} className="p-4"><p className="text-xs text-neutral-500">{t.l}</p><p className="mt-1 text-xl font-extrabold tabular-nums">{t.v}</p></Card>)}
      </div>
      <section className="px-4 pt-6 lg:px-8">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-500">À affecter <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{dispatch.length}</span></h2>
        <Card className="divide-y divide-neutral-100 p-0!">
          {dispatch.map((o) => <OrderRow key={o.id} o={o} couriers={couriers} onOpen={() => setOpen(o)} />)}
          {!dispatch.length && <p className="p-6 text-center text-sm text-neutral-400">Aucune course en attente de livreur</p>}
        </Card>
      </section>
      <section className="px-4 pt-6 lg:px-8">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">Livreurs</h2>
        <div className="flex flex-wrap gap-2">
          {couriers.map((c) => (
            <span key={c.id} className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm ring-1 ring-black/5">
              <span className={`h-2.5 w-2.5 rounded-full ${c.is_online ? 'bg-neam-500' : 'bg-neutral-300'}`} /> {c.full_name} <span className="text-xs text-neutral-400">{c.active_orders} en cours</span>
            </span>
          ))}
          {!couriers.length && <p className="text-sm text-neutral-400">Aucun livreur validé</p>}
        </div>
      </section>
      {open && <OrderSheet order={open} couriers={couriers} onClose={() => setOpen(null)} />}
    </>
  )
}

// ---------------- Commandes ----------------
const ORDER_TABS: { id: string; label: string; test: (o: LiveOrder) => boolean }[] = [
  { id: 'dispatch', label: 'À affecter', test: needsDispatch },
  { id: 'active', label: 'En cours', test: (o) => ACTIVE_STATUSES.includes(o.status) },
  { id: 'done', label: 'Livrées', test: (o) => o.status === 'delivered' },
  { id: 'ko', label: 'Annulées', test: (o) => o.status === 'cancelled' || o.status === 'rejected' },
  { id: 'all', label: 'Toutes', test: () => true },
]

function OrdersPage() {
  const [tab, setTab] = useState('active')
  const [q, setQ] = useState('')
  const { data: orders } = useAdminOrders('list', 'all', q)
  const { data: couriers } = useCouriers()
  const [open, setOpen] = useState<LiveOrder | null>(null)
  const t = ORDER_TABS.find((x) => x.id === tab)!
  const list = orders.filter(t.test)
  return (
    <>
      <PageTitle title="Commandes" subtitle={`${orders.length} dernières commandes`} />
      <div className="px-4 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-black/5">
            {ORDER_TABS.map((x) => (
              <button key={x.id} onClick={() => setTab(x.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${tab === x.id ? 'bg-neam-950 text-white' : 'text-neutral-500'}`}>
                {x.label} <span className="opacity-60">{orders.filter(x.test).length}</span>
              </button>
            ))}
          </div>
          <label className="flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-black/5">
            <Search size={16} className="text-neutral-400" />
            <input id="ord-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="N° de commande, nom ou téléphone" className="flex-1 bg-transparent text-sm outline-none" />
          </label>
        </div>
        <Card className="mt-3 divide-y divide-neutral-100 p-0!">
          {list.map((o) => <OrderRow key={o.id} o={o} couriers={couriers} onOpen={() => setOpen(o)} />)}
          {!list.length && <Empty emoji="🧾" title="Aucune commande" />}
        </Card>
      </div>
      {open && <OrderSheet order={orders.find((o) => o.id === open.id) ?? open} couriers={couriers} onClose={() => setOpen(null)} />}
    </>
  )
}

// ---------------- Livreurs ----------------
function CouriersPage() {
  const { toast } = useApp()
  const { data: couriers, reload } = useCouriers()
  const [remit, setRemit] = useState<CourierRow | null>(null)
  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')
  const record = async () => {
    const { error } = await sb().rpc('admin_record_remittance', { p_courier: remit!.id, p_amount: amount, p_note: note || null })
    if (error) return toast(errMsg(error))
    toast(`${money(amount)} reçus de ${remit!.full_name}`)
    setRemit(null)
    reload()
  }
  const setActive = async (c: CourierRow) => {
    const { error } = await sb().rpc('admin_set_user_active', { p_user: c.id, p_active: !c.is_active })
    if (error) return toast(errMsg(error))
    toast(c.is_active ? 'Livreur suspendu' : 'Livreur réactivé')
    reload()
  }
  const totalDue = couriers.reduce((n, c) => n + c.cash_due, 0)
  return (
    <>
      <PageTitle title="Livreurs" subtitle={`${couriers.filter((c) => c.is_online).length} en ligne · ${money(totalDue)} d’espèces à récupérer`} />
      <div className="grid grid-cols-1 gap-3 px-4 md:grid-cols-2 xl:grid-cols-3 lg:px-8">
        {couriers.map((c) => (
          <Card key={c.id} className={c.is_active ? '' : 'opacity-60'}>
            <div className="flex items-center gap-3">
              <span className="relative grid h-12 w-12 place-items-center rounded-full bg-neam-50 text-neam-700"><Bike /><span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-2 ring-white ${c.is_online ? 'bg-neam-500' : 'bg-neutral-300'}`} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.full_name}</p>
                <p className="truncate text-xs text-neutral-500">{formatPhone(c.phone)} · {c.vehicle} {c.plate}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 text-center text-sm">
              <div><p className="font-extrabold">{c.active_orders}</p><p className="text-[11px] text-neutral-500">en cours</p></div>
              <div><p className="font-extrabold">{c.delivered_today}</p><p className="text-[11px] text-neutral-500">livrées auj.</p></div>
              <div><p className="font-extrabold tabular-nums">{money(c.cash_due)}</p><p className="text-[11px] text-neutral-500">espèces dues</p></div>
            </div>
            {c.lat != null && c.lng != null && (
              <a href={`https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lng}#map=16/${c.lat}/${c.lng}`} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-1.5 text-xs font-medium text-neam-700">
                <MapPin size={13} /> Position {c.location_at ? timeAgo(new Date(c.location_at).getTime()) : ''} · voir la carte
              </a>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button disabled={!c.cash_due} onClick={() => { setRemit(c); setAmount(c.cash_due); setNote('') }} className={`${btn} bg-neam-600 text-white`}>Encaisser</button>
              <button onClick={() => setActive(c)} className={`${btn} ${c.is_active ? 'bg-red-50 text-red-700' : 'bg-neutral-100'}`}>{c.is_active ? 'Suspendre' : 'Réactiver'}</button>
            </div>
          </Card>
        ))}
        {!couriers.length && <Empty emoji="🛵" title="Aucun livreur" text="Validez des candidatures dans l’onglet Candidatures." />}
      </div>
      {remit && (
        <Sheet open onClose={() => setRemit(null)} title={`Espèces remises par ${remit.full_name}`}>
          <p className="text-sm text-neutral-600">Dû actuellement : <b>{money(remit.cash_due)}</b></p>
          <input id="rm-amount" className={`${field} mt-3 text-lg font-bold`} inputMode="numeric" value={amount || ''} onChange={(e) => setAmount(+e.target.value.replace(/\D/g, ''))} />
          <input id="rm-note" className={`${field} mt-2`} placeholder="Note (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button disabled={!amount} onClick={record} className="mt-4 w-full rounded-2xl bg-neam-600 py-3.5 font-semibold text-white disabled:opacity-50">Enregistrer la remise</button>
        </Sheet>
      )}
    </>
  )
}

// ---------------- Boutiques ----------------
type StoreRow = { id: string; name: string; district: string; phone: string; is_open: boolean; is_active: boolean; commission_rate: number; owner_id: string | null }
type Fin = { orders_count: number; sales: number; commission: number; net: number; paid: number; balance: number }

function StoresPage() {
  const { toast } = useApp()
  const { data, reload } = useLiveQuery(
    'admin-stores',
    async () => {
      const stores = ((await sb().from('stores').select('*').order('name')).data ?? []) as StoreRow[]
      const fins = await Promise.all(stores.map(async (s) => ((await sb().rpc('store_finances', { p_store: s.id })).data as Fin[] | null)?.[0]))
      return stores.map((s, i) => ({ ...s, fin: fins[i] }))
    },
    [{ table: 'stores' }, { table: 'merchant_payouts' }],
    [] as (StoreRow & { fin?: Fin })[],
  )
  const [pay, setPay] = useState<(StoreRow & { fin?: Fin }) | null>(null)
  const [amount, setAmount] = useState(0)
  const [ref, setRef] = useState('')
  const [rate, setRate] = useState<Record<string, string>>({})
  const update = async (s: StoreRow, patch: { active?: boolean; commission?: number }) => {
    const { error } = await sb().rpc('admin_update_store', { p_store: s.id, p_is_active: patch.active ?? null, p_commission: patch.commission ?? null })
    if (error) return toast(errMsg(error))
    toast('Boutique mise à jour')
    reload()
  }
  const payout = async () => {
    const { error } = await sb().rpc('admin_record_payout', { p_store: pay!.id, p_amount: amount, p_reference: ref || null })
    if (error) return toast(errMsg(error))
    toast(`Versement de ${money(amount)} enregistré`)
    setPay(null)
    reload()
  }
  return (
    <>
      <PageTitle title="Boutiques" subtitle={`${data.length} boutiques NEAM Market`} />
      <div className="px-4 lg:px-8">
        <Card className="overflow-x-auto p-0!">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
              <tr><th className="px-4 py-3">Boutique</th><th className="px-3">État</th><th className="px-3 text-right">Ventes</th><th className="px-3 text-right">Commission</th><th className="px-3">Taux</th><th className="px-3 text-right">À verser</th><th className="px-3" /></tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.map((s) => (
                <tr key={s.id} className={s.is_active ? '' : 'opacity-60'}>
                  <td className="px-4 py-3"><p className="font-semibold">{s.name}</p><p className="text-xs text-neutral-500">{s.district} · {s.owner_id ? 'gérée par le marchand' : 'gérée par NEAM'}</p></td>
                  <td className="px-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${!s.is_active ? 'bg-red-50 text-red-700' : s.is_open ? 'bg-neam-50 text-neam-700' : 'bg-neutral-100 text-neutral-600'}`}>{!s.is_active ? 'Suspendue' : s.is_open ? 'Ouverte' : 'Fermée'}</span></td>
                  <td className="px-3 text-right tabular-nums">{money(s.fin?.sales ?? 0)}</td>
                  <td className="px-3 text-right tabular-nums">{money(s.fin?.commission ?? 0)}</td>
                  <td className="px-3">
                    <span className="flex items-center gap-1">
                      <input aria-label="Taux de commission" className="h-9 w-14 rounded-lg border border-neutral-200 px-2 text-sm" value={rate[s.id] ?? String(Math.round(s.commission_rate * 100))} onChange={(e) => setRate({ ...rate, [s.id]: e.target.value.replace(/\D/g, '') })} onBlur={() => { const v = Number(rate[s.id]); if (rate[s.id] != null && v !== Math.round(s.commission_rate * 100) && v <= 50) update(s, { commission: v / 100 }) }} />%
                    </span>
                  </td>
                  <td className="px-3 text-right font-semibold tabular-nums">{money(s.fin?.balance ?? 0)}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1.5">
                      <button disabled={!s.fin?.balance} onClick={() => { setPay(s); setAmount(s.fin?.balance ?? 0); setRef('') }} className={`${btn} bg-neam-600 text-white`}>Verser</button>
                      <button onClick={() => update(s, { active: !s.is_active })} className={`${btn} ${s.is_active ? 'bg-red-50 text-red-700' : 'bg-neutral-100'}`}>{s.is_active ? 'Suspendre' : 'Réactiver'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      {pay && (
        <Sheet open onClose={() => setPay(null)} title={`Versement à ${pay.name}`}>
          <p className="text-sm text-neutral-600">Solde dû : <b>{money(pay.fin?.balance ?? 0)}</b></p>
          <input id="po-amount" className={`${field} mt-3 text-lg font-bold`} inputMode="numeric" value={amount || ''} onChange={(e) => setAmount(+e.target.value.replace(/\D/g, ''))} />
          <input id="po-ref" className={`${field} mt-2`} placeholder="Référence (ex. virement, Airtel Money…)" value={ref} onChange={(e) => setRef(e.target.value)} />
          <button disabled={!amount} onClick={payout} className="mt-4 w-full rounded-2xl bg-neam-600 py-3.5 font-semibold text-white disabled:opacity-50">Enregistrer le versement</button>
        </Sheet>
      )}
    </>
  )
}

// ---------------- Candidatures ----------------
type AppRow = { id: string; kind: 'merchant' | 'courier'; status: 'pending' | 'approved' | 'rejected'; full_name: string; phone: string; details: Record<string, string>; admin_note: string | null; created_at: string }

function ApplicationsPage() {
  const { toast } = useApp()
  const { data: apps, reload } = useLiveQuery<AppRow[]>('admin-apps', async () => ((await sb().from('staff_applications').select('*').order('created_at', { ascending: false }).limit(100)).data ?? []) as AppRow[], [{ table: 'staff_applications' }], [])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const review = async (a: AppRow, approve: boolean) => {
    if (!approve && !notes[a.id]?.trim()) return toast('Indiquez le motif du refus')
    const { error } = await sb().rpc('admin_review_application', { p_application: a.id, p_approve: approve, p_note: notes[a.id] || null })
    if (error) return toast(errMsg(error))
    toast(approve ? `${a.full_name} validé(e)` : 'Candidature refusée')
    reload()
  }
  const pending = apps.filter((a) => a.status === 'pending')
  const LABELS: Record<string, string> = { store_name: 'Boutique', district: 'Quartier', address: 'Adresse', city: 'Ville', vehicle: 'Véhicule', plate: 'Immatriculation', id_number: 'Pièce d’identité' }
  return (
    <>
      <PageTitle title="Candidatures" subtitle={`${pending.length} en attente`} />
      <div className="grid grid-cols-1 gap-3 px-4 md:grid-cols-2 lg:px-8">
        {pending.map((a) => (
          <Card key={a.id}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{a.full_name}</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.kind === 'merchant' ? 'bg-orange-50 text-orange-700' : 'bg-neam-50 text-neam-700'}`}>{a.kind === 'merchant' ? 'Marchand' : 'Livreur'}</span>
            </div>
            <p className="text-xs text-neutral-500">{formatPhone(a.phone)} · {timeAgo(new Date(a.created_at).getTime())}</p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              {Object.entries(a.details).filter(([, v]) => v).map(([k, v]) => <Fragment key={k}><dt className="text-neutral-500">{LABELS[k] ?? k}</dt><dd>{v}</dd></Fragment>)}
            </dl>
            <input aria-label="Note" className={`${field} mt-3`} placeholder="Note / motif de refus" value={notes[a.id] ?? ''} onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })} />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => review(a, true)} className={`${btn} bg-neam-600 text-white`}>Valider</button>
              <button onClick={() => review(a, false)} className={`${btn} bg-red-50 text-red-700`}>Refuser</button>
            </div>
          </Card>
        ))}
        {!pending.length && <div className="md:col-span-2"><Empty emoji="✅" title="Aucune candidature en attente" /></div>}
      </div>
      {apps.length > pending.length && (
        <section className="px-4 pt-6 lg:px-8">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">Déjà traitées</h2>
          <Card className="divide-y divide-neutral-100 p-0!">
            {apps.filter((a) => a.status !== 'pending').map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="flex-1 truncate">{a.full_name} · {a.kind === 'merchant' ? 'Marchand' : 'Livreur'}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.status === 'approved' ? 'bg-neam-50 text-neam-700' : 'bg-red-50 text-red-700'}`}>{a.status === 'approved' ? 'Validée' : 'Refusée'}</span>
              </div>
            ))}
          </Card>
        </section>
      )}
    </>
  )
}

// ---------------- Comptes ----------------
type UserRow = { id: string; full_name: string; phone: string | null; role: string; is_active: boolean; created_at: string; orders_count: number }
const ROLE_LABEL: Record<string, string> = { client: 'Client', merchant: 'Marchand', courier: 'Livreur', admin: 'Admin' }

function UsersPage() {
  const { toast } = useApp()
  const [q, setQ] = useState('')
  const { data: users, reload } = useLiveQuery<UserRow[]>(`admin-users-${q}`, async () => ((await sb().rpc('admin_users', { p_search: q.trim() || null })).data ?? []) as UserRow[], [], [])
  const toggle = async (u: UserRow) => {
    const { error } = await sb().rpc('admin_set_user_active', { p_user: u.id, p_active: !u.is_active })
    if (error) return toast(errMsg(error))
    toast(u.is_active ? 'Compte suspendu' : 'Compte réactivé')
    reload()
  }
  return (
    <>
      <PageTitle title="Comptes" subtitle={`${users.length} comptes`} />
      <div className="px-4 lg:px-8">
        <label className="mb-3 flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-black/5">
          <Search size={16} className="text-neutral-400" />
          <input id="usr-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou téléphone" className="flex-1 bg-transparent text-sm outline-none" />
        </label>
        <Card className="divide-y divide-neutral-100 p-0!">
          {users.map((u) => (
            <div key={u.id} className={`flex items-center gap-3 px-4 py-3 text-sm ${u.is_active ? '' : 'opacity-60'}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{u.full_name || 'Sans nom'}</p>
                <p className="truncate text-xs text-neutral-500">{formatPhone(u.phone)} · inscrit {timeAgo(new Date(u.created_at).getTime())} · {u.orders_count} commande{u.orders_count > 1 ? 's' : ''}</p>
              </div>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{ROLE_LABEL[u.role]}</span>
              {u.role !== 'admin' && <button onClick={() => toggle(u)} className={`${btn} ${u.is_active ? 'bg-red-50 text-red-700' : 'bg-neutral-100'}`}>{u.is_active ? 'Suspendre' : 'Réactiver'}</button>}
            </div>
          ))}
          {!users.length && <Empty emoji="👤" title="Aucun compte" />}
        </Card>
      </div>
    </>
  )
}

// ---------------- Paramètres ----------------
function SettingsPage() {
  const { toast } = useApp()
  const { data: settings, reload } = useLiveQuery<Record<string, unknown>>('admin-settings', async () => Object.fromEntries((((await sb().from('app_settings').select('key, value')).data ?? []) as { key: string; value: unknown }[]).map((r) => [r.key, r.value])), [], {})
  const [draft, setDraft] = useState<Record<string, string>>({})
  const val = (k: string) => draft[k] ?? (settings[k] != null ? JSON.stringify(settings[k]) : '')
  const save = async (k: string) => {
    let v: unknown
    try {
      v = JSON.parse(val(k))
    } catch {
      return toast('Valeur invalide')
    }
    const { error } = await sb().rpc('admin_update_setting', { p_key: k, p_value: v })
    if (error) return toast(errMsg(error))
    toast('Paramètre enregistré')
    setDraft((d) => {
      const { [k]: _omit, ...rest } = d
      void _omit
      return rest
    })
    reload()
  }
  const ITEMS = [
    { k: 'market_delivery_fee', l: 'Frais de livraison Market (FCFA)' },
    { k: 'market_free_delivery_from', l: 'Livraison offerte à partir de (FCFA)' },
    { k: 'express_base_fee', l: 'Express : prix de base par taille (doc, s, m, l)' },
    { k: 'express_speed_factor', l: 'Express : coefficient par rapidité' },
  ]
  return (
    <>
      <PageTitle title="Paramètres" subtitle="Tarifs appliqués par le serveur" />
      <div className="grid grid-cols-1 gap-3 px-4 lg:grid-cols-2 lg:px-8">
        {ITEMS.map(({ k, l }) => (
          <Card key={k}>
            <label className="block text-sm font-semibold" htmlFor={`set-${k}`}>{l}</label>
            <div className="mt-2 flex gap-2">
              <input id={`set-${k}`} className={`${field} font-mono`} value={val(k)} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
              <button disabled={draft[k] == null} onClick={() => save(k)} className={`${btn} shrink-0 bg-neam-600 text-white`}>Enregistrer</button>
            </div>
          </Card>
        ))}
        <Card className="text-sm text-neutral-600 lg:col-span-2">
          <p className="font-semibold text-neutral-900">Paiement</p>
          <p className="mt-1">Paiement à la livraison uniquement. Mobile Money et carte bancaire sont affichés « À venir » dans l’application client.</p>
        </Card>
      </div>
    </>
  )
}

function AdminInner() {
  const { data: counts } = useLiveQuery(
    'admin-badges',
    async () => {
      const [{ count: apps }, { data: orders }] = await Promise.all([
        sb().from('staff_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        sb().from('orders').select('kind, status, courier_id').in('status', ['pending', 'accepted', 'ready']),
      ])
      return { apps: apps ?? 0, dispatch: ((orders ?? []) as LiveOrder[]).filter(needsDispatch).length }
    },
    [{ table: 'orders' }, { table: 'staff_applications' }],
    { apps: 0, dispatch: 0 },
  )
  const tabs = useMemo(
    () => [
      { to: '/admin', label: 'Accueil', icon: LayoutDashboard, badge: counts.dispatch },
      { to: '/admin/commandes', label: 'Commandes', icon: ClipboardList },
      { to: '/admin/livreurs', label: 'Livreurs', icon: Bike },
      { to: '/admin/boutiques', label: 'Boutiques', icon: Store },
      { to: '/admin/candidatures', label: 'Candidatures', icon: BadgeCheck, badge: counts.apps },
      { to: '/admin/comptes', label: 'Comptes', icon: Users },
      { to: '/admin/parametres', label: 'Paramètres', icon: Settings },
    ],
    [counts],
  )
  return (
    <StaffShell app={APP} tabs={tabs}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="commandes" element={<OrdersPage />} />
        <Route path="livreurs" element={<CouriersPage />} />
        <Route path="boutiques" element={<StoresPage />} />
        <Route path="candidatures" element={<ApplicationsPage />} />
        <Route path="comptes" element={<UsersPage />} />
        <Route path="parametres" element={<SettingsPage />} />
      </Routes>
    </StaffShell>
  )
}

export default function AdminApp() {
  return (
    <StaffGate app={APP}>
      <AdminInner />
    </StaffGate>
  )
}
